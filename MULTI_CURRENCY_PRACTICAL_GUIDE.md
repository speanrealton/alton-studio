# Multi-Currency System - Practical Usage Guide

## Quick Integration Examples

### Example 1: Display a Product Price in Multiple Currencies

```tsx
// In your product card component
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Currency } from '@/lib/currencies';

export function ProductCard({ productPrice }: { productPrice: number }) {
  const [userCurrency, setUserCurrency] = useState<Currency>('USD');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const preferred = (data.user?.user_metadata as any)?.preferred_currency || 'USD';
      setUserCurrency(preferred as Currency);
    });
  }, []);

  return (
    <div className="product-card">
      <h2>Premium Design Template</h2>
      
      {/* Display in user's currency */}
      <CurrencyConverter
        amount={productPrice}
        baseCurrency="USD"
        targetCurrency={userCurrency}
        compact={true}
      />
    </div>
  );
}
```

### Example 2: Marketplace Creator Earnings Display

```tsx
// Show creator earnings in multiple currencies
import { convertCurrency, formatCurrency } from '@/lib/currencies';

function CreatorStats({ totalEarningsUSD }: { totalEarningsUSD: number }) {
  // Show earnings in USD, EUR, GBP, and INR
  const currencies = ['USD', 'EUR', 'GBP', 'INR'] as const;
  
  return (
    <div className="earnings-grid">
      {currencies.map((currency) => (
        <div key={currency} className="earning-card">
          <p className="text-sm text-gray-400">{currency}</p>
          <p className="text-xl font-bold">
            {formatCurrency(
              convertCurrency(totalEarningsUSD, 'USD', currency),
              currency
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Payment Form with Currency Awareness

```tsx
// Update payment form to show amounts in user's currency
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { convertCurrency } from '@/lib/currencies';
import { useState, useEffect } from 'react';
import type { Currency } from '@/lib/currencies';

export function PaymentForm({ priceUSD }: { priceUSD: number }) {
  const [userCurrency, setUserCurrency] = useState<Currency>('USD');
  const [amountInUserCurrency, setAmountInUserCurrency] = useState(priceUSD);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const preferred = (data.user?.user_metadata as any)?.preferred_currency || 'USD';
      setUserCurrency(preferred as Currency);
      
      // Convert the amount
      const converted = convertCurrency(priceUSD, 'USD', preferred as Currency);
      setAmountInUserCurrency(converted);
    });
  }, [priceUSD]);

  const handlePayment = async () => {
    // Always send USD amount to payment processor
    const paymentData = {
      amount_usd: priceUSD,
      amount_user_currency: amountInUserCurrency,
      user_currency: userCurrency,
      // ... other payment data
    };
    
    // Send to your payment API
    await processPayment(paymentData);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
      <h3>Order Summary</h3>
      
      <CurrencyConverter
        amount={priceUSD}
        baseCurrency="USD"
        targetCurrency={userCurrency}
        compact={false}
      />
      
      <button type="submit" className="btn btn-primary">
        Pay {userCurrency} {amountInUserCurrency.toFixed(2)}
      </button>
    </form>
  );
}
```

### Example 4: Add Currency Selector to a Page

```tsx
// Add currency selection with live price updates
import { CurrencySelector } from '@/components/CurrencySelector';
import { useState } from 'react';
import type { Currency } from '@/lib/currencies';

export function ShoppingCart() {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');
  const cartItems = [
    { name: 'Template 1', price: 29.99 },
    { name: 'Template 2', price: 49.99 },
  ];

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div>
      <div className="mb-6">
        <label>Display Currency:</label>
        <CurrencySelector 
          selectedCurrency={displayCurrency}
          onCurrencyChange={setDisplayCurrency}
        />
      </div>

      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item.name} className="cart-item">
            <span>{item.name}</span>
            <CurrencyConverter
              amount={item.price}
              baseCurrency="USD"
              targetCurrency={displayCurrency}
              compact={true}
            />
          </div>
        ))}
      </div>

      <div className="total">
        <strong>Total: </strong>
        <CurrencyConverter
          amount={total}
          baseCurrency="USD"
          targetCurrency={displayCurrency}
          compact={true}
        />
      </div>
    </div>
  );
}
```

### Example 5: Admin Dashboard - Multi-Currency Reports

```tsx
// Display transaction history with conversion options
import { convertCurrency, formatCurrency, getAllCurrencies } from '@/lib/currencies';
import { useState } from 'react';
import type { Currency } from '@/lib/currencies';

