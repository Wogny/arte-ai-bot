import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  Lock,
  Bell,
  Palette,
  Globe,
  Key,
  Activity,
  Download,
  Copy,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

export default function UserAdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");

  // Queries
  const userStatsQuery = trpc.user.getStats.useQuery();
  const userSettingsQuery = trpc.user.getSettings.useQuery();
  const activityLogQuery = trpc.user.getActivityLog.useQuery({ limit: 20 });
  const platformCredentialsQuery = trpc.platforms.listCredentials.useQuery() as any;

  // Mutations
  const updateNameMutation = trpc.user.updateName.useMutation({
    onSuccess: () => {
      toast.success("Nome atualizado com sucesso");
      setEditingName(false);
    },
  });

  const updateSettingsMutation = trpc.user.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas");
    },
  });

  const generateApiKeyMutation = trpc.user.generateApiKey.useMutation({
    onSuccess: () => {
      toast.success("Chave API gerada");
      userSettingsQuery.refetch();
    },
  });

  const revokeApiKeyMutation = trpc.user.revokeApiKey.useMutation({
    onSuccess: () => {
      toast.success("Chave API revogada");
      userSettingsQuery.refetch();
    },
  });

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast.success("Chave copiada para a área de transferência");
  };

  const handleUpdateName = () => {
    if (newName.trim()) {
      updateNameMutation.mutate({ name: newName });
    }
  };

  const stats = userStatsQuery.data;
  const settings = userSettingsQuery.data;
  const activityLog = activityLogQuery.data;
  const credentials = platformCredentialsQuery.data;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-gray-600">Gerencie sua conta, credenciais e preferências</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Conta</span>
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Credenciais</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Atividade</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferências</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Artes Criadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalArts || 0}</div>
                <p className="text-xs text-gray-500">Total de imagens geradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Posts Agendados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.scheduledPosts || 0}</div>
                <p className="text-xs text-gray-500">Próximas publicações</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Campanhas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
                <p className="text-xs text-gray-500">Em andamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Plataformas Conectadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{credentials?.length || 0}</div>
                <p className="text-xs text-gray-500">Redes sociais</p>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-gray-600">Nome</Label>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Método de Login</Label>
                  <Badge variant="outline" className="mt-1">
                    {user?.loginMethod}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Membro desde</Label>
                  <p className="font-medium">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("pt-BR")
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Conta */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Editar Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Seu nome"
                    />
                    <Button
                      onClick={handleUpdateName}
                      disabled={updateNameMutation.isPending}
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingName(false);
                        setNewName(user?.name || "");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span>{user?.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingName(true)}
                    >
                      Editar
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled />
                <p className="text-xs text-gray-500">
                  Email não pode ser alterado. Entre em contato com o suporte para mudanças.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>Chaves de API</CardTitle>
              <CardDescription>
                Use chaves de API para integrar com aplicações externas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings?.apiKey ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border bg-gray-50 p-3">
                    <code className="flex-1 font-mono text-sm">
                      {showApiKey
                        ? settings.apiKey
                        : `${settings.apiKey.substring(0, 10)}...`}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => settings.apiKey && handleCopyApiKey(settings.apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => generateApiKeyMutation.mutate()}
                      disabled={generateApiKeyMutation.isPending}
                    >
                      Gerar Nova Chave
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => revokeApiKeyMutation.mutate()}
                      disabled={revokeApiKeyMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Revogar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Você não possui uma chave de API. Gere uma para começar.
                  </p>
                  <Button
                    onClick={() => generateApiKeyMutation.mutate()}
                    disabled={generateApiKeyMutation.isPending}
                  >
                    Gerar Chave de API
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Credenciais */}
        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credenciais de Plataformas</CardTitle>
              <CardDescription>
                Gerencie suas credenciais de redes sociais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {credentials && credentials.length > 0 ? (
                <div className="space-y-3">
                  {credentials.map((cred: any) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium capitalize">{cred.platform}</p>
                        <p className="text-sm text-gray-500">
                          Conectado em{" "}
                          {new Date(cred.connectedAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Ativo
                        </Badge>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  Nenhuma credencial conectada. Vá para Integração Meta para conectar.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Atividade */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
              <CardDescription>
                Visualize todas as ações realizadas em sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLog && activityLog.length > 0 ? (
                <div className="space-y-3">
                  {activityLog.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-4 border-b pb-3">
                      <div className="mt-1 rounded-full bg-blue-100 p-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-500">{log.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">Nenhuma atividade registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Preferências */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Conta</CardTitle>
              <CardDescription>Customize sua experiência</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-gray-500">
                      Receba atualizações sobre suas campanhas
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <Label>Tema Escuro</Label>
                    <p className="text-sm text-gray-500">Use tema escuro por padrão</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <Label>Alertas de Performance</Label>
                    <p className="text-sm text-gray-500">
                      Notifique quando posts têm baixo desempenho
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </div>

              <Button className="w-full" onClick={() => updateSettingsMutation.mutate({})}>
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
