import { useMemo } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
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
import { TrendingUp, TrendingDown, Users, Heart, MessageCircle, Share2 } from "lucide-react";

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

interface AnalyticsData {
  postsPublished: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  growthRate: number;
  topPlatform: string;
  weeklyData: {
    labels: string[];
    reach: number[];
    engagement: number[];
    posts: number[];
  };
  platformDistribution: {
    instagram: number;
    tiktok: number;
    facebook: number;
    linkedin: number;
  };
  bestPostingTimes: {
    hour: number;
    engagement: number;
  }[];
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData;
  isLoading?: boolean;
}

export default function AnalyticsDashboard({ data, isLoading }: AnalyticsDashboardProps) {
  // Dados de exemplo se não houver dados reais
  const analyticsData: AnalyticsData = data || {
    postsPublished: 24,
    totalReach: 45320,
    totalEngagement: 3240,
    avgEngagementRate: 7.2,
    growthRate: 15.3,
    topPlatform: "Instagram",
    weeklyData: {
      labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
      reach: [5200, 6800, 7200, 8100, 9500, 4300, 4220],
      engagement: [420, 580, 640, 720, 850, 380, 350],
      posts: [3, 4, 3, 5, 4, 2, 3],
    },
    platformDistribution: {
      instagram: 45,
      tiktok: 30,
      facebook: 15,
      linkedin: 10,
    },
    bestPostingTimes: [
      { hour: 9, engagement: 520 },
      { hour: 12, engagement: 680 },
      { hour: 18, engagement: 920 },
      { hour: 21, engagement: 750 },
    ],
  };

  // Configurações de gráficos
  const lineChartData = useMemo(
    () => ({
      labels: analyticsData.weeklyData.labels,
      datasets: [
        {
          label: "Alcance",
          data: analyticsData.weeklyData.reach,
          borderColor: "rgb(34, 211, 238)",
          backgroundColor: "rgba(34, 211, 238, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Engajamento",
          data: analyticsData.weeklyData.engagement,
          borderColor: "rgb(168, 85, 247)",
          backgroundColor: "rgba(168, 85, 247, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [analyticsData]
  );

  const barChartData = useMemo(
    () => ({
      labels: analyticsData.bestPostingTimes.map((t) => `${t.hour}h`),
      datasets: [
        {
          label: "Engajamento por Horário",
          data: analyticsData.bestPostingTimes.map((t) => t.engagement),
          backgroundColor: [
            "rgba(34, 211, 238, 0.8)",
            "rgba(168, 85, 247, 0.8)",
            "rgba(251, 146, 60, 0.8)",
            "rgba(236, 72, 153, 0.8)",
          ],
          borderColor: [
            "rgb(34, 211, 238)",
            "rgb(168, 85, 247)",
            "rgb(251, 146, 60)",
            "rgb(236, 72, 153)",
          ],
          borderWidth: 1,
        },
      ],
    }),
    [analyticsData]
  );

  const doughnutChartData = useMemo(
    () => ({
      labels: ["Instagram", "TikTok", "Facebook", "LinkedIn"],
      datasets: [
        {
          data: [
            analyticsData.platformDistribution.instagram,
            analyticsData.platformDistribution.tiktok,
            analyticsData.platformDistribution.facebook,
            analyticsData.platformDistribution.linkedin,
          ],
          backgroundColor: [
            "rgba(225, 48, 108, 0.8)",
            "rgba(255, 255, 255, 0.8)",
            "rgba(24, 119, 242, 0.8)",
            "rgba(0, 119, 181, 0.8)",
          ],
          borderColor: [
            "rgb(225, 48, 108)",
            "rgb(255, 255, 255)",
            "rgb(24, 119, 242)",
            "rgb(0, 119, 181)",
          ],
          borderWidth: 2,
        },
      ],
    }),
    [analyticsData]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: "#fff",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.95)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right" as const,
        labels: {
          color: "#fff",
          font: {
            size: 12,
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.95)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-gray-700/30 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-gray-700/30 animate-pulse" />
          <div className="h-80 rounded-2xl bg-gray-700/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          title="Alcance Total"
          value={formatNumber(analyticsData.totalReach)}
          change={analyticsData.growthRate}
          isPositive={analyticsData.growthRate > 0}
          color="cyan"
        />
        <KPICard
          icon={Heart}
          title="Engajamento"
          value={formatNumber(analyticsData.totalEngagement)}
          change={12.5}
          isPositive={true}
          color="pink"
        />
        <KPICard
          icon={MessageCircle}
          title="Taxa de Engajamento"
          value={`${analyticsData.avgEngagementRate}%`}
          change={2.3}
          isPositive={true}
          color="purple"
        />
        <KPICard
          icon={Share2}
          title="Posts Publicados"
          value={analyticsData.postsPublished.toString()}
          change={8.7}
          isPositive={true}
          color="orange"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Gráfico de Linha - Alcance e Engajamento */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(30, 41, 59, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="text-white font-semibold mb-4">Desempenho Semanal</h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Gráfico de Rosca - Distribuição por Plataforma */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(30, 41, 59, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="text-white font-semibold mb-4">Distribuição por Plataforma</h3>
          <div className="h-64">
            <Doughnut data={doughnutChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Gráfico de Barras - Melhores Horários */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "rgba(30, 41, 59, 0.6)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <h3 className="text-white font-semibold mb-4">Melhores Horários para Publicar</h3>
        <div className="h-64">
          <Bar data={barChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  icon: any;
  title: string;
  value: string;
  change: number;
  isPositive: boolean;
  color: "cyan" | "pink" | "purple" | "orange";
}

function KPICard({ icon: Icon, title, value, change, isPositive, color }: KPICardProps) {
  const colorMap = {
    cyan: "from-cyan-500/20 to-cyan-600/10",
    pink: "from-pink-500/20 to-pink-600/10",
    purple: "from-purple-500/20 to-purple-600/10",
    orange: "from-orange-500/20 to-orange-600/10",
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className={`p-2 rounded-xl bg-gradient-to-br ${colorMap[color]} inline-block mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-white mb-2">{value}</div>
      <div className="flex items-center gap-1 text-xs">
        {isPositive ? (
          <TrendingUp className="w-3 h-3 text-green-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-400" />
        )}
        <span className={isPositive ? "text-green-400" : "text-red-400"}>
          {isPositive ? "+" : ""}{change}%
        </span>
        <span className="text-gray-500">vs. semana passada</span>
      </div>
    </div>
  );
}
