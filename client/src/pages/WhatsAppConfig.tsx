import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface ConnectionStatus {
  connected: boolean;
  phoneNumber?: string;
  businessName?: string;
  error?: string;
}

export default function WhatsAppConfig() {
  const [activeStep, setActiveStep] = useState(1);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [formData, setFormData] = useState({
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
    webhookVerifyToken: "",
  });

  // Queries
  const { data: settings, refetch: refetchSettings } = trpc.whatsapp.getSettings.useQuery();

  // Mutations
  const updateSettingsMutation = trpc.whatsapp.updateSettings.useMutation({
    onSuccess: () => {
      refetchSettings();
    },
  });

  const testConnectionMutation = trpc.whatsapp.testConnection.useMutation({
    onSuccess: (data) => {
      setConnectionStatus(data);
      setTestingConnection(false);
    },
    onError: (error) => {
      setConnectionStatus({ connected: false, error: error.message });
      setTestingConnection(false);
    },
  });

  // Carregar dados existentes
  useState(() => {
    if (settings) {
      setFormData({
        phoneNumberId: settings.phoneNumberId || "",
        accessToken: settings.accessToken || "",
        businessAccountId: settings.businessAccountId || "",
        webhookVerifyToken: settings.webhookVerifyToken || "",
      });
    }
  });

  const handleSaveCredentials = () => {
    updateSettingsMutation.mutate({
      ...formData,
      isActive: true,
    });
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    testConnectionMutation.mutate();
  };

  const steps = [
    { id: 1, title: "Criar App no Meta", icon: "📱" },
    { id: 2, title: "Configurar WhatsApp", icon: "💬" },
    { id: 3, title: "Obter Credenciais", icon: "🔑" },
    { id: 4, title: "Configurar Webhook", icon: "🔗" },
    { id: 5, title: "Testar Conexão", icon: "✅" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuração do WhatsApp Business</h1>
          <p className="text-gray-400">
            Siga os passos abaixo para configurar a integração com o WhatsApp Business API
          </p>
        </div>

        {/* Status Card */}
        <div className={`mb-8 p-6 rounded-2xl border ${
          settings?.isActive 
            ? "bg-green-500/10 border-green-500/30" 
            : "bg-yellow-500/10 border-yellow-500/30"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              settings?.isActive ? "bg-green-500" : "bg-yellow-500"
            }`}>
              {settings?.isActive ? "✓" : "!"}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {settings?.isActive ? "WhatsApp Conectado" : "WhatsApp Não Configurado"}
              </h3>
              <p className="text-gray-400">
                {settings?.isActive 
                  ? `Phone Number ID: ${settings.phoneNumberId}`
                  : "Complete a configuração para começar a enviar mensagens"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/10" />
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`relative z-10 flex flex-col items-center ${
                activeStep === step.id ? "text-green-400" : "text-gray-500"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 ${
                activeStep === step.id 
                  ? "bg-green-500 text-white" 
                  : step.id < activeStep 
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/10"
              }`}>
                {step.icon}
              </div>
              <span className="text-xs text-center max-w-[80px]">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {/* Step 1: Criar App no Meta */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Passo 1: Criar um App no Meta for Developers</h2>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 text-sm">
                  💡 Você precisará de uma conta de desenvolvedor no Meta para continuar.
                </p>
              </div>

              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-gray-300">
                  Acesse <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">developers.facebook.com</a>
                </li>
                <li className="text-gray-300">
                  Clique em <strong>"Meus Apps"</strong> no canto superior direito
                </li>
                <li className="text-gray-300">
                  Clique em <strong>"Criar App"</strong>
                </li>
                <li className="text-gray-300">
                  Selecione <strong>"Empresa"</strong> como tipo de app
                </li>
                <li className="text-gray-300">
                  Preencha o nome do app (ex: "Arte AI Bot WhatsApp")
                </li>
                <li className="text-gray-300">
                  Clique em <strong>"Criar App"</strong>
                </li>
              </ol>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-medium mb-2">📸 Exemplo de configuração:</h4>
                <div className="bg-gray-800 rounded-lg p-4 text-sm font-mono">
                  <p>Nome do App: Arte AI Bot WhatsApp</p>
                  <p>Tipo: Empresa</p>
                  <p>Conta Business: Sua conta empresarial</p>
                </div>
              </div>

              <button
                onClick={() => setActiveStep(2)}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-all"
              >
                Próximo Passo →
              </button>
            </div>
          )}

          {/* Step 2: Configurar WhatsApp */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Passo 2: Adicionar o Produto WhatsApp</h2>

              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-gray-300">
                  No painel do seu app, clique em <strong>"Adicionar Produtos"</strong>
                </li>
                <li className="text-gray-300">
                  Encontre <strong>"WhatsApp"</strong> e clique em <strong>"Configurar"</strong>
                </li>
                <li className="text-gray-300">
                  Selecione sua <strong>Conta Business do WhatsApp</strong> ou crie uma nova
                </li>
                <li className="text-gray-300">
                  Adicione um <strong>número de telefone</strong> para testes
                </li>
                <li className="text-gray-300">
                  Verifique o número de telefone via SMS ou ligação
                </li>
              </ol>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-300 text-sm">
                  ⚠️ <strong>Importante:</strong> Para produção, você precisará de um número de telefone dedicado que não esteja vinculado a nenhum WhatsApp pessoal ou Business.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-medium mb-2">Números para Teste:</h4>
                <p className="text-gray-400 text-sm">
                  O Meta fornece um número de teste gratuito para desenvolvimento. Você pode enviar mensagens para até 5 números verificados durante o período de teste.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveStep(1)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-all"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-all"
                >
                  Próximo Passo →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Obter Credenciais */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Passo 3: Obter suas Credenciais</h2>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-300 text-sm">
                  🔐 Suas credenciais serão criptografadas e armazenadas com segurança.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Phone Number ID *
                    <span className="ml-2 text-xs text-gray-500">
                      (Encontrado em WhatsApp → Configuração da API)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                    placeholder="Ex: 123456789012345"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Access Token *
                    <span className="ml-2 text-xs text-gray-500">
                      (Token temporário ou permanente)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={formData.accessToken}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    placeholder="EAAxxxxxxxxxxxxxxxx"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Business Account ID
                    <span className="ml-2 text-xs text-gray-500">
                      (Opcional - para recursos avançados)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessAccountId}
                    onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                    placeholder="Ex: 123456789012345"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-medium mb-2">📋 Onde encontrar:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• <strong>Phone Number ID:</strong> WhatsApp → Configuração da API → Phone Number ID</li>
                  <li>• <strong>Access Token:</strong> WhatsApp → Configuração da API → Token de Acesso Temporário</li>
                  <li>• <strong>Business Account ID:</strong> Configurações da Conta Business → ID da Conta</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveStep(2)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-all"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => {
                    handleSaveCredentials();
                    setActiveStep(4);
                  }}
                  disabled={!formData.phoneNumberId || !formData.accessToken}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar e Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Configurar Webhook */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Passo 4: Configurar Webhook</h2>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 text-sm">
                  💡 O webhook permite que você receba mensagens e atualizações de status em tempo real.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">URL do Webhook</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/api/whatsapp/webhook`}
                      readOnly
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/webhook`)}
                      className="bg-white/10 hover:bg-white/20 px-4 rounded-lg transition-all"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Token de Verificação
                    <span className="ml-2 text-xs text-gray-500">
                      (Crie um token único para verificação)
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.webhookVerifyToken}
                      onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
                      placeholder="arte-ai-bot-verify-token"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                    />
                    <button
                      onClick={() => {
                        const token = `arte-ai-${Math.random().toString(36).substring(2, 15)}`;
                        setFormData({ ...formData, webhookVerifyToken: token });
                      }}
                      className="bg-white/10 hover:bg-white/20 px-4 rounded-lg transition-all"
                    >
                      🔄
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-medium mb-2">📋 Como configurar no Meta:</h4>
                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Acesse WhatsApp → Configuração</li>
                  <li>Clique em "Editar" na seção Webhook</li>
                  <li>Cole a URL do Webhook acima</li>
                  <li>Cole o Token de Verificação</li>
                  <li>Clique em "Verificar e Salvar"</li>
                  <li>Marque os campos: <strong>messages</strong>, <strong>message_deliveries</strong>, <strong>message_reads</strong></li>
                </ol>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveStep(3)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-all"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => {
                    updateSettingsMutation.mutate({ webhookVerifyToken: formData.webhookVerifyToken });
                    setActiveStep(5);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-all"
                >
                  Próximo Passo →
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Testar Conexão */}
          {activeStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Passo 5: Testar Conexão</h2>

              <div className="bg-white/5 rounded-xl p-6 text-center">
                {connectionStatus === null && !testingConnection && (
                  <>
                    <div className="text-6xl mb-4">🔌</div>
                    <p className="text-gray-400 mb-6">
                      Clique no botão abaixo para testar a conexão com o WhatsApp Business API
                    </p>
                  </>
                )}

                {testingConnection && (
                  <>
                    <div className="text-6xl mb-4 animate-pulse">⏳</div>
                    <p className="text-gray-400 mb-6">Testando conexão...</p>
                  </>
                )}

                {connectionStatus?.connected && (
                  <>
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-green-400 font-bold text-xl mb-2">Conexão Estabelecida!</p>
                    <p className="text-gray-400 mb-6">
                      {connectionStatus.businessName && `Empresa: ${connectionStatus.businessName}`}
                      {connectionStatus.phoneNumber && ` | Telefone: ${connectionStatus.phoneNumber}`}
                    </p>
                  </>
                )}

                {connectionStatus && !connectionStatus.connected && (
                  <>
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-red-400 font-bold text-xl mb-2">Falha na Conexão</p>
                    <p className="text-gray-400 mb-6">
                      {connectionStatus.error || "Verifique suas credenciais e tente novamente"}
                    </p>
                  </>
                )}

                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {testingConnection ? "Testando..." : "Testar Conexão"}
                </button>
              </div>

              {connectionStatus?.connected && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h4 className="font-medium text-green-400 mb-2">🎉 Configuração Concluída!</h4>
                  <p className="text-gray-300 text-sm">
                    Sua integração com o WhatsApp Business está pronta. Agora você pode:
                  </p>
                  <ul className="text-sm text-gray-400 mt-2 space-y-1">
                    <li>• Enviar mensagens para seus contatos</li>
                    <li>• Receber notificações de aprovação</li>
                    <li>• Acompanhar o status das mensagens</li>
                    <li>• Gerenciar conversas em tempo real</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveStep(4)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-all"
                >
                  ← Voltar
                </button>
                <a
                  href="/whatsapp"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-all text-center"
                >
                  Ir para WhatsApp →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold mb-4">❓ Precisa de Ajuda?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all"
            >
              <div className="text-2xl mb-2">📚</div>
              <h4 className="font-medium">Documentação Oficial</h4>
              <p className="text-sm text-gray-400">Guia completo do Meta</p>
            </a>
            <a
              href="https://business.facebook.com/settings/whatsapp-business-accounts"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h4 className="font-medium">Configurações Business</h4>
              <p className="text-sm text-gray-400">Gerenciar conta business</p>
            </a>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all"
            >
              <div className="text-2xl mb-2">🔧</div>
              <h4 className="font-medium">Painel de Apps</h4>
              <p className="text-sm text-gray-400">Gerenciar seus apps</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
