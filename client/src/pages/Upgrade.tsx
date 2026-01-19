import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Crown,
  Zap,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Image,
  MessageSquare,
  Calendar,
  Share2,
  BarChart3,
  Users,
  Headphones,
  Loader2
} from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "STARTER",
    price: 49,
    priceId: "price_starter",
    color: "from-cyan-500 to-blue-500",
    features: [
      { name: "50 imagens/mês", included: true },
      { name: "100 legendas/mês", included: true },
      { name: "30 posts agendados", included: true },
      { name: "2 plataformas", included: true },
      { name: "Templates", included: true },
      { name: "Analytics básico", included: true },
      { name: "Suporte por email", included: true },
      { name: "1 membro", included: true },
    ],
  },
  {
    id: "professional",
    name: "PROFESSIONAL",
    price: 149,
    priceId: "price_professional",
    popular: true,
    color: "from-pink-500 to-purple-500",
    features: [
      { name: "200 imagens/mês", included: true },
      { name: "500 legendas/mês", included: true },
      { name: "100 posts agendados", included: true },
      { name: "5 plataformas", included: true },
      { name: "Templates", included: true },
      { name: "Analytics avançado", included: true },
      { name: "Suporte prioritário", included: true },
      { name: "5 membros", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "ENTERPRISE",
    price: 499,
    priceId: "price_enterprise",
    color: "from-purple-500 to-indigo-500",
    features: [
      { name: "Imagens ilimitadas", included: true },
      { name: "Legendas ilimitadas", included: true },
      { name: "Posts ilimitados", included: true },
      { name: "Plataformas ilimitadas", included: true },
      { name: "Templates", included: true },
      { name: "Analytics avançado", included: true },
      { name: "Suporte dedicado", included: true },
      { name: "Membros ilimitados", included: true },
    ],
  },
];

export default function Upgrade() {
  const [, navigate] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Query para obter uso atual
  const { data: usage } = trpc.billing.getUsage.useQuery();
  const { data: currentPlan } = trpc.billing.getCurrentPlan.useQuery();

  // Usar Mercado Pago em vez do Stripe
  const handleUpgrade = (planId: string) => {
    setLoadingPlan(planId);
    toast.info("Redirecionando para pagamento com Mercado Pago...");
    setTimeout(() => setLoadingPlan(null), 1000);
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // ilimitado
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white mb-4">
            <Crown className="w-4 h-4 mr-1" />
            Upgrade seu Plano
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-2">
            Desbloqueie Todo o Potencial
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para suas necessidades e comece a criar 
            conteúdo incrível sem limitações.
          </p>
        </div>

        {/* Uso Atual */}
        {usage && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Seu Uso Este Mês
              </CardTitle>
              <CardDescription className="text-gray-400">
                Plano atual: <span className="text-white font-medium">{currentPlan?.name || "Gratuito"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Image className="w-4 h-4" /> Imagens
                    </span>
                    <span className="text-white">
                      {usage.images.current}/{usage.images.limit === -1 ? "∞" : usage.images.limit}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.images.current, usage.images.limit)} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" /> Legendas
                    </span>
                    <span className="text-white">
                      {usage.captions.current}/{usage.captions.limit === -1 ? "∞" : usage.captions.limit}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.captions.current, usage.captions.limit)} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Agendados
                    </span>
                    <span className="text-white">
                      {usage.scheduled.current}/{usage.scheduled.limit === -1 ? "∞" : usage.scheduled.limit}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.scheduled.current, usage.scheduled.limit)} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Share2 className="w-4 h-4" /> Plataformas
                    </span>
                    <span className="text-white">
                      {usage.platforms.current}/{usage.platforms.limit === -1 ? "∞" : usage.platforms.limit}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.platforms.current, usage.platforms.limit)} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planos */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular ? "ring-2 ring-pink-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MAIS POPULAR
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">R${plan.price}</span>
                  <span className="text-gray-400">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-500 shrink-0" />
                      )}
                      <span className={feature.included ? "text-gray-300" : "text-gray-500"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90`}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={currentPlan?.id === plan.id}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : currentPlan?.id === plan.id ? (
                    "Plano Atual"
                  ) : (
                    <>
                      Escolher Plano
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparação de Features */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Comparação de Recursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400">Recurso</th>
                    <th className="text-center py-3 px-4 text-gray-400">Gratuito</th>
                    <th className="text-center py-3 px-4 text-cyan-400">Starter</th>
                    <th className="text-center py-3 px-4 text-pink-400">Professional</th>
                    <th className="text-center py-3 px-4 text-purple-400">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-300 flex items-center gap-2">
                      <Image className="w-4 h-4" /> Imagens/mês
                    </td>
                    <td className="text-center py-3 px-4 text-white">5</td>
                    <td className="text-center py-3 px-4 text-white">50</td>
                    <td className="text-center py-3 px-4 text-white">200</td>
                    <td className="text-center py-3 px-4 text-white">∞</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-300 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Legendas/mês
                    </td>
                    <td className="text-center py-3 px-4 text-white">10</td>
                    <td className="text-center py-3 px-4 text-white">100</td>
                    <td className="text-center py-3 px-4 text-white">500</td>
                    <td className="text-center py-3 px-4 text-white">∞</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Posts agendados
                    </td>
                    <td className="text-center py-3 px-4 text-white">5</td>
                    <td className="text-center py-3 px-4 text-white">30</td>
                    <td className="text-center py-3 px-4 text-white">100</td>
                    <td className="text-center py-3 px-4 text-white">∞</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-300 flex items-center gap-2">
                      <Share2 className="w-4 h-4" /> Plataformas
                    </td>
                    <td className="text-center py-3 px-4 text-white">1</td>
                    <td className="text-center py-3 px-4 text-white">2</td>
                    <td className="text-center py-3 px-4 text-white">5</td>
                    <td className="text-center py-3 px-4 text-white">∞</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Templates
                    </td>
                    <td className="text-center py-3 px-4"><X className="w-4 h-4 text-gray-500 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-300 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Analytics
                    </td>
                    <td className="text-center py-3 px-4"><X className="w-4 h-4 text-gray-500 mx-auto" /></td>
                    <td className="text-center py-3 px-4 text-white">Básico</td>
                    <td className="text-center py-3 px-4 text-white">Avançado</td>
                    <td className="text-center py-3 px-4 text-white">Avançado</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Membros
                    </td>
                    <td className="text-center py-3 px-4 text-white">1</td>
                    <td className="text-center py-3 px-4 text-white">1</td>
                    <td className="text-center py-3 px-4 text-white">5</td>
                    <td className="text-center py-3 px-4 text-white">∞</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-300 flex items-center gap-2">
                      <Headphones className="w-4 h-4" /> Suporte
                    </td>
                    <td className="text-center py-3 px-4 text-white">Comunidade</td>
                    <td className="text-center py-3 px-4 text-white">Email</td>
                    <td className="text-center py-3 px-4 text-white">Prioritário</td>
                    <td className="text-center py-3 px-4 text-white">Dedicado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-1">Posso cancelar a qualquer momento?</h4>
              <p className="text-gray-400 text-sm">
                Sim! Você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Como funciona o período de teste?</h4>
              <p className="text-gray-400 text-sm">
                Oferecemos 7 dias de teste grátis em todos os planos. Você só será cobrado após o período de teste.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Posso mudar de plano depois?</h4>
              <p className="text-gray-400 text-sm">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. A diferença será calculada proporcionalmente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA Final */}
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            Ainda tem dúvidas? Entre em contato com nosso suporte.
          </p>
          <Button 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => navigate("/support")}
          >
            <Headphones className="w-4 h-4 mr-2" />
            Falar com Suporte
          </Button>
        </div>
      </div>
    </div>
  );
}
