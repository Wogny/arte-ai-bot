import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface MercadoPagoPaymentFormProps {
  planId: number;
  planName: string;
  price: number;
  onSuccess?: () => void;
}

export function MercadoPagoPaymentForm({
  planId,
  planName,
  price,
  onSuccess,
}: MercadoPagoPaymentFormProps) {
  // Usar sonner para toasts
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'boleto'>('credit_card');
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardholderName: '',
    expirationMonth: '',
    expirationYear: '',
    securityCode: '',
  });
  const [installments, setInstallments] = useState(1);

  const createPaymentMutation = trpc.mercadopago.createPayment.useMutation();
  const generateCardTokenMutation = trpc.mercadopago.generateCardToken.useMutation();

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Validações específicas
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\D/g, '').slice(0, 16);
      setCardData(prev => ({ ...prev, [name]: cleaned }));
    } else if (name === 'securityCode') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      setCardData(prev => ({ ...prev, [name]: cleaned }));
    } else if (name === 'expirationMonth') {
      const cleaned = value.replace(/\D/g, '').slice(0, 2);
      setCardData(prev => ({ ...prev, [name]: cleaned }));
    } else if (name === 'expirationYear') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      setCardData(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setCardData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let cardToken: string | undefined;

      // Se for cartão de crédito, gerar token
      if (paymentMethod === 'credit_card') {
        if (!cardData.cardNumber || !cardData.cardholderName || !cardData.expirationMonth || !cardData.expirationYear || !cardData.securityCode) {
        toast.error('Preencha todos os dados do cartão');
          setLoading(false);
          return;
        }

        const tokenResult = await generateCardTokenMutation.mutateAsync({
          cardNumber: cardData.cardNumber,
          cardholderName: cardData.cardholderName,
          expirationMonth: parseInt(cardData.expirationMonth),
          expirationYear: parseInt(cardData.expirationYear),
          securityCode: cardData.securityCode,
        });

        cardToken = tokenResult.token;
      }

      // Criar pagamento
      const result = await createPaymentMutation.mutateAsync({
        planId,
        planName,
        price,
        paymentMethod,
        cardToken,
        installments: paymentMethod === 'credit_card' ? installments : 1,
      });

      if (result.success) {
        toast.success('Pagamento aprovado! Sua assinatura foi ativada.');
        onSuccess?.();
      } else {
        toast.info(`Pagamento pendente: ${result.statusDetail}`);
      }
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-purple-500/30 backdrop-blur-xl">
      <form onSubmit={handlePayment} className="space-y-6">
        {/* Resumo do Plano */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20">
          <p className="text-sm text-slate-400">Plano Selecionado</p>
          <h3 className="text-xl font-bold text-white">{planName}</h3>
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-2">
            R$ {price.toFixed(2)}
          </p>
        </div>

        {/* Método de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Método de Pagamento
          </label>
          <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-purple-500/30">
              <SelectItem value="credit_card">💳 Cartão de Crédito</SelectItem>
              <SelectItem value="pix">🔑 Pix</SelectItem>
              <SelectItem value="boleto">📋 Boleto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Formulário de Cartão */}
        {paymentMethod === 'credit_card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Número do Cartão
              </label>
              <Input
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={handleCardChange}
                maxLength={16}
                className="bg-slate-800/50 border-purple-500/30 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome do Titular
              </label>
              <Input
                name="cardholderName"
                placeholder="João Silva"
                value={cardData.cardholderName}
                onChange={handleCardChange}
                className="bg-slate-800/50 border-purple-500/30 text-white placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mês
                </label>
                <Input
                  name="expirationMonth"
                  placeholder="MM"
                  value={cardData.expirationMonth}
                  onChange={handleCardChange}
                  maxLength={2}
                  className="bg-slate-800/50 border-purple-500/30 text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ano
                </label>
                <Input
                  name="expirationYear"
                  placeholder="YYYY"
                  value={cardData.expirationYear}
                  onChange={handleCardChange}
                  maxLength={4}
                  className="bg-slate-800/50 border-purple-500/30 text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  CVV
                </label>
                <Input
                  name="securityCode"
                  placeholder="123"
                  value={cardData.securityCode}
                  onChange={handleCardChange}
                  maxLength={4}
                  className="bg-slate-800/50 border-purple-500/30 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Parcelamento
              </label>
              <Select value={installments.toString()} onValueChange={(value) => setInstallments(parseInt(value))}>
                <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-purple-500/30">
                  {[1, 2, 3, 6, 12].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x de R$ {(price / num).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Informação Pix */}
        {paymentMethod === 'pix' && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <p className="text-sm text-cyan-300">
              ✓ Você receberá um código Pix para escanear após confirmar o pagamento.
            </p>
          </div>
        )}

        {/* Informação Boleto */}
        {paymentMethod === 'boleto' && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <p className="text-sm text-orange-300">
              ✓ Você receberá um código de boleto para pagar em qualquer banco.
            </p>
          </div>
        )}

        {/* Botão de Pagamento */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar Pagamento
            </>
          )}
        </Button>

        {/* Aviso de Segurança */}
        <div className="flex items-start gap-2 text-xs text-slate-400">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>Seus dados de pagamento são processados de forma segura pelo Mercado Pago.</p>
        </div>
      </form>
    </Card>
  );
}
