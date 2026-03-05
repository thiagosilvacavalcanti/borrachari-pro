import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { authenticate } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const shopId = authenticate(req);

    if (req.method === 'GET') {
      const { startDate, endDate } = req.query;
      
      let query = supabase
        .from('sales')
        .select(`
          id,
          created_at,
          total,
          customers (
            name,
            plate,
            vehicle,
            phone
          ),
          payments (method, amount),
          sale_items (
            id,
            quantity,
            price,
            wheels_count,
            item_id,
            items (name)
          )
        `)
        .eq('shop_id', shopId);

      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00Z');
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59Z');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const history = data.map((s: any) => ({
        id: s.id,
        created_at: s.created_at,
        total: s.total,
        customer_name: s.customers?.name,
        customer_plate: s.customers?.plate,
        customer_vehicle: s.customers?.vehicle,
        customer_phone: s.customers?.phone,
        payment_methods: s.payments?.map((p: any) => p.method).join(', '),
        items: s.sale_items.map((si: any) => ({
          id: si.id,
          item_id: si.item_id,
          item_name: si.items?.name,
          quantity: si.quantity,
          price: si.price,
          wheels_count: si.wheels_count
        }))
      }));

      return res.json(history);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}
