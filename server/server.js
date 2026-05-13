const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const db = require('./db/connection');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

app.use(cors());
app.use(express.json());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, { customSiteTitle: 'Himalaya API Docs' }));

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

function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
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
      `UPDATE products SET name=COALESCE($1,name), category_id=COALESCE($2,category_id), specs=COALESCE($3,specs),
       description=COALESCE($4,description), price_min=COALESCE($5,price_min), price_max=COALESCE($6,price_max),
       stock=COALESCE($7,stock), status=COALESCE($8,status), icon=COALESCE($9,icon), updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name || null, category_id || null, specs || null, description !== undefined ? description : null,
       price_min !== undefined ? price_min : null, price_max !== undefined ? price_max : null,
       stock !== undefined ? stock : null, status || null, icon || null, req.params.id]
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

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO orders (id, buyer_id, type, notes) VALUES ($1, $2, $3, $4)',
      [orderId, req.user.id, type, notes || '']
    );
    for (const item of items) {
      const productId = isValidUUID(item.product_id) ? item.product_id : null;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, category, specs, quantity, price, price_max)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, productId, item.name, item.category || null, item.specs || null,
         item.quantity || 1, item.price || 0, item.price_max || 0]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ id: orderId, status: 'pending' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── Single Order Detail ──
app.get('/api/orders/:id', authenticate, async (req, res) => {
  try {
    const orderResult = await db.query(
      `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email, u.phone AS buyer_phone, u.company AS buyer_company
       FROM orders o JOIN users u ON o.buyer_id = u.id WHERE o.id = $1`,
      [req.params.id]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];
    if (req.user.role === 'buyer' && order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    order.items = items.rows;
    const latestQuote = await db.query(
      `SELECT quoted_price FROM order_messages WHERE order_id = $1 AND type IN ('quote','counter_offer') AND quoted_price IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    order.latest_quote = latestQuote.rows.length > 0 ? Number(latestQuote.rows[0].quoted_price) : null;
    const msgCount = await db.query('SELECT COUNT(*) FROM order_messages WHERE order_id = $1', [req.params.id]);
    order.message_count = parseInt(msgCount.rows[0].count);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Order Negotiation Thread ──
