const express = require('express');
const router = express.Router();
const { getTodayRates } = require('../services/currencyService');

// GET /api/currency/rates
router.get('/rates', async (req, res) => {
  try {
    const rates = await getTodayRates();
    res.json({ base: 'USD', rates });
  } catch (err) {
    console.error('Error fetching rates:', err);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

module.exports = router;
