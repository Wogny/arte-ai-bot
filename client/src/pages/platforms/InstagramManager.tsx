import { useState } from "react";
import { trpc } from "@/lib/trpc";

// Tipos específicos do Instagram
interface InstagramAccount {
  id: string;
  username: string;
  profilePic: string | null;
  followers: number;
  following: number;
  posts: number;
  isBusinessAccount: boolean;
}

interface InstagramPost {
  id: number;
  type: "feed" | "story" | "reel" | "carousel" | "igtv";
  content: string;
  mediaUrls: string[];
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  impressions: number;
}

interface ShoppingProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  clicks: number;
  sales: number;
}

interface HashtagSuggestion {
  tag: string;
  posts: number;
  relevance: number;
}

export default function InstagramManager() {
  const [activeTab, setActiveTab] = useState<"feed" | "stories" | "reels" | "shopping" | "insights" | "hashtags">("feed");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"feed" | "story" | "reel" | "carousel">("feed");
  const [carouselImages, setCarouselImages] = useState<string[]>([]);

  // Mock data
  const account: InstagramAccount = {
    id: "1",
    username: "@minhaempresa",
    profilePic: null,
    followers: 25400,
    following: 892,
    posts: 342,
    isBusinessAccount: true,
  };

  const recentPosts: InstagramPost[] = [
    {
      id: 1,
      type: "feed",
      content: "Nova coleção chegou! 🛍️ #moda #fashion #novidades",
      mediaUrls: ["/images/post1.jpg"],
      status: "published",
      scheduledAt: null,
      publishedAt: new Date(),
      likes: 1542,
      comments: 89,
      saves: 234,
      shares: 45,
      reach: 15200,
      impressions: 18500,
    },
    {
      id: 2,
      type: "reel",
      content: "Tutorial: Como combinar peças básicas ✨",
      mediaUrls: ["/videos/reel1.mp4"],
      status: "published",
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 86400000),
      likes: 8920,
      comments: 342,
      saves: 1205,
      shares: 567,
      reach: 125000,
      impressions: 180000,
    },
    {
      id: 3,
      type: "carousel",
      content: "5 looks para o verão 🌞 Arrasta para ver todos!",
      mediaUrls: ["/images/look1.jpg", "/images/look2.jpg", "/images/look3.jpg", "/images/look4.jpg", "/images/look5.jpg"],
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 86400000),
      publishedAt: null,
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
    },
  ];

  const products: ShoppingProduct[] = [
    { id: "p1", name: "Vestido Floral", price: 189.90, imageUrl: "/products/dress.jpg", isActive: true, clicks: 342, sales: 28 },
    { id: "p2", name: "Bolsa Couro", price: 299.90, imageUrl: "/products/bag.jpg", isActive: true, clicks: 567, sales: 45 },
    { id: "p3", name: "Sandália Verão", price: 149.90, imageUrl: "/products/sandal.jpg", isActive: false, clicks: 123, sales: 12 },
  ];

  const suggestedHashtags: HashtagSuggestion[] = [
    { tag: "#moda", posts: 45000000, relevance: 95 },
    { tag: "#fashion", posts: 120000000, relevance: 90 },
    { tag: "#lookdodia", posts: 8500000, relevance: 88 },
    { tag: "#modafeminina", posts: 12000000, relevance: 85 },
    { tag: "#tendencia", posts: 3200000, relevance: 82 },
    { tag: "#estilo", posts: 9800000, relevance: 80 },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Instagram Manager</h1>
            <p className="text-gray-400">Gerencie Feed, Stories, Reels e Shopping</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <span>+</span> Criar Conteúdo
        </button>
      </div>

      {/* Perfil Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-2xl font-bold">
            {account.username[1].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{account.username}</h2>
              {account.isBusinessAccount && (
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">Business</span>
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <div><span className="font-bold">{formatNumber(account.posts)}</span> <span className="text-gray-400">posts</span></div>
              <div><span className="font-bold">{formatNumber(account.followers)}</span> <span className="text-gray-400">seguidores</span></div>
              <div><span className="font-bold">{formatNumber(account.following)}</span> <span className="text-gray-400">seguindo</span></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">+12.5%</div>
            <div className="text-sm text-gray-400">crescimento mensal</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "feed", label: "📷 Feed" },
          { id: "stories", label: "📖 Stories" },
          { id: "reels", label: "🎬 Reels" },
          { id: "shopping", label: "🛍️ Shopping" },
          { id: "insights", label: "📊 Insights" },
          { id: "hashtags", label: "#️⃣ Hashtags" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        {/* Feed Tab */}
        {activeTab === "feed" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Feed Posts</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => { setCreateType("feed"); setShowCreateModal(true); }}
                className="aspect-square bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center hover:border-pink-500/50 transition-all"
              >
                <span className="text-4xl mb-2">📷</span>
                <span className="text-sm text-gray-400">Criar Post</span>
              </button>
              {recentPosts.filter(p => p.type === "feed" || p.type === "carousel").map((post) => (
                <div key={post.id} className="aspect-square bg-gray-700 rounded-xl relative overflow-hidden group cursor-pointer">
                  {post.type === "carousel" && (
                    <div className="absolute top-2 right-2 bg-black/50 rounded p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="font-bold">{formatNumber(post.likes)}</div>
                      <div className="text-xs">❤️</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{formatNumber(post.comments)}</div>
                      <div className="text-xs">💬</div>
                    </div>
                  </div>
                  {post.status === "scheduled" && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-medium">
                      Agendado
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stories Tab */}
        {activeTab === "stories" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Stories</h2>
            <div className="mb-8">
              <h3 className="text-sm text-gray-400 mb-3">Stories Ativos</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                <button
                  onClick={() => { setCreateType("story"); setShowCreateModal(true); }}
                  className="w-20 h-20 flex-shrink-0 bg-white/5 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center hover:border-pink-500/50 transition-all"
                >
                  <span className="text-2xl">+</span>
                </button>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-shrink-0 text-center">
                    <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                      <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📷</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 block">há {i}h</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm text-gray-400 mb-3">Destaques</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                <button className="w-20 flex-shrink-0 text-center">
                  <div className="w-20 h-20 bg-white/5 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center hover:border-pink-500/50 transition-all">
                    <span className="text-2xl">+</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1 block">Novo</span>
                </button>
                {["Produtos", "Bastidores", "Clientes", "Dicas"].map((highlight) => (
                  <div key={highlight} className="w-20 flex-shrink-0 text-center">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 block">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reels Tab */}
        {activeTab === "reels" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Reels</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>🔥 Reels têm 2x mais alcance que posts normais</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => { setCreateType("reel"); setShowCreateModal(true); }}
                className="aspect-[9/16] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center hover:border-pink-500/50 transition-all"
              >
                <span className="text-4xl mb-2">🎬</span>
                <span className="text-sm text-gray-400">Criar Reel</span>
              </button>
              {recentPosts.filter(p => p.type === "reel").map((reel) => (
                <div key={reel.id} className="aspect-[9/16] bg-gray-700 rounded-xl relative overflow-hidden group cursor-pointer">
                  <div className="absolute top-2 left-2 bg-black/50 rounded px-2 py-0.5 text-xs flex items-center gap-1">
                    <span>▶️</span> {formatNumber(reel.reach)}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
                    <p className="text-sm line-clamp-2 mb-2">{reel.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-300">
                      <span>❤️ {formatNumber(reel.likes)}</span>
                      <span>💬 {formatNumber(reel.comments)}</span>
                      <span>🔖 {formatNumber(reel.saves)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trending Audio */}
            <div className="mt-8">
              <h3 className="font-bold mb-4">🎵 Áudios em Alta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Original Sound - @creator", uses: "125K", trending: true },
                  { name: "Música Viral 2024", uses: "89K", trending: true },
                  { name: "Beat Comercial", uses: "45K", trending: false },
                ].map((audio, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                      🎵
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{audio.name}</div>
                      <div className="text-xs text-gray-400">{audio.uses} usos</div>
                    </div>
                    {audio.trending && (
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">🔥 Trending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shopping Tab */}
        {activeTab === "shopping" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Instagram Shopping</h2>
              <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
                + Adicionar Produto
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Produtos Ativos", value: "12", icon: "📦" },
                { label: "Cliques Totais", value: "2.4K", icon: "👆" },
                { label: "Vendas via Instagram", value: "89", icon: "💰" },
                { label: "Receita", value: "R$ 15.2K", icon: "📈" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="text-sm text-gray-400">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="h-48 bg-gray-700 relative">
                    {!product.isActive && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-gray-600 px-3 py-1 rounded text-sm">Inativo</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-1">{product.name}</h3>
                    <div className="text-xl font-bold text-pink-400 mb-3">{formatCurrency(product.price)}</div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>👆 {product.clicks} cliques</span>
                      <span>💰 {product.sales} vendas</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-all">
                        Editar
                      </button>
                      <button className="flex-1 bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded-lg text-sm transition-all">
                        Marcar em Post
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Insights do Perfil</h2>
            
            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Alcance", value: "125.4K", change: "+18.2%", positive: true },
                { label: "Impressões", value: "342.1K", change: "+12.5%", positive: true },
                { label: "Visitas ao Perfil", value: "8.9K", change: "+25.3%", positive: true },
                { label: "Cliques no Site", value: "1.2K", change: "-5.2%", positive: false },
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

            {/* Audience Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4">Gênero</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Feminino</span>
                      <span>68%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: "68%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Masculino</span>
                      <span>30%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "30%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Outro</span>
                      <span>2%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: "2%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4">Faixa Etária</h3>
                <div className="space-y-3">
                  {[
                    { range: "18-24", percent: 25 },
                    { range: "25-34", percent: 42 },
                    { range: "35-44", percent: 20 },
                    { range: "45-54", percent: 10 },
                    { range: "55+", percent: 3 },
                  ].map((age) => (
                    <div key={age.range}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{age.range}</span>
                        <span>{age.percent}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${age.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hashtags Tab */}
        {activeTab === "hashtags" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Gerador de Hashtags</h2>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Descreva seu conteúdo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: foto de moda feminina, vestido floral, verão"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
                />
                <button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white px-6 py-3 rounded-lg font-medium transition-all">
                  Gerar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-4">Hashtags Sugeridas</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedHashtags.map((tag) => (
                    <button
                      key={tag.tag}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 text-sm transition-all flex items-center gap-2"
                    >
                      <span>{tag.tag}</span>
                      <span className="text-xs text-gray-400">{formatNumber(tag.posts)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Suas Hashtags Salvas</h3>
                <div className="space-y-2">
                  {["#moda #fashion #lookdodia", "#empreendedorismo #negocios #sucesso", "#fitness #saude #treino"].map((set, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-sm">{set}</span>
                      <button className="text-pink-400 hover:text-pink-300 text-sm">Copiar</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Criar {createType === "feed" ? "Post" : createType === "story" ? "Story" : createType === "reel" ? "Reel" : "Carrossel"}
            </h3>
            
            {/* Seletor de tipo */}
            <div className="flex gap-2 mb-4">
              {[
                { id: "feed", label: "📷 Post" },
                { id: "carousel", label: "🎠 Carrossel" },
                { id: "story", label: "📖 Story" },
                { id: "reel", label: "🎬 Reel" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setCreateType(type.id as typeof createType)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    createType === type.id ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-white/10 text-gray-400"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Legenda</label>
                <textarea
                  placeholder="Escreva uma legenda cativante..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 h-24"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {createType === "carousel" ? "Imagens (até 10)" : createType === "reel" ? "Vídeo" : "Mídia"}
                </label>
                <div className={`border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-pink-500/50 transition-all cursor-pointer ${
                  createType === "carousel" ? "grid grid-cols-5 gap-2 p-4" : ""
                }`}>
                  {createType === "carousel" ? (
                    <>
                      {carouselImages.map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-700 rounded" />
                      ))}
                      <div className="aspect-square bg-white/5 border-2 border-dashed border-white/20 rounded flex items-center justify-center">
                        <span className="text-2xl">+</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl mb-2 block">{createType === "reel" ? "🎬" : "📷"}</span>
                      <span className="text-sm text-gray-400">
                        {createType === "reel" ? "Clique para adicionar vídeo" : "Clique para adicionar imagem"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Hashtags</label>
                <input
                  type="text"
                  placeholder="#moda #fashion #lookdodia"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Localização</label>
                <input
                  type="text"
                  placeholder="Adicionar localização"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-all">
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
