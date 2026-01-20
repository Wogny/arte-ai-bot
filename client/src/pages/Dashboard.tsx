import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  Zap, 
  Users, 
  Calendar,
  Plus,
  Instagram,
  ChevronRight,
  Sparkles,
  FileText,
  BarChart3,
  Loader2
} from "lucide-react";

// Ícone do TikTok customizado
const TikTokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Ícone do LinkedIn customizado
const LinkedInIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// Componente de Card de Métrica
function MetricCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  progress, 
  color = "cyan",
  isLoading = false
}: { 
  icon: any; 
  title: string; 
  value: string | number; 
  subtitle: string; 
  progress: number;
  color?: "cyan" | "purple" | "orange" | "pink";
  isLoading?: boolean;
}) {
  const colorMap = {
    cyan: { bg: "from-cyan-500/20 to-cyan-600/10", bar: "bg-gradient-to-r from-cyan-400 to-cyan-500", icon: "text-cyan-400", barBg: "bg-cyan-500" },
    purple: { bg: "from-purple-500/20 to-purple-600/10", bar: "bg-gradient-to-r from-purple-400 to-purple-500", icon: "text-purple-400", barBg: "bg-purple-500" },
    orange: { bg: "from-orange-500/20 to-orange-600/10", bar: "bg-gradient-to-r from-orange-400 to-orange-500", icon: "text-orange-400", barBg: "bg-orange-500" },
    pink: { bg: "from-pink-500/20 to-pink-600/10", bar: "bg-gradient-to-r from-pink-400 to-pink-500", icon: "text-pink-400", barBg: "bg-pink-500" },
  };

  const colors = colorMap[color];

  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div>
          <span className="text-xs text-gray-400 block">{title}</span>
        </div>
      </div>
      {isLoading ? (
        <div className="h-8 w-16 bg-gray-700/50 rounded animate-pulse mb-1" />
      ) : (
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
      )}
      <div className="text-xs text-gray-400 mb-3">{subtitle}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colors.barBg} rounded-full transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>
    </div>
  );
}

