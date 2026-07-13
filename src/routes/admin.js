/**
 * Admin routes — consumer-level, not in lib/.
 * Endpoints: products CRUD, orders list, payment logs list.
 */
const { Router } = require('express');
const prisma = require('../../lib/prisma');
const { requireAuth } = require('../../lib/middleware/auth');

const router = Router();
router.use(requireAuth);

// ── Products ────────────────────────────────────────────────────────────────

router.get('/products', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ products });
  } catch (err) { next(err); }
});

router.post('/products', async (req, res, next) => {
  try {
    const { name, description, price, type, duration_days, is_active } = req.body;
    const product = await prisma.product.create({
      data: { name, description, price: Number(price), type, durationDays: duration_days ? Number(duration_days) : null, isActive: is_active !== false },
    });
    res.status(201).json({ product });
  } catch (err) { next(err); }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const { name, description, price, type, duration_days, is_active } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, price: Number(price), type, durationDays: duration_days ? Number(duration_days) : null, isActive: is_active !== false },
    });
    res.json({ product });
  } catch (err) { next(err); }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.patch('/products/:id/toggle', async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
    });
    res.json({ product });
  } catch (err) { next(err); }
});

// ── Orders ──────────────────────────────────────────────────────────────────

router.get('/orders', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: { product: true, user: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (err) { next(err); }
});

// ── Payment Logs ────────────────────────────────────────────────────────────

router.get('/payment-logs', async (req, res, next) => {
  try {
    const logs = await prisma.paymentLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { paymentIntent: true, order: { include: { product: true, user: { select: { id: true, username: true } } } } },
    });
    res.json({ logs });
  } catch (err) { next(err); }
});

module.exports = router;
