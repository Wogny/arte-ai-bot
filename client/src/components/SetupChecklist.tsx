import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Lock, Zap } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  action?: {
    label: string;
    url: string;
  };
}

interface SetupChecklistProps {
  items: ChecklistItem[];
  onItemComplete?: (itemId: string) => void;
}

export default function SetupChecklist({ items, onItemComplete }: SetupChecklistProps) {
  const [checklist, setChecklist] = useState(items);
  const completedCount = checklist.filter(item => item.completed).length;
  const completionPercentage = (completedCount / checklist.length) * 100;

  const handleItemClick = (itemId: string) => {
    const item = checklist.find(i => i.id === itemId);
    if (item?.action) {
      window.location.href = item.action.url;
    }
  };

  const handleMarkComplete = (itemId: string) => {
    setChecklist(checklist.map(item =>
      item.id === itemId ? { ...item, completed: true } : item
    ));
    onItemComplete?.(itemId);
    localStorage.setItem(`checklist-${itemId}`, 'true');
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-3">Configuração Inicial</h2>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-400">Progresso</p>
          <p className="text-sm font-semibold text-purple-400">{completedCount}/{checklist.length}</p>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {checklist.map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border transition cursor-pointer ${
              item.completed
                ? 'bg-green-600/20 border-green-500/50'
                : 'bg-white/10 border-white/20 hover:bg-white/20'
            }`}
            onClick={() => item.action && handleItemClick(item.id)}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="mt-1">
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className={`font-medium ${
                  item.completed
                    ? 'text-green-200 line-through'
                    : 'text-white'
                }`}>
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 mt-1">{item.description}</p>
              </div>

              {/* Action Button */}
              {item.action && !item.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = item.action!.url;
                  }}
                  className="px-3 py-1 bg-purple-600/50 hover:bg-purple-600 text-purple-200 text-xs rounded transition font-medium whitespace-nowrap"
                >
                  {item.action.label}
                </button>
              )}

              {/* Completed Badge */}
              {item.completed && (
                <span className="px-3 py-1 bg-green-600/50 text-green-200 text-xs rounded font-medium">
                  Concluído
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {completedCount === checklist.length && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
            <p className="text-green-200 font-medium">
              ✨ Parabéns! Você completou a configuração inicial. Agora explore todas as funcionalidades!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
