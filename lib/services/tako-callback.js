const prisma = require('../prisma');
const { fulfillOrder } = require('./fulfillment');

async function processTakoCallback({ discord_message_id, sender_name, amount, raw_payload }) {
  // SQLite: rawPayload is String, convert from object
  const rawPayloadStr = typeof raw_payload === 'string' ? raw_payload : JSON.stringify(raw_payload);

  // 1. Duplicate check by discord_message_id
  const existingLog = await prisma.paymentLog.findUnique({
    where: { discordMessageId: discord_message_id },
  });
  if (existingLog) {
    return { handled: true, status: 'DUPLICATE' };
  }

  // 2. Find matching PaymentIntent
  const now = new Date();
  let paymentIntent = await prisma.paymentIntent.findFirst({
    where: {
      paymentCode: sender_name,
      status: 'PENDING',
      expiredAt: { gt: now },
    },
    include: { order: true },
  });

  // Loose match by sender_name
  if (!paymentIntent) {
    const intents = await prisma.paymentIntent.findMany({
      where: {
        status: 'PENDING',
        expiredAt: { gt: now },
      },
      include: { order: true },
    });
    paymentIntent = intents.find((pi) =>
      sender_name.includes(pi.paymentCode) || pi.paymentCode.includes(sender_name),
    ) || null;
  }

  // 3. No matching PaymentIntent
  if (!paymentIntent) {
    await prisma.paymentLog.create({
      data: {
        provider: 'TAKO',
        discordMessageId: discord_message_id,
        senderName: sender_name,
        amount,
        rawPayload: rawPayloadStr,
        status: 'UNKNOWN_PAYMENT',
      },
    });
    return { handled: true, status: 'UNKNOWN_PAYMENT' };
  }

  // 4. Expired order
  if (paymentIntent.order.expiredAt < now) {
    await prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: { status: 'EXPIRED' },
    });
    await prisma.order.update({
      where: { id: paymentIntent.order.id },
      data: { status: 'EXPIRED' },
    });
    await prisma.paymentLog.create({
      data: {
        provider: 'TAKO',
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.order.id,
        discordMessageId: discord_message_id,
        senderName: sender_name,
        amount,
        rawPayload: rawPayloadStr,
        status: 'EXPIRED_PAYMENT',
      },
    });
    return { handled: true, status: 'EXPIRED_PAYMENT' };
  }

  // 5. Amount mismatch
  if (paymentIntent.expectedAmount !== amount) {
    await prisma.paymentLog.create({
      data: {
        provider: 'TAKO',
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.order.id,
        discordMessageId: discord_message_id,
        senderName: sender_name,
        amount,
        rawPayload: rawPayloadStr,
        status: 'AMOUNT_MISMATCH',
      },
    });
    return { handled: true, status: 'AMOUNT_MISMATCH' };
  }

  // 6. Already paid
  if (paymentIntent.order.status === 'PAID') {
    await prisma.paymentLog.create({
      data: {
        provider: 'TAKO',
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.order.id,
        discordMessageId: discord_message_id,
        senderName: sender_name,
        amount,
        rawPayload: rawPayloadStr,
        status: 'DUPLICATE',
      },
    });
    return { handled: true, status: 'DUPLICATE' };
  }

  // 7. Valid payment
  await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: { status: 'PAID', paidAt: now },
    });
    await tx.order.update({
      where: { id: paymentIntent.order.id },
      data: { status: 'PAID', paidAt: now },
    });
    await tx.paymentLog.create({
      data: {
        provider: 'TAKO',
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.order.id,
        discordMessageId: discord_message_id,
        senderName: sender_name,
        amount,
        rawPayload: rawPayloadStr,
        status: 'SUCCESS',
      },
    });
  });

  // 8. Fulfill order
  await fulfillOrder(paymentIntent.order.id);

  return { handled: true, status: 'SUCCESS' };
}

module.exports = { processTakoCallback };
