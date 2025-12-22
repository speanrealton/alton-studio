# Settings Features - Site-Wide Implementation Guide

## Quick Start: Using Settings on Other Pages

### 1. Access User Settings Directly

```typescript
// In any component with access to the user
import { useUser } from '@supabase/auth-helpers-react';

export function MyComponent() {
  const user = useUser();
  
  // Get security settings
  const securitySettings = user?.user_metadata?.security_settings || {};
  const { twoFactorEnabled, loginAlerts, sessionTimeout } = securitySettings;
  
  // Get notification settings
  const notificationSettings = user?.user_metadata?.notification_settings || {};
  const { emailNotifications, marketplaceNotifications, digestFrequency } = notificationSettings;
  
  // Get data settings
  const dataSettings = user?.user_metadata?.data_settings || {};
  const { dataRetention } = dataSettings;
  
  // Use in your component logic
  return (
    <div>
      {twoFactorEnabled && <p>2FA is enabled</p>}
      {marketplaceNotifications && <p>Marketplace notifications are on</p>}
    </div>
  );
}
```

---

## 2. Create Custom Hooks (Recommended)

### Security Hook
```typescript
// src/hooks/useSecuritySettings.ts
import { useUser } from '@supabase/auth-helpers-react';

export function useSecuritySettings() {
  const user = useUser();
  
  return {
    twoFactorEnabled: user?.user_metadata?.security_settings?.twoFactorEnabled ?? false,
    loginAlerts: user?.user_metadata?.security_settings?.loginAlerts ?? true,
    sessionTimeout: user?.user_metadata?.security_settings?.sessionTimeout ?? 30,
  };
}

// Usage:
const { twoFactorEnabled, sessionTimeout } = useSecuritySettings();
```

### Notification Hook
```typescript
// src/hooks/useNotificationSettings.ts
import { useUser } from '@supabase/auth-helpers-react';

export function useNotificationSettings() {
  const user = useUser();
  const settings = user?.user_metadata?.notification_settings || {};
  
  return {
    emailNotifications: settings.emailNotifications ?? true,
    pushNotifications: settings.pushNotifications ?? true,
    marketplaceNotifications: settings.marketplaceNotifications ?? true,
    communityNotifications: settings.communityNotifications ?? true,
    digestFrequency: settings.digestFrequency ?? 'weekly',
  };
}

// Usage:
const { marketplaceNotifications, digestFrequency } = useNotificationSettings();
```

### Data Hook
```typescript
// src/hooks/useDataSettings.ts
import { useUser } from '@supabase/auth-helpers-react';

export function useDataSettings() {
  const user = useUser();
  
  return {
    dataRetention: user?.user_metadata?.data_settings?.dataRetention ?? '12',
  };
}

// Usage:
const { dataRetention } = useDataSettings();
```

---

## 3. Practical Examples

### Example 1: Conditional Marketplace Notifications
```typescript
// src/app/marketplace/page.tsx
'use client';

import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useState, useEffect } from 'react';

export default function MarketplacePage() {
  const { marketplaceNotifications, digestFrequency } = useNotificationSettings();
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    if (!marketplaceNotifications) return; // Don't fetch if disabled
    
    // Fetch marketplace notifications
    fetchMarketplaceNotifications()
      .then(data => setNotifications(data))
      .catch(err => console.error(err));
  }, [marketplaceNotifications]);
  
  if (!marketplaceNotifications) {
    return <p>Marketplace notifications are disabled in your settings.</p>;
  }
  
  return (
    <div>
      <h1>Marketplace</h1>
      {notifications.map(notif => (
        <NotificationCard key={notif.id} notification={notif} />
      ))}
    </div>
  );
}
```

