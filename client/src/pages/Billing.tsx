import { useState } from "react";
import { SubscriptionStatus } from "../components/SubscriptionStatus";
import { PaymentHistory } from "../components/PaymentHistory";
import { CancelSubscriptionModal } from "../components/CancelSubscriptionModal";
import { CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

const Billing: React.FC = () => {
  const [paymentOffset, setPaymentOffset] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Queries
  const { data: subscription, isLoading: subscriptionLoading } = trpc.subscription.getCurrentSubscription.useQuery();

  const { data: paymentHistory, isLoading: paymentLoading } = trpc.subscription.getPaymentHistory.useQuery({
    limit: 10,
    offset: paymentOffset,
    status: paymentStatus as any,
  });

  const { data: paymentSummary } = trpc.subscription.getPaymentSummary.useQuery();

  const cancelMutation = trpc.subscription.cancelSubscription.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const handleUpgrade = () => {
    window.location.href = "/pricing";
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelSuccess = () => {
    setShowCancelModal(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Gerenciamento de Assinatura
          </h1>
          <p className="text-gray-400">
            Visualize seu plano, histórico de pagamentos e gerencie sua assinatura
          </p>
        </div>

        {/* Status da Assinatura */}
        <div className="mb-8">
          {subscriptionLoading ? (
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-md border border-purple-500/30 rounded-lg p-6 flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-gray-400">Carregando assinatura...</span>
              </div>
            </div>
          ) : (
            <SubscriptionStatus
              subscription={subscription || null}
              onUpgrade={handleUpgrade}
              onCancel={handleCancelClick}
            />
          )}
        </div>

        {/* Resumo de Pagamentos */}
        {paymentSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Gasto */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-md border border-purple-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400">
                  Total Gasto
                </h3>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                {paymentSummary.totalSpentFormatted}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {paymentSummary.paymentCount} pagamento
                {paymentSummary.paymentCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Pagamento Médio */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-md border border-green-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400">
                  Pagamento Médio
                </h3>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                {paymentSummary.averagePaymentFormatted}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                por transação
              </p>
            </div>

            {/* Próximo Pagamento */}
            {subscription && subscription.currentPeriodEnd && (
              <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-md border border-blue-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-400">
                    Próximo Pagamento
                  </h3>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <p className="text-lg font-bold text-white">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {subscription.planPrice && `R$ ${(subscription.planPrice / 100).toFixed(2)}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Histórico de Pagamentos */}
        <div>
          {paymentLoading ? (
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-md border border-purple-500/30 rounded-lg p-6 flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-gray-400">Carregando histórico...</span>
              </div>
            </div>
          ) : (
            <PaymentHistory
              payments={paymentHistory?.payments || []}
              total={paymentHistory?.total || 0}
              limit={paymentHistory?.limit || 10}
              offset={paymentHistory?.offset || 0}
              isLoading={paymentLoading}
              onPageChange={setPaymentOffset}
              onStatusFilter={setPaymentStatus}
            />
          )}
        </div>

        {/* Informações Úteis */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Política de Reembolso */}
          <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-md border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Política de Reembolso
            </h3>
            <p className="text-sm text-gray-400">
              Oferecemos reembolso total nos primeiros 7 dias. Após esse período,
              você pode cancelar a qualquer momento sem penalidades.
            </p>
          </div>

          {/* Suporte */}
          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-purple-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Precisa de Ajuda?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Entre em contato com nosso time de suporte para dúvidas sobre
              pagamentos ou assinatura.
            </p>
            <button
              onClick={() => window.location.href = "/support-center"}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium text-sm"
            >
              Contatar Suporte
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Cancelamento */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSuccess={handleCancelSuccess}
        planName={subscription?.planName || "sua assinatura"}
      />
    </div>
  );
};

export default Billing;
