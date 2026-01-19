import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Schedule() {
  const [selectedImage, setSelectedImage] = useState<number | undefined>();
  const [platform, setPlatform] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const utils = trpc.useUtils();
  const { data: images } = trpc.images.list.useQuery({});
  const { data: scheduledPosts, isLoading } = trpc.scheduling.list.useQuery();
  const { data: metaCredentials } = trpc.meta.getCredentials.useQuery();

  const scheduleMutation = trpc.scheduling.create.useMutation({
    onSuccess: () => {
      toast.success("Postagem agendada com sucesso!");
      utils.scheduling.list.invalidate();
      setSelectedImage(undefined);
      setPlatform("");
      setCaption("");
      setScheduledDate("");
      setScheduledTime("");
    },
    onError: (error) => {
      toast.error("Erro ao agendar: " + error.message);
    },
  });

  const handleSchedule = () => {
    if (!selectedImage || !platform || !scheduledDate || !scheduledTime) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!metaCredentials?.hasCredentials) {
      toast.error("Configure suas credenciais Meta antes de agendar postagens");
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledFor < new Date()) {
      toast.error("A data e hora devem ser no futuro");
      return;
    }

    scheduleMutation.mutate({
      imageId: selectedImage,
      platform: platform as any,
      caption: caption.trim() || undefined,
      scheduledFor,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700 border-green-300";
      case "failed":
        return "bg-red-100 text-red-700 border-red-300";
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: "Agendado",
      published: "Publicado",
      failed: "Falhou",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Agendamento de Postagens</h1>
          <p className="text-muted-foreground text-lg">
            Programe suas publicações no Facebook e Instagram
          </p>
        </div>

        {!metaCredentials?.hasCredentials && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">Credenciais Meta não configuradas</p>
                <p className="text-sm text-yellow-800">
                  Configure suas credenciais Meta para poder agendar postagens
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Nova Postagem</CardTitle>
              <CardDescription>
                Selecione uma imagem e programe sua publicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image">Imagem *</Label>
                <Select 
                  value={selectedImage?.toString()} 
                  onValueChange={(val) => setSelectedImage(Number(val))}
                >
                  <SelectTrigger id="image">
                    <SelectValue placeholder="Selecione uma imagem" />
                  </SelectTrigger>
                  <SelectContent>
                    {images?.map((image) => (
                      <SelectItem key={image.id} value={image.id.toString()}>
                        {image.prompt.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedImage && images && (
                <div className="rounded-lg overflow-hidden border-2">
                  <img 
                    src={images.find(img => img.id === selectedImage)?.imageUrl} 
                    alt="Preview"
                    className="w-full aspect-square object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma *</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Legenda</Label>
                <Textarea
                  id="caption"
                  placeholder="Escreva a legenda da postagem..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSchedule}
                disabled={scheduleMutation.isPending || !metaCredentials?.hasCredentials}
                className="w-full"
                size="lg"
              >
                {scheduleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Postagem
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Postagens Agendadas</CardTitle>
                <CardDescription>
                  Acompanhe suas publicações programadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : scheduledPosts && scheduledPosts.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {scheduledPosts.map((post) => (
                      <Card key={post.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(post.status)}
                              <Badge variant="outline" className={getStatusColor(post.status)}>
                                {getStatusLabel(post.status)}
                              </Badge>
                            </div>
                            <Badge variant="secondary">{post.platform}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(post.scheduledFor), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          {post.caption && (
                            <p className="text-sm mt-2 line-clamp-2">{post.caption}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma postagem agendada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
