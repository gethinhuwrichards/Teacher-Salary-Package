const { getTodayRates } = require('./currencyService');

async function convertAmount(amount, fromCurrency, localCurrencyCode) {
  const rates = await getTodayRates();

  // Convert to USD first (all rates are USD-based)
  const fromRate = rates[fromCurrency];
  if (!fromRate) throw new Error(`Unknown currency: ${fromCurrency}`);

  const amountInUsd = amount / fromRate;

  const gbpRate = rates['GBP'] || 1;
  const eurRate = rates['EUR'] || 1;
  const localRate = rates[localCurrencyCode] || 1;

  return {
    usd: Math.round(amountInUsd * 100) / 100,
    gbp: Math.round(amountInUsd * gbpRate * 100) / 100,
    eur: Math.round(amountInUsd * eurRate * 100) / 100,
    local: Math.round(amountInUsd * localRate * 100) / 100,
    rate_date: new Date().toISOString().split('T')[0],
  };
}

module.exports = { convertAmount };
