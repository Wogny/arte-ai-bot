import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, Loader2, Clock, TrendingUp, Target, Zap, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Recommendations() {
  const [insights, setInsights] = useState<string>("");
  
  const utils = trpc.useUtils();
  const { data: recommendations, isLoading } = trpc.recommendations.list.useQuery({});
  const { data: campaigns } = trpc.campaigns.list.useQuery({});

  const generateMutation = trpc.recommendations.generateFromCampaigns.useMutation({
    onSuccess: (data) => {
      toast.success("Recomendações geradas com sucesso!");
      setInsights(data.insights);
      utils.recommendations.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao gerar recomendações: " + error.message);
    },
  });

  const markAsReadMutation = trpc.recommendations.markAsRead.useMutation({
    onSuccess: () => {
      utils.recommendations.list.invalidate();
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "posting_time":
        return <Clock className="w-5 h-5" />;
      case "product_boost":
        return <TrendingUp className="w-5 h-5" />;
      case "lead_generation":
        return <Target className="w-5 h-5" />;
      case "traffic_optimization":
        return <Zap className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      posting_time: "Horários de Postagem",
      product_boost: "Impulsionamento",
      lead_generation: "Geração de Leads",
      traffic_optimization: "Otimização de Tráfego",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      posting_time: "bg-blue-100 text-blue-700 border-blue-300",
      product_boost: "bg-purple-100 text-purple-700 border-purple-300",
      lead_generation: "bg-green-100 text-green-700 border-green-300",
      traffic_optimization: "bg-orange-100 text-orange-700 border-orange-300",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low":
        return "bg-slate-100 text-slate-700 border-slate-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    };
    return labels[priority] || priority;
  };

  const unreadRecommendations = recommendations?.filter(r => !r.isRead) || [];
  const readRecommendations = recommendations?.filter(r => r.isRead) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container py-8 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Recomendações Inteligentes</h1>
              <p className="text-muted-foreground text-lg">
                Insights e estratégias personalizadas com IA
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => generateMutation.mutate({})}
              disabled={generateMutation.isPending || !campaigns || campaigns.length === 0}
              className="shadow-lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar Recomendações
                </>
              )}
            </Button>
          </div>

          {(!campaigns || campaigns.length === 0) && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900">Adicione dados de campanhas</AlertTitle>
              <AlertDescription className="text-yellow-800">
                Para gerar recomendações personalizadas, adicione pelo menos uma campanha com dados de performance.
              </AlertDescription>
            </Alert>
          )}

          {insights && (
            <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Análise Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{insights}</Streamdown>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {unreadRecommendations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Novas Recomendações</h2>
                <div className="space-y-4">
                  {unreadRecommendations.map((rec) => (
                    <Card key={rec.id} className="border-2 border-primary/30 hover:shadow-xl transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${getTypeColor(rec.type)}`}>
                              {getTypeIcon(rec.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-xl">{rec.title}</CardTitle>
                                <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                                  {getPriorityLabel(rec.priority)}
                                </Badge>
                              </div>
                              <Badge variant="secondary" className="mb-3">
                                {getTypeLabel(rec.type)}
                              </Badge>
                              <CardDescription className="text-base leading-relaxed">
                                {rec.description}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate({ recommendationId: rec.id })}
                          disabled={markAsReadMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Marcar como Lida
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {readRecommendations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Recomendações Anteriores</h2>
                <div className="space-y-4">
                  {readRecommendations.map((rec) => (
                    <Card key={rec.id} className="border opacity-75 hover:opacity-100 transition-opacity">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(rec.type)}`}>
                            {getTypeIcon(rec.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{rec.title}</CardTitle>
                              <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                                {getPriorityLabel(rec.priority)}
                              </Badge>
                            </div>
                            <Badge variant="secondary" className="mb-2">
                              {getTypeLabel(rec.type)}
                            </Badge>
                            <CardDescription className="leading-relaxed">
                              {rec.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {recommendations && recommendations.length === 0 && (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Lightbulb className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma recomendação ainda</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Gere recomendações inteligentes baseadas nos dados das suas campanhas
                  </p>
                  <Button
                    onClick={() => generateMutation.mutate({})}
                    disabled={!campaigns || campaigns.length === 0}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Primeira Recomendação
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
