import { useState } from 'react';
import { Check } from 'lucide-react';

export default function PreferencesSettings() {
  const [preferences, setPreferences] = useState({
    theme: localStorage.getItem('theme') || 'dark',
    language: localStorage.getItem('language') || 'pt-BR',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('theme', preferences.theme);
    localStorage.setItem('language', preferences.language);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Save Confirmation */}
      {saved && (
        <div className="p-4 bg-green-600/20 border border-green-500/50 rounded-lg flex items-center gap-3 text-green-200">
          <Check className="w-5 h-5" />
          <span className="text-sm">Preferências salvas com sucesso!</span>
        </div>
      )}

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Tema</label>
        <div className="space-y-2">
          {[
            { value: 'dark', label: '🌙 Escuro' },
            { value: 'light', label: '☀️ Claro' },
            { value: 'auto', label: '🔄 Automático' },
          ].map(option => (
            <label key={option.value} className="flex items-center gap-3 p-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition">
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={preferences.theme === option.value}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-white">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Idioma</label>
        <select
          value={preferences.language}
          onChange={(e) => handleChange('language', e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition"
        >
          <option value="pt-BR">🇧🇷 Português (Brasil)</option>
          <option value="en-US">🇺🇸 English (US)</option>
          <option value="es-ES">🇪🇸 Español</option>
        </select>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Fuso Horário</label>
        <input
          type="text"
          value={preferences.timezone}
          disabled
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-2">Detectado automaticamente do seu navegador</p>
      </div>

      {/* Notifications */}
      <div className="pt-6 border-t border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Notificações</h3>
        
        <div className="space-y-3">
          {[
            {
              key: 'emailNotifications',
              label: 'Notificações por Email',
              description: 'Receba atualizações sobre seus posts e atividade',
            },
            {
              key: 'pushNotifications',
              label: 'Notificações Push',
              description: 'Alertas em tempo real no navegador',
            },
            {
              key: 'marketingEmails',
              label: 'Emails de Marketing',
              description: 'Novos recursos, promoções e dicas',
            },
          ].map(item => (
            <label
              key={item.key}
              className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition cursor-pointer"
            >
              <div>
                <p className="text-white font-medium">{item.label}</p>
                <p className="text-xs text-gray-400 mt-1">{item.description}</p>
              </div>
              <input
                type="checkbox"
                checked={preferences[item.key as keyof typeof preferences] as boolean}
                onChange={(e) => handleChange(item.key, e.target.checked)}
                className="w-5 h-5 rounded"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-medium"
      >
        Salvar Preferências
      </button>
    </div>
  );
}
