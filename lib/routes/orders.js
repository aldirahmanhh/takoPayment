const { Router } = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// GET /  (auth required)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /:id  (auth required, ownership check)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        paymentIntents: true,
        entitlements: true,
      },
    });

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const response = {
      order: {
        ...order,
        paymentIntents: undefined,
        entitlements: undefined,
        payment_intents: order.paymentIntents,
        ...(order.status === 'PAID' && { entitlements: order.entitlements }),
      },
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
