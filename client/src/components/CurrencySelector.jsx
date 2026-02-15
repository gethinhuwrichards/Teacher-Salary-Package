import { useCurrency } from '../context/CurrencyContext';
import { PREFERRED_CURRENCIES } from '../utils/constants';
import './CurrencySelector.css';

export default function CurrencySelector() {
  const { currency, selectCurrency } = useCurrency();

  if (!currency) return null;

  return (
    <select
      className="currency-selector"
      value={currency}
      onChange={(e) => selectCurrency(e.target.value)}
    >
      {PREFERRED_CURRENCIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
