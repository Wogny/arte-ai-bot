import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Image,
  FileText,
  Loader2,
} from "lucide-react";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Dados mockados para demonstração
const generateMockData = (days: number) => {
  const labels = [];
  const views = [];
  const likes = [];
  const comments = [];
  const shares = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }));
    views.push(Math.floor(Math.random() * 5000) + 1000);
    likes.push(Math.floor(Math.random() * 500) + 100);
    comments.push(Math.floor(Math.random() * 100) + 20);
    shares.push(Math.floor(Math.random() * 50) + 10);
  }
  
  return { labels, views, likes, comments, shares };
};

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [activeTab, setActiveTab] = useState("overview");

  // Dados serão carregados de APIs reais quando implementadas
  const isLoading = false;

  // Dados mockados baseados no período
  const mockData = useMemo(() => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    return generateMockData(days);
  }, [period]);

  // Configuração do gráfico de linha (Engajamento ao longo do tempo)
  const engagementChartData = {
    labels: mockData.labels,
    datasets: [
      {
        label: "Visualizações",
        data: mockData.views,
        borderColor: "rgb(34, 211, 238)",
        backgroundColor: "rgba(34, 211, 238, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Curtidas",
        data: mockData.likes,
        borderColor: "rgb(236, 72, 153)",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Configuração do gráfico de barras (Posts por plataforma)
  const platformChartData = {
    labels: ["Instagram", "TikTok", "Facebook", "LinkedIn", "Twitter"],
    datasets: [
      {
        label: "Posts Publicados",
        data: [45, 32, 28, 15, 12],
        backgroundColor: [
          "rgba(236, 72, 153, 0.8)",
          "rgba(34, 211, 238, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
        borderRadius: 8,
      },
    ],
  };

  // Configuração do gráfico de rosca (Distribuição de conteúdo)
  const contentTypeChartData = {
    labels: ["Imagens", "Vídeos", "Carrosséis", "Stories", "Reels"],
    datasets: [
      {
        data: [40, 25, 15, 12, 8],
        backgroundColor: [
          "rgba(34, 211, 238, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(16, 185, 129, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  // Configuração do gráfico de barras (Melhor horário)
  const bestTimeChartData = {
    labels: ["6h", "9h", "12h", "15h", "18h", "21h", "00h"],
    datasets: [
      {
        label: "Engajamento Médio",
        data: [120, 450, 680, 520, 890, 750, 320],
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "rgba(255, 255, 255, 0.7)",
          padding: 20,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "rgba(255, 255, 255, 0.7)",
          padding: 15,
        },
      },
    },
  };

  // Estatísticas de resumo
  const stats = [
    {
      title: "Total de Visualizações",
      value: "125.4K",
      change: "+12.5%",
      trend: "up",
      icon: Eye,
      color: "cyan",
    },
    {
      title: "Curtidas",
      value: "8.2K",
      change: "+8.3%",
      trend: "up",
      icon: Heart,
      color: "pink",
    },
    {
      title: "Comentários",
      value: "1.5K",
      change: "-2.1%",
      trend: "down",
      icon: MessageCircle,
      color: "purple",
    },
    {
      title: "Compartilhamentos",
      value: "892",
      change: "+15.7%",
      trend: "up",
      icon: Share2,
      color: "green",
    },
  ];

  const colorClasses: Record<string, string> = {
    cyan: "bg-cyan-500/20 text-cyan-400",
    pink: "bg-pink-500/20 text-pink-400",
    purple: "bg-purple-500/20 text-purple-400",
    green: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Acompanhe o desempenho do seu conteúdo em tempo real</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={stat.trend === "up" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white mt-3">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20">
              <Activity className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-cyan-500/20">
              <Image className="w-4 h-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="audience" className="data-[state=active]:bg-cyan-500/20">
              <Users className="w-4 h-4 mr-2" />
              Audiência
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Engajamento ao longo do tempo */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Engajamento ao Longo do Tempo</CardTitle>
                <CardDescription className="text-gray-400">
                  Visualizações e curtidas nos últimos {period === "7d" ? "7" : period === "30d" ? "30" : "90"} dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Line data={engagementChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Posts por Plataforma */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Posts por Plataforma</CardTitle>
                  <CardDescription className="text-gray-400">
                    Distribuição de publicações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <Bar data={platformChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Melhor Horário */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Melhor Horário para Postar</CardTitle>
                  <CardDescription className="text-gray-400">
                    Engajamento médio por horário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <Bar data={bestTimeChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tipo de Conteúdo */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Tipo de Conteúdo</CardTitle>
                  <CardDescription className="text-gray-400">
                    Distribuição por formato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Doughnut data={contentTypeChartData} options={doughnutOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Top Posts */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Top Posts</CardTitle>
                  <CardDescription className="text-gray-400">
                    Melhores publicações do período
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        #{i}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">Post sobre dicas de marketing</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {Math.floor(Math.random() * 5000)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {Math.floor(Math.random() * 500)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {Math.floor(Math.random() * 100)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-pink-500/20 text-pink-400">
                        Instagram
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Demografia */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Faixa Etária</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { age: "18-24", percent: 25 },
                    { age: "25-34", percent: 40 },
                    { age: "35-44", percent: 20 },
                    { age: "45-54", percent: 10 },
                    { age: "55+", percent: 5 },
                  ].map((item) => (
                    <div key={item.age} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{item.age}</span>
                        <span className="text-white">{item.percent}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Gênero */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Gênero</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { gender: "Feminino", percent: 58, color: "from-pink-500 to-rose-500" },
                    { gender: "Masculino", percent: 40, color: "from-cyan-500 to-blue-500" },
                    { gender: "Outro", percent: 2, color: "from-purple-500 to-violet-500" },
                  ].map((item) => (
                    <div key={item.gender} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{item.gender}</span>
                        <span className="text-white">{item.percent}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Localização */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Top Cidades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { city: "São Paulo", percent: 35 },
                    { city: "Rio de Janeiro", percent: 20 },
                    { city: "Belo Horizonte", percent: 12 },
                    { city: "Curitiba", percent: 8 },
                    { city: "Porto Alegre", percent: 6 },
                  ].map((item) => (
                    <div key={item.city} className="flex items-center justify-between">
                      <span className="text-gray-400">{item.city}</span>
                      <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                        {item.percent}%
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
