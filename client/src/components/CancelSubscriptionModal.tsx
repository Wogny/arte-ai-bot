import React, { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { trpc } from "../lib/trpc";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planName: string;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  planName,
}: CancelSubscriptionModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const cancelMutation = trpc.subscription.cancelSubscription.useMutation({
    onSuccess: () => {
      setIsConfirmed(false);
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Erro ao cancelar assinatura:", error);
      alert("Erro ao cancelar assinatura. Tente novamente.");
    },
  });

  const handleCancel = () => {
    if (!isConfirmed) {
      setShowWarning(true);
      return;
    }

    cancelMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-2xl border border-white/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-lg bg-red-500/20 p-3">
            <AlertCircle className="text-red-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Cancelar Assinatura</h2>
            <p className="text-sm text-gray-400">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        {/* Warning message */}
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-sm text-red-200">
            Ao cancelar sua assinatura <strong>{planName}</strong>, você perderá acesso a:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-red-200">
            <li>✗ Geração ilimitada de imagens com IA</li>
            <li>✗ Publicação automática em redes sociais</li>
            <li>✗ Agendamento de posts</li>
            <li>✗ Análise de competitors</li>
            <li>✗ Suporte prioritário</li>
          </ul>
        </div>

        {/* Confirmation checkbox */}
        <div className="mb-6 flex items-start gap-3">
          <input
            type="checkbox"
            id="confirm-cancel"
            checked={isConfirmed}
            onChange={(e) => {
              setIsConfirmed(e.target.checked);
              setShowWarning(false);
            }}
            className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-2 focus:ring-red-500"
          />
          <label htmlFor="confirm-cancel" className="text-sm text-gray-300">
            Entendo que vou perder acesso a todos os recursos premium e confirmo o cancelamento
          </label>
        </div>

        {/* Warning if not confirmed */}
        {showWarning && !isConfirmed && (
          <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
            <p className="text-sm text-yellow-200">
              Por favor, confirme que entende as consequências do cancelamento.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={cancelMutation.isPending}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            Manter Assinatura
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {cancelMutation.isPending ? "Cancelando..." : "Cancelar Assinatura"}
          </button>
        </div>

        {/* Info message */}
        <p className="mt-4 text-xs text-gray-500">
          Você pode reativar sua assinatura a qualquer momento. Seus dados serão preservados por 30 dias.
        </p>
      </div>
    </div>
  );
}
