import { useState } from 'react';
import { Check, AlertCircle, Shield, Smartphone, Clock } from 'lucide-react';

export default function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'Chrome no Windows',
      location: 'São Paulo, Brasil',
      lastActive: '2 minutos atrás',
      current: true,
    },
    {
      id: 2,
      device: 'Safari no iPhone',
      location: 'São Paulo, Brasil',
      lastActive: '1 hora atrás',
      current: false,
    },
  ]);

  const handleEnable2FA = () => {
    setShowQRCode(true);
  };

  const handleVerify2FA = () => {
    if (verificationCode.length === 6) {
      setTwoFactorEnabled(true);
      setShowQRCode(false);
      setVerificationCode('');
    }
  };

  const handleRevokeSession = (sessionId: number) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  return (
    <div className="space-y-8">
      {/* Two-Factor Authentication */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Autenticação de Dois Fatores (2FA)</h3>
        </div>

        {twoFactorEnabled ? (
          <div className="p-4 bg-green-600/20 border border-green-500/50 rounded-lg">
            <div className="flex items-center gap-3 text-green-200 mb-3">
              <Check className="w-5 h-5" />
              <span className="font-medium">2FA Ativado</span>
            </div>
            <p className="text-sm text-green-200/80 mb-4">
              Sua conta está protegida com autenticação de dois fatores. Você receberá um código no seu aplicativo autenticador a cada login.
            </p>
            <button
              onClick={() => setTwoFactorEnabled(false)}
              className="px-4 py-2 bg-red-600/50 hover:bg-red-600 text-red-200 rounded-lg transition text-sm font-medium"
            >
              Desativar 2FA
            </button>
          </div>
        ) : (
          <div className="p-4 bg-yellow-600/20 border border-yellow-500/50 rounded-lg">
            <div className="flex items-center gap-3 text-yellow-200 mb-3">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">2FA Desativado</span>
            </div>
            <p className="text-sm text-yellow-200/80 mb-4">
              Ative a autenticação de dois fatores para aumentar a segurança da sua conta.
            </p>
            {!showQRCode ? (
              <button
                onClick={handleEnable2FA}
                className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 text-purple-200 rounded-lg transition text-sm font-medium"
              >
                Ativar 2FA
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white mb-3">
                    1. Escaneie este código QR com seu aplicativo autenticador:
                  </p>
                  <div className="bg-white p-4 rounded-lg w-48 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📱</div>
                      <p className="text-xs text-gray-600">QR Code Placeholder</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-white mb-2">2. Digite o código de 6 dígitos:</p>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                    placeholder="000000"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowQRCode(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleVerify2FA}
                    disabled={verificationCode.length !== 6}
                    className="flex-1 px-4 py-2 bg-purple-600/50 hover:bg-purple-600 text-purple-200 rounded-lg transition text-sm font-medium disabled:opacity-50"
                  >
                    Verificar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="space-y-4 pt-6 border-t border-white/20">
        <h3 className="text-lg font-semibold text-white">Sessões Ativas</h3>
        <p className="text-sm text-gray-400">Gerencie seus dispositivos e sessões conectadas</p>

        <div className="space-y-3">
          {sessions.map(session => (
            <div
              key={session.id}
              className="p-4 bg-white/10 border border-white/20 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <p className="text-white font-medium">{session.device}</p>
                    <p className="text-xs text-gray-400 mt-1">{session.location}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-400">{session.lastActive}</p>
                      {session.current && (
                        <span className="px-2 py-1 bg-green-600/50 text-green-200 text-xs rounded">
                          Atual
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="px-3 py-1 bg-red-600/50 hover:bg-red-600 text-red-200 rounded text-xs font-medium transition"
                  >
                    Revogar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Password Security */}
      <div className="space-y-4 pt-6 border-t border-white/20">
        <h3 className="text-lg font-semibold text-white">Segurança de Senha</h3>
        
        <div className="p-4 bg-green-600/20 border border-green-500/50 rounded-lg">
          <p className="text-green-200 text-sm">
            <strong>Força da senha:</strong> Forte
          </p>
          <p className="text-xs text-green-200/80 mt-2">
            Sua senha atende aos critérios de segurança recomendados.
          </p>
        </div>

        <p className="text-sm text-gray-400">
          Recomendamos alterar sua senha a cada 90 dias para manter sua conta segura.
        </p>

        <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-medium">
          Alterar Senha
        </button>
      </div>
    </div>
  );
}
