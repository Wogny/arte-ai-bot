import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function UserAdmin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("platforms");

  const platformsQuery = trpc.platforms.list.useQuery();
  const addPlatformMutation = trpc.platforms.addCredentials.useMutation();
  const deletePlatformMutation = trpc.platforms.delete.useMutation();
  const testConnectionMutation = trpc.platforms.testConnection.useMutation();

  const [platformForm, setPlatformForm] = useState({
    platform: "facebook",
    accountName: "",
    accessToken: "",
    accountId: "",
  });

  const handleAddPlatform = async () => {
    if (!platformForm.accountName || !platformForm.accessToken || !platformForm.accountId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await addPlatformMutation.mutateAsync({
        platform: platformForm.platform as any,
        accountName: platformForm.accountName,
        accessToken: platformForm.accessToken,
        accountId: platformForm.accountId,
      });

      toast.success("Credencial adicionada com sucesso");
      setPlatformForm({ platform: "facebook", accountName: "", accessToken: "", accountId: "" });
      platformsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao adicionar credencial");
    }
  };

  const handleDeletePlatform = async (id: number) => {
    try {
      await deletePlatformMutation.mutateAsync({ id });
      toast.success("Credencial removida");
      platformsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao remover credencial");
    }
  };

  const handleTestConnection = async (id: number) => {
    try {
      const result = await testConnectionMutation.mutateAsync({ id });
      if (result.success) {
        toast.success("Conexão bem-sucedida!");
      } else {
        toast.error("Falha na conexão");
      }
    } catch (error) {
      toast.error("Erro ao testar conexão");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Painel de Administração</h1>
          </div>
          <p className="text-muted-foreground">
            Bem-vindo, <strong>{user?.name}</strong>. Gerencie suas plataformas e configurações aqui.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="platforms">Plataformas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Nova Plataforma</CardTitle>
                <CardDescription>
                  Conecte suas contas de redes sociais para gerenciar campanhas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform">Plataforma</Label>
                    <Select
                      value={platformForm.platform}
                      onValueChange={(value) =>
                        setPlatformForm({ ...platformForm, platform: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="accountName">Nome da Conta</Label>
                    <Input
                      id="accountName"
                      placeholder="Ex: Minha Loja"
                      value={platformForm.accountName}
                      onChange={(e) =>
                        setPlatformForm({ ...platformForm, accountName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountId">ID da Conta</Label>
                    <Input
                      id="accountId"
                      placeholder="ID da conta na plataforma"
                      value={platformForm.accountId}
                      onChange={(e) =>
                        setPlatformForm({ ...platformForm, accountId: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="accessToken">Token de Acesso</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      placeholder="Token de acesso"
                      value={platformForm.accessToken}
                      onChange={(e) =>
                        setPlatformForm({ ...platformForm, accessToken: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddPlatform}
                  disabled={addPlatformMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addPlatformMutation.isPending ? "Adicionando..." : "Adicionar Plataforma"}
                </Button>
              </CardContent>
            </Card>

            {/* Connected Platforms */}
            <Card>
              <CardHeader>
                <CardTitle>Plataformas Conectadas</CardTitle>
                <CardDescription>
                  {platformsQuery.data?.length || 0} plataforma(s) conectada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {platformsQuery.isLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : platformsQuery.data?.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma plataforma conectada</p>
                ) : (
                  <div className="space-y-3">
                    {platformsQuery.data?.map((platform) => (
                      <div
                        key={platform.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {platform.isActive ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-semibold capitalize">{platform.platform}</p>
                            <p className="text-sm text-muted-foreground">{platform.accountName}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(platform.id)}
                            disabled={testConnectionMutation.isPending}
                          >
                            Testar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePlatform(platform.id)}
                            disabled={deletePlatformMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Conta</CardTitle>
                <CardDescription>Personalize suas preferências</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tema</Label>
                    <Select defaultValue="light">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="auto">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Fuso Horário</Label>
                    <Select defaultValue="America/Sao_Paulo">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Idioma</Label>
                    <Select defaultValue="pt-BR">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button className="w-full">Salvar Configurações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atividades</CardTitle>
                <CardDescription>Suas ações recentes na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Histórico de atividades será exibido aqui</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
