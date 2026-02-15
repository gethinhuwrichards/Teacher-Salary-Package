const supabase = require('../db/supabase');

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}`;

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

async function getTodayRates() {
  const monthKey = getMonthKey();

  // Check cache — one fetch per month
  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('rates')
    .eq('base_currency', 'USD')
    .eq('rate_date', monthKey)
    .single();

  if (cached) return cached.rates;

  // No cached rates for this month — fetch from API
  const res = await fetch(`${BASE_URL}/latest/USD`);
  if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);

  const json = await res.json();
  if (json.result !== 'success') throw new Error(`Exchange rate API failed: ${json['error-type']}`);

  const rates = json.conversion_rates;

  // Cache with month key — won't be fetched again until next month
  await supabase
    .from('exchange_rates')
    .upsert({
      base_currency: 'USD',
      rate_date: monthKey,
      rates,
    }, { onConflict: 'base_currency,rate_date' });

  return rates;
}

module.exports = { getTodayRates };
