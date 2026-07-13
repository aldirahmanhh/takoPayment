require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || 'internal-dev-change-me',
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  TAKO_WEBHOOK_CHANNEL_ID: process.env.TAKO_WEBHOOK_CHANNEL_ID,
  TAKO_WEBHOOK_AUTHOR_ID: process.env.TAKO_WEBHOOK_AUTHOR_ID,
  TAKO_CREATOR_USERNAME: process.env.TAKO_CREATOR_USERNAME || 'anrizz',
  TAKO_URL: process.env.TAKO_URL || 'https://tako.id/anrizz',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  ORDER_EXPIRY_MINUTES: parseInt(process.env.ORDER_EXPIRY_MINUTES || '15', 10),
};
