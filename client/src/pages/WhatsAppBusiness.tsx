import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

// Tipos baseados no schema real
interface WhatsAppContact {
  id: number;
  workspaceId: number;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  company: string | null;
  notes: string | null;
  isActive: boolean;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WhatsAppConversation {
  id: number;
  workspaceId: number;
  contactId: number;
  status: "active" | "archived" | "blocked";
  unreadCount: number;
  lastMessageId: number | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WhatsAppMessage {
  id: number;
  conversationId: number;
  waMessageId: string | null;
  direction: "incoming" | "outgoing";
  type: string;
  content: string | null;
  mediaUrl: string | null;
  templateName: string | null;
  status: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  errorMessage: string | null;
  metadata: unknown;
  createdAt: Date;
}

interface ApprovalRequest {
  id: number;
  workspaceId: number;
  postId: number;
  contactId: number;
  conversationId: number;
  messageId: number | null;
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt: Date;
  respondedAt: Date | null;
  responseMessage: string | null;
  createdAt: Date;
}

export default function WhatsAppBusiness() {
  const [activeTab, setActiveTab] = useState<"conversations" | "contacts" | "approvals" | "settings">("conversations");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phoneNumber: "", email: "", notes: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: conversations, refetch: refetchConversations } = trpc.whatsapp.listConversations.useQuery();
  const { data: contacts, refetch: refetchContacts } = trpc.whatsapp.listContacts.useQuery();
  const { data: settings, refetch: refetchSettings } = trpc.whatsapp.getSettings.useQuery();
  const { data: conversationDetail, refetch: refetchMessages } = trpc.whatsapp.getConversation.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation }
  );
  const { data: pendingApprovals } = trpc.whatsapp.listApprovalRequests.useQuery({ status: "pending" });

  // Mutations
  const sendMessageMutation = trpc.whatsapp.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      refetchConversations();
    },
  });

  const createContactMutation = trpc.whatsapp.createContact.useMutation({
    onSuccess: () => {
      setShowNewContactModal(false);
      setNewContact({ name: "", phoneNumber: "", email: "", notes: "" });
      refetchContacts();
    },
  });

  const updateSettingsMutation = trpc.whatsapp.updateSettings.useMutation({
    onSuccess: () => refetchSettings(),
  });

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationDetail?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !conversationDetail?.contact) return;
    sendMessageMutation.mutate({
      contactId: conversationDetail.contact.id,
      message: newMessage,
    });
  };

  const handleCreateContact = () => {
    if (!newContact.name || !newContact.phoneNumber) return;
    createContactMutation.mutate(newContact);
  };

  const getContactName = (contactId: number): string => {
    const contact = contacts?.find((c: WhatsAppContact) => c.id === contactId);
    return contact?.name || contact?.phoneNumber || "Desconhecido";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          WhatsApp Business
        </h1>
        <p className="text-gray-400 mt-2">Gerencie conversas, contatos e aprovações via WhatsApp</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="text-3xl mb-2">💬</div>
          <div className="text-2xl font-bold">{conversations?.length || 0}</div>
          <div className="text-sm text-gray-400">Conversas</div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold">{contacts?.length || 0}</div>
          <div className="text-sm text-gray-400">Contatos</div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-2xl font-bold">{pendingApprovals?.length || 0}</div>
          <div className="text-sm text-gray-400">Aprovações Pendentes</div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="text-3xl mb-2">{settings?.isActive ? "🟢" : "🔴"}</div>
          <div className="text-2xl font-bold">{settings?.isActive ? "Ativo" : "Inativo"}</div>
          <div className="text-sm text-gray-400">Status da Integração</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["conversations", "contacts", "approvals", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab
                ? "bg-green-500 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab === "conversations" && "💬 Conversas"}
            {tab === "contacts" && "👥 Contatos"}
            {tab === "approvals" && "✅ Aprovações"}
            {tab === "settings" && "⚙️ Configurações"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        {/* Conversations Tab */}
        {activeTab === "conversations" && (
          <div className="flex h-[600px]">
            {/* Lista de conversas */}
            <div className="w-1/3 border-r border-white/10">
              <div className="p-4 border-b border-white/10">
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div className="overflow-y-auto h-full">
                {conversations?.map((conv: WhatsAppConversation) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${
                      selectedConversation === conv.id ? "bg-green-500/10 border-l-2 border-l-green-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                        {getContactName(conv.contactId)[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{getContactName(conv.contactId)}</span>
                          {conv.unreadCount > 0 && (
                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleString("pt-BR")
                            : "Sem mensagens"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!conversations || conversations.length === 0) && (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">💬</div>
                    <p>Nenhuma conversa ainda</p>
                  </div>
                )}
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 flex flex-col">
              {selectedConversation && conversationDetail ? (
                <>
                  {/* Header da conversa */}
                  <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                      {conversationDetail.contact?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-medium">{conversationDetail.contact?.name}</div>
                      <div className="text-sm text-gray-400">{conversationDetail.contact?.phoneNumber}</div>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversationDetail.messages?.map((msgData: any) => {
                      const msg = msgData.whatsapp_messages || msgData;
                      return (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.direction === "outgoing"
                              ? "bg-green-500 text-white"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <div className={`text-xs mt-1 ${msg.direction === "outgoing" ? "text-green-100" : "text-gray-400"}`}>
                            {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                            {msg.direction === "outgoing" && (
                              <span className="ml-2">
                                {msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input de mensagem */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendMessageMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                      >
                        {sendMessageMutation.isPending ? "..." : "Enviar"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p>Selecione uma conversa para começar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Contatos</h2>
              <button
                onClick={() => setShowNewContactModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                + Novo Contato
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts?.map((contact: WhatsAppContact) => (
                <div key={contact.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                      {contact.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-400">{contact.phoneNumber}</div>
                    </div>
                  </div>
                  {contact.email && (
                    <p className="text-sm text-gray-400 mb-2">📧 {contact.email}</p>
                  )}
                  {contact.notes && (
                    <p className="text-sm text-gray-500">{contact.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {(!contacts || contacts.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">👥</div>
                <p>Nenhum contato cadastrado</p>
                <button
                  onClick={() => setShowNewContactModal(true)}
                  className="mt-4 text-green-400 hover:text-green-300"
                >
                  Adicionar primeiro contato
                </button>
              </div>
            )}
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === "approvals" && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Aprovações Pendentes</h2>

            <div className="space-y-4">
              {pendingApprovals?.map((approval: ApprovalRequest) => (
                <div key={approval.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Post #{approval.postId}</div>
                      <div className="text-sm text-gray-400">
                        Enviado para: {getContactName(approval.contactId)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Expira em: {new Date(approval.expiresAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                        Aguardando
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!pendingApprovals || pendingApprovals.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">✅</div>
                <p>Nenhuma aprovação pendente</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Configurações do WhatsApp Business</h2>
              <a
                href="/whatsapp/config"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                🛠️ Assistente de Configuração
              </a>
            </div>

            <div className="space-y-6 max-w-2xl">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-medium mb-4">Status da Integração</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.isActive || false}
                    onChange={(e) => updateSettingsMutation.mutate({ isActive: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-green-500 focus:ring-green-500"
                  />
                  <span>Integração Ativa</span>
                </label>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-medium mb-4">Notificações</h3>
                <div className="space-y-3">
                  {[
                    { key: "notifyOnPostPublished", label: "Post publicado" },
                    { key: "notifyOnPostFailed", label: "Falha na publicação" },
                    { key: "notifyOnApprovalNeeded", label: "Aprovação necessária" },
                    { key: "notifyOnNewComment", label: "Novo comentário" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settings as any)?.[key] || false}
                        onChange={(e) => updateSettingsMutation.mutate({ [key]: e.target.checked })}
                        className="w-5 h-5 rounded bg-white/10 border-white/20 text-green-500 focus:ring-green-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-medium mb-4">Credenciais da API</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Configure suas credenciais do WhatsApp Business API para enviar mensagens.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      placeholder="Seu Phone Number ID"
                      defaultValue={settings?.phoneNumberId || ""}
                      onBlur={(e) => updateSettingsMutation.mutate({ phoneNumberId: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Access Token</label>
                    <input
                      type="password"
                      placeholder="Seu Access Token"
                      defaultValue={settings?.accessToken || ""}
                      onBlur={(e) => updateSettingsMutation.mutate({ accessToken: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Novo Contato */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Novo Contato</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Telefone *</label>
                <input
                  type="text"
                  value={newContact.phoneNumber}
                  onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                  placeholder="+55 11 99999-9999"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notas</label>
                <textarea
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 h-20"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewContactModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateContact}
                disabled={createContactMutation.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {createContactMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
