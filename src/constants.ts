export const PAYMENT_METHODS = [
  { id: 'money', label: 'Dinheiro', icon: 'Banknote' },
  { id: 'pix', label: 'Pix', icon: 'QrCode' },
  { id: 'debit', label: 'Cartão Débito', icon: 'CreditCard' },
  { id: 'credit', label: 'Cartão Crédito', icon: 'CreditCard' },
];

export const ITEM_TYPES = [
  { id: 'service', label: 'Serviço' },
  { id: 'product', label: 'Produto' },
];

export const APPOINTMENT_STATUS = [
  { id: 'scheduled', label: 'Agendado', color: 'bg-blue-500' },
  { id: 'in_progress', label: 'Iniciado', color: 'bg-yellow-500' },
  { id: 'paused', label: 'Pausado', color: 'bg-orange-500' },
  { id: 'completed', label: 'Finalizado', color: 'bg-green-500' },
  { id: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
];
