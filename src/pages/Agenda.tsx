import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Car, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  Camera,
  Image as ImageIcon,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { APPOINTMENT_STATUS } from '../constants';

export const Agenda: React.FC = () => {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPlate: '',
    customerVehicle: '',
    description: '',
    time: '08:00'
  });

  // Status Form State
  const [statusFormData, setStatusFormData] = useState({
    status: '',
    description: '',
    photo: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i));

  const filteredAppointments = appointments.filter(a => 
    isSameDay(new Date(a.scheduled_at), selectedDate)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = formData.time.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          description: formData.description,
          scheduledAt: scheduledAt.toISOString(),
          customerName: formData.customerName,
          customerPlate: formData.customerPlate,
          customerVehicle: formData.customerVehicle
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ customerName: '', customerPlate: '', customerVehicle: '', description: '', time: '08:00' });
        fetchAppointments();
      }
    } catch (err) {
      alert('Erro ao agendar');
    }
  };

  const handleStatusClick = (app: any) => {
    setSelectedAppointment(app);
    setStatusFormData({
      status: app.status,
      description: app.status_description || '',
      photo: app.photo || ''
    });
    setIsStatusModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStatusFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: statusFormData.status,
          status_description: statusFormData.description,
          photo: statusFormData.photo
        })
      });
      if (res.ok) {
        setIsStatusModalOpen(false);
        fetchAppointments();
      } else {
        alert('Erro ao atualizar status');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao atualizar status');
    }
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Agenda</h1>
          <p className="text-zinc-400">Serviços agendados e compromissos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
        >
          <Plus size={24} />
          Novo Agendamento
        </button>
      </header>

      {/* Date Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "flex min-w-[80px] flex-col items-center rounded-2xl p-4 transition-all",
                isSelected 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                  : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800"
              )}
            >
              <span className="text-xs font-medium uppercase">{format(day, 'EEE', { locale: ptBR })}</span>
              <span className="text-xl font-bold">{format(day, 'dd')}</span>
            </button>
          );
        })}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">
          {isSameDay(selectedDate, startOfToday()) ? 'Hoje' : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </h3>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-emerald-500" size={48} />
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl"
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center border-r border-zinc-800 pr-6">
                  <Clock size={20} className="text-emerald-500 mb-1" />
                  <span className="text-lg font-black text-white">{format(new Date(app.scheduled_at), 'HH:mm')}</span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                      APPOINTMENT_STATUS.find(s => s.id === app.status)?.color || 'bg-zinc-700'
                    )}>
                      {APPOINTMENT_STATUS.find(s => s.id === app.status)?.label}
                    </span>
                    <button 
                      onClick={() => handleStatusClick(app)}
                      className="text-zinc-600 hover:text-white p-1"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white">{app.description}</h4>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{app.customer_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car size={14} />
                      <span className="font-mono">{app.customer_plate || 'N/A'}</span>
                    </div>
                    {app.customer_vehicle && (
                      <div className="flex items-center gap-1">
                        <Car size={14} />
                        <span>{app.customer_vehicle}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Description & Photo */}
              {(app.status_description || app.photo) && (
                <div className="mt-2 space-y-4 border-t border-zinc-800 pt-4">
                  {app.status_description && (
                    <div className="flex gap-3 rounded-2xl bg-zinc-950/50 p-4">
                      <AlertCircle size={18} className="text-zinc-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Observação do Status</p>
                        <p className="text-sm text-zinc-300 italic">"{app.status_description}"</p>
                      </div>
                    </div>
                  )}
                  {app.photo && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800">
                      <img 
                        src={app.photo} 
                        alt="Foto do serviço" 
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <CalendarIcon size={48} className="mb-4 opacity-20" />
            <p>Nenhum serviço agendado para este dia.</p>
          </div>
        )}
      </div>

      {/* New Appointment Modal */}
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
                <h2 className="text-2xl font-bold text-white">Novo Agendamento</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-zinc-400">Descrição do Serviço</label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-emerald-500"
                      placeholder="Ex: Troca de Pneu Dianteiro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Horário</label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Data</label>
                    <div className="mt-1 flex h-[50px] items-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-300">
                      {format(selectedDate, 'dd/MM/yyyy')}
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4 mt-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Dados do Cliente (Opcional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Placa"
                      value={formData.customerPlate}
                      onChange={e => setFormData({ ...formData, customerPlate: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Veículo (Ex: Honda Biz)"
                      value={formData.customerVehicle}
                      onChange={e => setFormData({ ...formData, customerVehicle: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white transition-all hover:bg-emerald-500"
                >
                  Agendar Serviço
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Status Update Modal */}
        {isStatusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Atualizar Status</h2>
                  <p className="text-sm text-zinc-500">{selectedAppointment?.description}</p>
                </div>
                <button onClick={() => setIsStatusModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleStatusUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-3">Novo Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {APPOINTMENT_STATUS.map(status => (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setStatusFormData({ ...statusFormData, status: status.id })}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold transition-all border",
                          statusFormData.status === status.id
                            ? `${status.color} text-white border-transparent shadow-lg`
                            : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Descrição / Motivo</label>
                  <textarea
                    value={statusFormData.description}
                    onChange={e => setStatusFormData({ ...statusFormData, description: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-emerald-500 min-h-[100px]"
                    placeholder="Ex: Aguardando peça chegar..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Foto do Serviço</label>
                  <div className="flex flex-col gap-4">
                    {statusFormData.photo ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800">
                        <img src={statusFormData.photo} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setStatusFormData({ ...statusFormData, photo: '' })}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white shadow-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 py-10 text-zinc-500 hover:border-emerald-500/50 hover:text-emerald-500 transition-all"
                      >
                        <Camera size={32} />
                        <span className="text-sm font-bold">Tirar Foto ou Subir Arquivo</span>
                      </button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                >
                  Salvar Atualização
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
