/**
 * Tako Payment Gateway
 * 
 * Usage:
 *   const { createPaymentGateway } = require('bot-payment');
 *   const app = express();
 *   app.use('/api', createPaymentGateway());
 */

require('dotenv').config();
const { Router } = require('express');
const cors = require('cors');
const path = require('path');

module.exports = { createPaymentGateway };

function createPaymentGateway(configOverride = {}) {
  const config = { ...require('./config'), ...configOverride };

  const app = Router();

  app.use(require('express').json()); // ponytail: caller's express handles json, we layer for safety
  app.use(cors());

  // API routes
  app.use('/auth', require('./routes/auth'));
  app.use('/products', require('./routes/products'));
  app.use('/checkout', require('./routes/checkout'));
  app.use('/orders', require('./routes/orders'));
  app.use('/internal', require('./routes/internal'));

  // Static files (checkout page)
  app.use(require('express').static(path.join(__dirname, '..', 'public')));

  // Global error handler
  app.use((err, req, res, _next) => {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
