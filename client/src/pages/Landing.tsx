import { useState } from "react";
// Removido Link do wouter para evitar erro de pushState com domínios diferentes
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Zap, 
  Calendar, 
  BarChart3, 
  Users, 
  Palette,
  ArrowRight,
  Check,
  ChevronDown,
  Star,
  Play,
  Instagram,
  MessageCircle,
  Mail,
  Globe
} from "lucide-react";
import { getLoginUrl } from "@/const";

// Função helper para redirecionar para OAuth
const handleLoginClick = () => {
  window.location.href = getLoginUrl();
};

// Ícone do TikTok
const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Componente de Feature Card
function FeatureCard({ icon: Icon, title, description, color }: { 
  icon: any; 
  title: string; 
  description: string;
  color: "cyan" | "pink" | "purple" | "orange" | "green" | "blue";
}) {
  const colorMap = {
    cyan: "from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/20",
    pink: "from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/20",
    purple: "from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20",
    orange: "from-orange-500/20 to-orange-600/10 text-orange-400 border-orange-500/20",
    green: "from-green-500/20 to-green-600/10 text-green-400 border-green-500/20",
    blue: "from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div
      className="rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
      style={{
        background: "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorMap[color].split(" ").slice(0, 2).join(" ")} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-7 h-7 ${colorMap[color].split(" ")[2]}`} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// Componente de Step
function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="relative">
      {/* Linha conectora */}
      {number < 3 && (
        <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent" />
      )}
      
      <div className="text-center">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
          style={{
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))",
            border: "2px solid rgba(168, 85, 247, 0.5)",
            color: "#fff",
          }}
        >
          {number}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">{description}</p>
      </div>
    </div>
  );
}

// Componente de Testimonial
function TestimonialCard({ name, role, company, image, text, rating }: {
  name: string;
  role: string;
  company: string;
  image: string;
  text: string;
  rating: number;
}) {
  return (
    <div
      className="rounded-2xl p-6 h-full"
      style={{
        background: "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-5 h-5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} 
          />
        ))}
      </div>
      
      {/* Text */}
      <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">"{text}"</p>
      
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-white font-semibold">{name}</p>
          <p className="text-gray-400 text-xs">{role} • {company}</p>
        </div>
      </div>
    </div>
  );
}

// Componente de FAQ Item
function FAQItem({ question, answer, isOpen, onClick }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <button
        onClick={onClick}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <span className="text-white font-medium">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-48" : "max-h-0"}`}>
        <p className="px-6 pb-4 text-gray-400 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// Componente de Pricing Card (simplificado)
function PricingCard({ name, price, description, features, popular, color }: {
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  color: "cyan" | "pink" | "purple";
}) {
  const colorMap = {
    cyan: { text: "text-cyan-400", border: "border-cyan-500/30", bg: "rgba(34, 211, 238, 0.1)" },
    pink: { text: "text-pink-400", border: "border-pink-500/30", bg: "rgba(236, 72, 153, 0.1)" },
    purple: { text: "text-purple-400", border: "border-purple-500/30", bg: "rgba(168, 85, 247, 0.1)" },
  };

  return (
    <div className={`relative ${popular ? "md:scale-105" : ""}`}>
      {popular && (
        <div
          className="absolute -inset-1 rounded-2xl blur-xl opacity-60"
          style={{ background: "linear-gradient(to right, #ec4899, #a855f7, #22d3ee)" }}
        />
      )}
      
      <div
        className={`relative rounded-xl p-6 h-full flex flex-col ${colorMap[color].border} border`}
        style={{
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(10px)",
        }}
      >
        {popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
              MAIS POPULAR
            </span>
          </div>
        )}
        
        <h3 className={`text-xl font-bold mb-1 ${colorMap[color].text}`}>{name}</h3>
        <p className="text-gray-400 text-sm mb-4">{description}</p>
        
        <div className="mb-6">
          <span className="text-4xl font-bold text-white">R$ {price}</span>
          <span className="text-gray-400">/mês</span>
        </div>
        
        <ul className="space-y-3 mb-6 flex-grow">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className={`w-5 h-5 flex-shrink-0 ${colorMap[color].text}`} />
              <span className="text-gray-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={handleLoginClick}
          className="w-full"
          style={{
            background: colorMap[color].bg,
            border: `1px solid ${colorMap[color].border.replace("border-", "").replace("/30", "")}`,
          }}
        >
          Começar Agora
        </Button>
      </div>
    </div>
  );
}

