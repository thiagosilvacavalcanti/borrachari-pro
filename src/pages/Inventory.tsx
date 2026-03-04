import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  Wrench, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ITEM_TYPES } from '../constants';

export const Inventory: React.FC = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'service',
    price: '',
    commission: '',
    stock: ''
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          commission: parseFloat(formData.commission) || 0,
          stock: parseInt(formData.stock) || 0
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ name: '', type: 'service', price: '', commission: '', stock: '' });
        fetchItems();
      }
    } catch (err) {
      alert('Erro ao salvar item');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      price: item.price.toString(),
      commission: item.commission.toString(),
      stock: item.stock.toString()
    });
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(i => 
    i.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Estoque & Serviços</h1>
          <p className="text-zinc-400">Gerencie seus produtos e serviços</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setFormData({ name: '', type: 'service', price: '', commission: '', stock: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-500"
        >
          <Plus size={24} />
          Novo Item
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por nome..."
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
        ) : filteredItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl transition-all hover:border-orange-500/50"
          >
            <div className="flex items-start justify-between">
              <div className={cn(
                "rounded-2xl p-3",
                item.type === 'service' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
              )}>
                {item.type === 'service' ? <Wrench size={24} /> : <Package size={24} />}
              </div>
              <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => handleEdit(item)} className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white">
                  <Edit2 size={16} />
                </button>
                <button className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-bold text-white">{item.name}</h3>
              <p className="text-sm text-zinc-500">{item.type === 'service' ? 'Serviço' : 'Produto'}</p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Preço</p>
                <p className="text-lg font-black text-orange-500">R$ {item.price.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Comissão</p>
                <p className="text-lg font-bold text-blue-400">R$ {item.commission.toFixed(2)}</p>
              </div>
            </div>

            {item.type === 'product' && (
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      item.stock > 10 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(100, (item.stock / 50) * 100)}%` }}
                  />
                </div>
                <span className={cn(
                  "text-xs font-bold",
                  item.stock > 10 ? "text-orange-500" : "text-red-500"
                )}>
                  {item.stock} em estoque
                </span>
                {item.stock <= 5 && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingItem ? 'Editar Item' : 'Novo Item'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-orange-500"
                    placeholder="Ex: Remendo Interno"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400">Tipo</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {ITEM_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id as any })}
                        className={cn(
                          "rounded-xl border p-3 font-bold transition-all",
                          formData.type === type.id 
                            ? "border-orange-500 bg-orange-500/10 text-orange-500" 
                            : "border-zinc-800 bg-zinc-950 text-zinc-500"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Preço Base (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Comissão (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.commission}
                      onChange={e => setFormData({ ...formData, commission: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-orange-500"
                    />
                  </div>
                </div>

                {formData.type === 'product' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Estoque Inicial</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-orange-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-6 w-full rounded-xl bg-orange-600 py-4 text-lg font-bold text-white transition-all hover:bg-orange-500"
                >
                  Salvar Item
                </button>
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