### Example 2: Session Timeout Enforcement
```typescript
// src/app/layout.tsx or middleware
'use client';

import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function RootLayout({ children }) {
  const { sessionTimeout } = useSecuritySettings();
  
  useEffect(() => {
    if (!sessionTimeout || sessionTimeout === 0) return; // Never timeout
    
    let timeoutId: NodeJS.Timeout;
    let warningShown = false;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      warningShown = false;
      
      // Set timeout to logout after inactivity
      timeoutId = setTimeout(() => {
        supabase.auth.signOut();
        window.location.href = '/'; // Redirect to home
      }, sessionTimeout * 60 * 1000); // Convert to milliseconds
    };
    
    // Reset timer on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });
    
    resetTimer(); // Start initial timer
    
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [sessionTimeout]);
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Example 3: Community Notification Badge
```typescript
// src/components/CommunityNotificationBadge.tsx
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useEffect, useState } from 'react';

export function CommunityNotificationBadge() {
  const { communityNotifications, digestFrequency } = useNotificationSettings();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!communityNotifications) {
      setUnreadCount(0);
      return;
    }
    
    // Fetch unread community notifications
    fetchUnreadCount()
      .then(count => setUnreadCount(count))
      .catch(err => console.error(err));
  }, [communityNotifications]);
  
  if (!communityNotifications || unreadCount === 0) return null;
  
  return (
    <div className="bg-pink-600 rounded-full px-2 py-1 text-white text-xs font-bold">
      {unreadCount}
    </div>
  );
}
```

### Example 4: Email Digest Subscription Status
```typescript
// src/components/EmailDigestStatus.tsx
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

export function EmailDigestStatus() {
  const { emailNotifications, digestFrequency } = useNotificationSettings();
  
  if (!emailNotifications) {
    return (
      <p className="text-gray-400">
        Email notifications are currently disabled. Enable them in your notification settings.
      </p>
    );
  }
  
  return (
    <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-lg">
      <p className="text-blue-300">
        ✓ Email digests enabled
      </p>
      <p className="text-xs text-gray-400 mt-2">
        You'll receive a {digestFrequency} digest of your activity.
      </p>
    </div>
  );
}
```

---

## 4. Feature-by-Feature Implementation

### Two-Factor Authentication
```typescript
// Show 2FA requirement on sensitive actions
import { useSecuritySettings } from '@/hooks/useSecuritySettings';

function SensitiveActionButton() {
  const { twoFactorEnabled } = useSecuritySettings();
  
  const handleClick = () => {
    if (twoFactorEnabled) {
      // Show 2FA verification modal
      show2FAModal();
    } else {
      // Proceed directly
      performAction();
    }
  };
  
  return <button onClick={handleClick}>Confirm Purchase</button>;
}
```

### Login Alerts
```typescript
// Display security alerts on dashboard
function SecurityAlerts() {
  const { loginAlerts } = useSecuritySettings();
  const [recentLogins, setRecentLogins] = useState([]);
  
  useEffect(() => {
    if (!loginAlerts) return;
    
    // Fetch recent login attempts
    fetchRecentLogins()
      .then(logins => {
        // Show warning if suspicious login detected
        const suspicious = logins.filter(l => l.isSuspicious);
        if (suspicious.length > 0) {
          showAlert('Suspicious login detected!');
        }
      });
  }, [loginAlerts]);
  
  return <div>{/* Display security alerts */}</div>;
}
```

### Data Retention
```typescript
// Schedule deletion of old activity logs
import { useDataSettings } from '@/hooks/useDataSettings';

async function cleanupOldActivity(userId: string) {
  const { dataRetention } = useDataSettings();
  
  if (dataRetention === 'permanent') return; // Keep forever
  
  const months = parseInt(dataRetention);
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  
  // Delete activity logs older than retention period
  await supabase
    .from('activity_log')
    .delete()
    .eq('user_id', userId)
    .lt('created_at', cutoffDate.toISOString());
}
```

---

## 5. Database Integration (Future)

### Create Activity Log Table
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_activity_user_date 
  ON activity_log(user_id, created_at DESC);
```

### Create Sessions Table
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  ip_address INET,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Testing Settings Integration

