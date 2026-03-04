import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Plus,
  Trash2,
  Tag,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Financial: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Geral'
  });

  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, expensesRes] = await Promise.all([
        fetch('/api/reports/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/expenses', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (!dashboardRes.ok || !expensesRes.ok) {
        throw new Error('Erro ao carregar dados financeiros');
      }

      const dashboardJson = await dashboardRes.json();
      const expensesJson = await expensesRes.json();
      
      setData(dashboardJson);
      setExpenses(expensesJson);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount)
        })
      });
      
      if (res.ok) {
        setIsExpenseModalOpen(false);
        setExpenseForm({ description: '', amount: '', category: 'Geral' });
        fetchData();
      } else {
        alert('Erro ao salvar despesa');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar despesa');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Deseja excluir esta despesa?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erro ao excluir despesa');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir despesa');
    }
  };

  if (loading && !data) return (
    <div className="flex h-96 flex-col items-center justify-center text-zinc-500">
      <Loader2 className="animate-spin mb-4 text-orange-500" size={48} />
      <p className="animate-pulse">Carregando dados financeiros...</p>
    </div>
  );

  if (error && !data) return (
    <div className="flex h-96 flex-col items-center justify-center text-center p-6">
      <div className="bg-red-500/10 p-4 rounded-full text-red-500 mb-4">
        <TrendingDown size={48} />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado.</h2>
      <p className="text-zinc-400 mb-6 max-w-sm">{error}</p>
      <button 
        onClick={fetchData}
        className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-xl transition-all"
      >
        Tentar Novamente
      </button>
    </div>
  );

  const netBalance = (data?.monthRevenue || 0) - (data?.monthExpenses || 0);

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Financeiro</h1>
          <p className="text-zinc-400">Controle de caixa, despesas e comissões</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all"
          >
            <Plus size={18} />
            Nova Despesa
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-500">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-500">Entradas (Mês)</p>
            <p className="text-2xl font-black text-white">R$ {data?.monthRevenue?.toFixed(2) || '0,00'}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-red-500/10 p-3 text-red-500">
              <TrendingDown size={24} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-500">Saídas (Mês)</p>
            <p className="text-2xl font-black text-white">R$ {data?.monthExpenses?.toFixed(2) || '0,00'}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-500">Comissões (Hoje)</p>
            <p className="text-2xl font-black text-white">R$ {data?.todayCommissions?.toFixed(2) || '0,00'}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "rounded-3xl border border-zinc-800 p-6 shadow-xl",
            netBalance >= 0 ? "bg-orange-600 shadow-orange-600/20" : "bg-red-600 shadow-red-600/20"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-white/20 p-3 text-white">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-white/80">Saldo Líquido</p>
            <p className="text-2xl font-black text-white">R$ {netBalance.toFixed(2)}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Expenses */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Despesas Recentes</h3>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Saídas</span>
          </div>
          <div className="space-y-4">
            {expenses.length > 0 ? expenses.slice(0, 5).map((exp: any) => (
              <div key={exp.id} className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                    <ArrowDownRight size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{exp.description}</p>
                    <p className="text-xs text-zinc-500">
                      {exp.category} • {new Date(exp.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-red-500">
                    - R$ {exp.amount.toFixed(2)}
                  </span>
                  <button 
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )) : (
              <p className="text-center text-zinc-500 py-4">Nenhuma despesa registrada</p>
            )}
          </div>
        </motion.div>

        {/* Recent Sales */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Entradas Recentes</h3>
            <Link to="/historico" className="text-sm font-bold text-orange-500">Ver tudo</Link>
          </div>
          <div className="space-y-4">
            {data?.recentSales?.length > 0 ? data.recentSales.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{tx.customer_name || 'Consumidor'}</p>
                    <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleDateString('pt-BR')} {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span className="font-black text-orange-500">
                  + R$ {tx.total.toFixed(2)}
                </span>
              </div>
            )) : (
              <p className="text-center text-zinc-500 py-4">Nenhuma transação recente</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Expense Modal */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl"
            >
              <h2 className="mb-6 text-2xl font-bold text-white">Adicionar Despesa</h2>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400">Descrição</label>
                  <div className="relative mt-1">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      required
                      value={expenseForm.description}
                      onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="Ex: Aluguel, Luz, Ferramentas..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400">Valor (R$)</label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400">Categoria</label>
                  <div className="relative mt-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <select
                      value={expenseForm.category}
                      onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Geral">Geral</option>
                      <option value="Aluguel">Aluguel</option>
                      <option value="Utilidades">Utilidades (Luz/Água)</option>
                      <option value="Ferramentas">Ferramentas</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="flex-1 rounded-xl bg-zinc-800 py-4 font-bold text-white hover:bg-zinc-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-orange-600 py-4 font-bold text-white hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
