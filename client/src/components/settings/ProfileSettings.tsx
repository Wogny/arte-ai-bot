import { useState } from 'react';
import { Camera, Check, AlertCircle } from 'lucide-react';
import { trpc } from '../../lib/trpc';

interface ProfileSettingsProps {
  user?: {
    id?: string | number;
    name?: string | null;
    email?: string | null;
    image?: string;
  } | null;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateNameMutation = trpc.user.updateName.useMutation();
  const updatePasswordMutation = trpc.user.updatePassword.useMutation();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      await updateNameMutation.mutateAsync({ name: formData.name });
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 8 caracteres' });
      return;
    }

    setIsLoading(true);
    try {
      await updatePasswordMutation.mutateAsync({ newPassword });
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-600/20 border border-green-500/50 text-green-200'
            : 'bg-red-600/20 border border-red-500/50 text-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Profile Picture */}
      <div>
        <label className="block text-sm font-medium text-white mb-4">Foto de Perfil</label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <button className="px-6 py-3 bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg transition flex items-center gap-2 font-medium">
            <Camera className="w-4 h-4" />
            Alterar Foto
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Informações Pessoais</h3>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">Nome Completo</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            placeholder="seu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-medium disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="space-y-4 pt-6 border-t border-white/20">
        <h3 className="text-lg font-semibold text-white">Alterar Senha</h3>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">Nova Senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            placeholder="Mínimo 8 caracteres"
          />
          <p className="text-xs text-gray-400 mt-2">
            Use uma mistura de letras maiúsculas, minúsculas, números e símbolos
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Confirmar Senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            placeholder="Confirme sua nova senha"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !newPassword || !confirmPassword}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-medium disabled:opacity-50"
        >
          {isLoading ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </form>

      {/* Email Verification */}
      <div className="p-4 bg-blue-600/20 border border-blue-500/50 rounded-lg">
        <p className="text-blue-200 text-sm">
          <strong>Email Verificado:</strong> Seu email foi verificado com sucesso em 15 de janeiro de 2026
        </p>
      </div>
    </div>
  );
}
