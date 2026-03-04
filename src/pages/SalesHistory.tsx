import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download,
  Loader2,
  Car,
  User,
  CreditCard,
  Hash,
  Smartphone,
  Trash2,
  Edit,
  X,
  Phone,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const SalesHistory: React.FC = () => {
  const { token, shop } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterPayment, setFilterPayment] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    plate: '',
    vehicle: '',
    date: '',
    payment_method: '',
    items: [] as any[]
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = filterDate 
        ? `/api/sales/history?startDate=${filterDate}&endDate=${filterDate}`
        : '/api/sales/history';
        
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchItems();
  }, [token, filterDate]);

  const handleDelete = async (id: number) => {
    console.log('handleDelete called for Sale ID:', id);
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchHistory();
      } else {
        alert('Erro ao excluir: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao excluir registro');
    }
  };

  const exportToWhatsApp = () => {
    if (filteredHistory.length === 0) return;

    let message = `*Relatório de Serviços - ${shop?.name}*\n`;
    message += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    filteredHistory.forEach((h, i) => {
      const date = new Date(h.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      message += `${i + 1}. *${h.item_name}* (${date})\n`;
      message += `   Veículo: ${h.customer_vehicle || 'N/A'} | Placa: ${h.customer_plate || 'N/A'}\n`;
      message += `   Valor: R$ ${(h.price * h.quantity).toFixed(2)}\n\n`;
    });

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEditClick = (sale: any) => {
    setEditingSale(sale);
    setEditFormData({
      name: sale.customer_name || '',
      phone: sale.customer_phone || '',
      plate: sale.customer_plate || '',
      vehicle: sale.customer_vehicle || '',
      date: sale.created_at ? new Date(sale.created_at).toISOString().split('T')[0] : '',
      payment_method: sale.payment_methods?.split(', ')[0] || 'money',
      items: sale.items || []
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    try {
      const res = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchHistory();
      } else {
        alert('Erro ao atualizar: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao atualizar dados');
    }
  };

  const filteredHistory = history.filter(h => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = h.items?.some((item: any) => item.item_name?.toLowerCase().includes(searchLower)) ||
      h.customer_name?.toLowerCase().includes(searchLower) ||
      h.customer_vehicle?.toLowerCase().includes(searchLower) ||
      h.customer_plate?.toLowerCase().includes(searchLower);
    
    const matchesPayment = !filterPayment || h.payment_methods?.includes(filterPayment);
    
    return matchesSearch && matchesPayment;
  });

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Histórico de Serviços</h1>
          <p className="text-zinc-400">Lista detalhada de todos os serviços prestados</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToWhatsApp}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20"
          >
            <Smartphone size={18} />
            Exportar p/ WhatsApp
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por serviço, cliente ou placa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 pl-12 pr-4 py-4 text-white focus:border-orange-500 backdrop-blur-xl"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 backdrop-blur-xl">
          <Filter size={20} className="text-zinc-500" />
          <select 
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value)}
            className="bg-transparent text-white text-sm outline-none cursor-pointer"
          >
            <option value="" className="bg-zinc-900">Todos Pagamentos</option>
            <option value="money" className="bg-zinc-900">Dinheiro</option>
            <option value="pix" className="bg-zinc-900">PIX</option>
            <option value="debit" className="bg-zinc-900">Débito</option>
            <option value="credit" className="bg-zinc-900">Crédito</option>
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 backdrop-blur-xl">
          <Calendar size={20} className="text-zinc-500" />
          <input 
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="bg-transparent text-white text-sm outline-none"
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')}
              className="text-zinc-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
            <p className="text-zinc-500 font-medium">Carregando histórico...</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          filteredHistory.map((h, i) => (
            <motion.div 
              key={h.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-xl hover:border-zinc-700 transition-all"
            >
              {/* Header: Date and Price */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {new Date(h.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">
                      {new Date(h.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Valor Total</p>
                  <p className="text-xl font-black text-orange-500">R$ {h.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Body: Service and Vehicle */}
              <div className="grid gap-4 sm:grid-cols-2 border-t border-zinc-800/50 pt-4">
                <div className="space-y-3">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Serviços / Produtos</p>
                  {h.items?.map((item: any, idx: number) => (
                    <div key={idx} className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-800/50">
                      <h3 className="text-sm font-black text-white leading-tight">{item.item_name}</h3>
                      <div className="flex gap-2 mt-2">
                        <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/50 px-2 py-0.5 border border-zinc-800">
                          <span className="text-[8px] text-zinc-500 font-bold uppercase">Rodas</span>
                          <span className="text-[10px] font-black text-white">{item.wheels_count || 1}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/50 px-2 py-0.5 border border-zinc-800">
                          <span className="text-[8px] text-zinc-500 font-bold uppercase">Qtd</span>
                          <span className="text-[10px] font-black text-white">{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/50 px-2 py-0.5 border border-zinc-800">
                          <span className="text-[8px] text-zinc-500 font-bold uppercase">Preço</span>
                          <span className="text-[10px] font-black text-orange-500">R$ {item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Veículo / Cliente</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Car size={16} className="text-orange-500" />
                      <span className="text-sm">{h.customer_vehicle || 'Veículo não inf.'}</span>
                    </div>
                    {h.customer_plate && (
                      <div className="inline-flex items-center gap-2 rounded-md bg-orange-500/10 px-2 py-1 text-[10px] font-mono font-black text-orange-500 uppercase tracking-widest border border-orange-500/20">
                        <Hash size={12} />
                        <span>{h.customer_plate}</span>
                      </div>
                    )}
                    {h.customer_name && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <User size={14} className="text-zinc-600" />
                        <span>{h.customer_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer: Payments and Actions */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-800 pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {h.payment_methods?.split(', ').map((method: string, idx: number) => {
                    const labels: Record<string, string> = {
                      money: 'Dinheiro',
                      pix: 'PIX',
                      debit: 'Débito',
                      credit: 'Crédito'
                    };
                    return (
                      <span key={idx} className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase border border-zinc-700">
                        {labels[method] || method}
                      </span>
                    );
                  })}
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      let msg = `*Atendimento - ${shop?.name}*\n\n`;
                      h.items?.forEach((item: any) => {
                        msg += `*${item.item_name}*\n`;
                        msg += `Rodas: ${item.wheels_count || 1} | Qtd: ${item.quantity}\n`;
                        msg += `Preço: R$ ${item.price.toFixed(2)}\n\n`;
                      });
                      msg += `*Total: R$ ${h.total.toFixed(2)}*\n`;
                      msg += `Veículo: ${h.customer_vehicle || 'N/A'}\n`;
                      msg += `Placa: ${h.customer_plate || 'N/A'}`;
                      window.open(`https://wa.me/${h.customer_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all font-bold text-xs"
                  >
                    <Smartphone size={16} />
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => handleEditClick(h)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-bold text-xs"
                  >
                    <Edit size={16} />
                    Editar
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(h.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-xs"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30">
            <p className="text-zinc-500 font-medium">Nenhum serviço encontrado para sua busca.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                console.log('Backdrop clicked, closing modal');
                setDeleteConfirmId(null);
              }}
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 text-red-500 mb-6">
                <div className="p-3 rounded-2xl bg-red-500/10">
                  <Trash2 size={28} />
                </div>
                <h3 className="text-xl font-bold text-white">Confirmar Exclusão</h3>
              </div>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita e o estoque será devolvido.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-4 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Editar Serviço</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateSale} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Data do Serviço</label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Forma de Pagamento</label>
                    <select
                      value={editFormData.payment_method}
                      onChange={e => setEditFormData({ ...editFormData, payment_method: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-orange-500"
                    >
                      <option value="money">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="debit">Débito</option>
                      <option value="credit">Crédito</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Itens do Atendimento</p>
                    <button 
                      type="button"
                      onClick={() => setEditFormData({
                        ...editFormData,
                        items: [...editFormData.items, { item_id: items[0]?.id, quantity: 1, price: items[0]?.price || 0, wheels_count: 1 }]
                      })}
                      className="text-orange-500 text-xs font-bold flex items-center gap-1"
                    >
                      <Plus size={14} /> Adicionar Item
                    </button>
                  </div>
                  
                  {editFormData.items.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase">Item {idx + 1}</span>
                        <button 
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, items: editFormData.items.filter((_, i) => i !== idx) })}
                          className="text-red-500/50 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <select
                        value={item.item_id}
                        onChange={e => {
                          const selected = items.find(i => i.id === parseInt(e.target.value));
                          const newItems = [...editFormData.items];
                          newItems[idx] = { ...newItems[idx], item_id: parseInt(e.target.value), price: selected?.price || 0 };
                          setEditFormData({ ...editFormData, items: newItems });
                        }}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-orange-500"
                      >
                        {items.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Preço</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={e => {
                              const newItems = [...editFormData.items];
                              newItems[idx] = { ...newItems[idx], price: parseFloat(e.target.value) || 0 };
                              setEditFormData({ ...editFormData, items: newItems });
                            }}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Qtd</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => {
                              const newItems = [...editFormData.items];
                              newItems[idx] = { ...newItems[idx], quantity: parseInt(e.target.value) || 1 };
                              setEditFormData({ ...editFormData, items: newItems });
                            }}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Rodas</label>
                          <input
                            type="number"
                            value={item.wheels_count}
                            onChange={e => {
                              const newItems = [...editFormData.items];
                              newItems[idx] = { ...newItems[idx], wheels_count: parseInt(e.target.value) || 1 };
                              setEditFormData({ ...editFormData, items: newItems });
                            }}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-800 pt-4 mt-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Dados do Cliente</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400">Veículo (Modelo)</label>
                  <div className="relative mt-1">
                    <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      value={editFormData.vehicle}
                      onChange={e => setEditFormData({ ...editFormData, vehicle: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500"
                      placeholder="Ex: Toyota Corolla"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400">Placa</label>
                  <div className="relative mt-1">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      value={editFormData.plate}
                      onChange={e => setEditFormData({ ...editFormData, plate: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500"
                      placeholder="ABC-1234"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400">Nome do Cliente</label>
                  <div className="relative mt-1">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500"
                      placeholder="Nome do Cliente"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400">Telefone</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full rounded-xl bg-orange-600 py-4 text-lg font-bold text-white transition-all hover:bg-orange-500 shadow-lg shadow-orange-600/20"
                >
                  Salvar Alterações
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
