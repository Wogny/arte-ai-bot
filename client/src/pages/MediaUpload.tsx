import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Upload, 
  Video, 
  Image as ImageIcon, 
  Play, 
  Pause, 
  Clock, 
  FileVideo, 
  CheckCircle2,
  AlertCircle,
  X,
  Film,
  Smartphone,
  Square
} from "lucide-react";

type MediaType = "image" | "video" | "gif";
type ContentFormat = "post" | "story" | "reel" | "carousel";

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export default function MediaUpload() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Estado do upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("video");
  const [contentFormat, setContentFormat] = useState<ContentFormat>("post");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Buscar limites de upload
  const { data: limits } = trpc.media.getLimits.useQuery();
  
  // Buscar projetos
  const { data: projects } = trpc.projects.list.useQuery();
  const [selectedProject, setSelectedProject] = useState<number | undefined>();

  // Mutation de upload
  const uploadMutation = trpc.media.upload.useMutation({
    onSuccess: (data) => {
      toast.success("Mídia enviada com sucesso!");
      navigate("/galeria");
    },
    onError: (error) => {
      toast.error(error.message);
      setUploading(false);
    },
  });

  // Processar arquivo selecionado
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Detectar tipo de mídia
    if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else if (file.type === "image/gif") {
      setMediaType("gif");
    } else if (file.type.startsWith("image/")) {
      setMediaType("image");
    }

    setSelectedFile(file);
    
    // Criar preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Se for vídeo, extrair metadados
    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        setVideoMetadata({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        
        // Gerar thumbnail do primeiro frame
        video.currentTime = 1;
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0);
        setThumbnail(canvas.toDataURL("image/jpeg", 0.8));
      };
      video.src = url;
    }
  }, []);

  // Fazer upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 50);
        }
      };
      
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        setUploadProgress(60);

        // Preparar thumbnail base64 se existir
        let thumbnailBase64: string | undefined;
        if (thumbnail) {
          thumbnailBase64 = thumbnail.split(",")[1];
        }

        setUploadProgress(70);

        await uploadMutation.mutateAsync({
          mediaType,
          contentFormat,
          title: title || undefined,
          description: description || undefined,
          projectId: selectedProject,
          fileData: base64,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          duration: videoMetadata?.duration,
          width: videoMetadata?.width,
          height: videoMetadata?.height,
          thumbnailData: thumbnailBase64,
        });

        setUploadProgress(100);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Erro no upload:", error);
      setUploading(false);
    }
  };

  // Controles de vídeo
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Formatar duração
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Formatar tamanho
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Limpar seleção
  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setVideoMetadata(null);
    setThumbnail(null);
    setTitle("");
    setDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Verificar se o formato é válido
  const isFormatValid = () => {
    if (!videoMetadata || mediaType !== "video") return true;
    
    const maxDurations: Record<ContentFormat, number> = {
      reel: 90,
      story: 60,
      post: 3600,
      carousel: 60,
    };
    
    return videoMetadata.duration <= maxDurations[contentFormat];
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Upload de Mídia</h1>
          <p className="text-muted-foreground">
            Envie imagens e vídeos para agendar nas suas redes sociais
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Área de Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Selecionar Arquivo
              </CardTitle>
              <CardDescription>
                Arraste ou clique para selecionar um arquivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-4">
                      <Video className="h-12 w-12 text-muted-foreground" />
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Clique para selecionar</p>
                      <p className="text-sm text-muted-foreground">
                        Vídeos: MP4, MOV, WebM (até {limits?.video.maxSizeMB}MB)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Imagens: JPG, PNG, GIF, WebP (até {limits?.image.maxSizeMB}MB)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    {mediaType === "video" ? (
                      <>
                        <video
                          ref={videoRef}
                          src={preview!}
                          className="w-full h-full object-contain"
                          onEnded={() => setIsPlaying(false)}
                        />
                        <button
                          onClick={togglePlay}
                          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="h-16 w-16 text-white" />
                          ) : (
                            <Play className="h-16 w-16 text-white" />
                          )}
                        </button>
                      </>
                    ) : (
                      <img
                        src={preview!}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    )}
                    <button
                      onClick={clearSelection}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>

                  {/* Metadados */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                      <FileVideo className="h-4 w-4" />
                      {selectedFile.name}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                      {formatSize(selectedFile.size)}
                    </div>
                    {videoMetadata && (
                      <>
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                          <Clock className="h-4 w-4" />
                          {formatDuration(videoMetadata.duration)}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                          {videoMetadata.width}x{videoMetadata.height}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Validação de duração */}
                  {!isFormatValid() && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">
                        Vídeo muito longo para {contentFormat}. 
                        {contentFormat === "reel" && " Máximo: 90 segundos"}
                        {contentFormat === "story" && " Máximo: 60 segundos"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Configure os detalhes da sua mídia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formato do conteúdo */}
              <div className="space-y-2">
                <Label>Formato do Conteúdo</Label>
                <Tabs value={contentFormat} onValueChange={(v) => setContentFormat(v as ContentFormat)}>
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="post" className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      Post
                    </TabsTrigger>
                    <TabsTrigger value="story" className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      Story
                    </TabsTrigger>
                    <TabsTrigger value="reel" className="flex items-center gap-1">
                      <Film className="h-4 w-4" />
                      Reel
                    </TabsTrigger>
                    <TabsTrigger value="carousel" className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Carousel
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground">
                  {contentFormat === "reel" && "Vídeos verticais de até 90 segundos"}
                  {contentFormat === "story" && "Vídeos verticais de até 60 segundos"}
                  {contentFormat === "post" && "Imagens ou vídeos para o feed"}
                  {contentFormat === "carousel" && "Múltiplas imagens ou vídeos"}
                </p>
              </div>

              {/* Projeto */}
              <div className="space-y-2">
                <Label>Projeto (opcional)</Label>
                <Select
                  value={selectedProject?.toString() || ""}
                  onValueChange={(v) => setSelectedProject(v ? Number(v) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label>Título (opcional)</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da mídia"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição ou notas sobre a mídia"
                  rows={3}
                />
              </div>

              {/* Progresso de upload */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enviando...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Botão de upload */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || !isFormatValid()}
                className="w-full"
              >
                {uploading ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Mídia
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dicas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Dicas para Melhores Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <Film className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Reels</p>
                  <p className="text-sm text-muted-foreground">
                    Vídeos verticais 9:16, até 90 segundos. Ideal para engajamento.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Stories</p>
                  <p className="text-sm text-muted-foreground">
                    Vídeos verticais 9:16, até 60 segundos. Desaparecem em 24h.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Square className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Posts</p>
                  <p className="text-sm text-muted-foreground">
                    Quadrado 1:1 ou 4:5 para melhor visualização no feed.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
