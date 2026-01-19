import { useState } from "react";
import { trpc } from "@/lib/trpc";

// Tipos específicos do WhatsApp Business
interface WhatsAppAccount {
  id: string;
  phoneNumber: string;
  businessName: string;
  profilePic: string | null;
  status: "connected" | "disconnected" | "pending";
  tier: "standard" | "verified" | "official";
  messagesLimit: number;
  messagesUsed: number;
}

interface BroadcastList {
  id: string;
  name: string;
  contacts: number;
  lastSent: Date | null;
  openRate: number;
  clickRate: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  views: number;
  inquiries: number;
  category: string;
}

interface StatusUpdate {
  id: string;
  type: "text" | "image" | "video";
  content: string;
  mediaUrl: string | null;
  views: number;
  postedAt: Date;
  expiresAt: Date;
}

interface QuickReply {
  id: string;
  shortcut: string;
  message: string;
  usageCount: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  category: "marketing" | "utility" | "authentication";
  status: "approved" | "pending" | "rejected";
  content: string;
  language: string;
}

export default function WhatsAppManager() {
  const [activeTab, setActiveTab] = useState<"broadcasts" | "catalog" | "status" | "templates" | "quickreplies" | "analytics">("broadcasts");
  const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateStatus, setShowCreateStatus] = useState(false);

  // Mock data
  const account: WhatsAppAccount = {
    id: "1",
    phoneNumber: "+55 11 99999-9999",
    businessName: "Minha Empresa",
    profilePic: null,
    status: "connected",
    tier: "verified",
    messagesLimit: 10000,
    messagesUsed: 3420,
  };

  const broadcastLists: BroadcastList[] = [
    { id: "b1", name: "Clientes VIP", contacts: 250, lastSent: new Date(), openRate: 85, clickRate: 32 },
    { id: "b2", name: "Leads Quentes", contacts: 580, lastSent: new Date(Date.now() - 86400000), openRate: 72, clickRate: 18 },
    { id: "b3", name: "Newsletter", contacts: 1200, lastSent: new Date(Date.now() - 172800000), openRate: 65, clickRate: 12 },
  ];

  const catalogProducts: CatalogProduct[] = [
    { id: "p1", name: "Vestido Floral", description: "Vestido leve para o verão", price: 189.90, imageUrl: null, isAvailable: true, views: 342, inquiries: 28, category: "Roupas" },
    { id: "p2", name: "Bolsa Couro", description: "Bolsa de couro legítimo", price: 299.90, imageUrl: null, isAvailable: true, views: 567, inquiries: 45, category: "Acessórios" },
    { id: "p3", name: "Sandália Verão", description: "Sandália confortável", price: 149.90, imageUrl: null, isAvailable: false, views: 123, inquiries: 12, category: "Calçados" },
  ];

  const statusUpdates: StatusUpdate[] = [
    { id: "s1", type: "image", content: "Nova coleção disponível! 🛍️", mediaUrl: null, views: 892, postedAt: new Date(), expiresAt: new Date(Date.now() + 86400000) },
    { id: "s2", type: "text", content: "Promoção relâmpago! 50% OFF em tudo 🔥", mediaUrl: null, views: 1250, postedAt: new Date(Date.now() - 43200000), expiresAt: new Date(Date.now() + 43200000) },
  ];

  const quickReplies: QuickReply[] = [
    { id: "q1", shortcut: "/oi", message: "Olá! 👋 Seja bem-vindo(a) à nossa loja. Como posso ajudar?", usageCount: 1250 },
    { id: "q2", shortcut: "/preco", message: "Os preços dos nossos produtos estão no catálogo. Posso enviar para você?", usageCount: 890 },
    { id: "q3", shortcut: "/entrega", message: "Entregamos em todo o Brasil! O prazo varia de 3 a 7 dias úteis.", usageCount: 567 },
    { id: "q4", shortcut: "/pix", message: "Aceitamos PIX! A chave é: empresa@email.com", usageCount: 432 },
  ];

  const messageTemplates: MessageTemplate[] = [
    { id: "t1", name: "Boas-vindas", category: "marketing", status: "approved", content: "Olá {{1}}! Bem-vindo à nossa loja. Use o cupom BEMVINDO10 para 10% de desconto!", language: "pt_BR" },
    { id: "t2", name: "Confirmação de Pedido", category: "utility", status: "approved", content: "Seu pedido #{{1}} foi confirmado! Valor: R$ {{2}}. Previsão de entrega: {{3}}", language: "pt_BR" },
    { id: "t3", name: "Promoção Semanal", category: "marketing", status: "pending", content: "🔥 Promoção da Semana! {{1}} com {{2}}% de desconto. Corre que é por tempo limitado!", language: "pt_BR" },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "approved": return "text-green-400 bg-green-400/20";
      case "pending": return "text-yellow-400 bg-yellow-400/20";
      case "rejected": return "text-red-400 bg-red-400/20";
      default: return "text-gray-400 bg-gray-400/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Business Manager</h1>
            <p className="text-gray-400">Broadcasts, Catálogo e Status</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm ${
            account.status === "connected" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}>
            {account.status === "connected" ? "🟢 Conectado" : "🔴 Desconectado"}
          </span>
        </div>
      </div>

      {/* Account Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center text-2xl font-bold">
            {account.businessName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{account.businessName}</h2>
              {account.tier === "verified" && (
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                  ✓ Verificado
                </span>
              )}
            </div>
            <div className="text-gray-400">{account.phoneNumber}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Mensagens Mensais</div>
            <div className="text-2xl font-bold">{formatNumber(account.messagesUsed)} / {formatNumber(account.messagesLimit)}</div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-[#25D366] rounded-full" 
                style={{ width: `${(account.messagesUsed / account.messagesLimit) * 100}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "broadcasts", label: "📢 Broadcasts" },
          { id: "catalog", label: "🛍️ Catálogo" },
          { id: "status", label: "📖 Status" },
          { id: "templates", label: "📝 Templates" },
          { id: "quickreplies", label: "⚡ Respostas Rápidas" },
          { id: "analytics", label: "📊 Analytics" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#25D366] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        {/* Broadcasts Tab */}
        {activeTab === "broadcasts" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Listas de Transmissão</h2>
              <button
                onClick={() => setShowCreateBroadcast(true)}
                className="bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <span>+</span> Nova Lista
              </button>
            </div>

            <div className="space-y-4">
              {broadcastLists.map((list) => (
                <div key={list.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center">
                    <span className="text-xl">📢</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{list.name}</div>
                    <div className="text-sm text-gray-400">{list.contacts} contatos</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-xl font-bold text-[#25D366]">{list.openRate}%</div>
                    <div className="text-xs text-gray-400">Taxa de Abertura</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-xl font-bold text-blue-400">{list.clickRate}%</div>
                    <div className="text-xs text-gray-400">Taxa de Clique</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-all">
                      Editar
                    </button>
                    <button className="bg-[#25D366] hover:bg-[#1fb855] text-white px-3 py-2 rounded-lg text-sm transition-all">
                      Enviar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Total de Contatos", value: "2.030", icon: "👥" },
                { label: "Mensagens Enviadas (7d)", value: "4.5K", icon: "📤" },
                { label: "Taxa Média de Abertura", value: "74%", icon: "👁️" },
                { label: "Taxa Média de Clique", value: "21%", icon: "👆" },
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
          </div>
        )}

        {/* Catalog Tab */}
        {activeTab === "catalog" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Catálogo de Produtos</h2>
              <button
                onClick={() => setShowCreateProduct(true)}
                className="bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <span>+</span> Adicionar Produto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogProducts.map((product) => (
                <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="h-48 bg-gray-700 relative flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-500 px-3 py-1 rounded text-sm">Indisponível</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-white/20 px-2 py-0.5 rounded text-xs">
                      {product.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{product.description}</p>
                    <div className="text-xl font-bold text-[#25D366] mb-3">{formatCurrency(product.price)}</div>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span>👁️ {product.views} views</span>
                      <span>💬 {product.inquiries} perguntas</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-all">
                        Editar
                      </button>
                      <button className="flex-1 bg-[#25D366] hover:bg-[#1fb855] text-white px-3 py-2 rounded-lg text-sm transition-all">
                        Compartilhar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Catalog Stats */}
            <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-bold mb-4">📊 Performance do Catálogo</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{catalogProducts.length}</div>
                  <div className="text-sm text-gray-400">Produtos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatNumber(catalogProducts.reduce((acc, p) => acc + p.views, 0))}</div>
                  <div className="text-sm text-gray-400">Visualizações</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatNumber(catalogProducts.reduce((acc, p) => acc + p.inquiries, 0))}</div>
                  <div className="text-sm text-gray-400">Perguntas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#25D366]">
                    {((catalogProducts.reduce((acc, p) => acc + p.inquiries, 0) / catalogProducts.reduce((acc, p) => acc + p.views, 0)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Taxa de Conversão</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Tab */}
        {activeTab === "status" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Status do WhatsApp</h2>
              <button
                onClick={() => setShowCreateStatus(true)}
                className="bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <span>+</span> Criar Status
              </button>
            </div>

            {/* Active Status */}
            <div className="mb-8">
              <h3 className="text-sm text-gray-400 mb-3">Status Ativos</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setShowCreateStatus(true)}
                  className="w-20 h-20 flex-shrink-0 bg-white/5 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center hover:border-[#25D366]/50 transition-all"
                >
                  <span className="text-2xl">+</span>
                </button>
                {statusUpdates.map((status) => (
                  <div key={status.id} className="flex-shrink-0 text-center">
                    <div className="w-20 h-20 rounded-full p-0.5 bg-[#25D366]">
                      <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-2xl">{status.type === "text" ? "📝" : status.type === "image" ? "📷" : "🎬"}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 block">{status.views} views</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status List */}
            <div className="space-y-4">
              {statusUpdates.map((status) => (
                <div key={status.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{status.type === "text" ? "📝" : status.type === "image" ? "📷" : "🎬"}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">{status.content}</p>
                    <div className="text-sm text-gray-400">
                      Expira em {Math.round((status.expiresAt.getTime() - Date.now()) / 3600000)}h
                    </div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-xl font-bold">{status.views}</div>
                    <div className="text-xs text-gray-400">Visualizações</div>
                  </div>
                  <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm transition-all">
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Templates de Mensagem</h2>
              <button className="bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2">
                <span>+</span> Criar Template
              </button>
            </div>

            <div className="space-y-4">
              {messageTemplates.map((template) => (
                <div key={template.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold">{template.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(template.status)}`}>
                        {template.status === "approved" ? "✓ Aprovado" : template.status === "pending" ? "⏳ Pendente" : "✗ Rejeitado"}
                      </span>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-gray-400">
                        {template.category}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm transition-all">
                        Editar
                      </button>
                      <button className="bg-[#25D366] hover:bg-[#1fb855] text-white px-3 py-1 rounded-lg text-sm transition-all">
                        Usar
                      </button>
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 text-sm text-gray-300">
                    {template.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Idioma: {template.language}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Replies Tab */}
        {activeTab === "quickreplies" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Respostas Rápidas</h2>
              <button className="bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2">
                <span>+</span> Nova Resposta
              </button>
            </div>

            <div className="space-y-4">
              {quickReplies.map((reply) => (
                <div key={reply.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="bg-[#25D366]/20 px-3 py-1 rounded-lg font-mono text-[#25D366]">
                    {reply.shortcut}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{reply.message}</p>
                  </div>
                  <div className="text-center px-4">
                    <div className="font-bold">{formatNumber(reply.usageCount)}</div>
                    <div className="text-xs text-gray-400">usos</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm transition-all">
                      Editar
                    </button>
                    <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg text-sm transition-all">
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="mt-8 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl p-4">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <span>💡</span> Dica
              </h3>
              <p className="text-sm text-gray-300">
                Use respostas rápidas digitando o atalho no chat. Por exemplo, digite <code className="bg-black/20 px-1 rounded">/oi</code> e pressione Enter para enviar a mensagem de boas-vindas automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Analytics do WhatsApp</h2>
            
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Mensagens Enviadas", value: "12.4K", change: "+18.2%", positive: true },
                { label: "Mensagens Recebidas", value: "8.9K", change: "+25.3%", positive: true },
                { label: "Taxa de Resposta", value: "94%", change: "+5.2%", positive: true },
                { label: "Tempo Médio de Resposta", value: "2.5min", change: "-12.5%", positive: true },
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

            {/* Conversation Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4">Tipos de Conversa</h3>
                <div className="space-y-3">
                  {[
                    { type: "Vendas", percent: 45, color: "bg-[#25D366]" },
                    { type: "Suporte", percent: 30, color: "bg-blue-500" },
                    { type: "Dúvidas", percent: 15, color: "bg-yellow-500" },
                    { type: "Outros", percent: 10, color: "bg-gray-500" },
                  ].map((item) => (
                    <div key={item.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.type}</span>
                        <span>{item.percent}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4">Horários de Pico</h3>
                <div className="grid grid-cols-6 gap-2">
                  {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
                    <div key={hour} className="text-center">
                      <div className={`h-16 rounded ${
                        hour >= 10 && hour <= 12 ? "bg-[#25D366]" :
                        hour >= 14 && hour <= 16 ? "bg-[#25D366]/60" : "bg-white/10"
                      }`} style={{ height: `${Math.random() * 40 + 20}px` }} />
                      <div className="text-xs mt-1">{hour}h</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criar Broadcast */}
      {showCreateBroadcast && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Nova Lista de Transmissão</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome da Lista</label>
                <input
                  type="text"
                  placeholder="Ex: Clientes VIP"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366]/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Selecionar Contatos</label>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {["João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa", "Carlos Lima"].map((name) => (
                    <label key={name} className="flex items-center gap-3 py-2 cursor-pointer">
                      <input type="checkbox" className="rounded bg-white/10 border-white/20 text-[#25D366]" />
                      <span>{name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateBroadcast(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button className="flex-1 bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-lg font-medium transition-all">
                Criar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar Produto */}
      {showCreateProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Adicionar Produto ao Catálogo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Imagem do Produto</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#25D366]/50 transition-all cursor-pointer">
                  <span className="text-4xl mb-2 block">📷</span>
                  <span className="text-sm text-gray-400">Clique para adicionar imagem</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Vestido Floral"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366]/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <textarea
                  placeholder="Descreva o produto..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366]/50 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Preço</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Categoria</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#25D366]/50">
                    <option value="">Selecione</option>
                    <option value="roupas">Roupas</option>
                    <option value="acessorios">Acessórios</option>
                    <option value="calcados">Calçados</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateProduct(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button className="flex-1 bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-lg font-medium transition-all">
                Adicionar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar Status */}
      {showCreateStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Criar Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo de Status</label>
                <div className="flex gap-2">
                  {[
                    { id: "text", label: "📝 Texto" },
                    { id: "image", label: "📷 Imagem" },
                    { id: "video", label: "🎬 Vídeo" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-all"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Conteúdo</label>
                <textarea
                  placeholder="Digite sua mensagem..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366]/50 h-24"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Mídia (opcional)</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-[#25D366]/50 transition-all cursor-pointer">
                  <span className="text-2xl mb-2 block">📎</span>
                  <span className="text-sm text-gray-400">Adicionar imagem ou vídeo</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateStatus(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button className="flex-1 bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 rounded-lg font-medium transition-all">
                Publicar Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
