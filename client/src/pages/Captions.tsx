import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Hash, 
  Heart, 
  Clock, 
  Instagram, 
  Loader2,
  Wand2,
  MessageSquare,
  Star,
  Trash2
} from "lucide-react";

// Ícones de plataforma
const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  tiktok: <span className="text-sm font-bold">TT</span>,
  linkedin: <span className="text-sm font-bold">in</span>,
  facebook: <span className="text-sm font-bold">f</span>,
  twitter: <span className="text-sm font-bold">X</span>,
};

// Labels em português
const toneLabels: Record<string, string> = {
  formal: "Formal",
  casual: "Casual",
  divertido: "Divertido",
  inspirador: "Inspirador",
  profissional: "Profissional",
  urgente: "Urgente",
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  twitter: "Twitter/X",
};

const nicheLabels: Record<string, string> = {
  fitness: "Fitness",
  moda: "Moda",
  gastronomia: "Gastronomia",
  tecnologia: "Tecnologia",
  beleza: "Beleza",
  viagem: "Viagem",
  educacao: "Educação",
  negocios: "Negócios",
  saude: "Saúde",
  lifestyle: "Lifestyle",
  pets: "Pets",
  arte: "Arte",
  musica: "Música",
  esportes: "Esportes",
};

export default function Captions() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<string>("casual");
  const [platform, setPlatform] = useState<string>("instagram");
  const [niche, setNiche] = useState<string>("");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [activeTab, setActiveTab] = useState("generate");

  // Queries
  const { data: history, refetch: refetchHistory } = trpc.captions.history.useQuery({ limit: 20 });
  const { data: favorites, refetch: refetchFavorites } = trpc.captions.favorites.useQuery();

  // Mutations
  const generateMutation = trpc.captions.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedCaption(data.caption);
      toast.success("Legenda gerada com sucesso!");
      refetchHistory();
    },
    onError: (error) => {
      toast.error("Erro ao gerar legenda: " + error.message);
    },
  });

  const generateVariationsMutation = trpc.captions.generateVariations.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.variations.length} variações geradas!`);
    },
    onError: (error) => {
      toast.error("Erro ao gerar variações: " + error.message);
    },
  });

  const generateHashtagsMutation = trpc.captions.generateHashtags.useMutation({
    onSuccess: () => {
      toast.success("Hashtags geradas!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar hashtags: " + error.message);
    },
  });

  const favoriteMutation = trpc.captions.favorite.useMutation({
    onSuccess: () => {
      refetchHistory();
      refetchFavorites();
      toast.success("Atualizado!");
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Digite o tema do post");
      return;
    }
    generateMutation.mutate({
      topic,
      tone: tone as any,
      platform: platform as any,
      niche: niche as any || undefined,
      includeHashtags,
      includeEmojis,
      includeCTA,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const handleGenerateVariations = () => {
    if (!generatedCaption) {
      toast.error("Gere uma legenda primeiro");
      return;
    }
    generateVariationsMutation.mutate({
      originalCaption: generatedCaption,
      platform: platform as any,
      count: 3,
    });
  };

  const handleGenerateHashtags = () => {
    if (!topic.trim()) {
      toast.error("Digite o tema primeiro");
      return;
    }
    generateHashtagsMutation.mutate({
      topic,
      platform: platform as any,
      niche: niche as any || undefined,
      count: 15,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Wand2 className="w-8 h-8 text-purple-400" />
              Gerador de Legendas
            </h1>
            <p className="text-gray-400 mt-1">
              Crie legendas envolventes com inteligência artificial
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="generate" className="data-[state=active]:bg-purple-500/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/20">
              <Clock className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-purple-500/20">
              <Heart className="w-4 h-4 mr-2" />
              Favoritos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Gerar */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configurações */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    Configurações
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Personalize sua legenda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tema */}
                  <div className="space-y-2">
                    <Label className="text-white">Tema do Post *</Label>
                    <Textarea
                      placeholder="Ex: Lançamento de nova coleção de verão com peças leves e coloridas..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
                    />
                  </div>

                  {/* Plataforma e Tom */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Plataforma</Label>
                      <Select value={platform} onValueChange={setPlatform}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(platformLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                {platformIcons[key]}
                                {label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Tom</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(toneLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Nicho */}
                  <div className="space-y-2">
                    <Label className="text-white">Nicho (opcional)</Label>
                    <Select value={niche} onValueChange={setNiche}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Selecione um nicho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {Object.entries(nicheLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Opções */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white flex items-center gap-2">
                        <Hash className="w-4 h-4 text-cyan-400" />
                        Incluir Hashtags
                      </Label>
                      <Switch
                        checked={includeHashtags}
                        onCheckedChange={setIncludeHashtags}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">😊 Incluir Emojis</Label>
                      <Switch
                        checked={includeEmojis}
                        onCheckedChange={setIncludeEmojis}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">📢 Incluir CTA</Label>
                      <Switch
                        checked={includeCTA}
                        onCheckedChange={setIncludeCTA}
                      />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending || !topic.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {generateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Gerar Legenda
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerateHashtags}
                      disabled={generateHashtagsMutation.isPending || !topic.trim()}
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      {generateHashtagsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Hash className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Resultado */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-400" />
                    Resultado
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Sua legenda gerada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedCaption ? (
                    <>
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-[200px]">
                        <p className="text-white whitespace-pre-wrap">{generatedCaption}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          {generatedCaption.length} caracteres
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(generatedCaption)}
                            className="border-white/10 text-white hover:bg-white/10"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateVariations}
                            disabled={generateVariationsMutation.isPending}
                            className="border-white/10 text-white hover:bg-white/10"
                          >
                            {generateVariationsMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Variações
                          </Button>
                        </div>
                      </div>

                      {/* Variações */}
                      {generateVariationsMutation.data && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                          <h4 className="text-white font-medium">Variações:</h4>
                          {generateVariationsMutation.data.variations.map((variation: string, index: number) => (
                            <div
                              key={index}
                              className="bg-white/5 rounded-lg p-3 border border-white/10"
                            >
                              <p className="text-gray-300 text-sm whitespace-pre-wrap">{variation}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(variation)}
                                className="mt-2 text-gray-400 hover:text-white"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copiar
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Hashtags */}
                      {generateHashtagsMutation.data && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                          <h4 className="text-white font-medium">Hashtags Sugeridas:</h4>
                          <div className="flex flex-wrap gap-2">
                            {generateHashtagsMutation.data.hashtags.map((tag: string, index: number) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-cyan-500/20 text-cyan-300 cursor-pointer hover:bg-cyan-500/30"
                                onClick={() => handleCopy(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-500">
                      <Wand2 className="w-12 h-12 mb-4 opacity-50" />
                      <p>Sua legenda aparecerá aqui</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Legendas</CardTitle>
                <CardDescription className="text-gray-400">
                  Suas últimas legendas geradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {history && history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-cyan-400 border-cyan-400/50">
                              {platformLabels[item.platform] || item.platform}
                            </Badge>
                            <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                              {toneLabels[item.tone] || item.tone}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => favoriteMutation.mutate({ 
                                captionId: item.id, 
                                isFavorite: !item.isFavorite 
                              })}
                              className={item.isFavorite ? "text-pink-400" : "text-gray-400"}
                            >
                              <Heart className={`w-4 h-4 ${item.isFavorite ? "fill-current" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(item.generatedCaption)}
                              className="text-gray-400 hover:text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">Tema: {item.topic}</p>
                        <p className="text-white whitespace-pre-wrap">{item.generatedCaption}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma legenda gerada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Favoritos */}
          <TabsContent value="favorites" className="space-y-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Legendas Favoritas
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Suas legendas salvas para reutilização
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favorites && favorites.length > 0 ? (
                  <div className="space-y-4">
                    {favorites.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-cyan-400 border-cyan-400/50">
                              {platformLabels[item.platform] || item.platform}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => favoriteMutation.mutate({ 
                                captionId: item.id, 
                                isFavorite: false 
                              })}
                              className="text-pink-400"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(item.generatedCaption)}
                              className="text-gray-400 hover:text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-white whitespace-pre-wrap">{item.generatedCaption}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma legenda favorita</p>
                    <p className="text-sm mt-1">Clique no ❤️ para salvar legendas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
