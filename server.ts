import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { Octokit } from 'octokit';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-borracharia-key';

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.shopId = decoded.shopId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase
      .from('shops')
      .insert([{ name, email, password: hashedPassword }])
      .select()
      .single();

    if (error) throw error;

    const token = jwt.sign({ shopId: data.id }, JWT_SECRET);
    res.json({ token, shop: { id: data.id, name, email } });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: 'Email already exists or error creating shop' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { data: shop, error } = await supabase
    .from('shops')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !shop || !bcrypt.compareSync(password, shop.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ shopId: shop.id }, JWT_SECRET);
  res.json({ token, shop: { id: shop.id, name: shop.name, email: shop.email } });
});

// --- ITEMS ROUTES ---
app.get('/api/items', authenticate, async (req: any, res) => {
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .eq('shop_id', req.shopId);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(items);
});

app.post('/api/items', authenticate, async (req: any, res) => {
  const { name, type, price, commission, stock } = req.body;
  const { data, error } = await supabase
    .from('items')
    .insert([{ shop_id: req.shopId, name, type, price, commission, stock: stock || 0 }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/api/items/:id', authenticate, async (req: any, res) => {
  const { name, type, price, commission, stock } = req.body;
  const { error } = await supabase
    .from('items')
    .update({ name, type, price, commission, stock })
    .eq('id', req.params.id)
    .eq('shop_id', req.shopId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- CUSTOMERS ROUTES ---
app.get('/api/customers', authenticate, async (req: any, res) => {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', req.shopId);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(customers);
});

app.post('/api/customers', authenticate, async (req: any, res) => {
  const { name, phone, plate, vehicle } = req.body;
  const { data, error } = await supabase
    .from('customers')
    .insert([{ shop_id: req.shopId, name, phone, plate, vehicle }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- SALES ROUTES ---
app.get('/api/sales/history', authenticate, async (req: any, res) => {
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
    .eq('shop_id', req.shopId);

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

  res.json(history);
});

app.post('/api/sales', authenticate, async (req: any, res) => {
  const { customer, items: saleItems, payments, total, createdAt } = req.body;
  
  try {
    let customerId = customer.id;
    if (!customerId && (customer.name || customer.plate || customer.vehicle)) {
      const { data: newCust, error: custErr } = await supabase
        .from('customers')
        .insert([{ shop_id: req.shopId, name: customer.name || 'Consumidor', phone: customer.phone, plate: customer.plate, vehicle: customer.vehicle }])
        .select()
        .single();
      if (custErr) throw custErr;
      customerId = newCust.id;
    }

    const saleData: any = { shop_id: req.shopId, customer_id: customerId, total };
    if (createdAt) {
      saleData.created_at = createdAt;
    }

    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();
    if (saleErr) throw saleErr;
    const saleId = sale.id;

    const saleItemsToInsert = saleItems.map((item: any) => ({
      sale_id: saleId,
      item_id: item.id,
      quantity: item.quantity,
      price: item.price,
      commission_paid: (item.commission || 0) * item.quantity,
      wheels_count: item.wheels_count || 1,
      context: item.context
    }));

    const { error: itemsErr } = await supabase.from('sale_items').insert(saleItemsToInsert);
    if (itemsErr) throw itemsErr;

    // Update stock
    for (const item of saleItems) {
      if (item.type === 'product') {
        await supabase.rpc('decrement_stock', { item_id: item.id, amount: item.quantity });
      }
    }

    const paymentsToInsert = payments.map((p: any) => ({
      sale_id: saleId,
      method: p.method,
      amount: p.amount
    }));

    const { error: payErr } = await supabase.from('payments').insert(paymentsToInsert);
    if (payErr) throw payErr;

    res.json({ id: saleId, success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to process sale' });
  }
});

app.put('/api/sales/:id', authenticate, async (req: any, res) => {
  const saleId = req.params.id;
  const { name, phone, plate, vehicle, date, payment_method, items: newItems } = req.body;
  
  try {
    // 1. Verify ownership
    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .select('id, shop_id, customer_id')
      .eq('id', saleId)
      .single();

    if (saleErr || !sale || sale.shop_id !== req.shopId) {
      throw new Error('Sale not found');
    }

    // 2. Update customer
    if (sale.customer_id) {
      await supabase.from('customers').update({ name, phone, plate, vehicle }).eq('id', sale.customer_id);
    }

    // 3. Update sale date
    if (date) {
      await supabase.from('sales').update({ created_at: date }).eq('id', saleId);
    }

    // 4. Handle items (stock reconciliation)
    const { data: oldItems } = await supabase
      .from('sale_items')
      .select('id, item_id, quantity, items(type)')
      .eq('sale_id', saleId);

    if (oldItems) {
      for (const item of oldItems) {
        if ((item.items as any).type === 'product') {
          await supabase.rpc('increment_stock', { item_id: item.item_id, amount: item.quantity });
        }
      }
    }

    await supabase.from('sale_items').delete().eq('sale_id', saleId);

    let newTotal = 0;
    for (const item of newItems) {
      const { data: itemInfo } = await supabase.from('items').select('type, commission').eq('id', item.item_id).single();
      const commission = itemInfo?.commission || 0;
      const commission_paid = commission * item.quantity;
      
      await supabase.from('sale_items').insert([{
        sale_id: saleId,
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price,
        wheels_count: item.wheels_count,
        commission_paid
      }]);

      if (itemInfo?.type === 'product') {
        await supabase.rpc('decrement_stock', { item_id: item.item_id, amount: item.quantity });
      }
      newTotal += item.price * item.quantity;
    }

    // 5. Update sale total
    await supabase.from('sales').update({ total: newTotal }).eq('id', saleId);

    // 6. Update payments
    await supabase.from('payments').delete().eq('sale_id', saleId);
    await supabase.from('payments').insert([{
      sale_id: saleId,
      method: payment_method || 'money',
      amount: newTotal
    }]);

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to update sale' });
  }
});

app.delete('/api/sales/:id', authenticate, async (req: any, res) => {
  const saleId = req.params.id;
  
  try {
    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .select('id, shop_id')
      .eq('id', saleId)
      .single();

    if (saleErr || !sale || sale.shop_id !== req.shopId) {
      throw new Error('Sale not found');
    }

    const { data: items } = await supabase
      .from('sale_items')
      .select('item_id, quantity, items(type)')
      .eq('sale_id', saleId);

    if (items) {
      for (const item of items) {
        if ((item.items as any).type === 'product') {
          await supabase.rpc('increment_stock', { item_id: item.item_id, amount: item.quantity });
        }
      }
    }

    await supabase.from('sale_items').delete().eq('sale_id', saleId);
    await supabase.from('payments').delete().eq('sale_id', saleId);
    await supabase.from('sales').delete().eq('id', saleId);

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to delete sale' });
  }
});

// --- REPORTS / FINANCIAL ---
app.get('/api/reports/dashboard', authenticate, async (req: any, res) => {
  const { startDate, endDate } = req.query;
  
  // Default to last 30 days if no dates provided
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultEnd = now.toISOString().split('T')[0];

  const start = startDate || defaultStart;
  const end = endDate || defaultEnd;

  // For "Today" metrics, we use the current date in the shop's timezone (approximated)
  const today = now.toISOString().split('T')[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  
  try {
    // Daily Sales for the selected period
    const { data: salesData } = await supabase
      .from('sales')
      .select('created_at, total')
      .eq('shop_id', req.shopId)
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
      .eq('sales.shop_id', req.shopId)
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
      .eq('sales.shop_id', req.shopId)
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
      .eq('sales.shop_id', req.shopId)
      .gte('sales.created_at', start + 'T00:00:00Z')
      .lte('sales.created_at', end + 'T23:59:59Z');

    const periodCommissions = commData?.reduce((acc, curr) => acc + curr.commission_paid, 0) || 0;

    // Selected Period Revenue
    const periodRevenue = salesData?.reduce((acc, curr) => acc + curr.total, 0) || 0;

    // Selected Period Expenses
    const { data: expData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('shop_id', req.shopId)
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
      .eq('shop_id', req.shopId)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentSales = recentSalesData?.map((s: any) => ({
      id: s.id,
      total: s.total,
      created_at: s.created_at,
      customer_name: s.customers?.name
    }));

    // --- Specific Metrics for Financial Page ---
    try {
      // Month Revenue
      const { data: monthSalesData, error: monthSalesErr } = await supabase
        .from('sales')
        .select('total')
        .eq('shop_id', req.shopId)
        .gte('created_at', monthStart + 'T00:00:00Z');
      
      if (monthSalesErr) console.error('Month Sales Error:', monthSalesErr);
      const monthRevenue = monthSalesData?.reduce((acc, curr) => acc + curr.total, 0) || 0;

      // Month Expenses
      const { data: monthExpData, error: monthExpErr } = await supabase
        .from('expenses')
        .select('amount')
        .eq('shop_id', req.shopId)
        .gte('created_at', monthStart + 'T00:00:00Z');
      
      if (monthExpErr) console.error('Month Expenses Error:', monthExpErr);
      const monthExpenses = monthExpData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // Today Commissions
      const { data: todayCommData, error: todayCommErr } = await supabase
        .from('sale_items')
        .select(`
          commission_paid,
          sales!inner (shop_id, created_at)
        `)
        .eq('sales.shop_id', req.shopId)
        .gte('sales.created_at', today + 'T00:00:00Z');
      
      if (todayCommErr) console.error('Today Commissions Error:', todayCommErr);
      const todayCommissions = todayCommData?.reduce((acc, curr) => acc + curr.commission_paid, 0) || 0;

      res.json({
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
    } catch (innerErr) {
      console.error('Error calculating financial metrics:', innerErr);
      res.json({
        dailySales: dailySales || [],
        topServices: topServices || [],
        paymentMethods: paymentMethods || [],
        periodCommissions: periodCommissions || 0,
        periodRevenue: periodRevenue || 0,
        periodExpenses: periodExpenses || 0,
        recentSales: recentSales || [],
        monthRevenue: 0,
        monthExpenses: 0,
        todayCommissions: 0,
        today,
        monthStart
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// --- APPOINTMENTS ---
app.get('/api/appointments', authenticate, async (req: any, res) => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customers (name, plate, vehicle)
    `)
    .eq('shop_id', req.shopId)
    .order('scheduled_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const appointments = data.map((a: any) => ({
    ...a,
    customer_name: a.customers?.name,
    customer_plate: a.customers?.plate,
    customer_vehicle: a.customers?.vehicle
  }));

  res.json(appointments);
});

app.post('/api/appointments', authenticate, async (req: any, res) => {
  const { customerId, description, scheduledAt, customerName, customerPlate, customerVehicle } = req.body;
  
  try {
    let finalCustomerId = customerId;
    if (!finalCustomerId && (customerName || customerPlate || customerVehicle)) {
      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .insert([{ shop_id: req.shopId, name: customerName || 'Consumidor', plate: customerPlate, vehicle: customerVehicle }])
        .select()
        .single();
      if (custErr) throw custErr;
      finalCustomerId = cust.id;
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([{ shop_id: req.shopId, customer_id: finalCustomerId, description, scheduled_at: scheduledAt }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', authenticate, async (req: any, res) => {
  const { status, status_description, photo } = req.body;
  const { id } = req.params;

  const { error } = await supabase
    .from('appointments')
    .update({ status, status_description, photo })
    .eq('id', id)
    .eq('shop_id', req.shopId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- EXPENSES ---
app.get('/api/expenses', authenticate, async (req: any, res) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('shop_id', req.shopId)
    .order('created_at', { ascending: false });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/expenses', authenticate, async (req: any, res) => {
  const { description, amount, category } = req.body;
  if (!description || !amount) {
    return res.status(400).json({ error: 'Descrição e valor são obrigatórios' });
  }
  const { data, error } = await supabase
    .from('expenses')
    .insert([{ shop_id: req.shopId, description, amount, category: category || 'Geral' }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/expenses/:id', authenticate, async (req: any, res) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', req.params.id)
    .eq('shop_id', req.shopId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- GITHUB SYNC ROUTES ---
app.get('/api/auth/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'GitHub Client ID not configured' });
  
  const redirectUri = `${process.env.APP_URL}/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;
  res.json({ url });
});

app.get('/api/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }, {
      headers: { Accept: 'application/json' }
    });

    const accessToken = response.data.access_token;
    if (!accessToken) throw new Error('Failed to get access token');

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${accessToken}' }, '*');
              window.close();
            } else {
              window.location.href = '/settings';
            }
          </script>
          <p>Autenticação com GitHub realizada com sucesso! Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error(err);
    res.status(500).send('Erro na autenticação com GitHub');
  }
});

app.post('/api/github/sync', authenticate, async (req: any, res) => {
  const { githubToken, repoName } = req.body;
  if (!githubToken || !repoName) return res.status(400).json({ error: 'Token and Repo Name are required' });

  const octokit = new Octokit({ auth: githubToken });

  try {
    // 1. Get user info
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    // 2. Create repository
    let repo;
    try {
      const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        private: true,
        description: 'App Rodolfo Alemão - Sistema de Gerenciamento de Borracharia',
      });
      repo = newRepo;
    } catch (err: any) {
      if (err.status === 422) {
        // Repo already exists, get it
        const { data: existingRepo } = await octokit.rest.repos.get({
          owner: user.login,
          repo: repoName,
        });
        repo = existingRepo;
      } else {
        throw err;
      }
    }

    // 3. Helper to read files recursively
    const ignoreList = ['.git', 'node_modules', 'dist', '.next', '.DS_Store', 'package-lock.json'];
    
    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          if (!ignoreList.includes(file)) {
            getAllFiles(fullPath, arrayOfFiles);
          }
        } else {
          if (!ignoreList.includes(file)) {
            arrayOfFiles.push(fullPath);
          }
        }
      });
      return arrayOfFiles;
    };

    const projectFiles = getAllFiles(__dirname);
    
    // 4. Upload files
    for (const filePath of projectFiles) {
      const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
      const content = fs.readFileSync(filePath, { encoding: 'base64' });

      try {
        // Check if file exists to get its SHA
        let sha;
        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner: user.login,
            repo: repoName,
            path: relativePath,
          });
          if (!Array.isArray(fileData)) {
            sha = fileData.sha;
          }
        } catch (e) {}

        await octokit.rest.repos.createOrUpdateFileContents({
          owner: user.login,
          repo: repoName,
          path: relativePath,
          message: `Sync: ${relativePath}`,
          content,
          sha,
        });
      } catch (err: any) {
        console.error(`Error uploading ${relativePath}:`, err.message);
      }
    }

    res.json({ success: true, url: repo.html_url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to sync with GitHub' });
  }
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
