import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, Zap } from "lucide-react";
import PlatformPreview from "@/components/PlatformPreview";

interface AdaptedContent {
  platform: string;
  text: string;
  hashtags: string[];
  imageUrl?: string;
  bestPostingTime: string;
  characterCount: number;
  estimatedReach: number;
}

export default function BatchAdaptation() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "instagram",
    "tiktok",
    "facebook",
  ]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "funny" | "inspirational">(
    "casual"
  );
  const [adaptedContents, setAdaptedContents] = useState<Record<string, AdaptedContent>>({});
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [approvedPlatforms, setApprovedPlatforms] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const platformsQuery = trpc.contentAutomation.getPlatformConfigs.useQuery();
  const adaptMutation = trpc.contentAutomation.adaptForMultiplePlatforms.useMutation();

  const platforms = platformsQuery.data || [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  const handleAdapt = async () => {
    if (!text.trim()) {
      toast.error("Por favor, insira o texto do post");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Por favor, selecione pelo menos uma plataforma");
      return;
    }

    setIsLoading(true);
    try {
      const result = await adaptMutation.mutateAsync({
        text,
        platforms: selectedPlatforms as any,
        niche: niche || undefined,
        tone,
      });

      const contentMap: Record<string, AdaptedContent> = {};
      const resultArray = Array.isArray(result) ? result : [];
      resultArray.forEach((content: any) => {
        contentMap[content.platform] = content;
      });
      setAdaptedContents(contentMap);
      setApprovedPlatforms(new Set());
      toast.success(`Conteúdo adaptado para ${resultArray.length} plataformas`);
    } catch (error) {
      console.error("Erro ao adaptar conteúdo:", error);
      toast.error("Erro ao adaptar conteúdo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlatform = (platformId: string) => {
    setEditingPlatform(platformId);
  };

  const handleSavePlatform = (
    platformId: string,
    newText: string,
    newHashtags: string[]
  ) => {
    setAdaptedContents((prev) => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        text: newText,
        hashtags: newHashtags,
      },
    }));
    setEditingPlatform(null);
    toast.success("Alterações salvas");
  };

  const handleCancelEdit = () => {
    setEditingPlatform(null);
  };

  const handleApprovePlatform = (platformId: string) => {
    setApprovedPlatforms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(platformId)) {
        newSet.delete(platformId);
      } else {
        newSet.add(platformId);
      }
      return newSet;
    });
  };

  const handleScheduleAll = () => {
    if (approvedPlatforms.size === 0) {
      toast.error("Por favor, aprove pelo menos uma plataforma");
      return;
    }

    toast.success(
      `${approvedPlatforms.size} posts agendados para publicação nos melhores horários`
    );
    // TODO: Implementar agendamento real
  };

  const hasAdaptations = Object.keys(adaptedContents).length > 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Adaptação em Lote</h1>
        <p className="text-gray-600">
          Crie um post e adapte automaticamente para múltiplas plataformas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda - Entrada */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
              <CardDescription>Defina o conteúdo e plataformas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seleção de Plataformas */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Plataformas</Label>
                <div className="space-y-2">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                      />
                      <label
                        htmlFor={platform.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {platform.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label htmlFor="image">Imagem (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  {imageFile && <span className="text-xs text-green-600">✓ Carregada</span>}
                </div>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                )}
              </div>

              {/* Texto */}
              <div className="space-y-2">
                <Label htmlFor="text">Texto do Post *</Label>
                <Textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escreva o texto principal do seu post..."
                  className="min-h-32 resize-none"
                />
                <p className="text-xs text-gray-500">{text.length} caracteres</p>
              </div>

              {/* Nicho */}
              <div className="space-y-2">
                <Label htmlFor="niche">Nicho (opcional)</Label>
                <Input
                  id="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Ex: e-commerce, educação, saúde"
                />
              </div>

              {/* Tom */}
              <div className="space-y-2">
                <Label htmlFor="tone">Tom de Voz</Label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="casual">Casual</option>
                  <option value="professional">Profissional</option>
                  <option value="funny">Engraçado</option>
                  <option value="inspirational">Inspirador</option>
                </select>
              </div>

              {/* Botão Adaptar */}
              <Button
                onClick={handleAdapt}
                disabled={isLoading || !text.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adaptando...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Adaptar Conteúdo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Preview */}
        <div className="lg:col-span-2">
          {hasAdaptations ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Prévia das Adaptações ({Object.keys(adaptedContents).length})
                </h2>
                <div className="text-sm text-gray-600">
                  Aprovados: {approvedPlatforms.size}/{Object.keys(adaptedContents).length}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {selectedPlatforms.map((platformId) => {
                  const platformData = platforms.find((p) => p.id === platformId);
                  const content = adaptedContents[platformId];

                  if (!platformData || !content) return null;

                  const platformWithSize = {
                    id: platformData.id,
                    name: platformData.name,
                    format: platformData.format,
                    imageSize: platformData.imageSize || { width: 1080, height: 1080 },
                  };

                  return (
                    <PlatformPreview
                      key={platformId}
                      platform={platformWithSize}
                      content={content}
                      isEditing={editingPlatform === platformId}
                      onEdit={handleEditPlatform}
                      onSave={handleSavePlatform}
                      onCancel={handleCancelEdit}
                      onApprove={handleApprovePlatform}
                      isApproved={approvedPlatforms.has(platformId)}
                    />
                  );
                })}
              </div>

              {/* Botão de Agendamento */}
              <Button
                onClick={handleScheduleAll}
                disabled={approvedPlatforms.size === 0}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Upload className="mr-2 h-4 w-4" />
                Agendar {approvedPlatforms.size} Posts
              </Button>
            </div>
          ) : (
            <Card className="flex items-center justify-center min-h-96">
              <CardContent className="text-center">
                <p className="text-gray-500">
                  Preencha os dados e clique em "Adaptar Conteúdo" para visualizar as prévia
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
