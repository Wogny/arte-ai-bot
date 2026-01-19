import React, { useState } from "react";
import { Sparkles, ArrowRight, Check, Zap, Brain, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPageNew() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 text-white overflow-hidden">
      {/* Background Animated Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-400" />
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Arte AI Bot
          </span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" className="text-white hover:bg-white/10">Funcionalidades</Button>
          <Button variant="ghost" className="text-white hover:bg-white/10">Preços</Button>
          <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90">Começar Grátis</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-24 text-center">
        <div className="mb-8 inline-block">
          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 backdrop-blur-sm">
            <span className="text-sm text-purple-300 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Powered by Advanced AI
            </span>
          </div>
        </div>

        <h1 className="text-6xl font-black mb-6 leading-tight">
          Crie Conteúdo Viral
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Com Uma Frase
          </span>
        </h1>

        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          A inteligência artificial que entende seu negócio. Gera imagens, adapta para todas as redes e agenda automaticamente. Tudo em segundos.
        </p>

        {/* Magic Prompt Input */}
        <div className="mb-16 max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-900 rounded-2xl p-1 backdrop-blur-sm">
              <div className="flex gap-2 p-4 bg-slate-900 rounded-xl">
                <input
                  type="text"
                  placeholder="Ex: 'Crie um post promocional de Black Friday para minha loja de roupas'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                />
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 gap-2">
                  <Sparkles className="h-5 w-5" /> Gerar
                </Button>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-4">Deixe a IA fazer o trabalho criativo por você</p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 gap-6 mb-16">
          {[
            { icon: Palette, title: "Imagens Criativas", desc: "IA gera artes em qualquer estilo" },
            { icon: Brain, title: "Inteligência Adaptativa", desc: "Otimiza para cada rede social" },
            { icon: Zap, title: "Agendamento Automático", desc: "Publica nos melhores horários" }
          ].map((feature, i) => (
            <div key={i} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition">
                <feature.icon className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-lg px-8 py-6 gap-2">
          Comece Seu Teste Grátis <ArrowRight className="h-5 w-5" />
        </Button>

        <p className="text-gray-400 text-sm mt-4">Sem cartão de crédito. Sem compromisso. 7 dias grátis.</p>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-16 border-t border-white/10">
        <p className="text-center text-gray-400 mb-8">Confiado por agências e creators em todo Brasil</p>
        <div className="flex justify-center items-center gap-8 flex-wrap">
          {["Agência XYZ", "Creator 1M", "E-commerce Pro", "Marketing Hub"].map((name, i) => (
            <div key={i} className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-24">
        <h2 className="text-4xl font-bold text-center mb-16">Por que Arte AI Bot?</h2>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-6 text-red-400">❌ Ferramentas Tradicionais</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex gap-3"><span className="text-red-400">•</span> Você cria a arte fora</li>
              <li className="flex gap-3"><span className="text-red-400">•</span> Adapta manualmente para cada rede</li>
              <li className="flex gap-3"><span className="text-red-400">•</span> Escreve legendas do zero</li>
              <li className="flex gap-3"><span className="text-red-400">•</span> Agenda um a um</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/50 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-6 text-green-400">✅ Arte AI Bot</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex gap-3"><span className="text-green-400">✓</span> IA gera a arte para você</li>
              <li className="flex gap-3"><span className="text-green-400">✓</span> Adapta automaticamente</li>
              <li className="flex gap-3"><span className="text-green-400">✓</span> Cria legendas otimizadas</li>
              <li className="flex gap-3"><span className="text-green-400">✓</span> Agenda em todas as redes</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-8 text-center text-gray-400">
        <p>&copy; 2026 Arte AI Bot. Transformando criatividade em automação.</p>
      </footer>
    </div>
  );
}
