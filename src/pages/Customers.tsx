import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Car, 
  Phone, 
  History, 
  Plus, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export const Customers: React.FC = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/customers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCustomers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [token]);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.plate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Clientes</h1>
          <p className="text-zinc-400">Histórico e base de dados de clientes</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-500">
          <Plus size={24} />
          Novo Cliente
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por nome ou placa..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 pl-12 pr-4 py-4 text-white focus:border-orange-500 backdrop-blur-xl"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" size={48} />
          </div>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer, i) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl transition-all hover:border-orange-500/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-orange-500">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{customer.name}</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Phone size={14} />
                      <span>{customer.phone || 'N/A'}</span>
                    </div>
                    {customer.vehicle && (
                      <div className="flex items-center gap-2 text-xs text-orange-500 font-medium">
                        <Car size={12} />
                        <span>{customer.vehicle}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-zinc-950 p-4 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Car size={18} className="text-zinc-500" />
                  <span className="font-mono font-bold text-white tracking-widest">{customer.plate || 'N/A'}</span>
                </div>
                <button className="flex items-center gap-1 text-xs font-bold text-orange-500 uppercase tracking-wider">
                  <History size={14} />
                  Histórico
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                <span>Último serviço: 03/03/2026</span>
                <ChevronRight size={16} className="text-zinc-700 group-hover:text-orange-500 transition-colors" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-zinc-500">
            <User size={48} className="mb-4 opacity-20" />
            <p>Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
