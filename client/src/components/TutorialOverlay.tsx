import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface TutorialTip {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface TutorialOverlayProps {
  tips: TutorialTip[];
  onComplete?: () => void;
}

export default function TutorialOverlay({ tips, onComplete }: TutorialOverlayProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const currentTip = tips[currentTipIndex];

  useEffect(() => {
    if (!currentTip) return;

    const targetElement = document.querySelector(currentTip.target);
    if (!targetElement) return;

    setIsVisible(true);

    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    let top = rect.top + scrollTop;
    let left = rect.left + scrollLeft;

    switch (currentTip.position) {
      case 'top':
        top -= 120;
        left += rect.width / 2 - 150;
        break;
      case 'bottom':
        top += rect.height + 20;
        left += rect.width / 2 - 150;
        break;
      case 'left':
        top += rect.height / 2 - 50;
        left -= 320;
        break;
      case 'right':
        top += rect.height / 2 - 50;
        left += rect.width + 20;
        break;
    }

    setPosition({ top, left });
  }, [currentTip]);

  const handleNext = () => {
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('tutorialCompleted', 'true');
    onComplete?.();
  };

  if (!isVisible || !currentTip) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={handleComplete}
      ></div>

      {/* Spotlight */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <circle id="spotlight-circle" cx="50%" cy="50%" r="50" fill="black" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 shadow-2xl max-w-sm"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleComplete}
          className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Content */}
        <h3 className="text-lg font-semibold text-white mb-2">{currentTip.title}</h3>
        <p className="text-white/90 text-sm mb-4">{currentTip.description}</p>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {tips.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition ${
                  index === currentTipIndex
                    ? 'bg-white w-4'
                    : index < currentTipIndex
                    ? 'bg-white/60 w-2'
                    : 'bg-white/30 w-2'
                }`}
              ></div>
            ))}
          </div>
          <span className="text-xs text-white/80">
            {currentTipIndex + 1} de {tips.length}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {currentTip.action && (
            <button
              onClick={currentTip.action.onClick}
              className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition text-sm font-medium"
            >
              {currentTip.action.label}
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-3 py-2 bg-white/90 hover:bg-white text-purple-600 rounded-lg transition text-sm font-medium flex items-center justify-center gap-1"
          >
            {currentTipIndex === tips.length - 1 ? 'Concluir' : 'Próximo'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
