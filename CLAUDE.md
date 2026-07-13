# AI Agent Instructions

You are helping someone install and run **Tako Payment Gateway**. Follow these steps.

## Prerequisites

Ask the user for:
1. **Discord Bot Token** (from https://discord.com/developers/applications)
2. **Discord Channel ID** (where Tako webhook posts — enable Developer Mode, right-click channel → Copy ID)

## Installation

```bash
git clone https://github.com/aldirahmanhh/takoPayment.git
cd takoPayment
npm install
```

## Configuration

Copy `.env.example` to `.env` and fill in:

```
DISCORD_TOKEN=           # from user
TAKO_WEBHOOK_CHANNEL_ID= # from user
JWT_SECRET=              # generate random string: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
INTERNAL_API_KEY=        # generate another random string
DATABASE_URL="file:./dev.db"
TAKO_CREATOR_USERNAME=anrizz
TAKO_URL=https://tako.id/anrizz
ORDER_EXPIRY_MINUTES=15
```

## Database

```bash
npx prisma db push
```

## Seed a Product

```bash
node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.product.create({
    data: {
      id: 'prod_vip',
      name: 'VIP Access 30 Hari',
      description: 'Akses penuh fitur premium selama 30 hari',
      price: 10000,
      type: 'subscription',
      durationDays: 30,
      isActive: true
    }
  }).then(() => { console.log('Product seeded'); process.exit(0); });
"
```

Or use the admin panel at http://localhost:3000/admin.html after starting.

## Run

```bash
npm start
```

- **Checkout**: http://localhost:3000/checkout.html
- **Admin**: http://localhost:3000/admin.html
- **API**: http://localhost:3000/api/products

## Discord Bot Setup (tell the user)

1. Go to https://discord.com/developers/applications → New Application
2. Bot → Add Bot → Copy Token
3. Enable **Message Content Intent** (Privileged Gateway Intents)
4. OAuth2 → URL Generator → Scopes: `bot` → Permissions: `Read Messages`, `Send Messages`, `Read Message History`
5. Use the generated URL to invite the bot to the server
6. In the server: enable Developer Mode → right-click the Tako webhook channel → Copy ID → paste as `TAKO_WEBHOOK_CHANNEL_ID`

## Tako Webhook Setup (tell the user)

1. Go to https://tako.id → Dashboard → Integrations
2. Add Discord webhook → select server + channel
3. Save

## Troubleshooting

- **"DISCORD_TOKEN required"**: `.env` not configured
- **Bot not reading messages**: Message Content Intent not enabled
- **Payment logs not appearing**: Tako webhook not posting to configured channel
- **ORD-XXXXXX not detected**: User must put the payment code as the sender name on Tako
