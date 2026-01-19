import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Eye,
  Send,
  Plus,
} from "lucide-react";

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "f", color: "bg-blue-600" },
  { id: "instagram", name: "Instagram", icon: "📷", color: "bg-pink-600" },
  { id: "tiktok", name: "TikTok", icon: "♪", color: "bg-black" },
  { id: "whatsapp", name: "WhatsApp", icon: "💬", color: "bg-green-600" },
];

export default function CentralizedScheduling() {
  const { user } = useAuth();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Queries
  const scheduledPostsQuery = trpc.scheduling.list.useQuery();
  const platformCredentialsQuery = trpc.platforms.listCredentials.useQuery() as any;

  // Mutations
  const createScheduleMutation = trpc.scheduling.create.useMutation({
    onSuccess: () => {
      toast.success("Post agendado com sucesso!");
      setSelectedPlatforms([]);
      setCaption("");
      setScheduledDate("");
      setScheduledTime("");
      setImageUrl("");
      scheduledPostsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao agendar post");
    },
  });

  const deleteScheduleMutation = trpc.scheduling.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Post cancelado");
      scheduledPostsQuery.refetch();
    },
  });

  const handleTogglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSchedulePost = async () => {
    if (!selectedPlatforms.length) {
      toast.error("Selecione pelo menos uma plataforma");
      return;
    }

    if (!caption.trim()) {
      toast.error("Digite uma legenda");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error("Selecione data e hora");
      return;
    }

    const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    // Schedule for each platform
    for (const platform of selectedPlatforms) {
      await createScheduleMutation.mutateAsync({
        imageId: 1, // TODO: Allow image selection
        platform: platform as any,
        caption,
        scheduledFor: dateTime,
      });
    }
  };

  const scheduledPosts = scheduledPostsQuery.data || [];
  const credentials = platformCredentialsQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Agendamento Centralizado</h1>
        <p className="text-gray-600">
          Agende posts em múltiplas plataformas simultaneamente
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário de Agendamento */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Novo Agendamento</CardTitle>
              <CardDescription>
                Selecione plataformas e configure o post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seleção de Plataformas */}
              <div className="space-y-3">
                <Label>Plataformas</Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {PLATFORMS.map((platform) => {
                    const isConnected = credentials.some(
                      (c: any) => c.platform === platform.id
                    );
                    const isSelected = selectedPlatforms.includes(platform.id);

                    return (
                      <div
                        key={platform.id}
                        className={`relative flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => isConnected && handleTogglePlatform(platform.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={!isConnected}
                          onChange={() => handleTogglePlatform(platform.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{platform.name}</p>
                          {!isConnected && (
                            <p className="text-xs text-gray-500">Não conectado</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legenda */}
              <div className="space-y-2">
                <Label htmlFor="caption">Legenda</Label>
                <Textarea
                  id="caption"
                  placeholder="Digite a legenda do post..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-24"
                />
                <p className="text-xs text-gray-500">
                  {caption.length} caracteres
                </p>
              </div>

              {/* Data e Hora */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Botão de Agendamento */}
              <Button
                onClick={handleSchedulePost}
                disabled={
                  createScheduleMutation.isPending ||
                  selectedPlatforms.length === 0
                }
                className="w-full"
                size="lg"
              >
                <Send className="mr-2 h-4 w-4" />
                Agendar para {selectedPlatforms.length} plataforma
                {selectedPlatforms.length !== 1 ? "s" : ""}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Plataformas */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plataformas Conectadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {credentials.length > 0 ? (
                credentials.map((cred: any) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="text-sm">
                      <p className="font-medium capitalize">{cred.platform}</p>
                      <p className="text-xs text-gray-500">{cred.accountName}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50">
                      Ativo
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma plataforma conectada
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de Posts Agendados */}
      <Card>
        <CardHeader>
          <CardTitle>Posts Agendados</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os posts agendados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledPosts.length > 0 ? (
            <div className="space-y-3">
              {scheduledPosts.map((post: any) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium">
                        {new Date(post.scheduledFor).toLocaleString("pt-BR")}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          post.status === "published"
                            ? "bg-green-50 text-green-700"
                            : post.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                        }
                      >
                        {post.status === "published"
                          ? "Publicado"
                          : post.status === "failed"
                          ? "Erro"
                          : "Agendado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {post.caption}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Plataforma: {post.platform}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {post.status === "scheduled" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          deleteScheduleMutation.mutate({
                            postId: post.id,
                            status: "cancelled",
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum post agendado</p>
              <p className="text-sm text-gray-400">
                Crie seu primeiro agendamento acima
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