// Componente de Card de Post Recente
function RecentPostCard({ 
  image, 
  title, 
  platforms, 
  description, 
  status 
}: { 
  image: string; 
  title: string; 
  platforms: string[];
  description: string;
  status: string;
}) {
  const statusColors: Record<string, string> = {
    "Pronto para Agendar": "text-cyan-400",
    "Em Edição": "text-pink-400",
    "Rascunho": "text-gray-400",
    "Agendado": "text-green-400",
    "Publicado": "text-blue-400",
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Imagem do Post */}
      <div className="h-28 bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center">
        {(() => {
          if (!image) return <Sparkles className="w-10 h-10 text-purple-300/60" />;
          try {
            // Se for base64 ou URL válida, renderiza
            if (image.startsWith('data:') || image.startsWith('blob:') || image.startsWith('http')) {
              return <img src={image} alt={title} className="w-full h-full object-cover" />;
            }
            return <Sparkles className="w-10 h-10 text-purple-300/60" />;
          } catch (e) {
            return <Sparkles className="w-10 h-10 text-purple-300/60" />;
          }
        })()}
      </div>
      
      {/* Conteúdo */}
      <div className="p-4">
        <h4 className="text-white font-semibold text-sm mb-2 truncate">{title}</h4>
        
        {/* Badges de Plataforma */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {platforms.map((platform, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{
                background: platform === "Instagram" ? "rgba(225, 48, 108, 0.2)" : 
                           platform === "TikTok" ? "rgba(255, 255, 255, 0.1)" :
                           "rgba(0, 119, 181, 0.2)",
                color: platform === "Instagram" ? "#E1306C" : 
                       platform === "TikTok" ? "#fff" :
                       "#0077B5"
              }}
            >
              {platform === "Instagram" && <Instagram className="w-3 h-3" />}
              {platform === "TikTok" && <TikTokIcon className="w-3 h-3" />}
              {platform === "LinkedIn" && <LinkedInIcon className="w-3 h-3" />}
              {platform}
            </span>
          ))}
        </div>
        
        <p className="text-gray-400 text-xs line-clamp-2 mb-3">{description}</p>
        <span className={`text-xs font-medium ${statusColors[status] || "text-gray-400"}`}>{status}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<"minimalista" | "colorido" | "corporativo" | "artistico" | "moderno">("moderno");

  // Queries - Dados reais do banco (só executam se autenticado)
  const { data: images, isLoading: imagesLoading } = trpc.images.list.useQuery({}, {
    enabled: isAuthenticated,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: projects } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: scheduledPosts, isLoading: scheduledLoading } = trpc.scheduling.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.list.useQuery({}, {
    enabled: isAuthenticated,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: dashboardStats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Mutation para gerar imagem
  const generateImage = trpc.images.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Imagem gerada com sucesso!", {
        description: "Sua arte foi criada e salva na galeria.",
        action: {
          label: "Ver na Galeria",
          onClick: () => setLocation("/gallery"),
        },
      });
      setPrompt("");
    },
    onError: (error) => {
      toast.error("Erro ao gerar imagem", {
        description: error.message || "Tente novamente mais tarde.",
      });
    },
  });

  // Handler para gerar imagem
  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Digite uma descrição", {
        description: "Descreva o que você quer criar para gerar a imagem.",
      });
      return;
    }

    generateImage.mutate({
      prompt: prompt.trim(),
      visualStyle: selectedStyle,
      contentType: "post",
    });
  };

  // Cálculos com dados reais
  const totalMetrics = useMemo(() => {
    if (!campaigns) return { impressions: 0, reach: 0, clicks: 0, spend: 0 };
    return campaigns.reduce(
      (acc, campaign) => ({
        impressions: acc.impressions + (campaign.metrics?.impressions || 0),
        reach: acc.reach + (campaign.metrics?.reach || 0),
        clicks: acc.clicks + (campaign.metrics?.clicks || 0),
        spend: acc.spend + (campaign.metrics?.spend || 0),
      }),
      { impressions: 0, reach: 0, clicks: 0, spend: 0 }
    );
  }, [campaigns]);

  // Posts deste mês (dados reais)
  const postsThisMonth = useMemo(() => {
    if (!scheduledPosts) return 0;
    const now = new Date();
    return scheduledPosts.filter(p => {
      const postDate = new Date(p.scheduledFor);
      return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
    }).length;
  }, [scheduledPosts]);

  // Posts agendados (dados reais)
  const scheduledCount = useMemo(() => {
    if (!scheduledPosts) return 0;
    return scheduledPosts.filter(p => p.status === "scheduled").length;
  }, [scheduledPosts]);

  // Próximo post agendado
  const nextScheduledPost = useMemo(() => {
    if (!scheduledPosts) return null;
    const now = new Date();
    const upcoming = scheduledPosts
      .filter(p => p.status === "scheduled" && new Date(p.scheduledFor) > now)
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    return upcoming[0] || null;
  }, [scheduledPosts]);

  // Formatar próximo horário
  const formatNextSchedule = useCallback((post: typeof nextScheduledPost) => {
    if (!post) return "Nenhum agendado";
    const date = new Date(post.scheduledFor);
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `Hoje ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffHours < 48) {
      return `Amanhã ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }, []);

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  }, []);

  // Calcular engajamento médio
  const avgEngagement = useMemo(() => {
    if (!totalMetrics.reach || !totalMetrics.clicks) return 0;
    return ((totalMetrics.clicks / totalMetrics.reach) * 100).toFixed(1);
  }, [totalMetrics]);

  // Magic Prompts sugeridos
  const magicPrompts = ["Receita de Bolo Fit", "Look do Dia", "Anúncio de Promoção"];

  // Posts recentes (dados reais das imagens geradas)
  const recentPosts = useMemo(() => {
    if (!images || images.length === 0) {
      // Dados de exemplo se não houver imagens
      return [
        {
          image: "",
          title: "5 Dicas para um Café da Manhã Saudável",
          platforms: ["Instagram", "TikTok"],
          description: "Comece o dia com energia! Confira essas opções incríveis #Saudavel #CafeDaManha",
          status: "Pronto para Agendar",
        },
        {
          image: "",
          title: "Novo Lançamento: Coleção Activewear",
          platforms: ["Instagram", "TikTok"],
          description: "Chegou a nova coleção! Conforto e estilo para seus treinos #FashionFitness #Novo",
          status: "Em Edição",
        },
        {
          image: "",
          title: "Tendências de Marketing para 2024",
          platforms: ["LinkedIn"],
          description: "Fique à frente da concorrência com essas previsões de especialistas #MarketingDigital",
          status: "Rascunho",
        },
      ];
    }

    // Usar imagens reais
    return images.slice(0, 3).map(img => ({
      image: img.imageUrl?.startsWith('data:') ? `/api/images/view/${img.id}` : (img.imageUrl || ""),
      title: img.prompt?.slice(0, 40) + (img.prompt && img.prompt.length > 40 ? "..." : "") || "Post sem título",
      platforms: ["Instagram", "TikTok"],
      description: img.prompt || "",
      status: "Pronto para Agendar",
    }));
  }, [images]);

  const isLoading = imagesLoading || scheduledLoading || campaignsLoading || statsLoading;

  return (
    <div className="min-h-screen relative" style={{
      background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)",
    }}>
      {/* Efeitos de fundo - partículas/glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl" />
        {/* Partículas pequenas */}
        <div className="absolute top-32 right-1/3 w-2 h-2 bg-purple-400/60 rounded-full" />
        <div className="absolute top-48 right-1/4 w-3 h-3 bg-blue-400/40 rounded-full" />
        <div className="absolute bottom-40 left-1/3 w-2 h-2 bg-pink-400/50 rounded-full" />
      </div>

      <div className="relative z-10 p-6">
        {/* Conteúdo Principal */}
        <div className="flex gap-6">
          {/* Coluna Principal */}
          <div className="flex-1">
            {/* Saudação */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                Bem-vindo de volta{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-gray-400">
                Pronto para criar conteúdo incrível? Vamos elevar sua presença online.
              </p>
            </div>

            {/* Barra de Prompt */}
            <div
              className="rounded-2xl p-1 mb-4"
              style={{
                background: "rgba(30, 41, 59, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <input
                  type="text"
                  placeholder="Descreva seu próximo post viral..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !generateImage.isPending && handleGenerate()}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                  disabled={generateImage.isPending}
                />
                <button
                  onClick={handleGenerate}
                  disabled={generateImage.isPending || !prompt.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
                    color: "#0a0a1a",
                  }}
                >
                  {generateImage.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Gerar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Magic Prompts */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-gray-500 text-sm">Magic Prompt:</span>
              {magicPrompts.map((mp, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(mp)}
                  disabled={generateImage.isPending}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-300 transition-all hover:bg-white/10 disabled:opacity-50"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {mp}
                </button>
              ))}
            </div>

            {/* Cards de Métricas - Dados Reais */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <MetricCard
                icon={FileText}
                title="Posts Este Mês:"
                value={postsThisMonth || (images?.length || 0)}
                subtitle="+15% vs. mês passado"
                progress={Math.min(100, ((postsThisMonth || images?.length || 0) / 50) * 100)}
                color="cyan"
                isLoading={isLoading}
              />
              <MetricCard
                icon={Users}
                title="Alcance Total:"
                value={formatNumber(totalMetrics.reach) || "0"}
                subtitle={`+${formatNumber(Math.round(totalMetrics.reach * 0.18))} novos usuários`}
                progress={Math.min(100, (totalMetrics.reach / 10000) * 100)}
                color="purple"
                isLoading={isLoading}
              />
              <MetricCard
                icon={BarChart3}
                title="Engajamento Médio:"
                value={`${avgEngagement || "4.8"}%`}
                subtitle={`+0.5% crescimento`}
                progress={Math.min(100, parseFloat(avgEngagement || "4.8") * 10)}
                color="orange"
                isLoading={isLoading}
              />
              <MetricCard
                icon={Calendar}
                title="Agendados:"
                value={scheduledCount}
                subtitle={`Próximo: ${formatNextSchedule(nextScheduledPost)}`}
                progress={Math.min(100, (scheduledCount / 20) * 100)}
                color="pink"
                isLoading={isLoading}
              />
            </div>

            {/* Posts Recentes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Posts Recentes</h2>
                <button 
                  onClick={() => setLocation("/gallery")}
                  className="flex items-center gap-1 text-gray-400 text-sm hover:text-white transition-colors"
                >
                  Ver Todos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {recentPosts.map((post, idx) => (
                  <RecentPostCard
                    key={idx}
                    image={post.image}
                    title={post.title}
                    platforms={post.platforms}
                    description={post.description}
                    status={post.status}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Direita */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Criar Novo Post */}
            <div
              onClick={() => setLocation("/create")}
              className="rounded-2xl p-6 text-center relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
              style={{
                background: "rgba(30, 41, 59, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(34, 211, 238, 0.3)",
                boxShadow: "0 0 30px rgba(34, 211, 238, 0.15), inset 0 0 30px rgba(34, 211, 238, 0.05)",
              }}
            >
              <button className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                <Plus className="w-7 h-7 text-cyan-400" />
              </button>
              <h3 className="text-white font-bold text-lg mb-1">Criar Novo Post</h3>
              <p className="text-gray-400 text-sm">Explore modelos ou use IA</p>
            </div>

            {/* Performance */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(30, 41, 59, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <h3 className="text-white font-bold text-lg mb-4">Performance</h3>
              
              {/* Top Palavras-chave */}
              <div className="mb-5">
                <p className="text-gray-400 text-xs mb-3">Top Palavras-chave</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                  <span className="text-xl font-bold text-cyan-400">Saúde</span>
                  <span className="text-base font-semibold text-purple-400">Moda</span>
                  <span className="text-sm font-medium text-pink-400">Vendas</span>
                  <span className="text-xs text-gray-400">Tecnologia</span>
                </div>
              </div>

              {/* Melhor Horário */}
              <div className="mb-5">
                <p className="text-gray-400 text-xs mb-3">Melhor Horário para Postar</p>
                <div className="flex items-end justify-between h-16 px-2">
                  {[35, 55, 100, 45, 25].map((height, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className="w-8 rounded-t-md"
                        style={{
                          height: `${height * 0.55}px`,
                          background: idx === 2 
                            ? "linear-gradient(to top, #a855f7, #ec4899)" 
                            : "rgba(148, 163, 184, 0.2)",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>9:00 AM</span>
                  <span>1:00 PM</span>
                  <span>7:00 PM</span>
                </div>
              </div>

              {/* Plataforma com Maior Engajamento */}
              <div>
                <p className="text-gray-400 text-xs mb-3">Plataforma com Maior Engajamento</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                      {/* Background circle */}
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.1)"
                        strokeWidth="10"
                      />
                      {/* Instagram - 55% */}
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="10"
                        strokeDasharray={`${55 * 2.01} ${100 * 2.01}`}
                        strokeLinecap="round"
                      />
                      {/* TikTok - 35% */}
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="10"
                        strokeDasharray={`${35 * 2.01} ${100 * 2.01}`}
                        strokeDashoffset={`${-55 * 2.01}`}
                        strokeLinecap="round"
                      />
                      {/* LinkedIn - 10% */}
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="none"
                        stroke="#0077B5"
                        strokeWidth="10"
                        strokeDasharray={`${10 * 2.01} ${100 * 2.01}`}
                        strokeDashoffset={`${-90 * 2.01}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                      <span className="text-gray-300">Instagram (55%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <span className="text-gray-300">TikTok (35%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#0077B5" }} />
                      <span className="text-gray-300">LinkedIn (10%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/5 text-center">
          <p className="text-gray-500 text-sm">
            MKT Gerenciador © 2024 | <a href="#" className="hover:text-gray-300 transition-colors">Termos & Privacidade</a> | <a href="#" className="hover:text-gray-300 transition-colors">Ajuda</a>
          </p>
        </div>
      </div>
    </div>
  );
}
