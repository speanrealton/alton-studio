// src/components/CurrencyConverter.tsx - Currency Conversion Display Component

'use client';

import { useState } from 'react';
import { CURRENCIES, CurrencyCode, convertCurrency, formatCurrency } from '@/lib/currencies';
import { ArrowRightLeft } from 'lucide-react';

interface CurrencyConverterProps {
  amount: number;
  fromCurrency?: CurrencyCode;
  toCurrency?: CurrencyCode;
  showLabels?: boolean;
  compact?: boolean;
  onCurrencyChange?: (currency: CurrencyCode) => void;
}

export default function CurrencyConverter({
  amount,
  fromCurrency = 'USD',
  toCurrency = 'USD',
  showLabels = true,
  compact = false,
  onCurrencyChange,
}: CurrencyConverterProps) {
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(toCurrency);
  const [showConverter, setShowConverter] = useState(false);

  const convertedAmount = convertCurrency(amount, fromCurrency, displayCurrency);
  const originalAmount = formatCurrency(amount, fromCurrency);
  const newAmount = formatCurrency(convertedAmount, displayCurrency);

  const handleCurrencyChange = (currency: CurrencyCode) => {
    setDisplayCurrency(currency);
    onCurrencyChange?.(currency);
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="font-semibold text-gray-900 dark:text-white">{originalAmount}</span>
        {fromCurrency !== displayCurrency && (
          <>
            <span className="text-gray-500">=</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">{newAmount}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showLabels && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Amount in {CURRENCIES[fromCurrency]?.name}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {CURRENCIES[fromCurrency]?.code}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{originalAmount}</p>
        </div>

        <button
          onClick={() => setShowConverter(!showConverter)}
          className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition"
          title="Show converter"
        >
          <ArrowRightLeft className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </button>

        <div className="flex-1 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">
            {CURRENCIES[displayCurrency]?.code}
          </p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{newAmount}</p>
        </div>
      </div>

      {showConverter && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Convert to another currency:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CURRENCIES)
              .filter(([code]) => code !== displayCurrency)
              .slice(0, 10)
              .map(([code, data]) => (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code as CurrencyCode)}
                  className="px-3 py-2 text-left text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:border-purple-400 dark:hover:border-purple-500 transition"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {data.symbol} {code}
                  </span>
                  <p className="text-gray-500 dark:text-gray-400">
                    {formatCurrency(convertCurrency(amount, fromCurrency, code as CurrencyCode), code as CurrencyCode)}
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