function TransactionReport({ transactions }: { 
  transactions: { id: string; amountUSD: number; date: string }[] 
}) {
  const [reportCurrency, setReportCurrency] = useState<Currency>('USD');
  const currencies = getAllCurrencies();

  return (
    <div>
      <div className="mb-4">
        <select 
          value={reportCurrency}
          onChange={(e) => setReportCurrency(e.target.value as Currency)}
        >
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount ({reportCurrency})</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.date}</td>
              <td>
                {formatCurrency(
                  convertCurrency(tx.amountUSD, 'USD', reportCurrency),
                  reportCurrency
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="total">
        <strong>Total: </strong>
        {formatCurrency(
          convertCurrency(
            transactions.reduce((sum, tx) => sum + tx.amountUSD, 0),
            'USD',
            reportCurrency
          ),
          reportCurrency
        )}
      </div>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Load User Currency on Component Mount

```tsx
const [userCurrency, setUserCurrency] = useState<Currency>('USD');

useEffect(() => {
  const loadCurrency = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const preferred = (user?.user_metadata as any)?.preferred_currency || 'USD';
    setUserCurrency(preferred as Currency);
  };
  
  loadCurrency();
}, []);
```

### Pattern 2: Convert and Format in One Step

```tsx
import { convertCurrency, formatCurrency } from '@/lib/currencies';

const priceInEuro = convertCurrency(100, 'USD', 'EUR');
const formatted = formatCurrency(priceInEuro, 'EUR'); // "€92.00"
```

### Pattern 3: Conditional Display Based on Currency

```tsx
if (userCurrency !== 'USD') {
  // Show converted price with original USD price
  return (
    <div>
      <p className="text-gray-400">${priceUSD.toFixed(2)}</p>
      <p className="text-2xl font-bold">
        {formatCurrency(
          convertCurrency(priceUSD, 'USD', userCurrency),
          userCurrency
        )}
      </p>
    </div>
  );
}
```

### Pattern 4: Store Currency Preference in Database

```tsx
// After user selects currency
const saveCurrencyPreference = async (currency: Currency) => {
  // Update in auth metadata (already implemented in settings)
  await supabase.auth.updateUser({
    data: { preferred_currency: currency }
  });
  
  // Optional: Also store in profiles table
  await supabase.from('profiles').update({
    preferred_currency: currency
  }).eq('id', userId);
};
```

## Integration Checklist

- [ ] Import CurrencyConverter for price displays
- [ ] Load user currency on page load
- [ ] Use convertCurrency for backend calculations
- [ ] Always store amounts in USD in database
- [ ] Display converted amounts in UI
- [ ] Test with different currencies
- [ ] Verify mobile responsiveness
- [ ] Check dark mode compatibility
- [ ] Test conversion accuracy

## Performance Tips

1. **Cache user currency** on app initialization
2. **Avoid re-converting** the same amount multiple times
3. **Batch conversions** when displaying multiple prices
4. **Memoize CurrencyConverter** if rendering many items

```tsx
import { useMemo } from 'react';

function PriceList({ prices }: { prices: number[] }) {
  const userCurrency = useUserCurrency();
  
  const convertedPrices = useMemo(
    () => prices.map(p => convertCurrency(p, 'USD', userCurrency)),
    [prices, userCurrency]
  );
  
  return (
    <ul>
      {convertedPrices.map((price) => (
        <li key={price}>{formatCurrency(price, userCurrency)}</li>
      ))}
    </ul>
  );
}
```

## Troubleshooting

### Issue: Currency not loading on page
**Solution:** Check that `supabase.auth.getUser()` is called before accessing `user_metadata`

### Issue: Prices showing as NaN
**Solution:** Verify conversion rates in `src/lib/currencies.ts` are numbers, not strings

### Issue: Component not updating when user changes currency
**Solution:** Ensure `userCurrency` is in the dependency array of useEffect

### Issue: Currency symbol not displaying
**Solution:** Check that `getCurrencySymbol()` is being called with a valid currency code

## Next Steps

1. **Integrate CurrencyConverter** into marketplace product cards
2. **Add currency selection** to checkout flow
3. **Display earnings** in user's preferred currency in creator dashboard
4. **Update admin reports** to support multi-currency views
5. **Implement real-time rates** with API integration
