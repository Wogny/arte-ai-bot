import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  HelpCircle,
  MessageSquare,
  Book,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronRight,
  Loader2,
  ExternalLink,
  Zap,
  CreditCard,
  Image,
  Calendar,
  Settings,
  Users,
} from "lucide-react";

// FAQ Data
const faqData = [
  {
    category: "Geral",
    icon: HelpCircle,
    questions: [
      {
        q: "O que é o MKT Gerenciador?",
        a: "O MKT Gerenciador é uma plataforma completa de gestão de marketing digital que utiliza Inteligência Artificial para criar conteúdo, agendar posts e analisar o desempenho das suas redes sociais.",
      },
      {
        q: "Como funciona o período de teste gratuito?",
        a: "Oferecemos 7 dias de teste gratuito em todos os planos. Durante esse período, você tem acesso a todas as funcionalidades do plano escolhido sem nenhum custo.",
      },
      {
        q: "Posso cancelar minha assinatura a qualquer momento?",
        a: "Sim! Você pode cancelar sua assinatura a qualquer momento através das configurações da sua conta. O acesso continua até o fim do período pago.",
      },
    ],
  },
  {
    category: "Geração de Conteúdo",
    icon: Image,
    questions: [
      {
        q: "Como gerar imagens com IA?",
        a: "Acesse a página 'Criar Arte', descreva o que você deseja no campo de prompt, escolha o estilo visual e clique em 'Gerar'. A IA criará uma imagem personalizada em segundos.",
      },
      {
        q: "Quantas imagens posso gerar por mês?",
        a: "O limite depende do seu plano: Starter (50 imagens), Professional (200 imagens), Enterprise (ilimitado).",
      },
      {
        q: "Posso usar as imagens geradas comercialmente?",
        a: "Sim! Todas as imagens geradas são de sua propriedade e podem ser usadas para fins comerciais sem restrições.",
      },
    ],
  },
  {
    category: "Agendamento",
    icon: Calendar,
    questions: [
      {
        q: "Como agendar posts para múltiplas plataformas?",
        a: "Na página de Calendário, selecione a data e hora desejada, escolha as plataformas de destino e adicione seu conteúdo. O sistema publicará automaticamente no horário agendado.",
      },
      {
        q: "Quais redes sociais são suportadas?",
        a: "Atualmente suportamos Instagram, TikTok, Facebook, LinkedIn, Twitter e Pinterest. Novas integrações são adicionadas regularmente.",
      },
      {
        q: "Posso editar um post agendado?",
        a: "Sim, você pode editar ou cancelar qualquer post agendado antes da data de publicação através do calendário.",
      },
    ],
  },
  {
    category: "Pagamentos",
    icon: CreditCard,
    questions: [
      {
        q: "Quais formas de pagamento são aceitas?",
        a: "Aceitamos cartões de crédito (Visa, Mastercard, American Express), PIX e Boleto através do Mercado Pago.",
      },
      {
        q: "Como faço upgrade do meu plano?",
        a: "Acesse Configurações > Assinatura e clique em 'Fazer Upgrade'. A diferença será cobrada proporcionalmente.",
      },
      {
        q: "Emitem nota fiscal?",
        a: "Sim, todas as transações geram nota fiscal que é enviada automaticamente para o email cadastrado.",
      },
    ],
  },
];

// Knowledge Base Articles
const knowledgeBase = [
  {
    title: "Guia de Início Rápido",
    description: "Aprenda a configurar sua conta e fazer sua primeira publicação",
    icon: Zap,
    readTime: "5 min",
    category: "Iniciante",
  },
  {
    title: "Melhores Práticas para Legendas",
    description: "Dicas para criar legendas que engajam seu público",
    icon: MessageSquare,
    readTime: "8 min",
    category: "Conteúdo",
  },
  {
    title: "Conectando suas Redes Sociais",
    description: "Passo a passo para integrar Instagram, TikTok e mais",
    icon: Settings,
    readTime: "6 min",
    category: "Configuração",
  },
  {
    title: "Entendendo os Analytics",
    description: "Como interpretar os dados de desempenho",
    icon: Users,
    readTime: "10 min",
    category: "Analytics",
  },
  {
    title: "Gerenciando sua Equipe",
    description: "Adicione membros e defina permissões",
    icon: Users,
    readTime: "4 min",
    category: "Equipe",
  },
  {
    title: "Automação de Conteúdo",
    description: "Configure publicações automáticas e economize tempo",
    icon: Calendar,
    readTime: "7 min",
    category: "Avançado",
  },
];

