import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Platform {
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  getAuthUrl: () => Promise<{ authUrl: string }>;
  handleCallback: (code: string, state: string) => Promise<any>;
  disconnect: () => Promise<any>;
}

export default function PlatformConnections() {
  const [platformStatus, setPlatformStatus] = useState({
    tiktok: false,
    facebook: false,
    instagram: false,
    whatsapp: false,
  });

  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Queries
  const statusQuery = trpc.oauth.getPlatformStatus.useQuery();
  const getTikTokUrlMutation = trpc.oauth.getTikTokAuthUrl.useQuery();
  const getFacebookUrlMutation = trpc.oauth.getFacebookAuthUrl.useQuery();
  const handleTikTokCallbackMutation = trpc.oauth.handleTikTokCallback.useMutation();
  const handleFacebookCallbackMutation = trpc.oauth.handleFacebookCallback.useMutation();
  const disconnectMutation = trpc.oauth.disconnectPlatform.useMutation();

  useEffect(() => {
    if (statusQuery.data) {
      setPlatformStatus(statusQuery.data);
    }
  }, [statusQuery.data]);

  // Processa callback do OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setLoading(true);

      if (state.startsWith("tiktok_")) {
        await handleTikTokCallbackMutation.mutateAsync({ code, state });
        toast.success("TikTok conectado com sucesso!");
      } else if (state.startsWith("facebook_")) {
        await handleFacebookCallbackMutation.mutateAsync({ code, state });
        toast.success("Facebook e Instagram conectados com sucesso!");
      }

      // Limpa URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Atualiza status
      await statusQuery.refetch();
    } catch (error) {
      toast.error(
        `Erro ao conectar: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      setConnecting(platform);

      let authUrl = "";

      if (platform === "tiktok" && getTikTokUrlMutation.data) {
        authUrl = getTikTokUrlMutation.data.authUrl;
      } else if (platform === "facebook" && getFacebookUrlMutation.data) {
        authUrl = getFacebookUrlMutation.data.authUrl;
      }

      if (authUrl) {
        window.location.href = authUrl;
      } else {
        toast.error("Não foi possível obter URL de autorização");
      }
    } catch (error) {
      toast.error(
        `Erro ao conectar: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await disconnectMutation.mutateAsync({ platform });
      toast.success(`${platform} desconectado com sucesso!`);
      await statusQuery.refetch();
    } catch (error) {
      toast.error(
        `Erro ao desconectar: ${error instanceof Error ? error.message : "Desconhecido"}`
      );
    }
  };

  const platforms = [
    {
      id: "tiktok",
      name: "TikTok",
      icon: "🎵",
      description: "Publique vídeos e gerencie sua conta TikTok",
      connected: platformStatus.tiktok,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "f",
      description: "Publique no Facebook e gerencie suas páginas",
      connected: platformStatus.facebook,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📷",
      description: "Publique fotos e vídeos no Instagram",
      connected: platformStatus.instagram,
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      icon: "💬",
      description: "Envie mensagens via WhatsApp Business API",
      connected: platformStatus.whatsapp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Conexões de Plataformas</h1>
        <p className="text-gray-600">
          Conecte suas contas de redes sociais para publicar e gerenciar conteúdo
        </p>
      </div>

      {/* Grid de Plataformas */}
      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform) => (
          <Card key={platform.id} className="relative overflow-hidden">
            {/* Indicador de Status */}
            <div className="absolute top-0 right-0 w-2 h-2">
              {platform.connected ? (
                <div className="w-full h-full bg-green-500" />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>

            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{platform.icon}</div>
                  <div>
                    <CardTitle>{platform.name}</CardTitle>
                    <CardDescription>{platform.description}</CardDescription>
                  </div>
                </div>
                {platform.connected ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Desconectado
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Status Detalhado */}
                <div className="text-sm">
                  {platform.connected ? (
                    <p className="text-green-600">
                      ✓ Sua conta está conectada e pronta para usar
                    </p>
                  ) : (
                    <p className="text-gray-600">
                      Clique em conectar para autorizar o acesso à sua conta
                    </p>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  {platform.connected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        Desconectar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleConnect(platform.id)}
                      disabled={
                        connecting === platform.id ||
                        loading ||
                        (platform.id === "whatsapp") // WhatsApp ainda não tem OAuth
                      }
                    >
                      {connecting === platform.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : platform.id === "whatsapp" ? (
                        "Em Breve"
                      ) : (
                        "Conectar"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">1. Conectar Plataforma</p>
            <p className="text-gray-600">
              Clique em "Conectar" para autorizar o acesso à sua conta. Você será
              redirecionado para a plataforma para confirmar.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">2. Autorizar Acesso</p>
            <p className="text-gray-600">
              Faça login e autorize o acesso às suas contas. Nós nunca armazenamos
              suas senhas, apenas tokens de acesso.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">3. Publicar Conteúdo</p>
            <p className="text-gray-600">
              Após conectar, você poderá publicar conteúdo diretamente da plataforma
              para suas redes sociais.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Aviso de Segurança */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">🔒 Segurança</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          Seus tokens de acesso são armazenados com segurança e criptografados.
          Nunca compartilhamos suas credenciais com terceiros. Você pode desconectar
          a qualquer momento.
        </CardContent>
      </Card>
    </div>
  );
}
