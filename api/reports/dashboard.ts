import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { authenticate } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const shopId = authenticate(req);

    if (req.method === 'GET') {
      const { startDate, endDate } = req.query;
      
      // Default to last 30 days if no dates provided
      const now = new Date();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const defaultEnd = now.toISOString().split('T')[0];

      const start = (startDate as string) || defaultStart;
      const end = (endDate as string) || defaultEnd;

      // For "Today" metrics, we use the current date in the shop's timezone (approximated)
      const today = now.toISOString().split('T')[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      try {
        // Daily Sales for the selected period
        const { data: salesData } = await supabase
          .from('sales')
          .select('created_at, total')
          .eq('shop_id', shopId)
          .gte('created_at', start + 'T00:00:00Z')
          .lte('created_at', end + 'T23:59:59Z');

        const dailySalesMap: Record<string, number> = {};
        salesData?.forEach(s => {
          const date = s.created_at.split('T')[0];
          dailySalesMap[date] = (dailySalesMap[date] || 0) + s.total;
        });
        const dailySales = Object.entries(dailySalesMap).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));

        // Top Services for the selected period
        const { data: siData } = await supabase
          .from('sale_items')
          .select(`
            id,
            items (id, name, type),
            sales!inner (shop_id, created_at)
          `)
          .eq('sales.shop_id', shopId)
          .eq('items.type', 'service')
          .gte('sales.created_at', start + 'T00:00:00Z')
          .lte('sales.created_at', end + 'T23:59:59Z');

        const serviceCounts: Record<string, { name: string, count: number }> = {};
        siData?.forEach((si: any) => {
          if (!si.items) return;
          const id = si.items.id;
          if (!serviceCounts[id]) serviceCounts[id] = { name: si.items.name, count: 0 };
          serviceCounts[id].count++;
        });
        const topServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 5);

        // Payment Methods for the selected period
        const { data: payData } = await supabase
          .from('payments')
          .select(`
            method,
            amount,
            sales!inner (shop_id, created_at)
          `)
          .eq('sales.shop_id', shopId)
          .gte('sales.created_at', start + 'T00:00:00Z')
          .lte('sales.created_at', end + 'T23:59:59Z');

        const payMap: Record<string, number> = {};
        payData?.forEach((p: any) => {
          payMap[p.method] = (payMap[p.method] || 0) + p.amount;
        });
        const paymentMethods = Object.entries(payMap).map(([method, total]) => ({ method, total }));

        // Selected Period Commissions
        const { data: commData } = await supabase
          .from('sale_items')
          .select(`
            commission_paid,
            sales!inner (shop_id, created_at)
          `)
          .eq('sales.shop_id', shopId)
          .gte('sales.created_at', start + 'T00:00:00Z')
          .lte('sales.created_at', end + 'T23:59:59Z');

        const periodCommissions = commData?.reduce((acc, curr) => acc + curr.commission_paid, 0) || 0;

        // Selected Period Revenue
        const periodRevenue = salesData?.reduce((acc, curr) => acc + curr.total, 0) || 0;

        // Selected Period Expenses
        const { data: expData } = await supabase
          .from('expenses')
          .select('amount')
          .eq('shop_id', shopId)
          .gte('created_at', start + 'T00:00:00Z')
          .lte('created_at', end + 'T23:59:59Z');
        const periodExpenses = expData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

        // Recent Sales (always last 5)
        const { data: recentSalesData } = await supabase
          .from('sales')
          .select(`
            id,
            total,
            created_at,
            customers (name)
          `)
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false })
          .limit(5);

        const recentSales = recentSalesData?.map((s: any) => ({
          id: s.id,
          total: s.total,
          created_at: s.created_at,
          customer_name: s.customers?.name
        }));

        // Month Revenue
        const { data: monthSalesData } = await supabase
          .from('sales')
          .select('total')
          .eq('shop_id', shopId)
          .gte('created_at', monthStart + 'T00:00:00Z');
        
        const monthRevenue = monthSalesData?.reduce((acc, curr) => acc + curr.total, 0) || 0;

        // Month Expenses
        const { data: monthExpData } = await supabase
          .from('expenses')
          .select('amount')
          .eq('shop_id', shopId)
          .gte('created_at', monthStart + 'T00:00:00Z');
        
        const monthExpenses = monthExpData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

        // Today Commissions
        const { data: todayCommData } = await supabase
          .from('sale_items')
          .select(`
            commission_paid,
            sales!inner (shop_id, created_at)
          `)
          .eq('sales.shop_id', shopId)
          .gte('sales.created_at', today + 'T00:00:00Z');
        
        const todayCommissions = todayCommData?.reduce((acc, curr) => acc + curr.commission_paid, 0) || 0;

        return res.json({
          dailySales: dailySales || [],
          topServices: topServices || [],
          paymentMethods: paymentMethods || [],
          periodCommissions: periodCommissions || 0,
          periodRevenue: periodRevenue || 0,
          periodExpenses: periodExpenses || 0,
          recentSales: recentSales || [],
          monthRevenue,
          monthExpenses,
          todayCommissions,
          today,
          monthStart
        });
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to load dashboard data' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}
