import { useCurrency } from '../context/CurrencyContext';
import './CurrencyModal.css';

export default function CurrencyModal() {
  const { showModal, selectCurrency } = useCurrency();

  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Welcome to IntlTeacherPay</h2>
        <p>Select your preferred currency. Salaries will always be shown in both the local school currency and your preferred currency.</p>
        <div className="currency-options">
          <button className="currency-btn" onClick={() => selectCurrency('USD')}>
            <span className="currency-symbol">$</span>
            <span>US Dollar (USD)</span>
          </button>
          <button className="currency-btn" onClick={() => selectCurrency('GBP')}>
            <span className="currency-symbol">£</span>
            <span>British Pound (GBP)</span>
          </button>
          <button className="currency-btn" onClick={() => selectCurrency('EUR')}>
            <span className="currency-symbol">€</span>
            <span>Euro (EUR)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
