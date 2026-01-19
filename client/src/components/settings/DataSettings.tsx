import { useState } from 'react';
import { Download, Trash2, AlertCircle } from 'lucide-react';

export default function DataSettings() {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const handleDownloadData = async () => {
    // Simular download de dados
    const data = {
      user: {
        name: 'João Silva',
        email: 'joao@example.com',
        createdAt: '2026-01-15',
      },
      posts: [
        { id: 1, title: 'Post 1', createdAt: '2026-01-14' },
        { id: 2, title: 'Post 2', createdAt: '2026-01-13' },
      ],
      subscriptions: [
        { plan: 'Professional', startDate: '2026-01-15', endDate: '2026-02-15' },
      ],
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert('Por favor, digite sua senha para confirmar');
      return;
    }

    if (confirm('Tem certeza? Esta ação é irreversível e todos os seus dados serão deletados permanentemente.')) {
      // Simular deleção de conta
      alert('Sua conta foi deletada com sucesso');
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-8">
      {/* Data Export */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Exportar Meus Dados</h3>
        </div>

        <p className="text-sm text-gray-400">
          Baixe uma cópia de todos os seus dados em formato JSON. Inclui perfil, posts, assinaturas e histórico.
        </p>

        <div className="p-4 bg-blue-600/20 border border-blue-500/50 rounded-lg">
          <p className="text-blue-200 text-sm">
            <strong>Conformidade LGPD/GDPR:</strong> Você tem o direito de acessar todos os seus dados pessoais armazenados em nossa plataforma.
          </p>
        </div>

        <button
          onClick={handleDownloadData}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition font-medium flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Baixar Meus Dados
        </button>
      </div>

      {/* Data Storage */}
      <div className="space-y-4 pt-6 border-t border-white/20">
        <h3 className="text-lg font-semibold text-white">Armazenamento de Dados</h3>

        <div className="space-y-3">
          {[
            { label: 'Posts Criados', value: '24' },
            { label: 'Imagens Geradas', value: '156' },
            { label: 'Espaço Utilizado', value: '2.4 GB de 10 GB' },
            { label: 'Backup Automático', value: 'Ativado' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-lg">
              <span className="text-white">{item.label}</span>
              <span className="text-gray-400 font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Retention */}
      <div className="space-y-4 pt-6 border-t border-white/20">
        <h3 className="text-lg font-semibold text-white">Retenção de Dados</h3>

        <div className="space-y-3">
          <div className="p-4 bg-white/10 border border-white/20 rounded-lg">
            <p className="text-white font-medium mb-2">Dados Ativos</p>
            <p className="text-sm text-gray-400">Mantidos enquanto sua conta estiver ativa</p>
          </div>

          <div className="p-4 bg-white/10 border border-white/20 rounded-lg">
            <p className="text-white font-medium mb-2">Dados de Backup</p>
            <p className="text-sm text-gray-400">Mantidos por 30 dias após deleção</p>
          </div>

          <div className="p-4 bg-white/10 border border-white/20 rounded-lg">
            <p className="text-white font-medium mb-2">Logs e Análises</p>
            <p className="text-sm text-gray-400">Mantidos por 90 dias para segurança</p>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="space-y-4 pt-6 border-t border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-6 h-6 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Deletar Conta</h3>
        </div>

        <div className="p-4 bg-red-600/20 border border-red-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-200 font-medium mb-2">Ação Irreversível</p>
              <p className="text-sm text-red-200/80">
                Deletar sua conta removerá permanentemente todos os seus dados, posts, imagens e histórico. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-6 py-3 bg-red-600/50 hover:bg-red-600 text-red-200 rounded-lg transition font-medium"
          >
            Deletar Minha Conta
          </button>
        ) : (
          <div className="space-y-4 p-6 bg-red-600/20 border border-red-500/50 rounded-lg">
            <p className="text-white font-medium">Confirmar Deleção de Conta</p>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Digite sua senha para confirmar:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                placeholder="Sua senha"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-50"
              >
                Deletar Permanentemente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
