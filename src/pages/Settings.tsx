import React, { useState, useEffect } from 'react';
import { Github, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export const Settings: React.FC = () => {
  const { token } = useAuth();
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [repoName, setRepoName] = useState('rodolfo-alemao-app');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const newToken = event.data.token;
        setGithubToken(newToken);
        localStorage.setItem('github_token', newToken);
        setStatus({ type: 'success', message: 'GitHub conectado com sucesso!' });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectGitHub = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const { url } = await res.json();
      window.open(url, 'github_auth', 'width=600,height=700');
    } catch (err) {
      setStatus({ type: 'error', message: 'Erro ao iniciar autenticação com GitHub' });
    }
  };

  const handleSync = async () => {
    if (!githubToken) return;
    setSyncing(true);
    setStatus({ type: 'idle', message: '' });
    
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ githubToken, repoName })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ 
          type: 'success', 
          message: `Sincronização concluída! Repositório criado/atualizado.` 
        });
        // Open the repo URL
        if (data.url) {
          window.open(data.url, '_blank');
        }
      } else {
        setStatus({ type: 'error', message: data.error || 'Erro ao sincronizar com GitHub' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Erro de conexão ao sincronizar' });
    } finally {
      setSyncing(false);
    }
  };

  const disconnectGitHub = () => {
    localStorage.removeItem('github_token');
    setGithubToken(null);
    setStatus({ type: 'idle', message: 'GitHub desconectado.' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 lg:pb-0">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações</h1>
        <p className="text-zinc-400">Gerencie integrações e preferências do sistema</p>
      </header>

      <div className="grid gap-6">
        {/* GitHub Sync Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-zinc-800 text-white">
              <Github size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Backup no GitHub</h2>
              <p className="text-sm text-zinc-500">Sincronize o código fonte do seu sistema com sua conta do GitHub</p>
            </div>
          </div>

          <div className="space-y-6">
            {!githubToken ? (
              <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Conexão Segura</h3>
                    <p className="text-sm text-zinc-500">
                      Ao conectar, você autoriza o sistema a criar um repositório privado na sua conta para salvar o código. 
                      Nós não teremos acesso às suas senhas ou outros repositórios.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleConnectGitHub}
                  className="w-full flex items-center justify-center gap-2 bg-white text-zinc-950 font-bold py-4 px-6 rounded-xl hover:bg-zinc-200 transition-all"
                >
                  <Github size={20} />
                  Conectar ao GitHub
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <span className="text-sm font-medium text-emerald-500">GitHub Conectado</span>
                  </div>
                  <button 
                    onClick={disconnectGitHub}
                    className="text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    Desconectar
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Nome do Repositório</label>
                    <input 
                      type="text" 
                      value={repoName}
                      onChange={e => setRepoName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none"
                      placeholder="nome-do-repositorio"
                    />
                  </div>

                  <button 
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 transition-all"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        Sincronizando arquivos...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={20} />
                        Sincronizar Agora
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {status.message && (
              <div className={cn(
                "p-4 rounded-xl flex items-center gap-3 text-sm font-medium",
                status.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              )}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {status.message}
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-4">Por que sincronizar?</h3>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
              <span>Tenha uma cópia de segurança do seu código em um lugar seguro.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
              <span>Acompanhe as mudanças e atualizações que fazemos no sistema.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
              <span>Facilite a hospedagem em outros serviços se desejar no futuro.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
