import { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const loginMutation = trpc.auth.loginWithEmail.useMutation();
  const resendEmailMutation = trpc.auth.resendVerificationEmail.useMutation();

  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      if (result.success) {
        localStorage.setItem("manus-runtime-user-info", JSON.stringify(result.user));
        await utils.auth.me.invalidate();
        window.location.replace('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Digite seu email para reenviar o link');
      return;
    }

    try {
      const result = await resendEmailMutation.mutateAsync({ email });
      toast.success(result.message);
      setError('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao reenviar email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h1>
            <p className="text-gray-300">Faça login para acessar seu dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
              {error.includes('não verificado') && (
                <button
                  onClick={handleResendEmail}
                  disabled={resendEmailMutation.isPending}
                  className="mt-2 flex items-center gap-2 text-xs font-semibold text-white hover:text-purple-200 transition"
                >
                  {resendEmailMutation.isPending ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Mail className="w-3 h-3" />
                  )}
                  Reenviar link de confirmação
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setLocation('/forgot-password')}
                className="text-sm text-purple-400 hover:text-purple-300 transition"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-gray-400 text-sm">ou</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* OAuth Button */}
          <button
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_OAUTH_PORTAL_URL}?appId=${import.meta.env.VITE_APP_ID}&redirectUri=${encodeURIComponent(window.location.origin + '/api/oauth/callback')}&state=${btoa(window.location.origin + '/api/oauth/callback')}&type=signIn`;
            }}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 rounded-lg transition"
          >
            Entrar com Manus
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-gray-300 text-sm mt-6">
            Não tem conta?{' '}
            <button
              onClick={() => setLocation('/register')}
              className="text-purple-400 hover:text-purple-300 font-semibold transition"
            >
              Crie uma agora
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
