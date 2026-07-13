const { Router } = require('express');
const prisma = require('../prisma');

const router = Router();

// GET /
router.get('/', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true, price: true, type: true, durationDays: true },
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

// GET /:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, isActive: true },
      select: { id: true, name: true, description: true, price: true, type: true, durationDays: true },
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
