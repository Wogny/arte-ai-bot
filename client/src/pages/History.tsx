import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  History as HistoryIcon,
  Search,
  Heart,
  Copy,
  Trash2,
  RefreshCw,
  Image,
  MessageSquare,
  Star,
  Calendar,
  Loader2,
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function History() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Queries
  const { data: history, isLoading, refetch } = trpc.generationHistory.list.useQuery({
    type: activeTab as any,
    limit: 50,
    offset: 0,
  });
  const { data: favorites, refetch: refetchFavorites } = trpc.generationHistory.favorites.useQuery({
    type: activeTab as any,
  });
  const { data: stats } = trpc.generationHistory.stats.useQuery();

  // Mutations
  const toggleFavoriteMutation = trpc.generationHistory.toggleFavorite.useMutation({
    onSuccess: () => {
      refetch();
      refetchFavorites();
    },
  });

  const deleteMutation = trpc.generationHistory.delete.useMutation({
    onSuccess: () => {
      toast.success("Item removido do histórico!");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const handleToggleFavorite = (historyId: number, isFavorite: boolean) => {
    toggleFavoriteMutation.mutate({ historyId, isFavorite: !isFavorite });
  };

  const handleDelete = (historyId: number) => {
    if (confirm("Tem certeza que deseja remover este item do histórico?")) {
      deleteMutation.mutate({ historyId });
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copiado!");
  };

  const handleReuse = (item: any) => {
    if (item.type === "image") {
      navigate(`/create?prompt=${encodeURIComponent(item.prompt)}`);
    } else {
      navigate(`/captions?prompt=${encodeURIComponent(item.prompt)}`);
    }
    toast.success("Prompt carregado! Personalize e gere novamente.");
  };

  const filteredHistory = history?.filter((item: any) => {
    if (!searchQuery) return true;
    return item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <HistoryIcon className="w-8 h-8 text-cyan-400" />
              Histórico de Gerações
            </h1>
            <p className="text-gray-400 mt-1">
              Revise e reutilize seus prompts anteriores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white w-64"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Image className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.totalImages || 0}</p>
                  <p className="text-gray-400 text-sm">Imagens</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.totalCaptions || 0}</p>
                  <p className="text-gray-400 text-sm">Legendas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.totalFavorites || 0}</p>
                  <p className="text-gray-400 text-sm">Favoritos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.thisMonth || 0}</p>
                  <p className="text-gray-400 text-sm">Este mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
              Todos
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-white/10">
              <Image className="w-4 h-4 mr-2" />
              Imagens
            </TabsTrigger>
            <TabsTrigger value="caption" className="data-[state=active]:bg-white/10">
              <MessageSquare className="w-4 h-4 mr-2" />
              Legendas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : filteredHistory?.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <HistoryIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">
                    Nenhum histórico encontrado
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Comece a gerar imagens e legendas para ver seu histórico aqui
                  </p>
                  <Button 
                    onClick={() => navigate("/create")}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Criar Conteúdo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredHistory?.map((item: any) => (
                  <Card 
                    key={item.id}
                    className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon/Preview */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                          item.type === "image" 
                            ? "bg-cyan-500/20" 
                            : "bg-purple-500/20"
                        }`}>
                          {item.type === "image" ? (
                            item.result ? (
                              <img 
                                src={item.result} 
                                alt="" 
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <Image className="w-6 h-6 text-cyan-400" />
                            )
                          ) : (
                            <MessageSquare className="w-6 h-6 text-purple-400" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="secondary" 
                              className={`${
                                item.type === "image" 
                                  ? "bg-cyan-500/20 text-cyan-400" 
                                  : "bg-purple-500/20 text-purple-400"
                              }`}
                            >
                              {item.type === "image" ? "Imagem" : "Legenda"}
                            </Badge>
                            <span className="text-gray-500 text-sm">
                              {formatDate(item.createdAt)}
                            </span>
                            {item.isFavorite && (
                              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                            )}
                          </div>
                          <p className="text-white line-clamp-2">{item.prompt}</p>
                          {item.result && item.type === "caption" && (
                            <p className="text-gray-400 text-sm mt-1 line-clamp-1">
                              {item.result}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleFavorite(item.id, item.isFavorite)}
                            className="text-gray-400 hover:text-pink-400"
                          >
                            <Heart 
                              className={`w-4 h-4 ${item.isFavorite ? "fill-pink-400 text-pink-400" : ""}`} 
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyPrompt(item.prompt)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReuse(item)}
                            className="text-gray-400 hover:text-cyan-400"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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
                  Favorite seus melhores prompts para encontrá-los rapidamente! 
                  Use o botão de reutilizar para carregar o prompt diretamente 
                  na página de criação e fazer ajustes antes de gerar novamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
