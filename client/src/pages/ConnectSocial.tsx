import { useState } from 'react';
import { Link2, Unlink2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface SocialAccount {
  platform: string;
  username: string;
  connected: boolean;
  connectedAt?: Date;
  followers?: number;
  icon: string;
}

export default function ConnectSocial() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    { platform: 'Instagram', username: '', connected: false, icon: '📷' },
    { platform: 'Facebook', username: '', connected: false, icon: '👥' },
    { platform: 'TikTok', username: '', connected: false, icon: '🎵' },
    { platform: 'YouTube', username: '', connected: false, icon: '📺' },
    { platform: 'X (Twitter)', username: '', connected: false, icon: '𝕏' },
    { platform: 'LinkedIn', username: '', connected: false, icon: '💼' },
  ]);

  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handleConnect = async (platform: string) => {
    setLoading(true);
    setSelectedPlatform(platform);

    try {
      // Simulate OAuth connection
      // In production, this would redirect to the platform's OAuth flow
      const redirectUrl = `https://oauth.${platform.toLowerCase()}.com/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${window.location.origin}/api/oauth/callback`;
      
      // For demo, just update the state
      setAccounts(accounts.map(acc => 
        acc.platform === platform 
          ? { ...acc, connected: true, username: `user_${platform}`, followers: Math.floor(Math.random() * 100000) }
          : acc
      ));
    } catch (err) {
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
      setSelectedPlatform(null);
    }
  };

  const handleDisconnect = (platform: string) => {
    setAccounts(accounts.map(acc =>
      acc.platform === platform
        ? { ...acc, connected: false, username: '', followers: undefined }
        : acc
    ));
  };

  const connectedCount = accounts.filter(acc => acc.connected).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
            <Link2 className="w-8 h-8 text-purple-400" />
            Conectar Redes Sociais
          </h1>
          <p className="text-gray-400">
            Conecte suas contas de redes sociais para publicar posts automaticamente
          </p>
        </div>

        {/* Status Card */}
        <div className="mb-8 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Status de Conexão</h2>
              <p className="text-gray-400">
                {connectedCount} de {accounts.length} plataformas conectadas
              </p>
            </div>
            <div className="text-4xl font-bold text-purple-400">
              {connectedCount}/{accounts.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
              style={{ width: `${(connectedCount / accounts.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <div
              key={account.platform}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:border-white/40 transition"
            >
              {/* Platform Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{account.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{account.platform}</h3>
                    {account.connected && (
                      <p className="text-xs text-gray-400">@{account.username}</p>
                    )}
                  </div>
                </div>
                {account.connected && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                {account.connected ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-200">Conectado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-200">Não conectado</span>
                  </div>
                )}
              </div>

              {/* Followers Count */}
              {account.connected && account.followers && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Seguidores</p>
                  <p className="text-xl font-bold text-white">
                    {(account.followers / 1000).toFixed(1)}K
                  </p>
                </div>
              )}

              {/* Action Button */}
              {account.connected ? (
                <button
                  onClick={() => handleDisconnect(account.platform)}
                  className="w-full px-4 py-2 bg-red-600/50 hover:bg-red-600 text-red-200 rounded-lg transition flex items-center justify-center gap-2 font-medium"
                >
                  <Unlink2 className="w-4 h-4" />
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(account.platform)}
                  disabled={loading && selectedPlatform === account.platform}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium"
                >
                  {loading && selectedPlatform === account.platform ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Conectar
                    </>
                  )}
                </button>
              )}

              {/* Info Text */}
              <p className="text-xs text-gray-500 mt-3 text-center">
                Você será redirecionado para {account.platform} para autorizar
              </p>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benefits */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Benefícios</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Publique em múltiplas plataformas simultaneamente</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Agende posts com antecedência</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Analise o desempenho dos seus posts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span>Gerencie todas as contas em um só lugar</span>
              </li>
            </ul>
          </div>

          {/* Security Info */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Segurança</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">🔒</span>
                <span>Seus tokens são criptografados e seguros</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">🔒</span>
                <span>Nunca armazenamos suas senhas</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">🔒</span>
                <span>Você pode revogar acesso a qualquer momento</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">🔒</span>
                <span>Conformidade com LGPD e GDPR</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
