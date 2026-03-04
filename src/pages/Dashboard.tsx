import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const COLORS = ['#f97316', '#3b82f6', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // 'today', 'week', 'month', 'custom'
  const [customDates, setCustomDates] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const getDates = () => {
    const now = new Date();
    let start = '';
    let end = now.toISOString().split('T')[0];

    if (period === 'today') {
      start = end;
    } else if (period === 'week') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start = lastWeek.toISOString().split('T')[0];
    } else if (period === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = firstDay.toISOString().split('T')[0];
    } else {
      start = customDates.start;
      end = customDates.end;
    }
    return { start, end };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { start, end } = getDates();
        const res = await fetch(`/api/reports/dashboard?startDate=${start}&endDate=${end}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, period, customDates]);

  const stats = [
    { label: 'Faturamento Período', value: `R$ ${data?.periodRevenue?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Comissões Período', value: `R$ ${data?.periodCommissions?.toFixed(2) || '0.00'}`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Despesas Período', value: `R$ ${data?.periodExpenses?.toFixed(2) || '0.00'}`, icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Serviços Realizados', value: data?.topServices?.reduce((acc: number, s: any) => acc + s.count, 0) || 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400">Visão geral da sua borracharia</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mês' },
              { id: 'custom', label: 'Personalizado' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  period === p.id ? "bg-orange-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={customDates.start}
                onChange={e => setCustomDates({ ...customDates, start: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 outline-none"
              />
              <span className="text-zinc-500 text-xs">até</span>
              <input 
                type="date" 
                value={customDates.end}
                onChange={e => setCustomDates({ ...customDates, end: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 outline-none"
              />
            </div>
          )}

          <Link 
            to="/venda"
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-500 active:scale-95"
          >
            <PlusCircle size={24} />
            Novo Serviço
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex h-96 items-center justify-center text-zinc-500">
          <Loader2 className="animate-spin mr-2" />
          Carregando dados...
        </div>
      ) : (
        <>
          {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className={cn("rounded-2xl p-3", stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
                <ArrowUpRight size={14} />
                +12%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl"
        >
          <h3 className="mb-6 text-lg font-bold text-white">
            Faturamento {period === 'today' ? 'de Hoje' : period === 'week' ? 'da Semana' : period === 'month' ? 'do Mês' : 'do Período'}
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.dailySales}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area type="monotone" dataKey="total" stroke="#f97316" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Services */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl"
        >
          <h3 className="mb-6 text-lg font-bold text-white">Serviços mais Realizados</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topServices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} width={100} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#f97316" radius={[0, 8, 8, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Payment Methods */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl lg:col-span-1"
        >
          <h3 className="mb-6 text-lg font-bold text-white">Formas de Pagamento</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="method"
                >
                  {data?.paymentMethods?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {data?.paymentMethods?.map((pm: any, i: number) => (
              <div key={pm.method} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-zinc-400 capitalize">{pm.method}</span>
                </div>
                <span className="font-bold text-white">R$ {pm.total}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Atividades Recentes</h3>
            <Link to="/historico" className="text-sm font-bold text-orange-500">Ver Histórico</Link>
          </div>
          <div className="space-y-4">
            {data?.recentSales?.length > 0 ? data.recentSales.map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-orange-500">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{sale.customer_name || 'Consumidor'}</p>
                    <p className="text-xs text-zinc-500">{new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span className="font-bold text-orange-500">+ R$ {sale.total.toFixed(2)}</span>
              </div>
            )) : (
              <p className="text-center text-zinc-500 py-4">Nenhuma atividade recente</p>
            )}
          </div>
        </motion.div>
      </div>
    </>
    )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
