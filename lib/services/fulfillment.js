const prisma = require('../prisma');

async function fulfillOrder(orderId) {
  // Idempotent: skip if entitlement already exists
  const existing = await prisma.entitlement.findFirst({
    where: { orderId },
  });
  if (existing) {
    return existing;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const endDate = order.product.durationDays
    ? new Date(Date.now() + order.product.durationDays * 24 * 60 * 60 * 1000)
    : null;

  const entitlement = await prisma.entitlement.create({
    data: {
      userId: order.userId,
      productId: order.productId,
      orderId,
      status: 'ACTIVE',
      startsAt: new Date(),
      endsAt: endDate,
    },
  });

  return entitlement;
}

module.exports = { fulfillOrder };
