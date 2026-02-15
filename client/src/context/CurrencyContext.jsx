import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('preferredCurrency') || null;
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const prompted = localStorage.getItem('currencyPrompted');
    if (!prompted && !currency) {
      setShowModal(true);
    }
  }, [currency]);

  function selectCurrency(code) {
    setCurrency(code);
    localStorage.setItem('preferredCurrency', code);
    localStorage.setItem('currencyPrompted', 'true');
    setShowModal(false);
  }

  return (
    <CurrencyContext.Provider value={{ currency, selectCurrency, showModal, setShowModal }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
