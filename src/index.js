// Consumer entry point — contoh pakai library @anrizz/bot-payment
require('dotenv').config();
const express = require('express');
const path = require('path');

// Gunakan gateway dari lib/
const { createPaymentGateway } = require('../lib');
const { createDiscordBot } = require('../lib/bot');
const adminRouter = require('./routes/admin');

const app = express();

// Mount payment gateway di /api
app.use('/api', createPaymentGateway());

// Admin panel (backward compat)
app.use('/api/admin', adminRouter);

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Home dashboard
app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>Tako Payment Gateway</title>
<style>body{font-family:system-ui;background:#0f0f0f;color:#e5e5e5;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}main{text-align:center}h1{font-size:2rem;margin-bottom:.5rem}.status{color:#10b981;margin-bottom:1.5rem}.links{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}a{display:inline-block;padding:.75rem 1.5rem;border-radius:.5rem;text-decoration:none;font-weight:600}a.checkout{background:#3b82f6;color:#fff}a.admin{background:#1a1a1a;color:#e5e5e5;border:1px solid #333}a.api{background:#1a1a1a;color:#e5e5e5;border:1px solid #333}</style></head>
<body><main>
  <h1>Tako Payment Gateway</h1>
  <div class="status">Running</div>
  <div class="links">
    <a href="/checkout.html" class="checkout">Checkout</a>
    <a href="/admin.html" class="admin">Admin</a>
    <a href="/api/products" class="api">API Products</a>
  </div>
</main></body></html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 API on :${PORT}`);
});

// Start Discord bot (tidak akan login jika DISCORD_TOKEN tidak diset)
try {
  createDiscordBot();
} catch (_) {
  console.log('[bot] ⚠️ Discord bot not started (no DISCORD_TOKEN)');
}
