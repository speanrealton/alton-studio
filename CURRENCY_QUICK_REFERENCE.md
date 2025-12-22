# Currency System - Quick Reference Card

## 📚 Import Statements

```tsx
// Utility functions
import { convertCurrency, formatCurrency, getCurrencyName, getCurrencySymbol, getAllCurrencies } from '@/lib/currencies';
import type { Currency } from '@/lib/currencies';

// Components
import { CurrencySelector } from '@/components/CurrencySelector';
import { CurrencyConverter } from '@/components/CurrencyConverter';
```

## 🔧 Core Functions

### convertCurrency()
```tsx
convertCurrency(amount: number, from: Currency, to: Currency): number

// Example: Convert $100 to EUR
const priceInEuro = convertCurrency(100, 'USD', 'EUR');
// Result: 92
```

### formatCurrency()
```tsx
formatCurrency(amount: number, currency: Currency): string

// Example: Format 92 as EUR
const formatted = formatCurrency(92, 'EUR');
// Result: "€92.00"
```

### getCurrencyName()
```tsx
getCurrencyName(currency: Currency): string

// Example: Get full name
getCurrencyName('EUR');
// Result: "Euro"
```

### getCurrencySymbol()
```tsx
getCurrencySymbol(currency: Currency): string

// Example: Get symbol
getCurrencySymbol('EUR');
// Result: "€"
```

### getAllCurrencies()
```tsx
getAllCurrencies(): Currency[]

// Example: Get all 20 currencies
const currencies = getAllCurrencies();
// Result: ['USD', 'EUR', 'GBP', 'JPY', ...]
```

## 🎨 Components

### CurrencySelector
```tsx
<CurrencySelector 
  value={selectedCurrency}
  onChange={(currency) => setSelectedCurrency(currency)}
  label="Choose Currency"
  showFullName={true}
/>
```

### CurrencyConverter
```tsx
// Compact mode (default)
<CurrencyConverter 
  amount={99.99}
  baseCurrency="USD"
  targetCurrency="EUR"
/>

// Expanded mode
<CurrencyConverter 
  amount={99.99}
  baseCurrency="USD"
  targetCurrency="EUR"
  compact={false}
/>
```

## 👤 Get User's Currency

```tsx
// Method 1: From auth metadata
const { data: { user } } = await supabase.auth.getUser();
const userCurrency = (user?.user_metadata as any)?.preferred_currency || 'USD';

// Method 2: In useEffect
useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    const currency = (data.user?.user_metadata as any)?.preferred_currency || 'USD';
    setUserCurrency(currency);
  });
}, []);
```

## 💾 Save User's Currency

```tsx
// Update in settings
const saveCurrency = async (currency: Currency) => {
  const { error } = await supabase.auth.updateUser({
    data: { preferred_currency: currency }
  });
  if (!error) {
    // Success!
  }
};
```

## 📊 Common Patterns

### Pattern 1: Display Price in User's Currency
```tsx
<div>
  <p>Price: ${99.99}</p>
  <CurrencyConverter 
    amount={99.99}
    baseCurrency="USD"
    targetCurrency={userCurrency}
  />
</div>
```

### Pattern 2: Format Multiple Prices
```tsx
const prices = [29.99, 49.99, 99.99];
const formatted = prices.map(p => 
  formatCurrency(
    convertCurrency(p, 'USD', userCurrency),
    userCurrency
  )
);
```

### Pattern 3: Show Multiple Currencies
```tsx
const topCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
<div>
  {topCurrencies.map(curr => (
    <div key={curr}>
      {curr}: {formatCurrency(
        convertCurrency(price, 'USD', curr),
        curr
      )}
    </div>
  ))}
</div>
```

### Pattern 4: Payment with Conversion
```tsx
const handlePayment = async (amountUSD: number) => {
  const amountInUserCurrency = convertCurrency(
    amountUSD, 
    'USD', 
    userCurrency
  );
  
  // Process payment with USD amount
  await processPayment({
    amount_usd: amountUSD,
    amount_user_currency: amountInUserCurrency,
    currency: userCurrency
  });
};
```

## 20 Currencies

```
USD - US Dollar          EUR - Euro
GBP - British Pound      JPY - Japanese Yen
AUD - Australian Dollar  CAD - Canadian Dollar
CHF - Swiss Franc        CNY - Chinese Yuan
INR - Indian Rupee       MXN - Mexican Peso
BRL - Brazilian Real      ZAR - South African Rand
SGD - Singapore Dollar   HKD - Hong Kong Dollar
NZD - New Zealand Dollar KRW - South Korean Won
THB - Thai Baht          AED - UAE Dirham
SEK - Swedish Krona      NOK - Norwegian Krone
```

## 🎯 Type Definitions

```tsx
// All valid currency codes
type Currency = 
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD'
  | 'CHF' | 'CNY' | 'INR' | 'MXN' | 'BRL' | 'ZAR'
  | 'SGD' | 'HKD' | 'NZD' | 'KRW' | 'THB' | 'AED'
  | 'SEK' | 'NOK';

// Import for type safety
import type { Currency } from '@/lib/currencies';
```

## ⚡ Performance Tips

1. **Cache user currency:**
   ```tsx
   const [userCurrency, setUserCurrency] = useState<Currency>('USD');
   ```

2. **Memoize conversions:**
   ```tsx
   const convertedPrice = useMemo(
     () => convertCurrency(price, 'USD', userCurrency),
     [price, userCurrency]
   );
   ```

3. **Batch conversions:**
   ```tsx
   const prices = items.map(item => 
     convertCurrency(item.price, 'USD', userCurrency)
   );
   ```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Currency not loading | Check `supabase.auth.getUser()` in useEffect |
| Prices show as NaN | Verify amount is a number |
| Component not updating | Add `userCurrency` to dependency array |
| Type errors | Import `Currency` type from lib |
| Symbol not showing | Use `getCurrencySymbol()` function |

## 📖 Documentation Files

- `MULTI_CURRENCY_README.md` - Overview
- `MULTI_CURRENCY_INTEGRATION_GUIDE.md` - Full reference
- `MULTI_CURRENCY_PRACTICAL_GUIDE.md` - Examples
- `MULTI_CURRENCY_SESSION_SUMMARY.md` - Details

## ✅ Checklist

- [ ] Import currency utilities
- [ ] Load user's currency
- [ ] Display prices with CurrencyConverter
- [ ] Test with different currencies
- [ ] Verify dark mode works
- [ ] Test on mobile
- [ ] Check TypeScript types

---

**Quick reference complete! 🚀**
