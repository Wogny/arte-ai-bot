import React, { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExecutionMonitor() {
  const executionStatsQuery = trpc.execution.getStats.useQuery(undefined, {
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const executionHistoryQuery = trpc.execution.getHistory.useQuery({ limit: 50 }, {
    refetchInterval: 30000,
  });

  const executionStatusQuery = trpc.execution.getStatus.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const stats = executionStatsQuery.data;
  const history = executionHistoryQuery.data || [];
  const status = executionStatusQuery.data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Falha</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Monitor de Execução</h1>
        <p className="text-gray-600">
          Acompanhe o status de publicação automática de posts
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500">Execuções totais</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.successful}
              </div>
              <p className="text-xs text-gray-500">Publicadas com sucesso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                Falhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-gray-500">Falhas permanentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <p className="text-xs text-gray-500">Aguardando retry</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-gray-500">Taxa de sucesso</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status do Executor */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status do Executor</span>
              <Badge className="bg-green-100 text-green-800">
                {status.isRunning ? "Ativo" : "Inativo"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Última atualização: {new Date(status.lastUpdate).toLocaleString("pt-BR")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                O sistema de execução automática está{" "}
                <span className="font-semibold">
                  {status.isRunning ? "ativo" : "inativo"}
                </span>
                . Posts agendados serão publicados automaticamente nos horários
                configurados.
              </p>
              <p className="text-gray-600">
                O sistema verifica a cada minuto por posts que chegaram ao horário de
                publicação e os publica nas plataformas conectadas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Execuções */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>Últimas 50 execuções</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => executionHistoryQuery.refetch()}
              disabled={executionHistoryQuery.isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((log: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Post {log.postId} - {log.platform}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {log.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString("pt-BR")}
                        {log.retryCount > 0 && ` (Tentativa ${log.retryCount})`}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2">{getStatusBadge(log.status)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma execução registrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Técnicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <p className="font-medium">Frequência de Verificação</p>
            <p className="text-gray-600">A cada 1 minuto</p>
          </div>
          <div>
            <p className="font-medium">Tentativas de Retry</p>
            <p className="text-gray-600">Até 3 tentativas com intervalo de 5 minutos</p>
          </div>
          <div>
            <p className="font-medium">Plataformas Suportadas</p>
            <p className="text-gray-600">Facebook, Instagram, TikTok, WhatsApp</p>
          </div>
          <div>
            <p className="font-medium">Histórico Mantido</p>
            <p className="text-gray-600">Últimas 1000 execuções em memória</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
