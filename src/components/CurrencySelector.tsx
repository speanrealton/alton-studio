// src/components/CurrencySelector.tsx - Currency Selection Component

'use client';

import { useState } from 'react';
import { CURRENCIES, getAllCurrencies, getCurrencyName, getCurrencySymbol } from '@/lib/currencies';
import { DollarSign, ChevronDown } from 'lucide-react';
import type { CurrencyCode } from '@/lib/currencies';

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  label?: string;
  showFullName?: boolean;
}

export default function CurrencySelector({
  value,
  onChange,
  label = 'Currency',
  showFullName = false,
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currencies = getAllCurrencies();
  const selectedCurrency = CURRENCIES[value];

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium flex items-center justify-between hover:border-purple-400 dark:hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        >
          <span className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span>
              {selectedCurrency?.symbol} {value}
              {showFullName && ` - ${selectedCurrency?.name}`}
            </span>
          </span>
          <ChevronDown className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {currencies.map((currencyCode) => (
              <button
                key={currencyCode}
                onClick={() => {
                  onChange(currencyCode);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/30 transition ${
                  value === currencyCode
                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 font-semibold'
                    : 'text-gray-900 dark:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{getCurrencySymbol(currencyCode)}</span>
                  <span>
                    {currencyCode}
                    {showFullName && ` - ${getCurrencyName(currencyCode)}`}
                  </span>
                </span>
                {value === currencyCode && (
                  <span className="text-purple-600 dark:text-purple-400">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
