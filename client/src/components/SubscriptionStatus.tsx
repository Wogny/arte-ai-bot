import React from "react";
import { Calendar, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react";

interface SubscriptionStatusProps {
  subscription: {
    planName: string | null;
    planPrice: number | null;
    status: string;
    isActive: boolean;
    isExpired: boolean | null;
    daysRemaining: number | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    isTrialActive: boolean;
    trialEndsAt: Date | null;
  } | null;
  onUpgrade?: () => void;
  onCancel?: () => void;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription,
  onUpgrade,
  onCancel,
}) => {
  if (!subscription) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-md border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <AlertCircle className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              Nenhuma Assinatura Ativa
            </h3>
            <p className="text-gray-400 text-sm">
              Comece agora e aproveite 7 dias grátis
            </p>
          </div>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium"
          >
            Escolher Plano
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusColor = () => {
    if (subscription.isTrialActive) return "from-blue-500 to-cyan-500";
    if (subscription.isActive) return "from-green-500 to-emerald-500";
    if (subscription.isExpired) return "from-red-500 to-orange-500";
    return "from-gray-500 to-slate-500";
  };

  const getStatusLabel = () => {
    if (subscription.isTrialActive) return "Período de Teste";
    if (subscription.isActive) return "Ativo";
    if (subscription.isExpired) return "Expirado";
    return "Inativo";
  };

  const getStatusIcon = () => {
    if (subscription.isTrialActive) return <Clock className="w-5 h-5" />;
    if (subscription.isActive) return <CheckCircle className="w-5 h-5" />;
    if (subscription.isExpired) return <AlertCircle className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Status Principal */}
      <div className={`bg-gradient-to-br ${getStatusColor()} bg-opacity-10 backdrop-blur-md border border-opacity-30 rounded-lg p-6`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 bg-gradient-to-br ${getStatusColor()} rounded-lg`}>
                {getStatusIcon()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {subscription.planName}
                </h3>
                <p className="text-sm text-gray-400">
                  {getStatusLabel()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Preço */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Valor Mensal</p>
                <p className="text-2xl font-bold text-white">
                  R$ {subscription.planPrice ? (subscription.planPrice / 100).toFixed(2) : 'N/A'}
                </p>
              </div>

              {/* Dias Restantes */}
              {subscription.isActive && !subscription.isExpired && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Dias Restantes</p>
                  <p className="text-2xl font-bold text-white">
                    {subscription.daysRemaining ?? 0}
                  </p>
                </div>
              )}

              {/* Trial */}
              {subscription.isTrialActive && subscription.trialEndsAt && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Trial Termina Em</p>
                  <p className="text-sm text-white font-semibold">
                    {formatDate(subscription.trialEndsAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Período de Faturamento */}
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDate(subscription.currentPeriodStart)} até{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 ml-4">
            {subscription.isActive && (
              <button
                onClick={onUpgrade}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium text-sm whitespace-nowrap"
              >
                Mudar Plano
              </button>
            )}
            {subscription.isActive && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 font-medium text-sm whitespace-nowrap border border-red-500/30"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Barra de Progresso */}
        {subscription.isActive && !subscription.isExpired && (
          <div className="mt-4">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, ((subscription.daysRemaining ?? 0) / 30) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Aviso de Expiração */}
      {subscription.isExpired && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">
              Sua assinatura expirou
            </p>
            <p className="text-xs text-red-300/80 mt-1">
              Renove agora para continuar usando todos os recursos
            </p>
          </div>
          <button
            onClick={onUpgrade}
            className="ml-auto px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all duration-200 font-medium text-sm whitespace-nowrap"
          >
            Renovar
          </button>
        </div>
      )}

      {/* Dica de Trial */}
      {subscription.isTrialActive && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-400">
              Você está em período de teste
            </p>
            <p className="text-xs text-blue-300/80 mt-1">
              Aproveite todos os recursos gratuitamente até{" "}
              {formatDate(subscription.trialEndsAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
