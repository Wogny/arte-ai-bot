import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, 
  Clock, 
  Video, 
  Film, 
  Smartphone, 
  Square,
  Instagram,
  Facebook,
  Send,
  Play,
  Image as ImageIcon,
  Hash,
  Music
} from "lucide-react";
import { cn } from "@/lib/utils";

type ContentFormat = "post" | "story" | "reel" | "carousel";
type Platform = "facebook" | "instagram" | "tiktok" | "whatsapp" | "both" | "all";

export default function ScheduleVideo() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const mediaId = params.get("mediaId");

  // Estado do agendamento
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [contentFormat, setContentFormat] = useState<ContentFormat>("post");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [musicTrack, setMusicTrack] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [scheduling, setScheduling] = useState(false);

  // Plataformas selecionadas
  const [platforms, setPlatforms] = useState({
    instagram: true,
    facebook: false,
    tiktok: false,
  });

  // Buscar mídia se mediaId fornecido
  const { data: media } = trpc.media.getById.useQuery(
    { mediaId: Number(mediaId) },
    { enabled: !!mediaId }
  );

  // Buscar mídias recentes
  const { data: recentMedia } = trpc.media.recent.useQuery({ limit: 12 });

  // Mutation de agendamento
  const scheduleMutation = trpc.scheduling.create.useMutation({
    onSuccess: () => {
      toast.success("Vídeo agendado com sucesso!");
      navigate("/calendar");
    },
    onError: (error) => {
      toast.error(error.message);
      setScheduling(false);
    },
  });

  // Selecionar mídia quando carregada
  useEffect(() => {
    if (media) {
      setSelectedMedia(media);
      // Definir formato baseado no tipo de mídia
      if (media.contentFormat) {
        setContentFormat(media.contentFormat as ContentFormat);
      }
    }
  }, [media]);

  // Calcular plataforma baseada nas seleções
  useEffect(() => {
    const selected = Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k);
    if (selected.length === 0) {
      setPlatform("instagram");
    } else if (selected.length === 1) {
      setPlatform(selected[0] as Platform);
    } else if (selected.includes("instagram") && selected.includes("facebook") && !selected.includes("tiktok")) {
      setPlatform("both");
    } else {
      setPlatform("all");
    }
  }, [platforms]);

  // Agendar vídeo
  const handleSchedule = async () => {
    if (!selectedMedia) {
      toast.error("Selecione uma mídia para agendar");
      return;
    }

    if (!scheduledDate) {
      toast.error("Selecione uma data para o agendamento");
      return;
    }

    setScheduling(true);

    // Combinar data e hora
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const scheduledFor = new Date(scheduledDate);
    scheduledFor.setHours(hours, minutes, 0, 0);

    try {
      await scheduleMutation.mutateAsync({
        imageId: selectedMedia.mediaType === "image" ? selectedMedia.id : 0,
        mediaId: selectedMedia.id,
        mediaType: selectedMedia.mediaType,
        contentFormat,
        platform,
        caption: caption + (hashtags ? `\n\n${hashtags}` : ""),
        videoUrl: selectedMedia.videoUrl,
        videoKey: selectedMedia.videoKey || undefined,
        thumbnailUrl: selectedMedia.thumbnailUrl || undefined,
        duration: selectedMedia.duration,
        musicTrack: musicTrack || undefined,
        hashtags: hashtags || undefined,
        scheduledFor,
      });
    } catch (error) {
      console.error("Erro ao agendar:", error);
    }
  };

  // Renderizar preview da mídia
  const renderMediaPreview = (item: any) => {
    if (item.mediaType === "video") {
      return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
          ) : (
            <video src={item.videoUrl} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-12 w-12 text-white" />
          </div>
          {item.duration && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, "0")}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        <img src={item.imageUrl} alt="Preview" className="w-full h-full object-cover" />
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Agendar Vídeo</h1>
          <p className="text-muted-foreground">
            Agende vídeos para publicação como Posts, Stories ou Reels
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Seleção de Mídia */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mídia Selecionada */}
            {selectedMedia ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Mídia Selecionada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderMediaPreview(selectedMedia)}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedMedia.title || "Sem título"}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedMedia.mediaType === "video" ? "Vídeo" : "Imagem"} • 
                        {selectedMedia.width}x{selectedMedia.height}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedMedia(null)}>
                      Trocar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Selecione uma Mídia</CardTitle>
                  <CardDescription>
                    Escolha um vídeo ou imagem para agendar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {recentMedia?.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMedia(item)}
                        className="relative aspect-video bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                      >
                        {item.mediaType === "video" ? (
                          <>
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 px-1 bg-black/70 rounded text-xs text-white">
                              {item.duration && `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, "0")}`}
                            </div>
                          </>
                        ) : (
                          <img src={item.imageUrl || ""} alt="" className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                  {(!recentMedia || recentMedia.length === 0) && (
                    <div className="text-center py-8">
                      <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma mídia encontrada</p>
                      <Button className="mt-4" onClick={() => navigate("/media/upload")}>
                        Fazer Upload
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Legenda e Hashtags */}
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Legenda</Label>
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escreva a legenda do seu post..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {caption.length}/2200 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Hashtags
                  </Label>
                  <Input
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#marketing #socialmedia #video"
                  />
                </div>

                {contentFormat === "reel" && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Música (opcional)
                    </Label>
                    <Input
                      value={musicTrack}
                      onChange={(e) => setMusicTrack(e.target.value)}
                      placeholder="Nome da música ou ID"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Configurações de Agendamento */}
          <div className="space-y-6">
            {/* Formato do Conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle>Formato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={contentFormat === "post" ? "default" : "outline"}
                    onClick={() => setContentFormat("post")}
                    className="flex flex-col h-auto py-4"
                  >
                    <Square className="h-6 w-6 mb-1" />
                    <span>Post</span>
                  </Button>
                  <Button
                    variant={contentFormat === "story" ? "default" : "outline"}
                    onClick={() => setContentFormat("story")}
                    className="flex flex-col h-auto py-4"
                  >
                    <Smartphone className="h-6 w-6 mb-1" />
                    <span>Story</span>
                  </Button>
                  <Button
                    variant={contentFormat === "reel" ? "default" : "outline"}
                    onClick={() => setContentFormat("reel")}
                    className="flex flex-col h-auto py-4"
                  >
                    <Film className="h-6 w-6 mb-1" />
                    <span>Reel</span>
                  </Button>
                  <Button
                    variant={contentFormat === "carousel" ? "default" : "outline"}
                    onClick={() => setContentFormat("carousel")}
                    className="flex flex-col h-auto py-4"
                  >
                    <ImageIcon className="h-6 w-6 mb-1" />
                    <span>Carousel</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plataformas */}
            <Card>
              <CardHeader>
                <CardTitle>Plataformas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="instagram"
                    checked={platforms.instagram}
                    onCheckedChange={(checked) => 
                      setPlatforms(p => ({ ...p, instagram: !!checked }))
                    }
                  />
                  <Label htmlFor="instagram" className="flex items-center gap-2 cursor-pointer">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="facebook"
                    checked={platforms.facebook}
                    onCheckedChange={(checked) => 
                      setPlatforms(p => ({ ...p, facebook: !!checked }))
                    }
                  />
                  <Label htmlFor="facebook" className="flex items-center gap-2 cursor-pointer">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tiktok"
                    checked={platforms.tiktok}
                    onCheckedChange={(checked) => 
                      setPlatforms(p => ({ ...p, tiktok: !!checked }))
                    }
                  />
                  <Label htmlFor="tiktok" className="flex items-center gap-2 cursor-pointer">
                    <Video className="h-4 w-4" />
                    TikTok
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Data e Hora */}
            <Card>
              <CardHeader>
                <CardTitle>Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? (
                          format(scheduledDate, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de Agendar */}
            <Button
              onClick={handleSchedule}
              disabled={!selectedMedia || scheduling}
              className="w-full"
              size="lg"
            >
              {scheduling ? (
                "Agendando..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Agendar Publicação
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
