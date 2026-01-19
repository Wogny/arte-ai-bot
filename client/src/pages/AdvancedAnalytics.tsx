import React from "react";
import { BarChart3, TrendingUp, Users, Calendar, Download, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

export default function AdvancedAnalyticsPage() {
  const metrics = trpc.analytics.getOverviewMetrics.useQuery();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Analytics Avançado</h1>
          <p className="text-gray-500">Inteligência de dados para suas campanhas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filtrar</Button>
          <Button><Download className="h-4 w-4 mr-2" /> Exportar Relatório</Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-1">
          <CardContent className="pt-6 p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-2">
              <div>
                <p className="text-[10px] md:text-sm text-gray-500">Total de Alcance</p>
                <h3 className="text-lg md:text-2xl font-bold">124.5k</h3>
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1">
                <ArrowUpRight className="h-3 w-3 mr-1" /> 12%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Engajamento Médio</p>
                <h3 className="text-2xl font-bold">4.8%</h3>
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <ArrowUpRight className="h-3 w-3 mr-1" /> 5%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Cliques no Link</p>
                <h3 className="text-2xl font-bold">1,240</h3>
              </div>
              <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                <ArrowDownRight className="h-3 w-3 mr-1" /> 2%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Melhor Horário</p>
                <h3 className="text-2xl font-bold">18:00</h3>
              </div>
              <Badge variant="outline">Terças</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Tendência (Simulado) */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-5 w-5" /> Tendência de Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <div className="h-[200px] md:h-[300px] w-full bg-gray-50 rounded-lg flex items-end justify-around p-2 md:p-4 gap-1 md:gap-2">
              {metrics.data?.trends.map((t, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div 
                    className="bg-primary w-full rounded-t-sm transition-all hover:opacity-80" 
                    style={{ height: `${(t.engagement / 1000) * 100}%`, minHeight: '10%' }}
                  ></div>
                  <span className="text-[10px] text-gray-400 rotate-45 mt-2">{t.date.split('/')[0]}/{t.date.split('/')[1]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Plataforma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {metrics.data && Object.entries(metrics.data.platformBreakdown).map(([platform, count]) => (
              <div key={platform} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{platform}</span>
                  <span className="font-bold">{count} posts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(count / metrics.data!.totalPosts) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Insights de IA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Users className="h-5 w-5" /> Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Público-Alvo</h4>
              <p className="text-xs text-gray-600">Seu conteúdo performa 25% melhor com o público feminino entre 25-34 anos.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Melhor Formato</h4>
              <p className="text-xs text-gray-600">Vídeos curtos (Reels/TikTok) geram 3x mais compartilhamentos que imagens estáticas.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Sugestão de Conteúdo</h4>
              <p className="text-xs text-gray-600">Posts com tom "Inspiracional" têm a menor taxa de rejeição no seu workspace.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
