import { useState } from 'react';
import { Settings as SettingsIcon, User, Sliders, Lock, Database, LogOut, ChevronRight } from 'lucide-react';
import { trpc } from '../lib/trpc';
import ProfileSettings from '../components/settings/ProfileSettings';
import PreferencesSettings from '../components/settings/PreferencesSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import DataSettings from '../components/settings/DataSettings';

type SettingsTab = 'profile' | 'preferences' | 'security' | 'data';

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const tabs: TabItem[] = [
    {
      id: 'profile',
      label: 'Perfil',
      icon: <User className="w-5 h-5" />,
      description: 'Gerencie suas informações pessoais',
    },
    {
      id: 'preferences',
      label: 'Preferências',
      icon: <Sliders className="w-5 h-5" />,
      description: 'Customize sua experiência',
    },
    {
      id: 'security',
      label: 'Segurança',
      icon: <Lock className="w-5 h-5" />,
      description: 'Proteja sua conta',
    },
    {
      id: 'data',
      label: 'Dados',
      icon: <Database className="w-5 h-5" />,
      description: 'Gerencie seus dados',
    },
  ];

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja fazer logout?')) {
      await logoutMutation.mutateAsync();
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Configurações</h1>
              <p className="text-gray-400">Gerencie sua conta e preferências</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
              {/* User Card */}
              <div className="p-6 border-b border-white/20">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <p className="text-white font-semibold text-sm">{user?.name || 'Usuário'}</p>
                <p className="text-gray-400 text-xs mt-1">{user?.email}</p>
              </div>

              {/* Tabs */}
              <div className="divide-y divide-white/20">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-6 py-4 text-left transition flex items-center gap-3 ${
                      activeTab === tab.id
                        ? 'bg-purple-600/20 border-l-2 border-purple-600'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className={`${activeTab === tab.id ? 'text-purple-400' : 'text-gray-400'}`}>
                      {tab.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${activeTab === tab.id ? 'text-white' : 'text-gray-300'}`}>
                        {tab.label}
                      </p>
                    </div>
                    {activeTab === tab.id && <ChevronRight className="w-4 h-4 text-purple-400" />}
                  </button>
                ))}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="w-full px-6 py-4 text-left transition flex items-center gap-3 hover:bg-red-600/20 text-red-400 border-t border-white/20"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Fazer Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
              {/* Tab Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-gray-400">
                  {tabs.find(t => t.id === activeTab)?.description}
                </p>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'profile' && <ProfileSettings user={user} />}
                {activeTab === 'preferences' && <PreferencesSettings />}
                {activeTab === 'security' && <SecuritySettings />}
                {activeTab === 'data' && <DataSettings />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
