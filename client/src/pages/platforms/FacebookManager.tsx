import { useState } from "react";
import { trpc } from "@/lib/trpc";

// Tipos específicos do Facebook
interface FacebookPage {
  id: string;
  name: string;
  category: string;
  followers: number;
  isConnected: boolean;
}

interface FacebookPost {
  id: number;
  type: "post" | "story" | "reel" | "event" | "group_post";
  content: string;
  mediaUrl: string | null;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
}

interface FacebookEvent {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  coverImage: string | null;
  attendees: number;
  interested: number;
}

interface FacebookGroup {
  id: string;
  name: string;
  members: number;
  privacy: "public" | "private";
  isAdmin: boolean;
}

export default function FacebookManager() {
  const [activeTab, setActiveTab] = useState<"posts" | "stories" | "reels" | "events" | "groups" | "insights">("posts");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"post" | "story" | "reel" | "event">("post");

  // Mock data para demonstração
  const pages: FacebookPage[] = [
    { id: "1", name: "Minha Empresa", category: "Negócio Local", followers: 15420, isConnected: true },
    { id: "2", name: "Blog Pessoal", category: "Blog", followers: 3250, isConnected: true },
  ];

  const recentPosts: FacebookPost[] = [
    {
      id: 1,
      type: "post",
      content: "Confira nossa nova coleção de verão! 🌞",
      mediaUrl: "/images/summer.jpg",
      status: "published",
      scheduledAt: null,
      publishedAt: new Date(),
      reach: 12500,
      engagement: 8.5,
      likes: 342,
      comments: 28,
      shares: 15,
    },
    {
      id: 2,
      type: "reel",
      content: "Behind the scenes do nosso novo produto",
      mediaUrl: "/videos/bts.mp4",
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 86400000),
      publishedAt: null,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    },
  ];

  const events: FacebookEvent[] = [
    {
      id: "e1",
      name: "Workshop de Marketing Digital",
      description: "Aprenda as melhores estratégias de marketing digital",
      startDate: new Date(Date.now() + 604800000),
      endDate: new Date(Date.now() + 615600000),
      location: "Online - Zoom",
      coverImage: null,
      attendees: 45,
      interested: 128,
    },
  ];

  const groups: FacebookGroup[] = [
    { id: "g1", name: "Empreendedores Digitais", members: 5420, privacy: "private", isAdmin: true },
    { id: "g2", name: "Marketing Brasil", members: 12800, privacy: "public", isAdmin: false },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Facebook Manager</h1>
            <p className="text-gray-400">Gerencie suas páginas, posts, eventos e grupos</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <span>+</span> Criar Conteúdo
        </button>
      </div>

      {/* Páginas Conectadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {pages.map((page) => (
          <div key={page.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {page.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-medium">{page.name}</div>
                <div className="text-xs text-gray-400">{page.category}</div>
              </div>
              <div className={`w-3 h-3 rounded-full ${page.isConnected ? "bg-green-500" : "bg-red-500"}`} />
            </div>
            <div className="text-2xl font-bold">{formatNumber(page.followers)}</div>
            <div className="text-sm text-gray-400">seguidores</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "posts", label: "📝 Posts", icon: "📝" },
          { id: "stories", label: "📖 Stories", icon: "📖" },
          { id: "reels", label: "🎬 Reels", icon: "🎬" },
          { id: "events", label: "📅 Eventos", icon: "📅" },
          { id: "groups", label: "👥 Grupos", icon: "👥" },
          { id: "insights", label: "📊 Insights", icon: "📊" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Posts Recentes</h2>
            <div className="space-y-4">
              {recentPosts.filter(p => p.type === "post").map((post) => (
                <div key={post.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    {post.mediaUrl && (
                      <div className="w-24 h-24 bg-gray-700 rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className={`px-2 py-1 rounded ${
                          post.status === "published" ? "bg-green-500/20 text-green-400" :
                          post.status === "scheduled" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {post.status === "published" ? "Publicado" : post.status === "scheduled" ? "Agendado" : "Rascunho"}
                        </span>
                        {post.publishedAt && (
                          <span>{new Date(post.publishedAt).toLocaleDateString("pt-BR")}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold">{formatNumber(post.likes)}</div>
                          <div className="text-xs text-gray-400">Curtidas</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatNumber(post.comments)}</div>
                          <div className="text-xs text-gray-400">Comentários</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatNumber(post.shares)}</div>
                          <div className="text-xs text-gray-400">Compartilhamentos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stories Tab */}
        {activeTab === "stories" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Stories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <button
                onClick={() => { setCreateType("story"); setShowCreateModal(true); }}
                className="aspect-[9/16] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center hover:border-blue-500/50 transition-all"
              >
                <span className="text-4xl mb-2">+</span>
                <span className="text-sm text-gray-400">Criar Story</span>
              </button>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-[9/16] bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
                    <div className="text-sm font-medium">Story {i}</div>
                    <div className="text-xs text-gray-300">há {i}h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reels Tab */}
        {activeTab === "reels" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Reels</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => { setCreateType("reel"); setShowCreateModal(true); }}
                className="aspect-[9/16] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center hover:border-blue-500/50 transition-all"
              >
                <span className="text-4xl mb-2">🎬</span>
                <span className="text-sm text-gray-400">Criar Reel</span>
              </button>
              {recentPosts.filter(p => p.type === "reel").map((reel) => (
                <div key={reel.id} className="aspect-[9/16] bg-gradient-to-br from-pink-600 to-orange-600 rounded-xl relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      reel.status === "published" ? "bg-green-500" : "bg-yellow-500"
                    }`}>
                      {reel.status === "published" ? "Publicado" : "Agendado"}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
                    <p className="text-sm line-clamp-2">{reel.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-300">
                      <span>❤️ {formatNumber(reel.likes)}</span>
                      <span>💬 {formatNumber(reel.comments)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Eventos</h2>
              <button
                onClick={() => { setCreateType("event"); setShowCreateModal(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                + Criar Evento
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-blue-600 to-purple-600" />
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{event.name}</h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span>📅 {new Date(event.startDate).toLocaleDateString("pt-BR")}</span>
                      <span>📍 {event.location}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-green-400">✓</span>
                        <span>{event.attendees} confirmados</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span>{event.interested} interessados</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Grupos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <div key={group.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {group.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-gray-400">
                        {group.privacy === "public" ? "🌐 Público" : "🔒 Privado"}
                      </div>
                    </div>
                    {group.isAdmin && (
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">Admin</span>
                    )}
                  </div>
                  <div className="text-2xl font-bold">{formatNumber(group.members)}</div>
                  <div className="text-sm text-gray-400">membros</div>
                  <button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all">
                    Criar Post no Grupo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Insights da Página</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Alcance Total", value: "45.2K", change: "+12.5%", positive: true },
                { label: "Engajamento", value: "8.7%", change: "+2.3%", positive: true },
                { label: "Novos Seguidores", value: "1.2K", change: "+5.8%", positive: true },
                { label: "Cliques no Link", value: "892", change: "-3.2%", positive: false },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className={`text-sm ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                    {stat.change} vs. semana anterior
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico placeholder */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-bold mb-4">Alcance nos Últimos 7 Dias</h3>
              <div className="h-64 flex items-end gap-2">
                {[65, 45, 78, 52, 89, 67, 92].map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                      style={{ height: `${value}%` }}
                    />
                    <span className="text-xs text-gray-400 mt-2">
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i]}
                    </span>
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
            <h3 className="text-xl font-bold mb-4">
              Criar {createType === "post" ? "Post" : createType === "story" ? "Story" : createType === "reel" ? "Reel" : "Evento"}
            </h3>
            
            {/* Seletor de tipo */}
            <div className="flex gap-2 mb-4">
              {["post", "story", "reel", "event"].map((type) => (
                <button
                  key={type}
                  onClick={() => setCreateType(type as typeof createType)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    createType === type ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400"
                  }`}
                >
                  {type === "post" ? "📝 Post" : type === "story" ? "📖 Story" : type === "reel" ? "🎬 Reel" : "📅 Evento"}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Conteúdo</label>
                <textarea
                  placeholder="O que você quer compartilhar?"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 h-24"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mídia</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-blue-500/50 transition-all cursor-pointer">
                  <span className="text-4xl mb-2 block">📷</span>
                  <span className="text-sm text-gray-400">Clique para adicionar imagem ou vídeo</span>
                </div>
              </div>

              {createType === "event" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Data de Início</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Data de Término</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Local</label>
                    <input
                      type="text"
                      placeholder="Online ou endereço físico"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
