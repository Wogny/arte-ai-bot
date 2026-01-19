import { useState } from "react";
import { Link } from "wouter";

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  description: string;
  features: string[];
  stats: {
    followers: number;
    posts: number;
    engagement: number;
  };
  isConnected: boolean;
  route: string;
}

export default function PlatformHub() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const platforms: Platform[] = [
    {
      id: "facebook",
      name: "Facebook",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: "#1877F2",
      gradient: "from-[#1877F2] to-[#0d65d9]",
      description: "Gerencie páginas, grupos, eventos e Marketplace",
      features: ["Posts & Stories", "Grupos", "Eventos", "Marketplace", "Anúncios"],
      stats: { followers: 45200, posts: 342, engagement: 8.5 },
      isConnected: true,
      route: "/platforms/facebook",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: "#E4405F",
      gradient: "from-[#833AB4] via-[#E4405F] to-[#FCAF45]",
      description: "Feed, Stories, Reels e Shopping integrados",
      features: ["Feed Posts", "Stories", "Reels", "Shopping", "Hashtags"],
      stats: { followers: 25400, posts: 189, engagement: 12.3 },
      isConnected: true,
      route: "/platforms/instagram",
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      ),
      color: "#000000",
      gradient: "from-[#25F4EE] to-[#FE2C55]",
      description: "Vídeos virais, trends e duetos",
      features: ["Vídeos", "Trends", "Sons", "Efeitos", "Duetos"],
      stats: { followers: 89200, posts: 56, engagement: 28.5 },
      isConnected: true,
      route: "/platforms/tiktok",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: "#25D366",
      gradient: "from-[#25D366] to-[#128C7E]",
      description: "Broadcasts, catálogo e atendimento",
      features: ["Broadcasts", "Catálogo", "Status", "Templates", "Respostas Rápidas"],
      stats: { followers: 2030, posts: 0, engagement: 94 },
      isConnected: true,
      route: "/platforms/whatsapp",
    },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const totalFollowers = platforms.reduce((acc, p) => acc + p.stats.followers, 0);
  const totalPosts = platforms.reduce((acc, p) => acc + p.stats.posts, 0);
  const avgEngagement = platforms.reduce((acc, p) => acc + p.stats.engagement, 0) / platforms.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Central de Plataformas</h1>
        <p className="text-gray-400">Gerencie todas as suas redes sociais em um só lugar</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🌐</span>
            <span className="text-sm text-gray-400">Plataformas Conectadas</span>
          </div>
          <div className="text-3xl font-bold">{platforms.filter(p => p.isConnected).length}</div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👥</span>
            <span className="text-sm text-gray-400">Total de Seguidores</span>
          </div>
          <div className="text-3xl font-bold">{formatNumber(totalFollowers)}</div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📝</span>
            <span className="text-sm text-gray-400">Total de Posts</span>
          </div>
          <div className="text-3xl font-bold">{formatNumber(totalPosts)}</div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📈</span>
            <span className="text-sm text-gray-400">Engajamento Médio</span>
          </div>
          <div className="text-3xl font-bold">{avgEngagement.toFixed(1)}%</div>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-white/20 ${
              selectedPlatform === platform.id ? "ring-2 ring-white/30" : ""
            }`}
          >
            {/* Header with gradient */}
            <div className={`h-24 bg-gradient-to-r ${platform.gradient} relative`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-4 left-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-gray-900">
                  {platform.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{platform.name}</h2>
                  <p className="text-white/80 text-sm">{platform.description}</p>
                </div>
              </div>
              {platform.isConnected && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Conectado
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatNumber(platform.stats.followers)}</div>
                  <div className="text-xs text-gray-400">Seguidores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{platform.stats.posts}</div>
                  <div className="text-xs text-gray-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{platform.stats.engagement}%</div>
                  <div className="text-xs text-gray-400">Engajamento</div>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-6">
                {platform.features.map((feature) => (
                  <span
                    key={feature}
                    className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  to={platform.route}
                  className={`flex-1 bg-gradient-to-r ${platform.gradient} hover:opacity-90 text-white px-4 py-3 rounded-xl font-medium transition-all text-center`}
                >
                  Gerenciar
                </Link>
                <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-all">
                  ⚙️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition-all">
            <span className="text-3xl mb-2 block">📝</span>
            <span className="text-sm">Criar Post</span>
          </button>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition-all">
            <span className="text-3xl mb-2 block">📅</span>
            <span className="text-sm">Agendar</span>
          </button>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition-all">
            <span className="text-3xl mb-2 block">📊</span>
            <span className="text-sm">Ver Analytics</span>
          </button>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition-all">
            <span className="text-3xl mb-2 block">🔗</span>
            <span className="text-sm">Conectar Conta</span>
          </button>
        </div>
      </div>

      {/* Cross-Platform Posting */}
      <div className="mt-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">🚀 Publicação Multi-Plataforma</h3>
            <p className="text-gray-400">Crie um post e publique em todas as plataformas de uma vez</p>
          </div>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white px-6 py-3 rounded-xl font-medium transition-all">
            Criar Post Universal
          </button>
        </div>
      </div>
    </div>
  );
}
