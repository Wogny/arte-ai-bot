import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function MetaSettings() {
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const utils = trpc.useUtils();
  const { data: credentials, isLoading } = trpc.meta.getCredentials.useQuery();
  
  const saveMutation = trpc.meta.saveCredentials.useMutation({
    onSuccess: () => {
      toast.success("Credenciais salvas com sucesso!");
      utils.meta.getCredentials.invalidate();
      setAppId("");
      setAppSecret("");
      setAccessToken("");
    },
    onError: (error) => {
      toast.error("Erro ao salvar credenciais: " + error.message);
    },
  });

  const handleSave = () => {
    if (!appId.trim() || !appSecret.trim() || !accessToken.trim()) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    saveMutation.mutate({
      appId: appId.trim(),
      appSecret: appSecret.trim(),
      accessToken: accessToken.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Integração com Meta</h1>
          <p className="text-muted-foreground text-lg">
            Configure suas credenciais para agendar postagens no Facebook e Instagram
          </p>
        </div>

        {credentials?.hasCredentials && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Credenciais Configuradas</AlertTitle>
            <AlertDescription className="text-green-800">
              Suas credenciais Meta estão ativas desde {new Date(credentials.createdAt).toLocaleDateString('pt-BR')}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-2 shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Como Obter suas Credenciais</CardTitle>
            <CardDescription>
              Siga os passos abaixo para configurar sua integração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Acesse o Meta for Developers</p>
                  <a 
                    href="https://developers.facebook.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    developers.facebook.com
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Crie um novo App</p>
                  <p className="text-sm text-muted-foreground">
                    Selecione o tipo "Business" e adicione os produtos Facebook Login e Instagram Basic Display
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Copie as credenciais</p>
                  <p className="text-sm text-muted-foreground">
                    No painel do app, copie o App ID e App Secret. Gere um Access Token de longa duração
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">Cole as credenciais abaixo</p>
                  <p className="text-sm text-muted-foreground">
                    Insira suas credenciais nos campos abaixo para ativar a integração
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle>Credenciais da API Meta</CardTitle>
            <CardDescription>
              Suas credenciais são armazenadas de forma segura e criptografada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                Nunca compartilhe suas credenciais. Elas dão acesso total às suas contas do Facebook e Instagram.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-id">App ID</Label>
                <Input
                  id="app-id"
                  type="text"
                  placeholder="Digite seu App ID"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="app-secret">App Secret</Label>
                <Input
                  id="app-secret"
                  type="password"
                  placeholder="Digite seu App Secret"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="Digite seu Access Token de longa duração"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full"
              size="lg"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Credenciais"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
