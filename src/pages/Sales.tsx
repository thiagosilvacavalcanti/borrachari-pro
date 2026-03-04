import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  User, 
  Car, 
  Phone, 
  ChevronRight, 
  Check,
  Smartphone,
  CreditCard,
  Banknote,
  QrCode,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { calculateTotal, generateWhatsAppMessage } from '../utils/pricing';
import { PAYMENT_METHODS } from '../constants';

export const Sales: React.FC = () => {
  const { token, shop } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Customer/Items, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [customer, setCustomer] = useState({ name: '', phone: '', plate: '', vehicle: '', id: null });
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([{ method: 'money', amount: 0 }]);
  
  // Master Data
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      const res = await fetch('/api/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAvailableItems(data);
    };
    fetchItems();
  }, [token]);

  const addItem = (item: any) => {
    const existing = selectedItems.find(i => i.id === item.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1, wheels_count: 1, context: 'tire_1' }]);
    }
    setSearchTerm('');
  };

  const removeItem = (id: number) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  const { total } = calculateTotal(selectedItems);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customer,
          items: selectedItems,
          payments,
          total,
          createdAt: saleDate ? new Date(saleDate + 'T12:00:00').toISOString() : undefined
        })
      });
      if (res.ok) {
        setStep(3);
      }
    } catch (err) {
      alert('Erro ao finalizar venda');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = availableItems.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendWhatsApp = () => {
    const message = generateWhatsAppMessage(shop?.name || '', customer, selectedItems, payments, total);
    window.open(`https://wa.me/${customer.phone?.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">Novo Atendimento</h1>
              <span className="text-sm text-zinc-500">Passo 1 de 2</span>
            </div>

            {/* Customer Section */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-orange-500 font-bold">
                  <User size={20} />
                  <span>Cliente</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-bold uppercase">Data do Atendimento:</span>
                  <input 
                    type="date"
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Nome do Cliente"
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-orange-500"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    placeholder="Telefone"
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500"
                  />
                </div>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    placeholder="Veículo (Modelo)"
                    value={customer.vehicle}
                    onChange={e => setCustomer({ ...customer, vehicle: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500"
                  />
                </div>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    placeholder="Placa"
                    value={customer.plate}
                    onChange={e => setCustomer({ ...customer, plate: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-3 text-white focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="relative z-20 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2 text-orange-500 font-bold mb-2">
                <Plus size={20} />
                <span>Serviços e Produtos</span>
              </div>
              
              <div className="relative z-30">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Pesquisar serviço ou produto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-12 pr-4 py-4 text-white focus:border-orange-500 text-lg"
                />
                
                {searchTerm && (
                  <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl">
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => addItem(item)}
                          className="flex w-full items-center justify-between rounded-xl p-4 hover:bg-zinc-800 text-left"
                        >
                          <div>
                            <p className="font-bold text-white">{item.name}</p>
                            <p className="text-sm text-zinc-500">{item.type === 'service' ? 'Serviço' : 'Produto'}</p>
                          </div>
                          <span className="font-bold text-orange-500">R$ {item.price.toFixed(2)}</span>
                        </button>
                      ))
                    ) : (
                      <p className="p-4 text-center text-zinc-500">Nenhum item encontrado</p>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Items List */}
              <div className="space-y-3">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-zinc-950 p-4 border border-zinc-800 gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-white">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-2 py-1">
                          <span className="text-[10px] text-zinc-500 font-bold">Rodas:</span>
                          <button 
                            onClick={() => setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, wheels_count: Math.max(1, i.wheels_count - 1) } : i))}
                            className="text-zinc-400 hover:text-white p-1"
                          >-</button>
                          <span className="text-white font-bold min-w-[20px] text-center">{item.wheels_count || 1}</span>
                          <button 
                            onClick={() => setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, wheels_count: (i.wheels_count || 1) + 1 } : i))}
                            className="text-zinc-400 hover:text-white p-1"
                          >+</button>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-2 py-1">
                          <span className="text-[10px] text-zinc-500 font-bold">Qtd:</span>
                          <button 
                            onClick={() => setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                            className="text-zinc-400 hover:text-white p-1"
                          >-</button>
                          <span className="text-white font-bold min-w-[20px] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))}
                            className="text-zinc-400 hover:text-white p-1"
                          >+</button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-zinc-900 pt-3 sm:border-0 sm:pt-0">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-zinc-500 font-bold">R$</span>
                          <input 
                            type="number"
                            value={item.price}
                            onChange={e => setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, price: parseFloat(e.target.value) || 0 } : i))}
                            className="w-20 bg-zinc-900 text-white font-bold text-right rounded-lg px-2 py-1 border border-zinc-800 focus:border-orange-500 focus:ring-0"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1">Total: R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-red-500/50 hover:text-red-500 p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="mt-8 lg:relative lg:bottom-0 lg:p-0">
              <button
                disabled={selectedItems.length === 0}
                onClick={() => {
                  setPayments([{ method: 'money', amount: total }]);
                  setStep(2);
                }}
                className="flex w-full items-center justify-between rounded-2xl bg-orange-600 p-5 text-white shadow-xl shadow-orange-600/20 disabled:opacity-50 transition-all active:scale-95"
              >
                <div className="text-left">
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Total a pagar</p>
                  <p className="text-2xl font-black">R$ {total.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 font-bold">
                  Continuar
                  <ChevronRight size={24} />
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setStep(1)} className="rounded-xl bg-zinc-900 p-2 text-zinc-400">
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Pagamento</h1>
                <p className="text-zinc-500">Selecione como o cliente vai pagar</p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl space-y-6">
              <div className="text-center py-4">
                <p className="text-sm text-zinc-500 uppercase tracking-widest">Valor Total</p>
                <p className="text-5xl font-black text-white">R$ {total.toFixed(2)}</p>
              </div>

              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <div key={index} className="space-y-3 rounded-2xl bg-zinc-950 p-4 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-500">Método {index + 1}</span>
                      {payments.length > 1 && (
                        <button 
                          onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                          className="text-red-500 text-xs font-bold"
                        >Remover</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map(method => (
                        <button
                          key={method.id}
                          onClick={() => {
                            const newPayments = [...payments];
                            newPayments[index].method = method.id;
                            setPayments(newPayments);
                          }}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border p-3 transition-all",
                            payment.method === method.id 
                              ? "border-orange-500 bg-orange-500/10 text-orange-500" 
                              : "border-zinc-800 bg-zinc-900 text-zinc-400"
                          )}
                        >
                          {method.id === 'money' && <Banknote size={18} />}
                          {method.id === 'pix' && <QrCode size={18} />}
                          {method.id === 'debit' && <CreditCard size={18} />}
                          {method.id === 'credit' && <CreditCard size={18} />}
                          <span className="text-xs font-bold">{method.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={e => {
                          const newPayments = [...payments];
                          newPayments[index].amount = parseFloat(e.target.value) || 0;
                          setPayments(newPayments);
                        }}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-3 text-white font-bold text-xl"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setPayments([...payments, { method: 'pix', amount: 0 }])}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 p-4 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-all"
                >
                  <Plus size={20} />
                  Adicionar outro tipo de pagamento
                </button>
              </div>

              {/* Validation */}
              {Math.abs(payments.reduce((acc, p) => acc + p.amount, 0) - total) > 0.01 && (
                <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20 text-center">
                  A soma dos pagamentos (R$ {payments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}) não bate com o total.
                </div>
              )}
            </div>

            <button
              disabled={loading || Math.abs(payments.reduce((acc, p) => acc + p.amount, 0) - total) > 0.01}
              onClick={handleFinish}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 py-5 text-xl font-black text-white shadow-xl shadow-orange-600/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  <Check size={28} />
                  Finalizar Atendimento
                </>
              )}
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8 py-12 text-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-500 text-white shadow-2xl shadow-orange-500/40">
              <Check size={48} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">Sucesso!</h1>
              <p className="mt-2 text-zinc-400">Atendimento finalizado e registrado.</p>
            </div>

            <div className="w-full space-y-4">
              <button
                onClick={sendWhatsApp}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] py-5 text-xl font-bold text-white shadow-xl shadow-[#25D366]/20 transition-all active:scale-95"
              >
                <Smartphone size={28} />
                Enviar no WhatsApp
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-zinc-800 py-5 text-xl font-bold text-white transition-all active:scale-95"
              >
                Voltar ao Início
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