app.get('/api/orders/:id/messages', authenticate, async (req, res) => {
  try {
    // Access control: buyers only see their own order's messages
    if (req.user.role === 'buyer') {
      const orderCheck = await db.query('SELECT buyer_id FROM orders WHERE id = $1', [req.params.id]);
      if (orderCheck.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
      if (orderCheck.rows[0].buyer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    }
    const result = await db.query(
      `SELECT m.*, u.name AS sender_name, u.company AS sender_company
       FROM order_messages m JOIN users u ON m.sender_id = u.id
       WHERE m.order_id = $1 ORDER BY m.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Purchase Order PDF ──
function formatINR(num) {
  const n = Number(num);
  if (isNaN(n)) return '₹0';
  const s = n.toFixed(2);
  const [whole, dec] = s.split('.');
  // Indian grouping: last 3 digits, then groups of 2
  let result = '';
  const len = whole.length;
  if (len <= 3) {
    result = whole;
  } else {
    result = whole.slice(-3);
    let remaining = whole.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) result = remaining + ',' + result;
  }
  return '₹' + result;
}

app.get('/api/orders/:id/po', authenticate, async (req, res) => {
  try {
    // 1. Fetch order + buyer info
    const orderResult = await db.query(
      `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email, u.phone AS buyer_phone, u.company AS buyer_company
       FROM orders o JOIN users u ON o.buyer_id = u.id WHERE o.id = $1`,
      [req.params.id]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];

    // 2. Access control
    if (req.user.role === 'buyer' && order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 3. Status guard
    const allowedStatuses = ['po_issued', 'in-progress', 'completed'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({ error: 'PO can only be downloaded for orders with status: ' + allowedStatuses.join(', ') });
    }

    // 4. Fetch order items
    const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    const items = itemsResult.rows;

    // 5. Fetch agreed price from latest quoted_price message, fallback to total_value
    const priceResult = await db.query(
      `SELECT quoted_price FROM order_messages WHERE order_id = $1 AND type IN ('quote','counter_offer','acceptance') AND quoted_price IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    const agreedTotal = priceResult.rows.length > 0 ? Number(priceResult.rows[0].quoted_price) : Number(order.total_value || 0);

    // 6. Fetch delivery estimate
    const deliveryResult = await db.query(
      `SELECT delivery_estimate FROM order_messages WHERE order_id = $1 AND delivery_estimate IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    const deliveryEstimate = deliveryResult.rows.length > 0 ? deliveryResult.rows[0].delivery_estimate : 'As mutually agreed';

    // 7. Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PO-${order.id}.pdf"`);
    doc.pipe(res);

    const pageWidth = doc.page.width - 100; // 50pt margins each side
    const leftCol = 50;
    const rightCol = 310;

    // ── Header ──
    doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE ORDER', leftCol, 50);
    doc.fontSize(10).font('Helvetica').text(`PO Number: ${order.id}`, rightCol, 50, { align: 'right', width: pageWidth - 260 });
    doc.text(`Date: ${dateStr}`, rightCol, 65, { align: 'right', width: pageWidth - 260 });

    // Divider
    doc.moveTo(leftCol, 90).lineTo(leftCol + pageWidth, 90).lineWidth(1).stroke('#333333');

    // ── Supplier & Buyer columns ──
    let y = 100;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#888888').text('SUPPLIER', leftCol, y);
    doc.text('BUYER', rightCol, y);

    y += 16;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text('HIMALAYA ENTERPRISES', leftCol, y);
    doc.text(order.buyer_company || order.buyer_name, rightCol, y);

    y += 16;
    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    doc.text('Prop: Rajesh Kumar', leftCol, y);
    doc.text(order.buyer_name, rightCol, y);

    y += 14;
    doc.text('Kanhauli, Phulwari Sharif', leftCol, y);
    doc.text(order.buyer_email, rightCol, y);

    y += 14;
    doc.text('Patna - 801505 (Bihar)', leftCol, y);
    doc.text(order.buyer_phone || '', rightCol, y);

    y += 14;
    doc.text('Ph: +91 98765 43210', leftCol, y);

    y += 14;
    doc.fontSize(8).fillColor('#666666').text('All type of Automobile Body', leftCol, y);
    y += 12;
    doc.text('Building, Repairing & Fabrication', leftCol, y);

    // Divider
    y += 20;
    doc.moveTo(leftCol, y).lineTo(leftCol + pageWidth, y).lineWidth(0.5).stroke('#333333');

    // ── Order Details ──
    y += 12;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text('ORDER DETAILS', leftCol, y);
    y += 18;
    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    const orderType = order.type === 'rfq' ? 'RFQ' : 'Inquiry';
    doc.text(`Order Type: ${orderType}    |    Delivery: ${deliveryEstimate}`, leftCol, y);
    if (order.notes) {
      y += 14;
      doc.text(`Notes: ${order.notes.substring(0, 200)}`, leftCol, y, { width: pageWidth });
      y += doc.heightOfString(`Notes: ${order.notes.substring(0, 200)}`, { width: pageWidth });
    } else {
      y += 14;
    }

    // ── Items Table ──
    y += 10;
    const colWidths = { sno: 35, name: 140, specs: 110, qty: 40, unitPrice: 85, total: 85 };
    const tableX = leftCol;
    const tableWidth = colWidths.sno + colWidths.name + colWidths.specs + colWidths.qty + colWidths.unitPrice + colWidths.total;

    // Table header background
    doc.rect(tableX, y, tableWidth, 22).fill('#f0f0f0');
    doc.fillColor('#333333').fontSize(8).font('Helvetica-Bold');
    let cx = tableX + 4;
    doc.text('S.No', cx, y + 6, { width: colWidths.sno - 8 });
    cx += colWidths.sno;
    doc.text('Item', cx, y + 6, { width: colWidths.name - 8 });
    cx += colWidths.name;
    doc.text('Specs', cx, y + 6, { width: colWidths.specs - 8 });
    cx += colWidths.specs;
    doc.text('Qty', cx, y + 6, { width: colWidths.qty - 8 });
    cx += colWidths.qty;
    doc.text('Unit Price', cx, y + 6, { width: colWidths.unitPrice - 8 });
    cx += colWidths.unitPrice;
    doc.text('Total', cx, y + 6, { width: colWidths.total - 8 });

    y += 22;
    doc.font('Helvetica').fontSize(8).fillColor('#000000');

    items.forEach((item, idx) => {
      // Page break if near bottom
      if (y > 650) {
        doc.addPage();
        y = 50;
      }
      const unitPrice = Number(item.price || 0);
      const qty = Number(item.quantity || 1);
      const lineTotal = unitPrice * qty;
      const specs = (item.specs || '-').substring(0, 50);
      const rowH = 20;

      // Alternating row background
      if (idx % 2 === 1) {
        doc.rect(tableX, y, tableWidth, rowH).fill('#fafafa');
        doc.fillColor('#000000');
      }

      cx = tableX + 4;
      doc.text(String(idx + 1), cx, y + 5, { width: colWidths.sno - 8 });
      cx += colWidths.sno;
      doc.text(item.name || '-', cx, y + 5, { width: colWidths.name - 8 });
      cx += colWidths.name;
      doc.text(specs, cx, y + 5, { width: colWidths.specs - 8 });
      cx += colWidths.specs;
      doc.text(String(qty), cx, y + 5, { width: colWidths.qty - 8 });
      cx += colWidths.qty;
      doc.text(formatINR(unitPrice), cx, y + 5, { width: colWidths.unitPrice - 8 });
      cx += colWidths.unitPrice;
      doc.text(formatINR(lineTotal), cx, y + 5, { width: colWidths.total - 8 });

      y += rowH;
    });

    // Table bottom border
    doc.moveTo(tableX, y).lineTo(tableX + tableWidth, y).lineWidth(0.5).stroke('#cccccc');

    // Agreed total
    y += 10;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
    doc.text(`Agreed Total: ${formatINR(agreedTotal)}`, tableX + tableWidth - 200, y, { width: 200, align: 'right' });

    // Divider
    y += 25;
    doc.moveTo(leftCol, y).lineTo(leftCol + pageWidth, y).lineWidth(0.5).stroke('#333333');

    // ── Terms & Conditions ──
    y += 12;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text('TERMS & CONDITIONS', leftCol, y);
    y += 18;
    doc.fontSize(8).font('Helvetica').fillColor('#333333');
    const terms = [
      'Payment: 50% advance, 50% on delivery',
      'Warranty: 12 months against manufacturing defects',
      'Prices inclusive of fabrication; transport extra',
      'Delivery subject to material availability',
      'Disputes subject to Patna jurisdiction',
      'PO valid for 30 days from date of issue'
    ];
    terms.forEach((t, i) => {
      if (y > 720) { doc.addPage(); y = 50; }
      doc.text(`${i + 1}. ${t}`, leftCol, y, { width: pageWidth });
      y += 14;
    });

    // Divider
    y += 8;
    doc.moveTo(leftCol, y).lineTo(leftCol + pageWidth, y).lineWidth(0.5).stroke('#333333');

    // ── Signature block ──
    y += 20;
    if (y > 680) { doc.addPage(); y = 50; }
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text('For HIMALAYA ENTERPRISES', leftCol, y);
    doc.text('Accepted by Buyer', rightCol, y);

    y += 40;
    doc.moveTo(leftCol, y).lineTo(leftCol + 150, y).lineWidth(0.5).stroke('#000000');
    doc.moveTo(rightCol, y).lineTo(rightCol + 150, y).lineWidth(0.5).stroke('#000000');

    y += 6;
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('Authorised Signatory', leftCol, y);
    doc.text('Signature & Stamp', rightCol, y);

    // Footer
    y += 30;
    doc.fontSize(7).fillColor('#999999').text(
      `Generated on ${today.toLocaleString('en-IN')} | Computer-generated document`,
      leftCol, y, { width: pageWidth, align: 'center' }
    );

    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Send Quote / Counter-Offer / Comment / Accept / Reject ──
app.post('/api/orders/:id/messages', authenticate, async (req, res) => {
  const { type, quoted_price, delivery_estimate, message } = req.body;
  const validTypes = ['quote', 'counter_offer', 'comment', 'acceptance', 'rejection'];
  if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid message type' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (orderResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Order not found' }); }
    const order = orderResult.rows[0];

    // Access control
    if (req.user.role === 'buyer' && order.buyer_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Block actions on terminal statuses
    const terminalStatuses = ['completed', 'cancelled', 'accepted', 'po_issued'];
    if (terminalStatuses.includes(order.status) && type !== 'comment') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot negotiate on an order with status: ' + order.status });
    }

    // Validate message type against sender role
    if (type === 'quote' && req.user.role === 'buyer') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Buyers cannot send quotes' });
    }
    if (type === 'counter_offer' && req.user.role !== 'buyer') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only buyers can send counter-offers' });
    }

    // Insert message
    const msgResult = await client.query(
      `INSERT INTO order_messages (order_id, sender_id, sender_role, type, quoted_price, delivery_estimate, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, req.user.id, req.user.role, type, quoted_price || null, delivery_estimate || null, message || null]
    );

    // Determine status transition
    let newStatus = order.status;
    if (type === 'quote' && order.status === 'pending') {
      newStatus = 'quoted';
    } else if (type === 'counter_offer' && order.status === 'quoted') {
      newStatus = 'negotiating';
    } else if (type === 'acceptance' && ['quoted', 'negotiating'].includes(order.status)) {
      newStatus = 'accepted';
    } else if (type === 'rejection' && ['quoted', 'negotiating'].includes(order.status)) {
      newStatus = 'cancelled';
    }
    // Negotiating stays negotiating for revised quotes / counter-offers
    // quote on negotiating -> stays negotiating
    // counter_offer on negotiating -> stays negotiating

    if (newStatus !== order.status) {
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, req.params.id]);
    }

    // Update total_value on acceptance
    if (type === 'acceptance' && quoted_price) {
      await client.query('UPDATE orders SET total_value = $1 WHERE id = $2', [quoted_price, req.params.id]);
    }

    // Audit log
    await client.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'order_message_' + type, 'order', req.params.id,
       JSON.stringify({ type, quoted_price, new_status: newStatus })]
    );

    await client.query('COMMIT');
    const msg = msgResult.rows[0];
    msg.new_status = newStatus;
    res.status(201).json(msg);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.patch('/api/orders/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'quoted', 'negotiating', 'accepted', 'po_issued', 'confirmed', 'in-progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    // Access control: buyers can set po_issued or cancelled on their own orders
    if (req.user.role === 'buyer') {
      if (!['po_issued', 'cancelled'].includes(status)) return res.status(403).json({ error: 'Buyers can only set po_issued or cancelled' });
      const orderCheck = await db.query('SELECT buyer_id FROM orders WHERE id = $1', [req.params.id]);
      if (orderCheck.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
      if (orderCheck.rows[0].buyer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    }
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
