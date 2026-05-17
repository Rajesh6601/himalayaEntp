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

    // Attach invoice if exists
    const invoiceResult = await db.query(
      'SELECT id, invoice_number, grand_total, status, invoice_date FROM invoices WHERE order_id = $1 LIMIT 1',
      [req.params.id]
    );
    order.invoice = invoiceResult.rows.length > 0 ? invoiceResult.rows[0] : null;

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
    const allowedStatuses = ['po_issued', 'advance_paid', 'in-progress', 'invoiced', 'dispatched', 'delivered', 'qc_approved', 'completed'];
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
    doc.text('Managing Partner: Rajjeev Shuklaa', leftCol, y);
    doc.text(order.buyer_name, rightCol, y);

    y += 14;
    doc.text('M-6, 7th Phase, Adityapur Industrial Area', leftCol, y);
    doc.text(order.buyer_email, rightCol, y);

    y += 14;
    doc.text('Jamshedpur - 832109, Jharkhand (INDIA)', leftCol, y);
    doc.text(order.buyer_phone || '', rightCol, y);

    y += 14;
    doc.text('Ph: +91 93863 91266', leftCol, y);

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

// ── Send Quote / Counter-Offer / Comment / Accept / Reject / P2P Messages ──
app.post('/api/orders/:id/messages', authenticate, async (req, res) => {
  const { type, quoted_price, delivery_estimate, message } = req.body;
  const validTypes = ['quote', 'counter_offer', 'comment', 'acceptance', 'rejection',
    'advance_payment', 'invoice', 'dispatch', 'grn', 'qc_approved', 'qc_rejected', 'balance_payment', 'dispute_response'];
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

    // Block actions on terminal statuses (only comment allowed)
    const terminalStatuses = ['completed', 'cancelled'];
    if (terminalStatuses.includes(order.status) && type !== 'comment') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot send messages on an order with status: ' + order.status });
    }

    // Role validation for message types
    const buyerOnlyTypes = ['counter_offer', 'advance_payment', 'grn', 'qc_approved', 'qc_rejected', 'balance_payment'];
    const supplierOnlyTypes = ['quote', 'invoice', 'dispatch', 'dispute_response'];

    if (buyerOnlyTypes.includes(type) && req.user.role !== 'buyer') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Only buyers can send ${type} messages` });
    }
    if (supplierOnlyTypes.includes(type) && req.user.role !== 'supplier') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Only suppliers can send ${type} messages` });
    }

    // Insert message
    const msgResult = await client.query(
      `INSERT INTO order_messages (order_id, sender_id, sender_role, type, quoted_price, delivery_estimate, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, req.user.id, req.user.role, type, quoted_price || null, delivery_estimate || null, message || null]
    );

    // Determine status transition
    let newStatus = order.status;

    // Negotiation transitions
    if (type === 'quote' && order.status === 'pending') {
      newStatus = 'quoted';
    } else if (type === 'counter_offer' && order.status === 'quoted') {
      newStatus = 'negotiating';
    } else if (type === 'acceptance' && ['quoted', 'negotiating'].includes(order.status)) {
      newStatus = 'accepted';
    } else if (type === 'rejection' && ['quoted', 'negotiating'].includes(order.status)) {
      newStatus = 'cancelled';
    }

    // P2P lifecycle transitions
    if (type === 'advance_payment' && order.status === 'po_issued') {
      newStatus = 'advance_paid';
      if (quoted_price) {
        await client.query('UPDATE orders SET advance_paid = $1 WHERE id = $2', [quoted_price, req.params.id]);
      }
    } else if (type === 'dispatch' && ['invoiced', 'in-progress'].includes(order.status)) {
      newStatus = 'dispatched';
    } else if (type === 'grn' && order.status === 'dispatched') {
      newStatus = 'delivered';
    } else if (type === 'qc_approved' && order.status === 'delivered') {
      newStatus = 'qc_approved';
    } else if (type === 'qc_rejected' && order.status === 'delivered') {
      newStatus = 'disputed';
    } else if (type === 'balance_payment' && order.status === 'qc_approved') {
      newStatus = 'completed';
      if (quoted_price) {
        await client.query('UPDATE orders SET balance_paid = $1 WHERE id = $2', [quoted_price, req.params.id]);
      }
    }
    // dispute_response on disputed -> stays disputed (supplier responds, status unchanged)

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
  const validStatuses = ['pending', 'quoted', 'negotiating', 'accepted', 'po_issued', 'advance_paid', 'confirmed', 'in-progress', 'invoiced', 'dispatched', 'delivered', 'qc_approved', 'completed', 'cancelled', 'disputed'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  // Transition guard map
  const transitions = {
    'pending':      ['quoted', 'cancelled'],
    'quoted':       ['negotiating', 'accepted', 'cancelled'],
    'negotiating':  ['quoted', 'negotiating', 'accepted', 'cancelled'],
    'accepted':     ['po_issued', 'cancelled'],
    'po_issued':    ['advance_paid', 'in-progress', 'cancelled'],
    'advance_paid': ['in-progress', 'cancelled'],
    'in-progress':  ['invoiced', 'completed', 'cancelled'],
    'invoiced':     ['dispatched', 'cancelled'],
    'dispatched':   ['delivered'],
    'delivered':    ['qc_approved', 'disputed'],
    'qc_approved':  ['completed'],
    'disputed':     ['in-progress', 'cancelled'],
    'completed':    [],
    'cancelled':    []
  };

  try {
    const orderCheck = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderCheck.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderCheck.rows[0];

    // Access control
    if (req.user.role === 'buyer') {
      const buyerAllowed = ['po_issued', 'advance_paid', 'delivered', 'qc_approved', 'completed', 'disputed', 'cancelled'];
      if (!buyerAllowed.includes(status)) return res.status(403).json({ error: 'Buyers cannot set status to ' + status });
      if (order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    } else if (req.user.role === 'supplier') {
      const supplierAllowed = ['in-progress', 'invoiced', 'dispatched', 'completed', 'cancelled'];
      if (!supplierAllowed.includes(status)) return res.status(403).json({ error: 'Suppliers cannot set status to ' + status });
    }

    // Validate transition
    const allowed = transitions[order.status];
    if (allowed && !allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ')}` });
    }

    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// INVOICE ROUTES