// Mock tickets
const mockTickets = [
  {
    id: 1,
    subject: "Problema ao conectar Instagram",
    status: "open",
    priority: "high",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 2,
    subject: "Dúvida sobre plano Enterprise",
    status: "answered",
    priority: "medium",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 3,
    subject: "Erro ao gerar imagem",
    status: "closed",
    priority: "low",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
];

export default function SupportCenter() {
  const [activeTab, setActiveTab] = useState("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "general", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Ticket criado com sucesso! Responderemos em até 24 horas.");
    setShowNewTicket(false);
    setNewTicket({ subject: "", category: "general", message: "" });
    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-yellow-500/20 text-yellow-400"><AlertCircle className="w-3 h-3 mr-1" />Aberto</Badge>;
      case "answered":
        return <Badge className="bg-cyan-500/20 text-cyan-400"><MessageSquare className="w-3 h-3 mr-1" />Respondido</Badge>;
      case "closed":
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Fechado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Média</Badge>;
      case "low":
        return <Badge variant="secondary">Baixa</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const filteredFaq = faqData.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-8 h-8 text-cyan-400" />
            Central de Ajuda
          </h1>
          <p className="text-gray-400 mt-2">Como podemos ajudar você hoje?</p>
          
          <div className="max-w-xl mx-auto mt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar na central de ajuda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10 w-full justify-start">
            <TabsTrigger value="faq" className="data-[state=active]:bg-cyan-500/20">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-cyan-500/20">
              <Book className="w-4 h-4 mr-2" />
              Base de Conhecimento
            </TabsTrigger>
            <TabsTrigger value="tickets" className="data-[state=active]:bg-cyan-500/20">
              <MessageSquare className="w-4 h-4 mr-2" />
              Meus Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {(searchQuery ? filteredFaq : faqData).map((category, idx) => (
                <Card key={idx} className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <category.icon className="w-5 h-5 text-cyan-400" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {category.questions.map((item, qIdx) => (
                        <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`} className="border-white/10">
                          <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-400">
                            {item.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeBase.map((article, idx) => (
                <Card 
                  key={idx} 
                  className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30 transition-colors">
                        <article.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold group-hover:text-cyan-400 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">{article.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="secondary" className="text-xs">
                            {article.category}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readTime}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Meus Tickets</h2>
              <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Abrir Novo Ticket</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Descreva seu problema e nossa equipe responderá em até 24 horas.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Assunto</label>
                      <Input
                        placeholder="Resumo do problema"
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Categoria</label>
                      <Select 
                        value={newTicket.category} 
                        onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Geral</SelectItem>
                          <SelectItem value="billing">Pagamento</SelectItem>
                          <SelectItem value="technical">Técnico</SelectItem>
                          <SelectItem value="feature">Sugestão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Mensagem</label>
                      <Textarea
                        placeholder="Descreva seu problema em detalhes..."
                        value={newTicket.message}
                        onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                        className="bg-white/5 border-white/10 text-white min-h-[150px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewTicket(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmitTicket} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Enviar Ticket
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {mockTickets.map((ticket) => (
                <Card key={ticket.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-gray-400 font-mono text-sm">#{ticket.id}</div>
                        <div>
                          <h3 className="text-white font-medium">{ticket.subject}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Criado {ticket.createdAt.toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status)}
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold text-lg">Precisa de ajuda urgente?</h3>
                <p className="text-gray-400 text-sm">
                  Nossa equipe está disponível de segunda a sexta, das 9h às 18h.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-white/20">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat ao Vivo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
