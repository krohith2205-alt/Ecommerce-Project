import { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext();

// Baseline exchange rates relative to INR (₹1)
const exchangeRates = {
  INR: { symbol: "₹", rate: 1 },
  USD: { symbol: "$", rate: 0.012 }, // e.g., 1 INR = 0.012 USD (~$1 = ₹83)
  EUR: { symbol: "€", rate: 0.011 }, // e.g., 1 INR = 0.011 EUR
  GBP: { symbol: "£", rate: 0.0095 } // e.g., 1 INR = 0.0095 GBP
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("currency") || "INR";
  });

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  // Convert and format any INR amount
  function formatPrice(amountInINR) {
    const data = exchangeRates[currency] || exchangeRates.INR;
    const converted = Number(amountInINR || 0) * data.rate;
    
    // Format nicely based on currency
    return `${data.symbol}${converted.toFixed(2)}`;
  }

  // Get raw converted number (useful for calculations if needed)
  function convertAmount(amountInINR) {
    const data = exchangeRates[currency] || exchangeRates.INR;
    return Number((Number(amountInINR || 0) * data.rate).toFixed(2));
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}