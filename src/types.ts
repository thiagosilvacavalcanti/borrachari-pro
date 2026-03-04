export interface Shop {
  id: number;
  name: string;
  email: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  plate?: string;
  vehicle?: string;
}

export interface Item {
  id: number;
  name: string;
  type: 'service' | 'product';
  price: number;
  commission: number;
  stock: number;
}

export interface SaleItem extends Item {
  quantity: number;
  wheels_count?: number;
  context?: string;
}

export interface Payment {
  method: 'money' | 'pix' | 'debit' | 'credit';
  amount: number;
}

export interface Sale {
  id: number;
  customer_id?: number;
  total: number;
  created_at: string;
  items: SaleItem[];
  payments: Payment[];
}

export interface Appointment {
  id: number;
  customer_id?: number;
  customer_name?: string;
  customer_plate?: string;
  description: string;
  scheduled_at: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
