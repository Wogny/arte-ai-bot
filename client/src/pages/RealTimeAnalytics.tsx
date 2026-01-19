import { useState, useEffect, useRef, ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Download, RefreshCw, Eye, Users, MessageCircle, DollarSign, Target } from "lucide-react";

interface MetricCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: number;
}

export default function RealTimeAnalytics() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"7" | "30" | "90">("30");
  const [quickPeriod, setQuickPeriod] = useState<"today" | "yesterday" | "7days" | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const getPeriodDays = () => {
    if (quickPeriod === "today") return 1;
    if (quickPeriod === "yesterday") return 1;
    if (quickPeriod === "7days") return 7;
    return parseInt(selectedPeriod);
  };

  const periodDays = getPeriodDays();

  // Queries
  const metricsQuery = trpc.realTimeAnalytics.getRealTimeMetrics.useQuery();
  const historyQuery = trpc.realTimeAnalytics.getMetricsHistory.useQuery({
    days: periodDays,
  });
  const comparisonQuery = trpc.realTimeAnalytics.getPeriodsComparison.useQuery({
    currentPeriodDays: periodDays,
    previousPeriodDays: periodDays,
  });
  const exportQuery = trpc.realTimeAnalytics.exportMetricsCSV.useQuery(
    { days: periodDays },
    { enabled: false }
  );

  // Mutations
  const syncMutation = trpc.realTimeAnalytics.syncMetricsWithMeta.useMutation({
    onSuccess: () => {
      toast.success("Métricas sincronizadas com sucesso!");
      metricsQuery.refetch();
      historyQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao sincronizar métricas");
    },
  });

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        metricsQuery.refetch();
      }, 30000); // Atualizar a cada 30 segundos
      setRefreshInterval(interval);
      return () => {
        clearInterval(interval);
      };
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh]);

  useEffect(() => {
    historyQuery.refetch();
    comparisonQuery.refetch();
  }, [quickPeriod, selectedPeriod]);

  const handleExport = async () => {
    const result = await exportQuery.refetch();
    if (result.data?.csv) {
      const element = document.createElement("a");
      const file = new Blob([result.data.csv], { type: "text/csv" });
      element.href = URL.createObjectURL(file);
      element.download = result.data.filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Arquivo exportado com sucesso!");
    }
  };

  const metrics = metricsQuery.data?.metrics;
  const platformBreakdown = metricsQuery.data?.platformBreakdown;
  const history = historyQuery.data || [];
  const comparison = comparisonQuery.data;

  const metricCards: MetricCard[] = [
    {
      label: "Impressões",
      value: metrics?.impressions?.toLocaleString() || "0",
      icon: <Eye className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-700",
      change: comparison?.changes.impressions,
    },
    {
      label: "Alcance",
      value: metrics?.reach?.toLocaleString() || "0",
      icon: <Users className="w-5 h-5" />,
      color: "bg-purple-100 text-purple-700",
      change: comparison?.changes.reach,
    },
    {
      label: "Engajamento",
      value: metrics?.engagement?.toLocaleString() || "0",
      icon: <MessageCircle className="w-5 h-5" />,
      color: "bg-pink-100 text-pink-700",
      change: comparison?.changes.engagement,
    },
    {
      label: "Cliques",
      value: metrics?.clicks?.toLocaleString() || "0",
      icon: <Target className="w-5 h-5" />,
      color: "bg-green-100 text-green-700",
      change: comparison?.changes.clicks,
    },
    {
      label: "Investimento",
      value: `R$ ${(metrics?.spend || 0).toFixed(2)}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-yellow-100 text-yellow-700",
      change: comparison?.changes.spend,
    },
  ];

  const platformColors = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    tiktok: "#000000",
    whatsapp: "#25D366",
  };

  const platformData = [
    { name: "Facebook", value: platformBreakdown?.facebook.impressions || 0, posts: platformBreakdown?.facebook.posts || 0 },
    { name: "Instagram", value: platformBreakdown?.instagram.impressions || 0, posts: platformBreakdown?.instagram.posts || 0 },
    { name: "TikTok", value: platformBreakdown?.tiktok.impressions || 0, posts: platformBreakdown?.tiktok.posts || 0 },
    { name: "WhatsApp", value: platformBreakdown?.whatsapp.impressions || 0, posts: platformBreakdown?.whatsapp.posts || 0 },
  ].filter(p => p.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            Analytics em Tempo Real
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desempenho de suas campanhas em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => metricsQuery.refetch()}
            disabled={metricsQuery.isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Meta
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportQuery.isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Quick Period Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={quickPeriod === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => setQuickPeriod("today")}
        >
          Hoje
        </Button>
        <Button
          variant={quickPeriod === "yesterday" ? "default" : "outline"}
          size="sm"
          onClick={() => setQuickPeriod("yesterday")}
        >
          Ontem
        </Button>
        <Button
          variant={quickPeriod === "7days" ? "default" : "outline"}
          size="sm"
          onClick={() => setQuickPeriod("7days")}
        >
          Últimos 7 dias
        </Button>
        <Button
          variant={quickPeriod === null ? "default" : "outline"}
          size="sm"
          onClick={() => setQuickPeriod(null)}
        >
          Customizado
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {quickPeriod === null && (
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Selecione período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          )}
          {quickPeriod && (
            <div className="text-sm font-medium text-muted-foreground">
              {quickPeriod === "today" && "Dados de Hoje"}
              {quickPeriod === "yesterday" && "Dados de Ontem"}
              {quickPeriod === "7days" && "Últimos 7 Dias"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Auto-atualizar:</label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-2">{card.value}</p>
                  {card.change !== undefined && (
                    <p className={`text-xs mt-1 ${card.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {card.change >= 0 ? "↑" : "↓"} {Math.abs(card.change).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">CTR</p>
              <p className="text-2xl font-bold mt-2">{metrics?.ctr?.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Taxa de Engajamento</p>
              <p className="text-2xl font-bold mt-2">{metrics?.engagementRate?.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold mt-2">{metrics?.conversionRate?.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">CPM</p>
              <p className="text-2xl font-bold mt-2">R$ {metrics?.cpm?.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="platforms">Plataformas</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          {/* Impressions Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Impressões ao Longo do Tempo</CardTitle>
              <CardDescription>Evolução de impressões nos últimos {selectedPeriod} dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="impressions" stroke="#3b82f6" fill="#93c5fd" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Multiple Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Principais</CardTitle>
              <CardDescription>Comparação de múltiplas métricas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="engagement" stroke="#ec4899" />
                  <Line type="monotone" dataKey="clicks" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement and Conversions */}
          <Card>
            <CardHeader>
              <CardTitle>Engajamento e Conversões</CardTitle>
              <CardDescription>Análise de engajamento e conversões</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="engagement" fill="#ec4899" />
                  <Bar dataKey="conversions" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          {/* Platform Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Plataforma</CardTitle>
              <CardDescription>Impressões por plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(platformColors)[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformData.map((platform) => (
              <Card key={platform.name}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{platform.name}</p>
                      <Badge variant="secondary">{platform.posts} posts</Badge>
                    </div>
                    <div className="text-2xl font-bold">{platform.value.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Impressões</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {comparison && (
            <>
              {/* Period Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparação de Períodos</CardTitle>
                  <CardDescription>
                    Período atual vs período anterior ({selectedPeriod} dias cada)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          metric: "Impressões",
                          atual: comparison.currentPeriod.metrics.impressions,
                          anterior: comparison.previousPeriod.metrics.impressions,
                        },
                        {
                          metric: "Alcance",
                          atual: comparison.currentPeriod.metrics.reach,
                          anterior: comparison.previousPeriod.metrics.reach,
                        },
                        {
                          metric: "Engajamento",
                          atual: comparison.currentPeriod.metrics.engagement,
                          anterior: comparison.previousPeriod.metrics.engagement,
                        },
                        {
                          metric: "Cliques",
                          atual: comparison.currentPeriod.metrics.clicks,
                          anterior: comparison.previousPeriod.metrics.clicks,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="atual" fill="#3b82f6" name="Período Atual" />
                      <Bar dataKey="anterior" fill="#d1d5db" name="Período Anterior" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Changes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(comparison.changes).map(([metric, change]) => (
                  <Card key={metric}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground capitalize">{metric}</p>
                        <p className={`text-2xl font-bold mt-2 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
