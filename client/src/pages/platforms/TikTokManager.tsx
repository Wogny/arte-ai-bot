import { useState } from "react";
import { trpc } from "@/lib/trpc";

// Tipos específicos do TikTok
interface TikTokAccount {
  id: string;
  username: string;
  displayName: string;
  profilePic: string | null;
  followers: number;
  following: number;
  likes: number;
  isBusinessAccount: boolean;
}

interface TikTokVideo {
  id: number;
  content: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  duration: number;
  soundName: string | null;
  hashtags: string[];
}

interface TrendingSound {
  id: string;
  name: string;
  author: string;
  uses: number;
  isOriginal: boolean;
  duration: number;
}

interface TrendingHashtag {
  tag: string;
  views: number;
  growth: number;
  category: string;
}

interface TikTokEffect {
  id: string;
  name: string;
  category: string;
  uses: number;
  previewUrl: string;
}

export default function TikTokManager() {
  const [activeTab, setActiveTab] = useState<"videos" | "trends" | "sounds" | "effects" | "analytics" | "duets">("videos");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data
  const account: TikTokAccount = {
    id: "1",
    username: "@minhaempresa",
    displayName: "Minha Empresa",
    profilePic: null,
    followers: 45200,
    following: 234,
    likes: 892000,
    isBusinessAccount: true,
  };

  const videos: TikTokVideo[] = [
    {
      id: 1,
      content: "5 dicas para aumentar suas vendas 📈 #empreendedorismo #vendas #dicas",
      videoUrl: "/videos/tiktok1.mp4",
      thumbnailUrl: null,
      status: "published",
      scheduledAt: null,
      publishedAt: new Date(),
      views: 125000,
      likes: 8920,
      comments: 342,
      shares: 567,
      saves: 1205,
      duration: 45,
      soundName: "Original Sound - @minhaempresa",
      hashtags: ["empreendedorismo", "vendas", "dicas"],
    },
    {
      id: 2,
      content: "POV: Você descobriu esse hack de produtividade 🤯",
      videoUrl: "/videos/tiktok2.mp4",
      thumbnailUrl: null,
      status: "published",
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 86400000),
      views: 89000,
      likes: 5420,
      comments: 189,
      shares: 234,
      saves: 890,
      duration: 30,
      soundName: "Música Viral 2024",
      hashtags: ["produtividade", "hack", "trabalho"],
    },
    {
      id: 3,
      content: "Respondendo comentários dos seguidores 💬",
      videoUrl: "/videos/tiktok3.mp4",
      thumbnailUrl: null,
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 86400000),
      publishedAt: null,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      duration: 60,
      soundName: null,
      hashtags: ["respostas", "comunidade"],
    },
  ];

  const trendingSounds: TrendingSound[] = [
    { id: "s1", name: "Música Viral 2024", author: "Artista Popular", uses: 2500000, isOriginal: false, duration: 30 },
    { id: "s2", name: "Beat Comercial", author: "Producer X", uses: 890000, isOriginal: false, duration: 15 },
    { id: "s3", name: "Trending Sound", author: "Creator Y", uses: 450000, isOriginal: true, duration: 45 },
    { id: "s4", name: "Remix Hit", author: "DJ Z", uses: 320000, isOriginal: false, duration: 20 },
  ];

  const trendingHashtags: TrendingHashtag[] = [
    { tag: "#fyp", views: 45000000000, growth: 5.2, category: "Geral" },
    { tag: "#viral", views: 32000000000, growth: 8.5, category: "Geral" },
    { tag: "#empreendedorismo", views: 2500000000, growth: 12.3, category: "Negócios" },
    { tag: "#dicasdevendas", views: 890000000, growth: 25.8, category: "Negócios" },
    { tag: "#marketingdigital", views: 1200000000, growth: 18.2, category: "Marketing" },
  ];

  const effects: TikTokEffect[] = [
    { id: "e1", name: "Green Screen", category: "Fundo", uses: 5000000, previewUrl: "" },
    { id: "e2", name: "Slow Motion", category: "Tempo", uses: 3200000, previewUrl: "" },
    { id: "e3", name: "Face Zoom", category: "Rosto", uses: 2800000, previewUrl: "" },
    { id: "e4", name: "Split Screen", category: "Layout", uses: 1500000, previewUrl: "" },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/20">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">TikTok Manager</h1>
            <p className="text-gray-400">Gerencie vídeos, trends e analytics</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#fe2c55] hover:bg-[#e91e45] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <span>+</span> Criar Vídeo
        </button>
      </div>

      {/* Perfil Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#25f4ee] to-[#fe2c55] rounded-full flex items-center justify-center text-2xl font-bold">
            {account.displayName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{account.displayName}</h2>
              <span className="text-gray-400">{account.username}</span>
              {account.isBusinessAccount && (
                <span className="bg-[#25f4ee]/20 text-[#25f4ee] px-2 py-0.5 rounded text-xs">Business</span>
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <div><span className="font-bold">{formatNumber(account.followers)}</span> <span className="text-gray-400">seguidores</span></div>
              <div><span className="font-bold">{formatNumber(account.following)}</span> <span className="text-gray-400">seguindo</span></div>
              <div><span className="font-bold">{formatNumber(account.likes)}</span> <span className="text-gray-400">curtidas</span></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#25f4ee]">+28.5%</div>
            <div className="text-sm text-gray-400">crescimento mensal</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "videos", label: "🎬 Vídeos" },
          { id: "trends", label: "🔥 Trends" },
          { id: "sounds", label: "🎵 Sons" },
          { id: "effects", label: "✨ Efeitos" },
          { id: "duets", label: "🤝 Duetos" },
          { id: "analytics", label: "📊 Analytics" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#fe2c55] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        {/* Videos Tab */}
        {activeTab === "videos" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Seus Vídeos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="aspect-[9/16] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center hover:border-[#fe2c55]/50 transition-all"
              >
                <span className="text-4xl mb-2">🎬</span>
                <span className="text-sm text-gray-400">Criar Vídeo</span>
              </button>
              {videos.map((video) => (
                <div key={video.id} className="aspect-[9/16] bg-gray-700 rounded-xl relative overflow-hidden group cursor-pointer">
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      video.status === "published" ? "bg-green-500" : "bg-yellow-500"
                    }`}>
                      {video.status === "published" ? "Publicado" : "Agendado"}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-0.5 text-xs">
                    {formatDuration(video.duration)}
                  </div>

                  {/* Sound */}
                  {video.soundName && (
                    <div className="absolute bottom-16 left-2 right-2 bg-black/50 rounded px-2 py-1 text-xs flex items-center gap-1 truncate">
                      <span>🎵</span> {video.soundName}
                    </div>
                  )}

                  {/* Stats Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
                    <p className="text-sm line-clamp-2 mb-2">{video.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-300">
                      <span>▶️ {formatNumber(video.views)}</span>
                      <span>❤️ {formatNumber(video.likes)}</span>
                      <span>💬 {formatNumber(video.comments)}</span>
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                    <button className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all">
                      <span>✏️</span>
                    </button>
                    <button className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all">
                      <span>📊</span>
                    </button>
                    <button className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all">
                      <span>🗑️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <div>
            <h2 className="text-xl font-bold mb-6">🔥 Hashtags em Alta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {trendingHashtags.map((hashtag, i) => (
                <div key={hashtag.tag} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#fe2c55]/20 rounded-full flex items-center justify-center text-[#fe2c55] font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{hashtag.tag}</div>
                    <div className="text-sm text-gray-400">{formatNumber(hashtag.views)} visualizações</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-sm">+{hashtag.growth}%</div>
                    <div className="text-xs text-gray-400">{hashtag.category}</div>
                  </div>
                  <button className="bg-[#fe2c55] hover:bg-[#e91e45] text-white px-3 py-1 rounded-lg text-sm transition-all">
                    Usar
                  </button>
                </div>
              ))}
            </div>

            {/* Trending Content Ideas */}
            <h3 className="font-bold mb-4">💡 Ideias de Conteúdo em Alta</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "POV Videos", description: "Vídeos de ponto de vista estão bombando", growth: "+45%" },
                { title: "Storytime", description: "Conte histórias envolventes", growth: "+32%" },
                { title: "Tutorial Rápido", description: "Dicas em menos de 30 segundos", growth: "+28%" },
              ].map((idea) => (
                <div key={idea.title} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">{idea.title}</h4>
                    <span className="text-green-400 text-sm">{idea.growth}</span>
                  </div>
                  <p className="text-sm text-gray-400">{idea.description}</p>
                  <button className="mt-3 w-full bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-all">
                    Criar com IA
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sounds Tab */}
        {activeTab === "sounds" && (
          <div>
            <h2 className="text-xl font-bold mb-6">🎵 Sons em Alta</h2>
            <div className="space-y-4">
              {trendingSounds.map((sound, i) => (
                <div key={sound.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#25f4ee] to-[#fe2c55] rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎵</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{sound.name}</span>
                      {sound.isOriginal && (
                        <span className="bg-[#25f4ee]/20 text-[#25f4ee] px-2 py-0.5 rounded text-xs">Original</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{sound.author} • {formatDuration(sound.duration)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatNumber(sound.uses)}</div>
                    <div className="text-xs text-gray-400">usos</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all">
                      ▶️
                    </button>
                    <button className="bg-[#fe2c55] hover:bg-[#e91e45] text-white px-3 py-2 rounded-lg text-sm transition-all">
                      Usar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sound Library */}
            <div className="mt-8">
              <h3 className="font-bold mb-4">📚 Biblioteca de Sons</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Comercial", "Motivacional", "Divertido", "Relaxante"].map((category) => (
                  <button key={category} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-all">
                    <span className="text-2xl mb-2 block">🎶</span>
                    <span className="font-medium">{category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === "effects" && (
          <div>
            <h2 className="text-xl font-bold mb-6">✨ Efeitos Populares</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {effects.map((effect) => (
                <div key={effect.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-[#25f4ee]/20 to-[#fe2c55]/20 flex items-center justify-center">
                    <span className="text-4xl">✨</span>
                  </div>
                  <div className="p-3">
                    <div className="font-medium">{effect.name}</div>
                    <div className="text-xs text-gray-400 mb-2">{effect.category} • {formatNumber(effect.uses)} usos</div>
                    <button className="w-full bg-[#fe2c55] hover:bg-[#e91e45] text-white px-3 py-1 rounded-lg text-sm transition-all">
                      Usar Efeito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duets Tab */}
        {activeTab === "duets" && (
          <div>
            <h2 className="text-xl font-bold mb-6">🤝 Duetos e Stitches</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span>🤝</span> Dueto
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Grave um vídeo lado a lado com outro criador. Ótimo para reações e colaborações.
                </p>
                <button className="w-full bg-[#fe2c55] hover:bg-[#e91e45] text-white px-4 py-2 rounded-lg font-medium transition-all">
                  Criar Dueto
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span>✂️</span> Stitch
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Use um trecho de outro vídeo e adicione seu próprio conteúdo. Perfeito para respostas.
                </p>
                <button className="w-full bg-[#25f4ee] hover:bg-[#1de0dc] text-black px-4 py-2 rounded-lg font-medium transition-all">
                  Criar Stitch
                </button>
              </div>
            </div>

            {/* Duet Suggestions */}
            <h3 className="font-bold mb-4">💡 Vídeos Sugeridos para Dueto</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[9/16] bg-gray-700 rounded-xl relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
                    <div className="text-sm font-medium">@creator{i}</div>
                    <div className="text-xs text-gray-400">{formatNumber(50000 * i)} views</div>
                  </div>
                  <button className="absolute top-2 right-2 bg-[#fe2c55] text-white px-2 py-1 rounded text-xs">
                    Dueto
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div>
            <h2 className="text-xl font-bold mb-6">📊 Analytics</h2>
            
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Visualizações (7d)", value: "892K", change: "+45.2%", positive: true },
                { label: "Seguidores (7d)", value: "+2.4K", change: "+28.5%", positive: true },
                { label: "Curtidas (7d)", value: "45.2K", change: "+32.1%", positive: true },
                { label: "Comentários (7d)", value: "1.8K", change: "+18.9%", positive: true },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className={`text-sm ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Best Performing Content */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <h3 className="font-bold mb-4">🏆 Melhor Desempenho</h3>
              <div className="flex items-center gap-4">
                <div className="w-24 h-32 bg-gray-700 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium mb-2">{videos[0]?.content}</p>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold">{formatNumber(videos[0]?.views || 0)}</div>
                      <div className="text-xs text-gray-400">Views</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{formatNumber(videos[0]?.likes || 0)}</div>
                      <div className="text-xs text-gray-400">Likes</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{formatNumber(videos[0]?.shares || 0)}</div>
                      <div className="text-xs text-gray-400">Shares</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{formatNumber(videos[0]?.saves || 0)}</div>
                      <div className="text-xs text-gray-400">Saves</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Time to Post */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-bold mb-4">⏰ Melhores Horários para Postar</h3>
              <div className="grid grid-cols-7 gap-2">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, i) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-gray-400 mb-2">{day}</div>
                    <div className={`h-20 rounded-lg ${
                      i === 2 || i === 4 ? "bg-[#fe2c55]" : 
                      i === 1 || i === 3 ? "bg-[#fe2c55]/60" : "bg-white/10"
                    }`} />
                    <div className="text-xs mt-1">
                      {i === 2 || i === 4 ? "19h" : i === 1 || i === 3 ? "20h" : "21h"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Criar Vídeo TikTok</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Vídeo</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#fe2c55]/50 transition-all cursor-pointer">
                  <span className="text-4xl mb-2 block">🎬</span>
                  <span className="text-sm text-gray-400">Clique para fazer upload do vídeo</span>
                  <div className="text-xs text-gray-500 mt-2">MP4, MOV • Até 10 minutos • Proporção 9:16</div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <textarea
                  placeholder="Descreva seu vídeo..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe2c55]/50 h-24"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Hashtags</label>
                <input
                  type="text"
                  placeholder="#fyp #viral #trending"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe2c55]/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Som</label>
                <button className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-left text-gray-400 hover:bg-white/10 transition-all flex items-center gap-2">
                  <span>🎵</span> Selecionar som da biblioteca
                </button>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded bg-white/10 border-white/20" />
                  <span className="text-sm">Permitir Duetos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded bg-white/10 border-white/20" />
                  <span className="text-sm">Permitir Stitch</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button className="flex-1 bg-[#fe2c55] hover:bg-[#e91e45] text-white px-4 py-2 rounded-lg font-medium transition-all">
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
