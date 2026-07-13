const { Router } = require('express');
const { requireInternalKey } = require('../middleware/auth');
const { processTakoCallback } = require('../services/tako-callback');

const router = Router();

// POST /tako-callback
router.post('/tako-callback', requireInternalKey, async (req, res) => {
  try {
    const result = await processTakoCallback(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Tako callback error:', err);
    res.status(500).json({ ok: false, error: 'Internal processing error' });
  }
});

module.exports = router;
