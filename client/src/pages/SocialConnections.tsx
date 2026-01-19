import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Youtube,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink
} from "lucide-react";

// Ícone do TikTok customizado
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Ícone do Twitter/X
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-6 h-6" />,
  facebook: <Facebook className="w-6 h-6" />,
  tiktok: <TikTokIcon className="w-6 h-6" />,
  linkedin: <Linkedin className="w-6 h-6" />,
  twitter: <TwitterIcon className="w-6 h-6" />,
  youtube: <Youtube className="w-6 h-6" />,
};

const platformColors: Record<string, string> = {
  instagram: "from-purple-500 via-pink-500 to-orange-500",
  facebook: "from-blue-600 to-blue-700",
  tiktok: "from-black to-gray-800",
  linkedin: "from-blue-700 to-blue-800",
  twitter: "from-gray-900 to-black",
  youtube: "from-red-600 to-red-700",
};

export default function SocialConnections() {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  // Queries
  const { data: connections, refetch: refetchConnections } = trpc.socialConnections.list.useQuery();
  const { data: platforms } = trpc.socialConnections.getAvailablePlatforms.useQuery();

  // Mutations
  const getAuthUrlMutation = trpc.socialConnections.getAuthUrl.useMutation({
    onSuccess: (data) => {
      // Abrir popup de autorização
      window.open(data.authUrl, "_blank", "width=600,height=700");
    },
    onError: (error) => {
      toast.error("Erro ao iniciar conexão: " + error.message);
      setConnectingPlatform(null);
    },
  });

  const disconnectMutation = trpc.socialConnections.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Conta desconectada com sucesso!");
      refetchConnections();
    },
    onError: (error) => {
      toast.error("Erro ao desconectar: " + error.message);
    },
  });

  const refreshTokenMutation = trpc.socialConnections.refreshToken.useMutation({
    onSuccess: () => {
      toast.success("Token renovado com sucesso!");
      refetchConnections();
    },
    onError: (error) => {
      toast.error("Erro ao renovar token: " + error.message);
    },
  });

  const handleConnect = (platformId: string) => {
    setConnectingPlatform(platformId);
    const redirectUri = `${window.location.origin}/oauth/callback/${platformId}`;
    getAuthUrlMutation.mutate({
      platform: platformId as any,
      redirectUri,
    });
  };

  const handleDisconnect = (connectionId: number) => {
    if (confirm("Tem certeza que deseja desconectar esta conta?")) {
      disconnectMutation.mutate({ connectionId });
    }
  };

  const handleRefreshToken = (connectionId: number) => {
    refreshTokenMutation.mutate({ connectionId });
  };

  const getConnectionForPlatform = (platformId: string) => {
    return connections?.find(c => c.platform === platformId);
  };

  const isTokenExpired = (connection: any) => {
    if (!connection.tokenExpiresAt) return false;
    return new Date(connection.tokenExpiresAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Link2 className="w-8 h-8 text-cyan-400" />
            Conexões de Redes Sociais
          </h1>
          <p className="text-gray-400 mt-1">
            Conecte suas contas para publicar automaticamente
          </p>
        </div>

        {/* Status Geral */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {connections?.length || 0} conta(s) conectada(s)
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Conecte mais contas para expandir seu alcance
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => refetchConnections()}
                className="border-white/10 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Plataformas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms?.map((platform) => {
            const connection = getConnectionForPlatform(platform.id);
            const isConnected = !!connection;
            const expired = connection && isTokenExpired(connection);

            return (
              <Card 
                key={platform.id}
                className={`bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                  isConnected ? "ring-1 ring-green-500/30" : ""
                }`}
              >
                {/* Gradient Header */}
                <div className={`h-2 bg-gradient-to-r ${platformColors[platform.id]}`} />
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${platformColors[platform.id]} flex items-center justify-center text-white`}>
                        {platformIcons[platform.id]}
                      </div>
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          {platform.name}
                          {isConnected && !expired && (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          )}
                          {expired && (
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {platform.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {platform.features.map((feature) => (
                      <Badge 
                        key={feature} 
                        variant="secondary"
                        className="bg-white/10 text-gray-300"
                      >
                        {feature}
                      </Badge>
                    ))}
                    {platform.requiresBusinessAccount && (
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                        Conta Business
                      </Badge>
                    )}
                  </div>

                  {/* Conta Conectada */}
                  {isConnected && connection && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-3">
                        {connection.accountAvatar ? (
                          <img 
                            src={connection.accountAvatar} 
                            alt="" 
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            {platformIcons[platform.id]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {connection.accountName || connection.accountUsername || "Conta conectada"}
                          </p>
                          {connection.accountUsername && (
                            <p className="text-gray-400 text-sm truncate">
                              @{connection.accountUsername}
                            </p>
                          )}
                        </div>
                        {expired && (
                          <Badge variant="destructive" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                            Token expirado
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2">
                    {isConnected ? (
                      <>
                        {expired && (
                          <Button
                            onClick={() => handleRefreshToken(connection!.id)}
                            disabled={refreshTokenMutation.isPending}
                            className="flex-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/50"
                          >
                            {refreshTokenMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Renovar Token
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnect(connection!.id)}
                          disabled={disconnectMutation.isPending}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          {disconnectMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Unlink className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleConnect(platform.id)}
                        disabled={connectingPlatform === platform.id}
                        className={`flex-1 bg-gradient-to-r ${platformColors[platform.id]} hover:opacity-90`}
                      >
                        {connectingPlatform === platform.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Link2 className="w-4 h-4 mr-2" />
                        )}
                        Conectar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instruções */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-white">Conecte suas contas</p>
                <p className="text-sm text-gray-400">
                  Clique em "Conectar" e autorize o acesso à sua conta de rede social.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-white">Crie seu conteúdo</p>
                <p className="text-sm text-gray-400">
                  Use nossa IA para gerar imagens e legendas incríveis.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-white">Agende e publique</p>
                <p className="text-sm text-gray-400">
                  Escolha a data e hora, e nós publicamos automaticamente para você.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aviso sobre APIs */}
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">Importante</p>
                <p className="text-yellow-200/80 text-sm mt-1">
                  Para Instagram e Facebook, é necessário ter uma conta Business conectada a uma Página do Facebook.
                  Para TikTok, você precisa de uma conta de criador ou business.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
