/**
 * Tako Payment Gateway - Discord Bot
 * Exports createDiscordBot(config) untuk dipanggil dari app consumer.
 */
const { Client, GatewayIntentBits, Events } = require('discord.js');

// ── Parser ──────────────────────────────────────────────────────────────────

const TEST_PATTERNS = [
  /contoh/i,
  /ini adalah pesan contoh/i,
  /gunakan/i,
  /test donation/i,
  /pesan uji coba/i,
];

const AMOUNT_REGEX = /(?:IDR|Rp)\s*(\d{1,3}(?:[.,]\d{3})*|\d+)/i;
const SENDER_FIELD_NAMES = ['pengirim', 'sender', 'gifter', 'donatur'];
const ORD_CODE_REGEX = /\bORD-[A-Z0-9]{6}\b/;

function parseTakoEmbed(message) {
  const embed = message.embeds[0];
  const textParts = [];

  if (embed) {
    if (embed.title) textParts.push(embed.title);
    if (embed.description) textParts.push(embed.description);
    if (embed.fields && embed.fields.length > 0) {
      for (const field of embed.fields) {
        textParts.push(field.name, field.value);
      }
    }
  }

  if (textParts.length === 0 && message.content) {
    textParts.push(message.content);
  }

  if (textParts.length === 0) return null;

  const fullText = textParts.join(' ');

  for (const pattern of TEST_PATTERNS) {
    if (pattern.test(fullText)) {
      console.log(`[bot] ⏭️  Ignored test message: ${message.id}`);
      return null;
    }
  }

  const amountMatch = fullText.match(AMOUNT_REGEX);
  if (!amountMatch) return null;

  const amount = parseInt(amountMatch[1].replace(/[.,]/g, ''), 10);
  if (isNaN(amount) || amount <= 0) return null;

  // Extract sender_name
  let senderName = null;

  if (embed && embed.fields) {
    for (const field of embed.fields) {
      if (SENDER_FIELD_NAMES.includes(field.name.toLowerCase().trim())) {
        senderName = field.value.trim();
        break;
      }
    }
  }

  if (!senderName) {
    const mengirimMatch = fullText.match(/^(.+?)\s+mengirim\b/i);
    if (mengirimMatch) senderName = mengirimMatch[1].trim();
  }

  if (!senderName) {
    const amountIndex = fullText.search(AMOUNT_REGEX);
    if (amountIndex > 0) {
      senderName = fullText.slice(0, amountIndex)
        .replace(/(?:💰|💵|💸|donasi|masuk|new\s+donation)/gi, '').trim();
    }
  }

  if (!senderName) senderName = message.author.username;

  senderName = senderName.replace(/\s+/g, ' ').trim();

  // Scan for ORD-XXXXXX in full embed text
  const ordMatch = fullText.match(ORD_CODE_REGEX);
  if (ordMatch) senderName = ordMatch[0];

  if (!senderName || senderName.length === 0) return null;

  const rawPayload = {
    title: embed ? embed.title : null,
    description: embed ? embed.description : null,
    fields: (embed && embed.fields) ? embed.fields.map(f => ({ name: f.name, value: f.value })) : [],
    author: { id: message.author.id, username: message.author.username },
  };

  return { discord_message_id: message.id, sender_name: senderName, amount, raw_payload: rawPayload };
}

// ── Bot Factory ─────────────────────────────────────────────────────────────

function createDiscordBot(cfg = {}) {
  const TAKO_WEBHOOK_CHANNEL_ID = cfg.TAKO_WEBHOOK_CHANNEL_ID || process.env.TAKO_WEBHOOK_CHANNEL_ID;
  const TAKO_WEBHOOK_AUTHOR_ID = cfg.TAKO_WEBHOOK_AUTHOR_ID || process.env.TAKO_WEBHOOK_AUTHOR_ID;
  const INTERNAL_API_KEY = cfg.INTERNAL_API_KEY || process.env.INTERNAL_API_KEY;
  const BACKEND_URL = cfg.BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3000';
  const DISCORD_TOKEN = cfg.DISCORD_TOKEN || process.env.DISCORD_TOKEN;

  if (!DISCORD_TOKEN) {
    throw new Error('[bot] DISCORD_TOKEN required');
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  client.on(Events.ClientReady, () => {
    console.log(`[bot] 🤖 Ready as ${client.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (!message.author.bot) return;
    if (TAKO_WEBHOOK_CHANNEL_ID && message.channel.id !== TAKO_WEBHOOK_CHANNEL_ID) return;
    if (TAKO_WEBHOOK_AUTHOR_ID && message.author.id !== TAKO_WEBHOOK_AUTHOR_ID) return;

    const parsed = parseTakoEmbed(message);
    if (!parsed) return;

    console.log(`[bot] 📤 Sender: ${parsed.sender_name} | Amount: ${parsed.amount}`);

    try {
      const response = await fetch(`${BACKEND_URL}/api/internal/tako-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_KEY}`,
        },
        body: JSON.stringify({
          discord_message_id: parsed.discord_message_id,
          sender_name: parsed.sender_name,
          amount: parsed.amount,
          raw_payload: parsed.raw_payload,
        }),
      });
      if (response.ok) {
        console.log(`[bot] ✅ Backend accepted: ${parsed.sender_name} IDR ${parsed.amount}`);
      } else {
        const body = await response.text();
        console.warn(`[bot] ⚠️  Backend rejected (${response.status}): ${body}`);
      }
    } catch (err) {
      console.error(`[bot] ❌ Backend unreachable: ${err.message}`);
    }
  });

  client.login(DISCORD_TOKEN);
  return client;
}

module.exports = { createDiscordBot };
