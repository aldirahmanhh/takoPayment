const { Router } = require('express');
const prisma = require('../prisma');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const { generatePaymentCode } = require('../generate-payment-code');

const router = Router();

// POST /  (auth required)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'product_id required' });
    }

    const product = await prisma.product.findUnique({ where: { id: product_id } });
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found or inactive' });
    }

    const paymentCode = generatePaymentCode();
    const expiredAt = new Date(Date.now() + config.ORDER_EXPIRY_MINUTES * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: req.user.id,
          productId: product.id,
          amount: product.price,
          status: 'PENDING',
          expiredAt,
        },
      });

      const pi = await tx.paymentIntent.create({
        data: {
          orderId: order.id,
          userId: req.user.id,
          provider: 'TAKO',
          paymentCode,
          expectedAmount: product.price,
          status: 'PENDING',
          expiredAt,
        },
      });

      return { order, pi };
    });

    res.status(201).json({
      order_id: result.order.id,
      payment_intent_id: result.pi.id,
      amount: product.price,
      payment_code: paymentCode,
      tako_url: config.TAKO_URL,
      instruction: `Silakan donate ke Tako sebesar IDR ${product.price.toLocaleString('id-ID')} dengan nama pengirim atau pesan: ${paymentCode}`,
      expired_at: expiredAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
