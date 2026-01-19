import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";

interface Payment {
  id: number;
  mercadopagoPaymentId: string | null;
  amount: number;
  amountFormatted: string;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  statusLabel: string;
  description: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

interface PaymentHistoryProps {
  payments: Payment[];
  total: number;
  limit: number;
  offset: number;
  isLoading?: boolean;
  onPageChange?: (offset: number) => void;
  onStatusFilter?: (status: string | undefined) => void;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  payments,
  total,
  limit,
  offset,
  isLoading = false,
  onPageChange,
  onStatusFilter,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handleStatusChange = (status: string | undefined) => {
    setSelectedStatus(status);
    onStatusFilter?.(status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "refunded":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-md border border-purple-500/30 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Histórico de Pagamentos
          </h3>
          <p className="text-sm text-gray-400">
            {total} pagamento{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
          <Download className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => handleStatusChange(undefined)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedStatus === undefined
              ? "bg-purple-500 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => handleStatusChange("succeeded")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedStatus === "succeeded"
              ? "bg-green-500 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          Realizados
        </button>
        <button
          onClick={() => handleStatusChange("pending")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedStatus === "pending"
              ? "bg-yellow-500 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => handleStatusChange("failed")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedStatus === "failed"
              ? "bg-red-500 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          Falhas
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                Data
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                ID
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-gray-400">Carregando...</span>
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <p className="text-gray-400">Nenhum pagamento encontrado</p>
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                >
                  <td className="px-4 py-3 text-sm text-white">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {payment.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">
                    {payment.amountFormatted}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {payment.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                    {payment.mercadopagoPaymentId ? payment.mercadopagoPaymentId.substring(0, 8) + '...' : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
          <p className="text-sm text-gray-400">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(0, offset - limit))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.((pageNum - 1) * limit)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                      pageNum === currentPage
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-gray-400 hover:bg-white/20"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onPageChange?.(offset + limit)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