export default function Landing() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const features = [
    { icon: Sparkles, title: "Geração com IA", description: "Crie posts incríveis em segundos usando inteligência artificial avançada. Descreva sua ideia e deixe a IA fazer a mágica.", color: "cyan" as const },
    { icon: Calendar, title: "Agendamento Inteligente", description: "Agende seus posts para o melhor horário automaticamente. Nossa IA analisa quando seu público está mais ativo.", color: "pink" as const },
    { icon: BarChart3, title: "Analytics Avançado", description: "Acompanhe métricas detalhadas de engajamento, alcance e crescimento em tempo real com dashboards intuitivos.", color: "purple" as const },
    { icon: Users, title: "Multi-Plataforma", description: "Publique simultaneamente no Instagram, TikTok, LinkedIn, Facebook e Twitter com um único clique.", color: "orange" as const },
    { icon: Palette, title: "Templates Prontos", description: "Biblioteca com centenas de templates profissionais para diferentes nichos e ocasiões.", color: "green" as const },
    { icon: Zap, title: "Automação Total", description: "Configure fluxos automáticos de conteúdo e deixe o MKT Gerenciador trabalhar por você 24/7.", color: "blue" as const },
  ];

  const steps = [
    { number: 1, title: "Descreva sua Ideia", description: "Digite o que você quer criar no prompt mágico. Pode ser um post, story, anúncio ou qualquer conteúdo." },
    { number: 2, title: "IA Gera o Conteúdo", description: "Nossa inteligência artificial cria imagens e textos únicos e profissionais em segundos." },
    { number: 3, title: "Publique e Cresça", description: "Agende ou publique instantaneamente em todas as suas redes sociais e acompanhe os resultados." },
  ];

  const testimonials = [
    { name: "Marina Silva", role: "Social Media Manager", company: "Agência Criativa", image: "", text: "O MKT Gerenciador revolucionou minha produtividade. Consigo criar uma semana de conteúdo em apenas 2 horas. Meus clientes estão impressionados!", rating: 5 },
    { name: "Carlos Mendes", role: "Empreendedor", company: "E-commerce Fashion", image: "", text: "Economizo mais de 20 horas por semana desde que comecei a usar. A qualidade das imagens geradas é surpreendente.", rating: 5 },
    { name: "Ana Beatriz", role: "Influenciadora", company: "150k seguidores", image: "", text: "Meu engajamento aumentou 300% em 3 meses. As sugestões de horário e hashtags são perfeitas para meu nicho.", rating: 5 },
  ];

  const faqs = [
    { question: "Como funciona a geração de imagens com IA?", answer: "Nossa IA utiliza modelos avançados de geração de imagens. Basta descrever o que você quer criar em linguagem natural, e o sistema gera imagens únicas e profissionais em segundos. Você pode ajustar estilos, cores e formatos conforme sua necessidade." },
    { question: "Posso cancelar minha assinatura a qualquer momento?", answer: "Sim! Você pode cancelar sua assinatura quando quiser, sem multas ou taxas adicionais. Seu acesso continua até o final do período já pago." },
    { question: "Quais redes sociais são suportadas?", answer: "Atualmente suportamos Instagram, TikTok, LinkedIn, Facebook e Twitter. Estamos constantemente adicionando novas integrações baseado no feedback dos usuários." },
    { question: "Existe um período de teste gratuito?", answer: "Sim! Oferecemos 7 dias de teste gratuito em todos os planos. Você pode experimentar todas as funcionalidades sem compromisso e sem precisar inserir cartão de crédito." },
    { question: "Como funciona o suporte ao cliente?", answer: "Oferecemos suporte via chat, email e central de ajuda. Planos Professional e Enterprise têm acesso a suporte prioritário com tempo de resposta garantido." },
  ];

  const plans = [
    { name: "STARTER", price: 49, description: "Para começar", features: ["50 Posts/mês", "Instagram + TikTok", "Analytics Básico", "Agendamento Simples"], color: "cyan" as const },
    { name: "PROFESSIONAL", price: 149, description: "Mais popular", features: ["500 Posts/mês", "Todas as Redes", "Analytics Avançado", "Equipe até 5", "Biblioteca de Mídia"], popular: true, color: "pink" as const },
    { name: "ENTERPRISE", price: 499, description: "Para grandes equipes", features: ["Posts ilimitados", "Integrações Custom", "Suporte 24/7", "Equipe ilimitada", "API de Acesso"], color: "purple" as const },
  ];

  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)",
    }}>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header/Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{
        background: "rgba(10, 10, 26, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MKT Gerenciador</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Recursos</a>
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">Como Funciona</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Preços</a>
            <a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm">FAQ</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-gray-300 hover:text-white" onClick={handleLoginClick}>
              Entrar
            </Button>
            <Button
              className="px-6"
              style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
              }}
              onClick={handleLoginClick}
            >
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{
            background: "rgba(168, 85, 247, 0.2)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
          }}>
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm">Powered by AI • +10.000 usuários ativos</span>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Crie Conteúdos </span>
            <span style={{
              background: "linear-gradient(to right, #a855f7, #ec4899, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Incríveis
            </span>
            <br />
            <span className="text-white">no MKT GERENCIADOR</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 px-4">
            Transforme suas ideias em posts virais para redes sociais em segundos. 
            Geração de imagens, textos e agendamento automático — tudo em um só lugar.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 px-4">
            <Button
              size="lg"
              className="w-full"
              style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
              }}
              onClick={handleLoginClick}
            >
              Começar Agora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg border-gray-600 text-gray-300 hover:bg-white/5"
            >
              <Play className="w-5 h-5 mr-2" />
              Ver Demo
            </Button>
          </div>
          
          {/* Hero Image/Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl opacity-50"
              style={{ background: "linear-gradient(to right, #a855f7, #ec4899, #22d3ee)" }}
            />
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "rgba(30, 41, 59, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <img 
                src="https://placehold.co/1200x600/1a1a2e/a855f7?text=Arte+AI+Bot+Dashboard+Preview" 
                alt="MKT Gerenciador Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
          
          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-gray-400 text-sm">Usuários Ativos</p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">500K+</p>
              <p className="text-gray-400 text-sm">Posts Criados</p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">4.9/5</p>
              <p className="text-gray-400 text-sm">Avaliação Média</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Tudo que Você Precisa para{" "}
              <span style={{
                background: "linear-gradient(to right, #a855f7, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Dominar as Redes
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Ferramentas poderosas de IA combinadas com automação inteligente para transformar sua presença digital.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Em apenas 3 passos simples, você transforma suas ideias em conteúdo profissional.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {steps.map((step) => (
              <StepCard key={step.number} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              O Que Nossos Clientes{" "}
              <span style={{
                background: "linear-gradient(to right, #22d3ee, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Dizem
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Milhares de criadores de conteúdo já transformaram suas redes sociais com o MKT Gerenciador.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, idx) => (
              <TestimonialCard key={idx} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Planos para Todos os{" "}
              <span style={{
                background: "linear-gradient(to right, #ec4899, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Tamanhos
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Comece grátis por 7 dias. Cancele quando quiser.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, idx) => (
              <PricingCard key={idx} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-gray-400">
              Tire suas dúvidas sobre o MKT Gerenciador.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <FAQItem
                key={idx}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === idx}
                onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div
            className="rounded-3xl p-12 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))",
              border: "1px solid rgba(168, 85, 247, 0.3)",
            }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Pronto para Revolucionar seu Conteúdo?
            </h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Junte-se a mais de 10.000 criadores que já estão usando IA para dominar as redes sociais.
            </p>
            <Button
              size="lg"
              className="w-full"
              style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
              }}
              onClick={handleLoginClick}
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MKT Gerenciador</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Transforme suas ideias em conteúdo viral com inteligência artificial.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  <TikTokIcon className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Preços</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Integrações</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Carreiras</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li><a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 MKT Gerenciador. Todos os direitos reservados.
            </p>
            <p className="text-gray-500 text-sm">
              Mercavejo IA Feito com ❤️ no Brasil
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
