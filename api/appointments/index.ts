import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { authenticate } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const shopId = authenticate(req);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customers (name, plate, vehicle)
        `)
        .eq('shop_id', shopId)
        .order('scheduled_at', { ascending: true });

      if (error) return res.status(500).json({ error: error.message });

      const appointments = data.map((a: any) => ({
        ...a,
        customer_name: a.customers?.name,
        customer_plate: a.customers?.plate,
        customer_vehicle: a.customers?.vehicle
      }));

      return res.json(appointments);
    }

    if (req.method === 'POST') {
      const { customerId, description, scheduledAt, customerName, customerPlate, customerVehicle } = req.body;
      
      try {
        let finalCustomerId = customerId;
        if (!finalCustomerId && (customerName || customerPlate || customerVehicle)) {
          const { data: cust, error: custErr } = await supabase
            .from('customers')
            .insert([{ shop_id: shopId, name: customerName || 'Consumidor', plate: customerPlate, vehicle: customerVehicle }])
            .select()
            .single();
          if (custErr) throw custErr;
          finalCustomerId = cust.id;
        }

        const { data, error } = await supabase
          .from('appointments')
          .insert([{ shop_id: shopId, customer_id: finalCustomerId, description, scheduled_at: scheduledAt }])
          .select()
          .single();

        if (error) throw error;
        return res.json(data);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}
