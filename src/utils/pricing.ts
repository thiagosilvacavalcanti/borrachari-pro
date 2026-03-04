import { SaleItem } from '../types';

export const calculateTotal = (items: SaleItem[]) => {
  let total = 0;
  
  const processedItems = items.map(item => {
    total += item.price * item.quantity;
    return { ...item, finalPrice: item.price };
  });

  return { total, processedItems };
};

export const generateWhatsAppMessage = (shopName: string, customer: any, items: any[], payments: any[], total: number) => {
  const date = new Date().toLocaleDateString('pt-BR');
  let message = `*BORRACHARIA ${shopName.toUpperCase()}*\n\n`;
  message += `*Cliente:* ${customer.name || 'Consumidor'}\n`;
  if (customer.vehicle) message += `*Veículo:* ${customer.vehicle}\n`;
  if (customer.plate) message += `*Placa:* ${customer.plate}\n`;
  message += `*Data:* ${date}\n\n`;
  
  message += `*Serviços realizados:*\n`;
  items.forEach(item => {
    message += `- ${item.wheels_count || 1} ${item.name} ${item.quantity}: R$ ${(item.price * item.quantity).toFixed(2)}\n`;
  });
  
  message += `\n*Valor Total: R$ ${total.toFixed(2)}*\n\n`;
  
  message += `*Pagamento:*\n`;
  payments.forEach(p => {
    message += `- ${p.method.toUpperCase()}: R$ ${p.amount.toFixed(2)}\n`;
  });
  
  message += `\nObrigado pela preferência!`;
  
  return encodeURIComponent(message);
};
