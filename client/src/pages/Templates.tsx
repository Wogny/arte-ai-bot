import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  LayoutTemplate,
  Search,
  Filter,
  Heart,
  Copy,
  Sparkles,
  Instagram,
  Linkedin,
  Facebook,
  ChevronRight,
  Star,
  TrendingUp,
  Loader2,
  X
} from "lucide-react";

// Ícone do TikTok
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
  instagram: <Instagram className="w-4 h-4" />,
  tiktok: <TikTokIcon className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  twitter: <TwitterIcon className="w-4 h-4" />,
};

const visualStyleColors: Record<string, string> = {
  colorido: "from-pink-500 to-orange-500",
  minimalista: "from-gray-400 to-gray-600",
  moderno: "from-cyan-500 to-blue-500",
  artistico: "from-purple-500 to-pink-500",
  corporativo: "from-blue-600 to-blue-800",
};

export default function Templates() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const { data: filters } = trpc.postTemplates.getFilters.useQuery();
  const { data: templates, isLoading } = trpc.postTemplates.list.useQuery({
    niche: selectedNiche as any,
    category: selectedCategory as any,
    platform: selectedPlatform as any,
    limit: 50,
  });
  const { data: favorites, refetch: refetchFavorites } = trpc.postTemplates.favorites.useQuery();

  // Mutations
  const toggleFavoriteMutation = trpc.postTemplates.toggleFavorite.useMutation({
    onSuccess: () => {
      refetchFavorites();
    },
  });

  const handleToggleFavorite = (templateId: number, isFavorite: boolean) => {
    toggleFavoriteMutation.mutate({ templateId, isFavorite: !isFavorite });
  };

  const handleUseTemplate = (template: any) => {
    // Navegar para página de criação com o template
    navigate(`/create?template=${template.id}`);
    toast.success("Template carregado! Personalize e gere sua arte.");
  };

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast.success("Legenda copiada!");
  };

  const isFavorite = (templateId: number) => {
    return favorites?.some((f: any) => f.templateId === templateId);
  };

  const filteredTemplates = templates?.filter((t: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.niche?.toLowerCase().includes(query)
    );
  });

  const clearFilters = () => {
    setSelectedNiche(null);
    setSelectedCategory(null);
    setSelectedPlatform(null);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedNiche || selectedCategory || selectedPlatform || searchQuery;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <LayoutTemplate className="w-8 h-8 text-cyan-400" />
              Modelos de Postagens
            </h1>
            <p className="text-gray-400 mt-1">
              Templates prontos para acelerar sua criação de conteúdo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white w-64"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-white/10 text-white hover:bg-white/10 ${showFilters ? "bg-white/10" : ""}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge className="ml-2 bg-cyan-500">
                  {[selectedNiche, selectedCategory, selectedPlatform].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Filtrar por:</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar filtros
                  </Button>
                )}
              </div>
              
              {/* Nichos */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Nicho:</p>
                <div className="flex flex-wrap gap-2">
                  {filters?.niches.map((niche: any) => (
                    <Button
                      key={niche.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedNiche(selectedNiche === niche.id ? null : niche.id)}
                      className={`border-white/10 ${
                        selectedNiche === niche.id 
                          ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" 
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-1">{niche.icon}</span>
                      {niche.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Categorias */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Categoria:</p>
                <div className="flex flex-wrap gap-2">
                  {filters?.categories.map((cat: any) => (
                    <Button
                      key={cat.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      className={`border-white/10 ${
                        selectedCategory === cat.id 
                          ? "bg-purple-500/20 text-purple-400 border-purple-500/50" 
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-1">{cat.icon}</span>
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Plataformas */}
              <div>
                <p className="text-gray-400 text-sm mb-2">Plataforma:</p>
                <div className="flex flex-wrap gap-2">
                  {filters?.platforms.map((platform: any) => (
                    <Button
                      key={platform.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPlatform(selectedPlatform === platform.id ? null : platform.id)}
                      className={`border-white/10 ${
                        selectedPlatform === platform.id 
                          ? "bg-pink-500/20 text-pink-400 border-pink-500/50" 
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {platformIcons[platform.id]}
                      <span className="ml-1">{platform.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filteredTemplates?.length === 0 ? (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <LayoutTemplate className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">
                Nenhum template encontrado
              </h3>
              <p className="text-gray-400 mb-4">
                Tente ajustar os filtros ou buscar por outro termo
              </p>
              <Button onClick={clearFilters} className="bg-cyan-500 hover:bg-cyan-600">
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates?.map((template: any) => (
              <Card 
                key={template.id}
                className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden hover:bg-white/10 transition-all duration-300 group"
              >
                {/* Visual Style Gradient */}
                <div className={`h-24 bg-gradient-to-r ${visualStyleColors[template.visualStyle] || "from-gray-500 to-gray-700"} relative`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <Badge className="bg-black/50 text-white">
                      {platformIcons[template.platform]}
                      <span className="ml-1 capitalize">{template.platform}</span>
                    </Badge>
                    <Badge className="bg-black/50 text-white capitalize">
                      {template.contentType}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleFavorite(template.id, isFavorite(template.id) || false)}
                    className="absolute top-2 right-2 text-white hover:bg-white/20"
                  >
                    <Heart 
                      className={`w-5 h-5 ${isFavorite(template.id) ? "fill-red-500 text-red-500" : ""}`} 
                    />
                  </Button>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-gray-400 line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {filters?.niches.find((n: any) => n.id === template.niche) && (
                      <Badge variant="secondary" className="bg-white/10 text-gray-300 text-xs">
                        {filters.niches.find((n: any) => n.id === template.niche)?.icon}{" "}
                        {filters.niches.find((n: any) => n.id === template.niche)?.name}
                      </Badge>
                    )}
                    {filters?.categories.find((c: any) => c.id === template.category) && (
                      <Badge variant="secondary" className="bg-white/10 text-gray-300 text-xs">
                        {filters.categories.find((c: any) => c.id === template.category)?.icon}{" "}
                        {filters.categories.find((c: any) => c.id === template.category)?.name}
                      </Badge>
                    )}
                  </div>

                  {/* Preview da Legenda */}
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-gray-300 text-sm line-clamp-3 whitespace-pre-line">
                      {template.captionTemplate}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Usar Template
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyCaption(template.captionTemplate)}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dica */}
        <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Dica Pro</h3>
                <p className="text-gray-300 text-sm">
                  Personalize os templates com sua identidade visual! Após selecionar um template, 
                  você pode editar o prompt e a legenda para combinar com sua marca. 
                  Use os hashtags sugeridos para aumentar seu alcance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
