import React, { useState, useMemo } from "react";
import { Sparkles, TrendingUp, Users, Zap, Calendar, Image as ImageIcon, Send, MoreVertical, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import MultiDevicePreview from "@/components/MultiDevicePreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componente de Skeleton para Stats
function StatSkeleton() {
  return (
    <div className="relative">
      <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="h-4 w-20 bg-white/10 animate-pulse rounded mb-2" />
            <div className="h-8 w-16 bg-white/10 animate-pulse rounded" />
          </div>
          <div className="h-6 w-6 bg-white/10 animate-pulse rounded" />
        </div>
        <div className="h-1 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}

// Componente de Skeleton para Posts
function PostSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
      <div className="w-16 h-16 bg-white/10 animate-pulse rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <div className="h-5 w-32 bg-white/10 animate-pulse rounded mb-2" />
        <div className="h-4 w-48 bg-white/10 animate-pulse rounded mb-2" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-white/10 animate-pulse rounded-full" />
          <div className="h-5 w-16 bg-white/10 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardNew() {
  const [magicPrompt, setMagicPrompt] = useState("");

  // Queries otimizadas com cache
  const { 
    data: analyticsData, 
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = trpc.analytics.getOverviewMetrics.useQuery(undefined, {
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { 
    data: scheduledPosts, 
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts
  } = trpc.scheduling.list.useQuery(undefined, {
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  // Memoização dos posts recentes
  const recentPosts = useMemo(() => {
    if (!scheduledPosts) return [];
    return scheduledPosts
      .filter(post => post.status === "scheduled" || post.status === "published")
      .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())
      .slice(0, 3);
  }, [scheduledPosts]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    if (!analyticsData) {
      return [
        { label: "Posts Este Mês", value: "...", icon: ImageIcon, color: "purple" },
        { label: "Alcance Total", value: "...", icon: Users, color: "blue" },
        { label: "Engajamento Médio", value: "...", icon: TrendingUp, color: "pink" },
        { label: "Agendados", value: "...", icon: Calendar, color: "green" }
      ];
    }

    return [
      { label: "Posts Este Mês", value: String(analyticsData.totalPosts || 0), icon: ImageIcon, color: "purple" },
      { label: "Alcance Total", value: formatCompactNumber(analyticsData.totalPosts * 520), icon: Users, color: "blue" },
      { label: "Engajamento Médio", value: "4.8%", icon: TrendingUp, color: "pink" },
      { label: "Agendados", value: String(analyticsData.scheduledPosts || 0), icon: Calendar, color: "green" }
    ];
  }, [analyticsData]);

  // Função para formatar números grandes
  function formatCompactNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
  }

  // Handler para o Magic Prompt
  const handleMagicGenerate = () => {
    if (!magicPrompt.trim()) return;
    // TODO: Integrar com a API de geração de conteúdo
    console.log("Gerando conteúdo para:", magicPrompt);
  };

  // Função de refresh
  const handleRefresh = () => {
    refetchAnalytics();
    refetchPosts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900/20 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">Arte AI Bot</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            <div className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full text-sm text-purple-300">
              Plano Professional
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Perfil
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Bem-vindo de volta! 👋</h1>
          <p className="text-gray-400">Veja o desempenho do seu conteúdo e crie novos posts com IA</p>
        </div>

        {/* Error Alert */}
        {(analyticsError || postsError) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-300">Alguns dados não puderam ser carregados.</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="ml-auto text-red-300 hover:text-white"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Magic Prompt Bar */}
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-1 border border-white/10">
            <div className="flex gap-3 p-4 bg-slate-900 rounded-xl">
              <Sparkles className="h-6 w-6 text-purple-400 flex-shrink-0" />
              <input
                type="text"
                value={magicPrompt}
                onChange={(e) => setMagicPrompt(e.target.value)}
                placeholder="Descreva o post que deseja criar... (ex: 'Promoção de verão com desconto de 30%')"
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleMagicGenerate()}
              />
              <Button 
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 gap-2"
                onClick={handleMagicGenerate}
                disabled={!magicPrompt.trim()}
              >
                <Send className="h-4 w-4" /> Gerar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {analyticsLoading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            stats.map((stat, i) => (
              <div key={i} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/20 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition`}></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-white/20 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Preview & Recent */}
          <div className="lg:col-span-2 space-y-8">
            {/* Multi-Device Preview Integration */}
            <MultiDevicePreview />

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Posts Recentes</h2>
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  Ver Todos
                </Button>
              </div>

              <div className="space-y-4">
                {postsLoading ? (
                  <>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                  </>
                ) : recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <div key={post.id} className="group flex gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition border border-white/5 hover:border-white/20">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">
                          {post.caption?.slice(0, 30) || `Post #${post.id}`}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Agendado para {post.platform}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                            {post.platform}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            post.status === "published" 
                              ? "bg-green-500/20 text-green-300" 
                              : "bg-blue-500/20 text-blue-300"
                          }`}>
                            {post.status === "published" ? "Publicado" : "Agendado"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-gray-400 hidden sm:block">
                          {format(new Date(post.scheduledFor), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum post recente</p>
                    <p className="text-sm">Use o campo acima para criar seu primeiro post!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Create Post Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition"></div>
              <div className="relative bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-md border border-purple-500/50 rounded-2xl p-6 text-center">
                <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Criar Novo Post</h3>
                <p className="text-sm text-gray-300 mb-4">Use a IA para gerar conteúdo em segundos</p>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90">
                  Começar Agora
                </Button>
              </div>
            </div>

            {/* Performance Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Performance</h3>
              <div className="space-y-3">
                {analyticsLoading ? (
                  <>
                    <div className="h-5 bg-white/10 animate-pulse rounded" />
                    <div className="h-5 bg-white/10 animate-pulse rounded" />
                    <div className="h-5 bg-white/10 animate-pulse rounded" />
                  </>
                ) : (
                  [
                    { label: "Melhor Horário", value: analyticsData?.bestTimePost || "Terça 18:00" },
                    { label: "Plataforma Top", value: getBestPlatform(analyticsData?.platformBreakdown) },
                    { label: "Taxa Crescimento", value: "+12% mês" }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-semibold">{item.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Status Rápido</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Posts Publicados</span>
                  <span className="text-green-400 font-semibold">
                    {analyticsLoading ? "..." : analyticsData?.publishedPosts || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Rascunhos</span>
                  <span className="text-yellow-400 font-semibold">
                    {analyticsLoading ? "..." : analyticsData?.draftPosts || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Falhas</span>
                  <span className="text-red-400 font-semibold">
                    {analyticsLoading ? "..." : analyticsData?.failedPosts || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Função auxiliar para obter a melhor plataforma
function getBestPlatform(breakdown?: Record<string, number>): string {
  if (!breakdown) return "Instagram";
  
  const entries = Object.entries(breakdown);
  if (entries.length === 0) return "Instagram";
  
  const best = entries.reduce((a, b) => a[1] > b[1] ? a : b);
  return best[0].charAt(0).toUpperCase() + best[0].slice(1);
}
