# @anrizz/bot-payment

Payment gateway otomatis menggunakan Tako.id donation page + Discord webhook sebagai callback tidak langsung.

## Arsitektur

```
User checkout (Frontend) → Backend API → User donate di Tako
                                          ↓
                              Tako kirim notif ke Discord webhook
                                          ↓
                              Discord bot baca & parse
                                          ↓
                          Bot kirim data payment ke Backend
                                          ↓
                            Backend validasi + fulfillment
```

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd bot-payment
npm install
```

### 2. Setup Database

```bash
cp .env.example .env
# Edit .env: isi DISCORD_TOKEN, DATABASE_URL, dll

npx prisma db push
```

### 3. Seed Products

Di database, insert produk via SQLite CLI atau admin panel:

```sql
INSERT INTO products (id, name, description, price, type, duration_days, is_active)
VALUES ('prod1', 'VIP Access', 'Akses VIP 1 bulan', 10000, 'subscription', 30, 1);
```

### 4. Run

```bash
npm start
# API: http://localhost:3000
# Checkout: http://localhost:3000/checkout.html
# Admin: http://localhost:3000/admin.html (login dulu)
```

## Flow Pembayaran

1. User login/register di `/checkout.html` atau frontend app kamu
2. User pilih produk → klik Beli
3. Backend buat order + payment code (contoh: `ORD-A8K2X9`)
4. User donate ke [Tako](https://tako.id/anrizz) dengan nama pengirim = kode order
5. Tako kirim notif ke Discord → bot parse → kirim ke backend
6. Backend validasi: payment_code match, amount match, belum expired
7. If valid → order PAID → entitlement dibuat

## Config (.env)

| Key | Deskripsi |
|-----|-----------|
| `DISCORD_TOKEN` | Token bot Discord |
| `TAKO_WEBHOOK_CHANNEL_ID` | Channel ID tempat Tako webhook post |
| `TAKO_WEBHOOK_AUTHOR_ID` | (Opsional) Webhook author ID Tako untuk whitelist |
| `JWT_SECRET` | Secret untuk sign JWT token |
| `INTERNAL_API_KEY` | API key untuk komunikasi bot → backend |
| `DATABASE_URL` | SQLite path (`file:./dev.db`) |
| `TAKO_URL` | URL halaman Tako (default: `https://tako.id/anrizz`) |
| `ORDER_EXPIRY_MINUTES` | Expiry order dalam menit (default: 15) |

## Pakai Sebagai Library

```js
const express = require('express');
const { createPaymentGateway } = require('@anrizz/bot-payment');

const app = express();
app.use('/api', createPaymentGateway({
  JWT_SECRET: 'custom-secret',
  INTERNAL_API_KEY: 'custom-key',
}));

app.listen(3000);
```

## Discord Bot

Untuk menjalankan bot Discord, panggil dari entry app kamu:

```js
const { createDiscordBot } = require('@anrizz/bot-payment/lib/bot');
createDiscordBot({
  DISCORD_TOKEN: 'your-token',
  TAKO_WEBHOOK_CHANNEL_ID: 'channel-id',
  INTERNAL_API_KEY: 'your-internal-key',
  BACKEND_URL: 'http://localhost:3000',
});
```

## Database

Menggunakan SQLite (Prisma 5). Schema ada di `prisma/schema.prisma`.

Tabel:
- `users` — akun user
- `products` — produk yang dijual
- `orders` — order checkout
- `payment_intents` — intent pembayaran dengan payment_code
- `payment_logs` — log semua notif Tako (termasuk gagal/rejected)
- `entitlements` — fulfillment (akses produk setelah PAID)

## Stack

- Node.js + Express
- discord.js v14
- SQLite + Prisma ORM
- JWT + bcryptjs
- Tailwind CSS (frontend)
