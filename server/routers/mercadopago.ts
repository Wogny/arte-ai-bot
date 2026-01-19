import { router, protectedProcedure } from '../_core/trpc.js';
import { z } from 'zod';
import { subscriptions } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const MERCADOPAGO_API_URL = 'https://api.mercadopago.com/v1';
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export const mercadopagoRouter = router({
  // Criar preferência de pagamento (Checkout Pro)
  createPreference: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        planName: z.string(),
        price: z.number(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const preference = {
          items: [
            {
              title: input.planName,
              description: input.description,
              quantity: 1,
              unit_price: input.price,
            },
          ],
          payer: {
            email: ctx.user.email,
            name: ctx.user.name || 'Cliente',
          },
          back_urls: {
            success: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/success`,
            failure: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/failure`,
            pending: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/pending`,
          },
          auto_return: 'approved',
          external_reference: `${ctx.user.id}-${input.planId}-${Date.now()}`,
          notification_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/mercadopago/webhook`,
        };

        const response = await fetch(`${MERCADOPAGO_API_URL}/checkout/preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
          },
          body: JSON.stringify(preference),
        });

        if (!response.ok) {
          throw new Error('Erro ao criar preferência no Mercado Pago');
        }

        const data = await response.json();
        return {
          initPoint: data.init_point,
          preferenceId: data.id,
        };
      } catch (error) {
        console.error('Mercado Pago Error:', error);
        throw new Error('Falha ao criar preferência de pagamento');
      }
    }),

  // Criar pagamento com API Transparente (Cartão, Pix, Boleto)
  createPayment: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        planName: z.string(),
        price: z.number(),
        paymentMethod: z.enum(['credit_card', 'pix', 'boleto']),
        cardToken: z.string().optional(),
        installments: z.number().optional().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const paymentData: any = {
          transaction_amount: input.price,
          description: input.planName,
          external_reference: `${ctx.user.id}-${input.planId}-${Date.now()}`,
          notification_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/mercadopago/webhook`,
          payer: {
            email: ctx.user.email,
            first_name: ctx.user.name?.split(' ')[0] || 'Cliente',
            last_name: ctx.user.name?.split(' ')[1] || '',
          },
        };

        // Configurar método de pagamento
        if (input.paymentMethod === 'credit_card' && input.cardToken) {
          paymentData.payment_method_id = 'credit_card';
          paymentData.token = input.cardToken;
          paymentData.installments = input.installments;
        } else if (input.paymentMethod === 'pix') {
          paymentData.payment_method_id = 'pix';
        } else if (input.paymentMethod === 'boleto') {
          paymentData.payment_method_id = 'boleto';
        }

        const response = await fetch(`${MERCADOPAGO_API_URL}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro ao processar pagamento');
        }

        const data = await response.json();

        // Log da transação
        console.log('Transação Mercado Pago:', {
          userId: ctx.user.id,
          planId: input.planId,
          amount: input.price,
          status: data.status,
          paymentMethod: input.paymentMethod,
          mercadopagoId: data.id,
        });

        return {
          success: data.status === 'approved',
          paymentId: data.id,
          status: data.status,
          statusDetail: data.status_detail,
        };
      } catch (error) {
        console.error('Mercado Pago Payment Error:', error);
        throw new Error('Falha ao processar pagamento');
      }
    }),

  // Obter status de pagamento
  getPaymentStatus: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const response = await fetch(`${MERCADOPAGO_API_URL}/payments/${input.paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao obter status do pagamento');
        }

        const data = await response.json();
        return {
          status: data.status,
          statusDetail: data.status_detail,
          amount: data.transaction_amount,
          paymentMethod: data.payment_method_id,
        };
      } catch (error) {
        console.error('Mercado Pago Status Error:', error);
        throw new Error('Falha ao obter status do pagamento');
      }
    }),

  // Gerar token de cartão (para API Transparente)
  generateCardToken: protectedProcedure
    .input(
      z.object({
        cardNumber: z.string(),
        cardholderName: z.string(),
        expirationMonth: z.number(),
        expirationYear: z.number(),
        securityCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${MERCADOPAGO_API_URL}/card_tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            card_number: input.cardNumber.replace(/\s/g, ''),
            cardholder: {
              name: input.cardholderName,
            },
            expiration_month: input.expirationMonth,
            expiration_year: input.expirationYear,
            security_code: input.securityCode,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao gerar token do cartão');
        }

        const data = await response.json();
        return {
          token: data.id,
          lastFourDigits: data.last_four_digits,
        };
      } catch (error) {
        console.error('Mercado Pago Token Error:', error);
        throw new Error('Falha ao gerar token do cartão');
      }
    }),
});
