import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const steps = [
  {
    title: "Bem-vindo ao MKT Gerenciador! 🚀",
    content: "Vamos te mostrar como transformar suas redes sociais com inteligência artificial em poucos minutos.",
    target: "welcome"
  },
  {
    title: "Geração de Conteúdo",
    content: "Aqui você pode criar artes incríveis usando nossos modelos de IA treinados para marketing.",
    target: "content-gen"
  },
  {
    title: "Agendamento Inteligente",
    content: "Organize suas postagens em um calendário visual e deixe que a IA escolha os melhores horários.",
    target: "calendar"
  },
  {
    title: "Analytics Avançado",
    content: "Acompanhe o crescimento da sua marca com dados reais e insights estratégicos.",
    target: "analytics"
  }
];

export default function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("hasSeenOnboarding", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-[400px] shadow-2xl border-primary/20 animate-in fade-in zoom-in duration-300">
        <CardHeader className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 h-8 w-8" 
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
            Passo {currentStep + 1} de {steps.length}
          </div>
          <CardTitle>{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 leading-relaxed">
            {steps[currentStep].content}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? "Começar Agora!" : "Próximo"} 
            {currentStep !== steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
