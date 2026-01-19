import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Plus, Trash2, TrendingUp, Users, MessageCircle, Clock } from "lucide-react";

export default function CompetitorAnalysis() {
  const [selectedCompetitor, setSelectedCompetitor] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [competitor2Id, setCompetitor2Id] = useState<number | null>(null);

  // Queries
  const { data: competitors, isLoading: loadingCompetitors } = trpc.competitors.listCompetitors.useQuery({
    active: true,
  });

  const { data: competitorDetails } = trpc.competitors.getCompetitorDetails.useQuery(
    { competitorId: selectedCompetitor! },
    { enabled: !!selectedCompetitor }
  );

  const { data: metricsHistory } = trpc.competitors.getCompetitorMetricsHistory.useQuery(
    { competitorId: selectedCompetitor!, days: 30 },
    { enabled: !!selectedCompetitor }
  );

  const { data: hashtags } = trpc.competitors.getCompetitorHashtags.useQuery(
    { competitorId: selectedCompetitor!, limit: 15 },
    { enabled: !!selectedCompetitor }
  );

  const { data: postingSchedule } = trpc.competitors.getPostingScheduleAnalysis.useQuery(
    { competitorId: selectedCompetitor! },
    { enabled: !!selectedCompetitor }
  );

  const { data: comparison } = trpc.competitors.compareCompetitors.useQuery(
    { competitorId1: selectedCompetitor!, competitorId2: competitor2Id!, days: 30 },
    { enabled: !!selectedCompetitor && !!competitor2Id && compareMode }
  );

  // Mutations
  const addCompetitorMutation = trpc.competitors.addCompetitor.useMutation();

  const deleteCompetitorMutation = trpc.competitors.deleteCompetitor.useMutation({
    onSuccess: () => {
      setSelectedCompetitor(null);
    },
  });

  const handleAddCompetitor = () => {
    addCompetitorMutation.mutate({
      name: "Novo Concorrente",
      platform: "instagram",
      accountId: "competitor_account",
      description: "Concorrente para análise",
    });
  };

  const handleDeleteCompetitor = (id: number) => {
    if (confirm("Tem certeza que deseja remover este concorrente?")) {
      deleteCompetitorMutation.mutate({ competitorId: id });
    }
  };

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Análise de Concorrentes</h1>
          <p className="text-muted-foreground mt-2">Monitore e compare o desempenho dos seus concorrentes</p>
        </div>
        <Button onClick={handleAddCompetitor} disabled={addCompetitorMutation.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Concorrente
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar - Lista de Concorrentes */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Concorrentes</CardTitle>
              <CardDescription>{competitors?.length || 0} monitorados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingCompetitors ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : competitors && competitors.length > 0 ? (
                competitors.map((comp) => (
                  <div
                    key={comp.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCompetitor === comp.id
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                    onClick={() => setSelectedCompetitor(comp.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{comp.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{comp.platform}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompetitor(comp.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum concorrente adicionado</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {selectedCompetitor && competitorDetails ? (
            <>
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Seguidores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{competitorDetails.metrics?.followers || 0}</p>
                    <p className="text-xs text-green-600 mt-1">
                      +{String(competitorDetails.metrics?.followersGrowth || 0)} este mês
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{competitorDetails.metrics?.postsCount || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Engajamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{competitorDetails.metrics?.totalEngagement || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Engajamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{(Number(competitorDetails.metrics?.averageEngagementRate) || 0).toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Média</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="metrics">Métricas</TabsTrigger>
                  <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
                  <TabsTrigger value="schedule">Horários</TabsTrigger>
                  <TabsTrigger value="compare">Comparar</TabsTrigger>
                </TabsList>

                {/* Aba Métricas */}
                <TabsContent value="metrics" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tendência de Engajamento (30 dias)</CardTitle>
                      <CardDescription>Evolução do engajamento ao longo do tempo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {metricsHistory && metricsHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={metricsHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="totalEngagement" stroke="#3b82f6" name="Engajamento" />
                            <Line type="monotone" dataKey="totalImpressions" stroke="#10b981" name="Impressões" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Sem dados disponíveis</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Posts Recentes</CardTitle>
                      <CardDescription>Últimos posts com melhor desempenho</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {competitorDetails.recentPosts && competitorDetails.recentPosts.length > 0 ? (
                          competitorDetails.recentPosts.map((post) => (
                            <div key={post.id} className="border-l-4 border-blue-500 pl-4 py-2">
                              <p className="text-sm font-medium line-clamp-2">{post.caption}</p>
                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  {post.likes} likes
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {post.comments} comentários
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {post.engagement} engajamento
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">Sem posts disponíveis</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Hashtags */}
                <TabsContent value="hashtags" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Hashtags Mais Usadas</CardTitle>
                      <CardDescription>Top 15 hashtags por frequência</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hashtags && hashtags.length > 0 ? (
                        <div className="space-y-2">
                          {hashtags.map((tag, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium text-sm">{tag.hashtag}</span>
                              <div className="flex gap-4 text-xs">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {tag.frequency}x
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {String(Math.round(parseFloat(String(tag.engagementAverage))))} eng
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Sem dados disponíveis</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Horários */}
                <TabsContent value="schedule" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Análise de Horários de Postagem</CardTitle>
                      <CardDescription>Melhor hora para postar por dia da semana</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {postingSchedule && Object.keys(postingSchedule).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(postingSchedule).map(([day, hours]) => (
                            <div key={day} className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-3">{day}</h4>
                              <div className="space-y-2">
                                {(hours as any[]).map((h, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      {String(h.hour).padStart(2, "0")}:00
                                    </span>
                                    <span className="text-muted-foreground">{h.postsCount} posts</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Sem dados disponíveis</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Comparar */}
                <TabsContent value="compare" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Comparar com Concorrente</CardTitle>
                      <CardDescription>Selecione outro concorrente para comparação</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <select
                          value={competitor2Id || ""}
                          onChange={(e) => setCompetitor2Id(Number(e.target.value) || null)}
                          className="flex-1 px-3 py-2 border rounded-lg"
                        >
                          <option value="">Selecione um concorrente</option>
                          {competitors?.filter((c) => c.id !== selectedCompetitor).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          onClick={() => setCompareMode(!compareMode)}
                          variant={compareMode ? "default" : "outline"}
                        >
                          {compareMode ? "Comparando" : "Comparar"}
                        </Button>
                      </div>

                      {compareMode && comparison && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {/* Competitor 1 */}
                          <div className="border rounded-lg p-4 bg-blue-50">
                            <h4 className="font-semibold mb-4">{comparison.competitor1.name}</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Impressões:</span>
                                <span className="font-semibold">{comparison.competitor1.metrics.totalImpressions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Alcance:</span>
                                <span className="font-semibold">{comparison.competitor1.metrics.totalReach}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Engajamento:</span>
                                <span className="font-semibold">{comparison.competitor1.metrics.totalEngagement}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Taxa Engajamento:</span>
                                <span className="font-semibold">{comparison.competitor1.metrics.avgEngagementRate.toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Competitor 2 */}
                          <div className="border rounded-lg p-4 bg-red-50">
                            <h4 className="font-semibold mb-4">{comparison.competitor2.name}</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Impressões:</span>
                                <span className="font-semibold">{comparison.competitor2.metrics.totalImpressions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Alcance:</span>
                                <span className="font-semibold">{comparison.competitor2.metrics.totalReach}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Engajamento:</span>
                                <span className="font-semibold">{comparison.competitor2.metrics.totalEngagement}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Taxa Engajamento:</span>
                                <span className="font-semibold">{comparison.competitor2.metrics.avgEngagementRate.toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-semibold text-muted-foreground">Selecione um concorrente para começar</p>
                <p className="text-sm text-muted-foreground mt-2">Clique em um concorrente na lista ao lado</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
