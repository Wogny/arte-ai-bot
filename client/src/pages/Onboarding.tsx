import { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, Zap, Image as ImageIcon, Calendar, Share2, BarChart3, X } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  actionUrl: string;
  completed: boolean;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showChecklist, setShowChecklist] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Bem-vindo ao MKT Gerenciador',
      description: 'Transforme suas ideias em posts virais para redes sociais em segundos com IA.',
      icon: <Zap className="w-16 h-16 text-purple-400" />,
      action: 'Próximo',
      actionUrl: '#',
      completed: false,
    },
    {
      id: 2,
      title: 'Conecte suas Redes Sociais',
      description: 'Publique em Instagram, Facebook, TikTok e outras plataformas de uma vez.',
      icon: <Share2 className="w-16 h-16 text-pink-400" />,
      action: 'Conectar Redes',
      actionUrl: '/connect-social',
      completed: completedSteps.includes(2),
    },
    {
      id: 3,
      title: 'Gere Imagens com IA',
      description: 'Crie imagens incríveis com nosso gerador de IA. Escolha entre 8 estilos diferentes.',
      icon: <ImageIcon className="w-16 h-16 text-cyan-400" />,
      action: 'Gerar Imagem',
      actionUrl: '/create-post',
      completed: completedSteps.includes(3),
    },
    {
      id: 4,
      title: 'Agende seus Posts',
      description: 'Planeje seus posts com antecedência usando nosso calendário visual.',
      icon: <Calendar className="w-16 h-16 text-green-400" />,
      action: 'Agendar Post',
      actionUrl: '/schedule-visual',
      completed: completedSteps.includes(4),
    },
    {
      id: 5,
      title: 'Analise o Desempenho',
      description: 'Acompanhe métricas, engajamento e melhore seus resultados com dados reais.',
      icon: <BarChart3 className="w-16 h-16 text-yellow-400" />,
      action: 'Ver Analytics',
      actionUrl: '/dashboard',
      completed: completedSteps.includes(5),
    },
  ];

  const currentStepData = steps[currentStep];
  const completionPercentage = (completedSteps.length / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete
      localStorage.setItem('onboardingCompleted', 'true');
      window.location.href = '/dashboard';
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    window.location.href = '/dashboard';
  };

  const handleStepClick = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    window.location.href = steps[stepId - 1].actionUrl;
  };

  const handleMarkComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Bem-vindo ao MKT Gerenciador! 🎉</h1>
            <p className="text-gray-400">Vamos configurar sua conta em 5 passos simples</p>
          </div>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Pular
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">Progresso do Onboarding</p>
            <p className="text-sm font-semibold text-purple-400">{Math.round(completionPercentage)}%</p>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12">
              {/* Step Content */}
              <div className="text-center mb-12">
                <div className="flex justify-center mb-8">
                  {currentStepData.icon}
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">{currentStepData.title}</h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">{currentStepData.description}</p>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mb-12">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(index)}
                      className={`w-10 h-10 rounded-full font-semibold transition flex items-center justify-center ${
                        index === currentStep
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                          : completedSteps.includes(step.id)
                          ? 'bg-green-600 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </button>
                    {index < steps.length - 1 && (
                      <div className="w-8 h-1 bg-white/10 mx-2"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-semibold"
                  >
                    Anterior
                  </button>
                )}
                <a
                  href={currentStepData.actionUrl}
                  onClick={() => handleMarkComplete(currentStepData.id)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-semibold flex items-center gap-2"
                >
                  {currentStepData.action}
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>

              {/* Video Placeholder */}
              <div className="mt-12 rounded-xl overflow-hidden bg-black/30">
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-600/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Vídeo explicativo em breve</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Sidebar */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-6">Checklist de Configuração</h3>

              <div className="space-y-4">
                {steps.map(step => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id - 1)}
                    className={`w-full p-4 rounded-lg text-left transition ${
                      completedSteps.includes(step.id)
                        ? 'bg-green-600/20 border border-green-500/50'
                        : currentStep === step.id - 1
                        ? 'bg-purple-600/20 border border-purple-500/50'
                        : 'bg-white/10 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {completedSteps.includes(step.id) ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${
                          completedSteps.includes(step.id)
                            ? 'text-green-200 line-through'
                            : 'text-white'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Completion Message */}
              {completedSteps.length === steps.length && (
                <div className="mt-6 p-4 bg-green-600/20 border border-green-500/50 rounded-lg">
                  <p className="text-green-200 text-sm font-medium">✨ Parabéns! Você completou o onboarding!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <div className="text-3xl mb-3">💡</div>
            <h4 className="text-white font-semibold mb-2">Dica 1</h4>
            <p className="text-sm text-gray-400">Use o gerador de IA para criar imagens únicas e personalizadas para sua marca.</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <div className="text-3xl mb-3">⏰</div>
            <h4 className="text-white font-semibold mb-2">Dica 2</h4>
            <p className="text-sm text-gray-400">Agende seus posts nos melhores horários para maximizar o engajamento.</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <div className="text-3xl mb-3">📊</div>
            <h4 className="text-white font-semibold mb-2">Dica 3</h4>
            <p className="text-sm text-gray-400">Analise seus dados para entender o que funciona melhor com sua audiência.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
