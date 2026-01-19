import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import TiltCard from "@/components/TiltCard";
import { MercadoPagoPaymentForm } from "@/components/MercadoPagoPaymentForm";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const plans = [
    {
      name: "STARTER",
      price: billingPeriod === "monthly" ? 49 : 588,
      description: "Para começar",
      features: [
        "50 Posts/mês",
        "Instagram + TikTok",
        "Analytics Básico",
        "Agendamento Simples",
      ],
      color: "cyan",
      popular: false,
      planId: 1,
    },
    {
      name: "PROFESSIONAL",
      price: billingPeriod === "monthly" ? 149 : 1788,
      description: "Mais popular",
      features: [
        "500 Posts/mês",
        "Todas as Redes (IG, TK, FB, LI, TW)",
        "Analytics Avançado",
        "Equipe até 5",
        "Biblioteca de Mídia",
        "Suporte Prioritário",
      ],
      color: "pink",
      popular: true,
      planId: 2,
    },
    {
      name: "ENTERPRISE",
      price: billingPeriod === "monthly" ? 499 : 5988,
      description: "Solução Completa",
      features: [
        "Posts Ilimitados",
        "Todas as Redes + API",
        "Analytics em Tempo Real",
        "Equipe Ilimitada",
        "Integrações Customizadas",
        "Suporte 24/7",
        "Consultoria Estratégica",
      ],
      color: "purple",
      popular: false,
      planId: 3,
    },
  ];

  const handleSelectPlan = (planId: number) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const selectedPlanData = plans.find(p => p.planId === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Planos Simples e Transparentes
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Escolha o plano perfeito para sua estratégia de marketing
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-lg font-semibold ${billingPeriod === "monthly" ? "text-white" : "text-slate-400"}`}>
              Mensal
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              style={{
                backgroundColor: billingPeriod === "annual" ? "rgb(168, 85, 247)" : "rgb(55, 65, 81)",
              }}
            >
              <span
                className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform"
                style={{
                  transform: billingPeriod === "annual" ? "translateX(1.5rem)" : "translateX(0.25rem)",
                }}
              />
            </button>
            <span className={`text-lg font-semibold ${billingPeriod === "annual" ? "text-white" : "text-slate-400"}`}>
              Anual
              <span className="ml-2 inline-block bg-gradient-to-r from-purple-400 to-pink-400 text-xs font-bold text-white px-3 py-1 rounded-full">
                Economize 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <TiltCard key={index} intensity={0.5}>
              <div
                className={`relative h-full rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:shadow-2xl p-8 flex flex-col ${
                  plan.popular
                    ? "bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-500/50 ring-2 ring-pink-500/50 scale-105"
                    : "bg-slate-800/40 border-slate-700/50 hover:border-purple-500/50"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MAIS POPULAR
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      R$ {plan.price}
                    </span>
                    <span className="text-slate-400">/mês</span>
                  </div>
                  {billingPeriod === "annual" && (
                    <p className="text-xs text-slate-500 mt-2">
                      Faturado anualmente
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.planId)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold mb-8 transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg hover:shadow-pink-500/50"
                      : "bg-slate-700/50 text-white hover:bg-slate-600/50 border border-slate-600/50"
                  }`}
                >
                  Começar Agora
                </button>

                {/* Features */}
                <div className="space-y-4 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Trial Badge */}
                <div className="mt-8 pt-8 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400 text-center">
                    ✨ 7 dias grátis • Sem cartão necessário
                  </p>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Perguntas Frequentes</h2>
          <div className="space-y-6">
            {[
              {
                q: "Posso cancelar minha assinatura a qualquer momento?",
                a: "Sim! Você pode cancelar sua assinatura a qualquer momento sem penalidades. Você terá acesso até o final do período de faturamento.",
              },
              {
                q: "Qual é a política de reembolso?",
                a: "Oferecemos reembolso total nos primeiros 7 dias. Após esse período, não há reembolsos, mas você pode cancelar a qualquer momento.",
              },
              {
                q: "Posso mudar de plano depois?",
                a: "Claro! Você pode fazer upgrade ou downgrade de seu plano a qualquer momento. A mudança será refletida no seu próximo ciclo de faturamento.",
              },
              {
                q: "Vocês oferecem desconto para pagamento anual?",
                a: "Sim! Pagando anualmente, você economiza 20% em comparação com o pagamento mensal.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-white mb-2">{item.q}</h3>
                <p className="text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md bg-slate-900 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>Confirmar Pagamento</span>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          {selectedPlanData && (
            <MercadoPagoPaymentForm
              planId={selectedPlanData.planId}
              planName={selectedPlanData.name}
              price={selectedPlanData.price}
              onSuccess={() => {
                setShowPaymentModal(false);
                toast.success("Bem-vindo ao MKT Gerenciador!");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
