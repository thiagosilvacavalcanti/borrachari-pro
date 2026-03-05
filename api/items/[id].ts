import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { authenticate } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  try {
    const shopId = authenticate(req);

    if (req.method === 'PUT') {
      const { name, type, price, commission, stock } = req.body;
      const { error } = await supabase
        .from('items')
        .update({ name, type, price, commission, stock })
        .eq('id', id)
        .eq('shop_id', shopId);

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}
