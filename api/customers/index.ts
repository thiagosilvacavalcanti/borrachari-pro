import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { authenticate } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const shopId = authenticate(req);

    if (req.method === 'GET') {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId);
      
      if (error) return res.status(500).json({ error: error.message });
      return res.json(customers);
    }

    if (req.method === 'POST') {
      const { name, phone, plate, vehicle } = req.body;
      const { data, error } = await supabase
        .from('customers')
        .insert([{ shop_id: shopId, name, phone, plate, vehicle }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}
