import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, Eye, MousePointer, Users, DollarSign, Loader2, Upload } from "lucide-react";
import CampaignCSVUpload from "@/components/CampaignCSVUpload";
import CampaignFilters, { CampaignFilterState } from "@/components/CampaignFilters";
import TagSelector from "@/components/TagSelector";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

export default function Campaigns() {
  const [filters, setFilters] = useState<CampaignFilterState>({
    searchText: "",
    tags: [],
    platforms: [],
    dateRange: "all",
    performanceLevel: "all",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [impressions, setImpressions] = useState("");
  const [reach, setReach] = useState("");
  const [engagement, setEngagement] = useState("");
  const [clicks, setClicks] = useState("");
  const [conversions, setConversions] = useState("");
  const [spend, setSpend] = useState("");

  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery({});
  
  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campanha adicionada com sucesso!");
      utils.campaigns.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar campanha: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setPlatform("");
    setStartDate("");
    setEndDate("");
    setImpressions("");
    setReach("");
    setEngagement("");
    setClicks("");
    setConversions("");
    setSpend("");
  };

  const handleCreate = () => {
    if (!name.trim() || !platform || !startDate) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    const metrics: any = {};
    if (impressions) metrics.impressions = Number(impressions);
    if (reach) metrics.reach = Number(reach);
    if (engagement) metrics.engagement = Number(engagement);
    if (clicks) metrics.clicks = Number(clicks);
    if (conversions) metrics.conversions = Number(conversions);
    if (spend) metrics.spend = Number(spend);

    createMutation.mutate({
      name: name.trim(),
      platform,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
    });
  };

  const formatNumber = (num?: number) => {
    if (!num) return "-";
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  const formatCurrency = (num?: number) => {
    if (!num) return "-";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const filteredCampaigns = (campaigns || []).filter((campaign) => {
    if (filters.searchText && !campaign.name.toLowerCase().includes(filters.searchText.toLowerCase())) {
      return false;
    }
    if (filters.platforms.length > 0 && !filters.platforms.includes(campaign.platform)) {
      return false;
    }
    if (filters.dateRange !== "all") {
      const now = new Date();
      const daysAgo = filters.dateRange === "7days" ? 7 : filters.dateRange === "30days" ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      if (new Date(campaign.startDate) < cutoffDate) {
        return false;
      }
    }
    return true;
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Campanhas</h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe o desempenho das suas campanhas
            </p>
          </div>
          <div className="flex gap-2">
            <CampaignCSVUpload onSuccess={() => utils.campaigns.list.invalidate()} />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Dados de Campanha</DialogTitle>
                <DialogDescription>
                  Insira os dados históricos da sua campanha para análise
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Nome da Campanha *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Black Friday 2024"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Plataforma *</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="Facebook + Instagram">Facebook + Instagram</SelectItem>
                        <SelectItem value="Google Ads">Google Ads</SelectItem>
                        <SelectItem value="TikTok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Data de Início *</Label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Data de Término</Label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Métricas (opcional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="impressions">Impressões</Label>
                      <Input
                        id="impressions"
                        type="number"
                        placeholder="0"
                        value={impressions}
                        onChange={(e) => setImpressions(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reach">Alcance</Label>
                      <Input
                        id="reach"
                        type="number"
                        placeholder="0"
                        value={reach}
                        onChange={(e) => setReach(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="engagement">Engajamento</Label>
                      <Input
                        id="engagement"
                        type="number"
                        placeholder="0"
                        value={engagement}
                        onChange={(e) => setEngagement(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clicks">Cliques</Label>
                      <Input
                        id="clicks"
                        type="number"
                        placeholder="0"
                        value={clicks}
                        onChange={(e) => setClicks(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conversions">Conversões</Label>
                      <Input
                        id="conversions"
                        type="number"
                        placeholder="0"
                        value={conversions}
                        onChange={(e) => setConversions(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spend">Investimento (R$)</Label>
                      <Input
                        id="spend"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={spend}
                        onChange={(e) => setSpend(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Campanha"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <CampaignFilters onFilterChange={setFilters} initialFilters={filters} />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="space-y-6">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="border-2 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {campaign.platform} • {format(new Date(campaign.startDate), "dd/MM/yyyy", { locale: ptBR })}
                        {campaign.endDate && ` - ${format(new Date(campaign.endDate), "dd/MM/yyyy", { locale: ptBR })}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Eye className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Impressões</p>
                        <p className="text-lg font-semibold">{formatNumber(campaign.metrics?.impressions)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Alcance</p>
                        <p className="text-lg font-semibold">{formatNumber(campaign.metrics?.reach)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Engajamento</p>
                        <p className="text-lg font-semibold">{formatNumber(campaign.metrics?.engagement)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-orange-100">
                        <MousePointer className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cliques</p>
                        <p className="text-lg font-semibold">{formatNumber(campaign.metrics?.clicks)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-pink-100">
                        <TrendingUp className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Conversões</p>
                        <p className="text-lg font-semibold">{formatNumber(campaign.metrics?.conversions)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Investimento</p>
                        <p className="text-lg font-semibold">{formatCurrency(campaign.metrics?.spend)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 py-3 border-t bg-muted/30 flex justify-end">
                  <TagSelector campaignId={campaign.id} onTagsChange={() => utils.campaigns.list.invalidate()} />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma campanha registrada</h3>
              <p className="text-muted-foreground text-center mb-6">
                Adicione dados das suas campanhas para receber análises e recomendações
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