```typescript
// src/__tests__/hooks/useSecuritySettings.test.ts
import { renderHook } from '@testing-library/react';
import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { useUser } from '@supabase/auth-helpers-react';

jest.mock('@supabase/auth-helpers-react');

describe('useSecuritySettings', () => {
  it('returns default values when no user metadata', () => {
    (useUser as jest.Mock).mockReturnValue(null);
    
    const { result } = renderHook(() => useSecuritySettings());
    
    expect(result.current.twoFactorEnabled).toBe(false);
    expect(result.current.loginAlerts).toBe(true);
    expect(result.current.sessionTimeout).toBe(30);
  });
  
  it('returns user metadata when available', () => {
    const mockUser = {
      user_metadata: {
        security_settings: {
          twoFactorEnabled: true,
          loginAlerts: false,
          sessionTimeout: 60,
        }
      }
    };
    
    (useUser as jest.Mock).mockReturnValue(mockUser);
    
    const { result } = renderHook(() => useSecuritySettings());
    
    expect(result.current.twoFactorEnabled).toBe(true);
    expect(result.current.loginAlerts).toBe(false);
    expect(result.current.sessionTimeout).toBe(60);
  });
});
```

---

## 7. Deployment Checklist

- [ ] Create the three custom hooks (useSecuritySettings, useNotificationSettings, useDataSettings)
- [ ] Test settings retrieval on all relevant pages
- [ ] Implement session timeout logic in root layout/middleware
- [ ] Create activity_log and user_sessions tables if using advanced features
- [ ] Set up email digest background job (if using email notifications)
- [ ] Test 2FA flow on sensitive actions
- [ ] Verify notification preferences are respected across site
- [ ] Test data export functionality
- [ ] Document API endpoints for settings (if exposing via API)
- [ ] Set up monitoring for feature usage

---

## 8. Common Patterns

### Pattern 1: Feature Flag
```typescript
// Hide feature if notifications disabled
{marketplaceNotifications && <MarketplaceNotifications />}
```

### Pattern 2: Fallback UI
```typescript
// Show different UI based on settings
{twoFactorEnabled ? <2FAVerification /> : <SimpleLogin />}
```

### Pattern 3: Side Effect
```typescript
// Run effect only when setting changes
useEffect(() => {
  if (sessionTimeout) {
    setupSessionTimer(sessionTimeout);
  }
}, [sessionTimeout]);
```

---

## 9. Troubleshooting

### Settings not persisting?
- Check that `supabase.auth.updateUser()` is returning the updated user
- Verify user_metadata is properly formatted
- Check Supabase logs for errors

### Settings not reflecting across pages?
- Ensure you're using `useUser()` from `@supabase/auth-helpers-react`
- Try refreshing the page or clearing browser cache
- Check that custom hooks are correctly accessing user_metadata

### Session timeout not working?
- Verify sessionTimeout is > 0 (0 = never timeout)
- Check that event listeners are properly attached
- Ensure middleware has access to security settings

---

## 10. Migration Path

If you have existing users, add default settings:

```typescript
// Migration function
async function addDefaultSettingsToUsers() {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id');
  
  if (error) throw error;
  
  for (const { id } of users) {
    await supabase.auth.admin.updateUserById(id, {
      user_metadata: {
        security_settings: {
          twoFactorEnabled: false,
          loginAlerts: true,
          sessionTimeout: 30,
        },
        notification_settings: {
          emailNotifications: true,
          pushNotifications: true,
          marketplaceNotifications: true,
          communityNotifications: true,
          digestFrequency: 'weekly',
        },
        data_settings: {
          dataRetention: '12',
        },
      }
    });
  }
}
```

---

**Quick Links**:
- [Settings Page Expansion Guide](SETTINGS_PAGE_EXPANSION_GUIDE.md)
- [Main Settings Page](src/app/settings/page.tsx)
- [Multi-Currency Guide](MULTI_CURRENCY_README.md)
- [User Guide](USER_GUIDE.md)
