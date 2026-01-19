import { Router, Request, Response } from 'express';
import { getDb } from '../db.ts';
import { subscriptions, payments } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const MERCADOPAGO_API_URL = 'https://api.mercadopago.com/v1';
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

/**
 * Webhook para receber notificações de pagamento do Mercado Pago
 * POST /api/mercadopago/webhook
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { data, type } = req.body;

    // Verificar tipo de notificação
    if (type !== 'payment') {
      return res.status(200).json({ success: true });
    }

    // Obter detalhes do pagamento
    if (!data?.id) {
      return res.status(400).json({ error: 'ID de pagamento não fornecido' });
    }

    const paymentId = data.id;

    // Buscar detalhes do pagamento na API do Mercado Pago
    const paymentResponse = await fetch(
      `${MERCADOPAGO_API_URL}/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error('Erro ao obter detalhes do pagamento:', paymentResponse.statusText);
      return res.status(500).json({ error: 'Erro ao obter detalhes do pagamento' });
    }

    const payment = await paymentResponse.json();
    const db = await getDb();

    if (!db) {
      return res.status(500).json({ error: 'Erro ao conectar ao banco de dados' });
    }

    // Extrair informações
    const {
      id: mercadopagoId,
      status,
      status_detail,
      transaction_amount,
      external_reference,
      payer,
    } = payment;
    const now = new Date();

    // Parse do external_reference: userId-planId-timestamp
    const [userIdStr, planIdStr] = external_reference?.split('-') || [];
    const userId = parseInt(userIdStr);
    const planId = parseInt(planIdStr);

    if (!userId || !planId) {
      console.error('Invalid external_reference format:', external_reference);
      return res.status(400).json({ error: 'Referência externa inválida' });
    }

    console.log('Webhook recebido:', {
      paymentId: mercadopagoId,
      status,
      userId,
      planId,
      amount: transaction_amount,
    });

    // Registrar pagamento no banco de dados
    await db.insert(payments).values({
      userId,
      mercadopagoPaymentId: mercadopagoId.toString(),
      amount: Math.round(transaction_amount * 100), // Converter para centavos
      currency: 'BRL',
      status: status === 'approved' ? 'succeeded' : status === 'pending' ? 'pending' : 'failed',
      description: `Pagamento do plano ${planId}`,
      paidAt: status === 'approved' ? now : null,
      createdAt: now,
      updatedAt: now,
    }).catch(err => console.error('Erro ao inserir pagamento:', err));

    // Se pagamento foi aprovado, ativar assinatura
    if (status === 'approved') {
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

      // Verificar se já existe assinatura ativa
      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (existingSubscription.length > 0) {
        // Atualizar assinatura existente
        await db
          .update(subscriptions)
          .set({
            planId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
            updatedAt: now,
          })
          .where(eq(subscriptions.userId, userId))
          .catch(err => console.error('Erro ao atualizar assinatura:', err));
      } else {
        // Criar nova assinatura
        const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias de trial
        await db
          .insert(subscriptions)
          .values({
            userId,
            planId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
            trialEndsAt,
            isTrialActive: true,
            createdAt: now,
            updatedAt: now,
          })
          .catch(err => console.error('Erro ao criar assinatura:', err));
      }

      console.log('Assinatura ativada para usuário:', userId);
    }

    // Retornar sucesso
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro no webhook do Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export const mercadopagoWebhookRouter = router;
