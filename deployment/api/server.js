const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

app.use(cors());
app.use(express.json());

// ── Auth Middleware ──
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ── Health Check ──
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ══════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hash, role || 'buyer']
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// PRODUCT ROUTES
// ══════════════════════════════════════════════

app.get('/api/products', async (req, res) => {
  const { category, search, status } = req.query;
  let sql = 'SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1';
  const params = [];
  let idx = 1;

  if (category && category !== 'all') {
    sql += ` AND p.category_id = $${idx++}`;
    params.push(category);
  }
  if (status && status !== 'all') {
    sql += ` AND p.status = $${idx++}`;
    params.push(status);
  }
  if (search) {
    sql += ` AND (p.name ILIKE $${idx} OR p.specs ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }
  sql += ' ORDER BY p.created_at DESC';

  try {
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticate, requireRole('supplier'), async (req, res) => {
  const { name, category_id, specs, description, price_min, price_max, stock, status, icon } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO products (name, category_id, specs, description, price_min, price_max, stock, status, icon, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, category_id, specs, description, price_min, price_max, stock || 0, status || 'available', icon || '📦', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticate, requireRole('supplier'), async (req, res) => {
  const { name, category_id, specs, description, price_min, price_max, stock, status, icon } = req.body;
  try {
    const result = await db.query(
      `UPDATE products SET name=$1, category_id=$2, specs=$3, description=$4, price_min=$5, price_max=$6,
       stock=$7, status=$8, icon=$9 WHERE id=$10 RETURNING *`,
      [name, category_id, specs, description, price_min, price_max, stock, status, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id/stock', authenticate, requireRole('supplier'), async (req, res) => {
  const { stock } = req.body;
  const status = stock > 0 ? 'available' : 'order';
  try {
    const result = await db.query(
      'UPDATE products SET stock=$1, status=$2 WHERE id=$3 RETURNING *',
      [stock, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticate, requireRole('supplier'), async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// ORDER ROUTES
// ══════════════════════════════════════════════

app.get('/api/orders', authenticate, async (req, res) => {
  try {
    let sql, params;
    if (req.user.role === 'supplier') {
      sql = `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
             FROM orders o JOIN users u ON o.buyer_id = u.id ORDER BY o.created_at DESC`;
      params = [];
    } else {
      sql = `SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC`;
      params = [req.user.id];
    }
    const result = await db.query(sql, params);

    for (const order of result.rows) {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      order.items = items.rows;
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  const { type, items, notes } = req.body;
  const prefix = type === 'rfq' ? 'RFQ-' : 'ORD-';
  const orderId = prefix + Date.now().toString(36).toUpperCase();

  try {
    await db.query('BEGIN');
    await db.query(
      'INSERT INTO orders (id, buyer_id, type, notes) VALUES ($1, $2, $3, $4)',
      [orderId, req.user.id, type, notes || '']
    );
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, name, category, specs, quantity, price, price_max)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, item.product_id || null, item.name, item.category || null, item.specs || null,
         item.quantity || 1, item.price || 0, item.price_max || 0]
      );
    }
    await db.query('COMMIT');
    res.status(201).json({ id: orderId, status: 'pending' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', authenticate, requireRole('supplier'), async (req, res) => {
  const { status } = req.body;
  try {
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// FAVORITES
// ══════════════════════════════════════════════

app.get('/api/favorites', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.* FROM favorites f JOIN products p ON f.product_id = p.id WHERE f.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/favorites/:productId', authenticate, async (req, res) => {
  try {
    await db.query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.productId]
    );
    res.json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/favorites/:productId', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.productId]
    );
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// CONTACT INQUIRIES
// ══════════════════════════════════════════════

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, product_interest, message } = req.body;
  try {
    await db.query(
      'INSERT INTO contact_inquiries (name, email, phone, product_interest, message) VALUES ($1,$2,$3,$4,$5)',
      [name, email, phone, product_interest, message]
    );
    res.status(201).json({ message: 'Inquiry submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════

app.get('/api/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY sort_order');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`Himalaya API running on port ${PORT}`);
});
