const CURRENCY_SYMBOLS = {
  USD: { locale: 'en-US', currency: 'USD' },
  GBP: { locale: 'en-GB', currency: 'GBP' },
  EUR: { locale: 'de-DE', currency: 'EUR' },
};

export function formatCurrency(amount, currencyCode) {
  if (amount == null || isNaN(amount)) return '—';

  const config = CURRENCY_SYMBOLS[currencyCode] || {
    locale: 'en-US',
    currency: currencyCode,
  };

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency || currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${Math.round(amount).toLocaleString()}`;
  }
}

export function getCurrencyField(preferredCurrency) {
  const map = {
    USD: 'usd',
    GBP: 'gbp',
    EUR: 'eur',
  };
  return map[preferredCurrency] || 'usd';
}
