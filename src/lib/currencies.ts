// src/lib/currencies.ts - Multi-Currency Support System

export const CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$', code: 'USD', rate: 1 },
  EUR: { name: 'Euro', symbol: '€', code: 'EUR', rate: 0.92 },
  GBP: { name: 'British Pound', symbol: '£', code: 'GBP', rate: 0.79 },
  JPY: { name: 'Japanese Yen', symbol: '¥', code: 'JPY', rate: 149.5 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', code: 'AUD', rate: 1.53 },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', code: 'CAD', rate: 1.36 },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', code: 'CHF', rate: 0.88 },
  CNY: { name: 'Chinese Yuan', symbol: '¥', code: 'CNY', rate: 7.24 },
  INR: { name: 'Indian Rupee', symbol: '₹', code: 'INR', rate: 83.12 },
  MXN: { name: 'Mexican Peso', symbol: '$', code: 'MXN', rate: 17.05 },
  BRL: { name: 'Brazilian Real', symbol: 'R$', code: 'BRL', rate: 4.97 },
  ZAR: { name: 'South African Rand', symbol: 'R', code: 'ZAR', rate: 18.50 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', code: 'SGD', rate: 1.34 },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', code: 'HKD', rate: 7.81 },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', code: 'NZD', rate: 1.64 },
  KRW: { name: 'South Korean Won', symbol: '₩', code: 'KRW', rate: 1319.5 },
  THB: { name: 'Thai Baht', symbol: '฿', code: 'THB', rate: 35.45 },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', code: 'AED', rate: 3.67 },
  SEK: { name: 'Swedish Krona', symbol: 'kr', code: 'SEK', rate: 10.65 },
  NOK: { name: 'Norwegian Krone', symbol: 'kr', code: 'NOK', rate: 10.85 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

/**
 * Convert amount from one currency to another
 * @param amount - Amount in source currency
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const sourceRate = CURRENCIES[fromCurrency]?.rate || 1;
  const targetRate = CURRENCIES[toCurrency]?.rate || 1;
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / sourceRate;
  const convertedAmount = amountInUSD * targetRate;
  
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Format amount with currency symbol
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string (e.g., "$99.99")
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const currencyData = CURRENCIES[currency];
  if (!currencyData) return `${amount.toFixed(2)}`;
  
  // Special formatting for currencies with different decimal conventions
  if (currency === 'JPY') {
    return `${currencyData.symbol}${Math.round(amount)}`;
  }
  
  return `${currencyData.symbol}${amount.toFixed(2)}`;
}

/**
 * Get currency display name
 */
export function getCurrencyName(currency: CurrencyCode): string {
  return CURRENCIES[currency]?.name || currency;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency]?.symbol || currency;
}

/**
 * List all available currencies
 */
export function getAllCurrencies() {
  return Object.keys(CURRENCIES) as CurrencyCode[];
}