// ══════════════════════════════════════════════

// ── Number to Words (Indian Rupees) ──
function numberToWordsINR(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertChunk(n % 100) : '');
  }

  const intPart = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - intPart) * 100);
  let result = '';

  if (intPart >= 10000000) {
    result += convertChunk(Math.floor(intPart / 10000000)) + ' Crore ';
  }
  const remCrore = intPart % 10000000;
  if (remCrore >= 100000) {
    result += convertChunk(Math.floor(remCrore / 100000)) + ' Lakh ';
  }
  const remLakh = remCrore % 100000;
  if (remLakh >= 1000) {
    result += convertChunk(Math.floor(remLakh / 1000)) + ' Thousand ';
  }
  const remThousand = remLakh % 1000;
  if (remThousand > 0) {
    result += convertChunk(remThousand);
  }

  result = result.trim();
  if (!result) result = 'Zero';
  result += ' Rupees';
  if (paise > 0) result += ' and ' + convertChunk(paise) + ' Paise';
  return result + ' Only';
}

// ── Create Invoice (Supplier) ──
app.post('/api/orders/:id/invoice', authenticate, requireRole('supplier'), async (req, res) => {
  const { buyer_gstin, hsn_code, place_of_supply, items, cgst_rate, sgst_rate, igst_rate, payment_terms, notes, due_date } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch order
    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (orderResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Order not found' }); }
    const order = orderResult.rows[0];

    // Status guard
    const allowedStatuses = ['po_issued', 'advance_paid', 'in-progress'];
    if (!allowedStatuses.includes(order.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invoice can only be created for orders with status: ' + allowedStatuses.join(', ') });
    }

    // Prevent duplicates
    const existingInv = await client.query('SELECT id FROM invoices WHERE order_id = $1', [req.params.id]);
    if (existingInv.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'An invoice already exists for this order' });
    }

    // Generate invoice number
    const now = new Date();
    const dateStr = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(10000 + Math.random() * 90000));
    const invoiceNumber = 'INV-' + dateStr + '-' + rand;

    // Calculate totals from items
    const invoiceItems = items || [];
    let subtotal = 0;
    for (const item of invoiceItems) {
      item.total = (item.quantity || 1) * (item.unit_price || 0);
      subtotal += item.total;
    }

    // If no items provided, use order total_value
    if (invoiceItems.length === 0) {
      subtotal = Number(order.total_value || 0);
    }

    const cRate = Number(cgst_rate || 0);
    const sRate = Number(sgst_rate || 0);
    const iRate = Number(igst_rate || 0);
    const cgstAmt = Math.round(subtotal * cRate / 100 * 100) / 100;
    const sgstAmt = Math.round(subtotal * sRate / 100 * 100) / 100;
    const igstAmt = Math.round(subtotal * iRate / 100 * 100) / 100;
    const totalTax = cgstAmt + sgstAmt + igstAmt;
    const grandTotal = subtotal + totalTax;

    // Validate invoice total against PO value (5% tolerance for tax/transport adjustments)
    const poValue = Number(order.total_value || 0);
    if (poValue > 0) {
      const tolerance = 0.05; // 5%
      const maxAllowed = poValue * (1 + tolerance);
      if (subtotal > maxAllowed) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Invoice subtotal (₹${subtotal.toLocaleString('en-IN')}) exceeds PO value (₹${poValue.toLocaleString('en-IN')}) by more than 5%. Maximum allowed: ₹${maxAllowed.toLocaleString('en-IN')}`
        });
      }
    }

    // Insert invoice
    const invResult = await client.query(
      `INSERT INTO invoices (order_id, invoice_number, invoice_date, due_date, buyer_gstin, hsn_code, place_of_supply,
        subtotal, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount, total_tax, grand_total,
        payment_terms, notes, created_by)
       VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [req.params.id, invoiceNumber, due_date || null, buyer_gstin || null, hsn_code || '8707',
       place_of_supply || 'Bihar', subtotal, cRate, cgstAmt, sRate, sgstAmt, iRate, igstAmt,
       totalTax, grandTotal, payment_terms || null, notes || null, req.user.id]
    );
    const invoice = invResult.rows[0];

    // Insert invoice items
    for (const item of invoiceItems) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, hsn_code, quantity, unit_price, total)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [invoice.id, item.description, item.hsn_code || '8707', item.quantity || 1, item.unit_price || 0, item.total]
      );
    }

    // Update order status to invoiced
    await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['invoiced', req.params.id]);

    // Insert timeline message
    await client.query(
      `INSERT INTO order_messages (order_id, sender_id, sender_role, type, quoted_price, message)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.params.id, req.user.id, req.user.role, 'invoice', grandTotal,
       `Invoice ${invoiceNumber} created. Grand Total: ${formatINR(grandTotal)}`]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, 'invoice_created', 'invoice', invoice.id,
       JSON.stringify({ invoice_number: invoiceNumber, grand_total: grandTotal, order_id: req.params.id })]
    );

    await client.query('COMMIT');
    res.status(201).json(invoice);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── Invoice Data (JSON) ──
app.get('/api/orders/:id/invoice-data', authenticate, async (req, res) => {
  try {
    const orderResult = await db.query('SELECT buyer_id FROM orders WHERE id = $1', [req.params.id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role === 'buyer' && orderResult.rows[0].buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const invResult = await db.query('SELECT * FROM invoices WHERE order_id = $1 LIMIT 1', [req.params.id]);
    if (invResult.rows.length === 0) return res.status(404).json({ error: 'No invoice found for this order' });
    const invoice = invResult.rows[0];

    const itemsResult = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
    invoice.items = itemsResult.rows;

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Invoice PDF Download ──
app.get('/api/orders/:id/invoice', authenticate, async (req, res) => {
  try {
    // Fetch order + buyer info
    const orderResult = await db.query(
      `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email, u.phone AS buyer_phone, u.company AS buyer_company
       FROM orders o JOIN users u ON o.buyer_id = u.id WHERE o.id = $1`,
      [req.params.id]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];

    // Access control
    if (req.user.role === 'buyer' && order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Status guard
    const allowedStatuses = ['invoiced', 'dispatched', 'delivered', 'qc_approved', 'completed'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({ error: 'Invoice PDF available for statuses: ' + allowedStatuses.join(', ') });
    }

    // Fetch invoice
    const invResult = await db.query('SELECT * FROM invoices WHERE order_id = $1 LIMIT 1', [req.params.id]);
    if (invResult.rows.length === 0) return res.status(404).json({ error: 'No invoice found' });
    const invoice = invResult.rows[0];

    // Fetch items
    const itemsResult = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
    const items = itemsResult.rows;

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const today = new Date();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
    doc.pipe(res);

    const pageWidth = doc.page.width - 100;
    const leftCol = 50;
    const rightCol = 310;

    // ── Header ──
    doc.fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', leftCol, 50);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice: ${invoice.invoice_number}`, rightCol, 50, { align: 'right', width: pageWidth - 260 });
    const invDate = new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(`Date: ${invDate}`, rightCol, 65, { align: 'right', width: pageWidth - 260 });
    if (invoice.due_date) {
      const dueDate = new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.text(`Due: ${dueDate}`, rightCol, 80, { align: 'right', width: pageWidth - 260 });
    }

    // Divider
    doc.moveTo(leftCol, 98).lineTo(leftCol + pageWidth, 98).lineWidth(1).stroke('#333333');

    // ── Supplier & Buyer ──
    let y = 108;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#888888');
    doc.text('FROM (SUPPLIER)', leftCol, y);
    doc.text('TO (BUYER)', rightCol, y);

    y += 16;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000');
    doc.text('HIMALAYA ENTERPRISES', leftCol, y);
    doc.text(order.buyer_company || order.buyer_name, rightCol, y);

    y += 16;
    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    doc.text('Managing Partner: Rajjeev Shuklaa', leftCol, y);
    doc.text(order.buyer_name, rightCol, y);

    y += 14;
    doc.text('M-6, 7th Phase, Adityapur Industrial Area', leftCol, y);
    doc.text(order.buyer_email, rightCol, y);

    y += 14;
    doc.text('Jamshedpur - 832109, Jharkhand (INDIA)', leftCol, y);
    doc.text(order.buyer_phone || '', rightCol, y);

    y += 14;
    doc.text(`GSTIN: ${invoice.supplier_gstin || '10AABCH1234A1ZA'}`, leftCol, y);
    doc.text(`GSTIN: ${invoice.buyer_gstin || 'N/A'}`, rightCol, y);

    // Divider
    y += 20;
    doc.moveTo(leftCol, y).lineTo(leftCol + pageWidth, y).lineWidth(0.5).stroke('#333333');

    // ── Order Reference ──
    y += 10;
    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    doc.text(`Order Ref: ${order.id}  |  Place of Supply: ${invoice.place_of_supply || 'Bihar'}  |  HSN: ${invoice.hsn_code || '8707'}`, leftCol, y);

    // Divider
    y += 18;
    doc.moveTo(leftCol, y).lineTo(leftCol + pageWidth, y).lineWidth(0.5).stroke('#333333');

    // ── Items Table ──
    y += 10;
    const colWidths = { sno: 30, desc: 175, hsn: 50, qty: 40, rate: 85, amount: 95 };
    const tableX = leftCol;
    const tableWidth = colWidths.sno + colWidths.desc + colWidths.hsn + colWidths.qty + colWidths.rate + colWidths.amount;

    // Table header
    doc.rect(tableX, y, tableWidth, 22).fill('#f0f0f0');
    doc.fillColor('#333333').fontSize(8).font('Helvetica-Bold');
    let cx = tableX + 4;
    doc.text('S.No', cx, y + 6, { width: colWidths.sno - 8 });
    cx += colWidths.sno;
    doc.text('Description', cx, y + 6, { width: colWidths.desc - 8 });
    cx += colWidths.desc;
    doc.text('HSN', cx, y + 6, { width: colWidths.hsn - 8 });
    cx += colWidths.hsn;
    doc.text('Qty', cx, y + 6, { width: colWidths.qty - 8 });
    cx += colWidths.qty;
    doc.text('Rate', cx, y + 6, { width: colWidths.rate - 8 });
    cx += colWidths.rate;
    doc.text('Amount', cx, y + 6, { width: colWidths.amount - 8 });

    y += 22;
    doc.font('Helvetica').fontSize(8).fillColor('#000000');

    if (items.length > 0) {
      items.forEach((item, idx) => {
        if (y > 650) { doc.addPage(); y = 50; }
        const rowH = 20;
        if (idx % 2 === 1) {
          doc.rect(tableX, y, tableWidth, rowH).fill('#fafafa');
          doc.fillColor('#000000');
        }
        cx = tableX + 4;
        doc.text(String(idx + 1), cx, y + 5, { width: colWidths.sno - 8 });
        cx += colWidths.sno;
        doc.text(item.description || '-', cx, y + 5, { width: colWidths.desc - 8 });
        cx += colWidths.desc;
        doc.text(item.hsn_code || '8707', cx, y + 5, { width: colWidths.hsn - 8 });
        cx += colWidths.hsn;
        doc.text(String(item.quantity || 1), cx, y + 5, { width: colWidths.qty - 8 });
        cx += colWidths.qty;
        doc.text(formatINR(item.unit_price), cx, y + 5, { width: colWidths.rate - 8 });
        cx += colWidths.rate;
        doc.text(formatINR(item.total), cx, y + 5, { width: colWidths.amount - 8 });
        y += rowH;
      });
    } else {
      // Single line for order total
      cx = tableX + 4;
      doc.text('1', cx, y + 5, { width: colWidths.sno - 8 });
      cx += colWidths.sno;
      doc.text('As per Purchase Order ' + order.id, cx, y + 5, { width: colWidths.desc - 8 });
      cx += colWidths.desc;
      doc.text(invoice.hsn_code || '8707', cx, y + 5, { width: colWidths.hsn - 8 });
      cx += colWidths.hsn;
      doc.text('1', cx, y + 5, { width: colWidths.qty - 8 });
      cx += colWidths.qty;
      doc.text(formatINR(invoice.subtotal), cx, y + 5, { width: colWidths.rate - 8 });
      cx += colWidths.rate;
      doc.text(formatINR(invoice.subtotal), cx, y + 5, { width: colWidths.amount - 8 });
      y += 20;
    }

    // Table bottom border
    doc.moveTo(tableX, y).lineTo(tableX + tableWidth, y).lineWidth(0.5).stroke('#cccccc');

    // ── Tax Summary ──
    y += 10;
    const rightAlign = tableX + tableWidth - 200;
    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    doc.text(`Subtotal:`, rightAlign, y, { width: 100 });
    doc.text(formatINR(invoice.subtotal), rightAlign + 100, y, { width: 100, align: 'right' });

    if (Number(invoice.cgst_rate) > 0) {
      y += 14;
      doc.text(`CGST @${invoice.cgst_rate}%:`, rightAlign, y, { width: 100 });
      doc.text(formatINR(invoice.cgst_amount), rightAlign + 100, y, { width: 100, align: 'right' });
    }
    if (Number(invoice.sgst_rate) > 0) {
      y += 14;
      doc.text(`SGST @${invoice.sgst_rate}%:`, rightAlign, y, { width: 100 });
      doc.text(formatINR(invoice.sgst_amount), rightAlign + 100, y, { width: 100, align: 'right' });
    }
    if (Number(invoice.igst_rate) > 0) {
      y += 14;
      doc.text(`IGST @${invoice.igst_rate}%:`, rightAlign, y, { width: 100 });
      doc.text(formatINR(invoice.igst_amount), rightAlign + 100, y, { width: 100, align: 'right' });
    }

    y += 14;
    doc.text(`Total Tax:`, rightAlign, y, { width: 100 });
    doc.text(formatINR(invoice.total_tax), rightAlign + 100, y, { width: 100, align: 'right' });

    y += 18;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000');
    doc.text(`GRAND TOTAL:`, rightAlign, y, { width: 100 });
    doc.text(formatINR(invoice.grand_total), rightAlign + 100, y, { width: 100, align: 'right' });

    // ── Amount in Words ──
    y += 25;
    doc.moveTo(leftCol, y).lineTo(leftCol + pageWidth, y).lineWidth(0.5).stroke('#333333');
    y += 8;
    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    doc.text(`Amount in Words: ${numberToWordsINR(Number(invoice.grand_total))}`, leftCol, y, { width: pageWidth });

    // ── Payment Info ──
    y += 20;
    doc.moveTo(leftCol, y).lineTo(leftCol + pageWidth, y).lineWidth(0.5).stroke('#333333');
    y += 8;
    if (invoice.payment_terms) {
      doc.text(`Payment Terms: ${invoice.payment_terms}`, leftCol, y, { width: pageWidth });
      y += 14;
    }
    const advPaid = Number(order.advance_paid || 0);
    const balDue = Number(invoice.grand_total) - advPaid;
    doc.text(`Advance Received: ${formatINR(advPaid)}  |  Balance Due: ${formatINR(balDue)}`, leftCol, y, { width: pageWidth });

    // ── Bank Details ──
    y += 20;
    doc.moveTo(leftCol, y).lineTo(leftCol + pageWidth, y).lineWidth(0.5).stroke('#333333');
    y += 8;
    doc.fontSize(8).fillColor('#666666');
    doc.text('Bank: State Bank of India  |  A/C: XXXXXXXXXXXX  |  IFSC: SBIN0XXXXXX', leftCol, y, { width: pageWidth });

    // ── Signature Block ──
    y += 25;
    doc.moveTo(leftCol, y).lineTo(leftCol + pageWidth, y).lineWidth(0.5).stroke('#333333');
    y += 15;
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
    y += 25;
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
