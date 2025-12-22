# Settings Features - Code Snippets & Implementation Examples

## 1. Copy-Paste Ready Code Snippets

### Custom Hook: useSecuritySettings
```typescript
// src/hooks/useSecuritySettings.ts
import { useUser } from '@supabase/auth-helpers-react';

type SecuritySettings = {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
};

export function useSecuritySettings(): SecuritySettings {
  const user = useUser();
  
  const settings = user?.user_metadata?.security_settings;
  
  return {
    twoFactorEnabled: settings?.twoFactorEnabled ?? false,
    loginAlerts: settings?.loginAlerts ?? true,
    sessionTimeout: settings?.sessionTimeout ?? 30,
  };
}
```

### Custom Hook: useNotificationSettings
```typescript
// src/hooks/useNotificationSettings.ts
import { useUser } from '@supabase/auth-helpers-react';

type NotificationSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketplaceNotifications: boolean;
  communityNotifications: boolean;
  digestFrequency: 'instant' | 'daily' | 'weekly' | 'monthly';
};

export function useNotificationSettings(): NotificationSettings {
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
```

### Custom Hook: useDataSettings
```typescript
// src/hooks/useDataSettings.ts
import { useUser } from '@supabase/auth-helpers-react';

type DataSettings = {
  dataRetention: string;
};

export function useDataSettings(): DataSettings {
  const user = useUser();
  
  return {
    dataRetention: user?.user_metadata?.data_settings?.dataRetention ?? '12',
  };
}
```

---

## 2. Integration Examples

### Example 1: Marketplace Page with Notification Control
```typescript
// src/app/marketplace/page.tsx
'use client';

import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell } from 'lucide-react';

export default function MarketplacePage() {
  const { marketplaceNotifications, digestFrequency } = useNotificationSettings();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch notifications if user has them enabled
    if (!marketplaceNotifications) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setNotifications(data || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [marketplaceNotifications]);

  if (!marketplaceNotifications) {
    return (
      <div className="p-8 text-center">
        <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-400">
          Marketplace notifications are disabled in your settings.
        </p>
        <a href="/settings?tab=notifications" className="text-blue-400 hover:underline mt-2">
          Enable notifications
        </a>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
      <p className="text-gray-400 mb-4">
        Digest frequency: {digestFrequency}
      </p>

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-400">No notifications yet</p>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div key={notif.id} className="p-4 border border-white/10 rounded-lg">
              <h3 className="font-semibold">{notif.title}</h3>
              <p className="text-sm text-gray-400">{notif.message}</p>
              <time className="text-xs text-gray-500 mt-2">
                {new Date(notif.created_at).toLocaleDateString()}
              </time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 2: Community Page with Notification Filtering
```typescript
// src/app/community/page.tsx
'use client';

import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CommunityPage() {
  const { communityNotifications } = useNotificationSettings();
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    if (!communityNotifications) return;

    // Set up real-time listener for community activity
    const subscription = supabase
      .channel('community:activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_activity',
        },
        (payload) => {
          // Only increment if notifications are enabled
          if (communityNotifications) {
            setActivityCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [communityNotifications]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Community</h1>
      
      {!communityNotifications && (
        <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
          <p className="text-gray-300">
            Community notifications are disabled. 
            <a href="/settings?tab=notifications" className="text-blue-400 hover:underline ml-2">
              Enable them
            </a>
          </p>
        </div>
      )}

      {communityNotifications && activityCount > 0 && (
        <div className="bg-pink-600/20 border border-pink-600/30 p-4 rounded-lg mb-6">
          <p className="text-pink-300">
            {activityCount} new community activities
          </p>
        </div>
      )}

      {/* Community content here */}
    </div>
  );
}
```

### Example 3: Security Middleware - Session Timeout
```typescript
// src/app/layout.tsx (Add to root layout or middleware.ts)
'use client';

import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { sessionTimeout } = useSecuritySettings();
  const router = useRouter();
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTime = useRef<number>(Date.now());

  useEffect(() => {
    // Don't set timeout if it's 0 (never timeout) or not set
    if (!sessionTimeout || sessionTimeout === 0) {
      return;
    }

    const resetTimer = () => {
      // Clear existing timeout
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      lastActivityTime.current = Date.now();

      // Set new timeout
      timeoutId.current = setTimeout(() => {
        // Session expired - sign out user
        signOutAndRedirect();
      }, sessionTimeout * 60 * 1000); // Convert minutes to milliseconds
    };

    const signOutAndRedirect = async () => {
      await supabase.auth.signOut();
      router.push('/auth/login?reason=session-expired');
    };

    // Activity events that reset the timer
    const activityEvents = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [sessionTimeout, router]);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Example 4: Dashboard - Display Login Alerts
```typescript
// src/app/dashboard/components/SecurityAlerts.tsx
'use client';

import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

type LoginEvent = {
  id: string;
  ip_address: string;
  device: string;
  location: string;
  timestamp: string;
  isSuspicious: boolean;
};

export function SecurityAlerts() {
  const { loginAlerts } = useSecuritySettings();
  const [recentLogins, setRecentLogins] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loginAlerts) {
      setLoading(false);
      return;
    }

    const fetchLogins = async () => {
      try {
        const { data, error } = await supabase
          .from('login_events')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentLogins(data || []);
      } catch (err) {
        console.error('Failed to fetch login events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogins();
  }, [loginAlerts]);

  if (!loginAlerts) {
    return null;
  }

  const suspiciousLogins = recentLogins.filter(l => l.isSuspicious);

  return (
    <div className="space-y-4">
      {suspiciousLogins.length > 0 && (
        <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
            <div>
              <p className="font-semibold text-red-300">
                ⚠️ {suspiciousLogins.length} suspicious login{suspiciousLogins.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-300 mt-2">
                We detected unusual login activity. If this wasn't you, please change your password immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h3 className="font-semibold mb-4">Recent Login Activity</h3>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : recentLogins.length === 0 ? (
          <p className="text-gray-400 text-sm">No login activity</p>
        ) : (
          <div className="space-y-3">
            {recentLogins.map(login => (
              <div key={login.id} className="flex items-between justify-between text-sm">
                <div>
                  <p className="font-medium">{login.device}</p>
                  <p className="text-xs text-gray-400">{login.ip_address}</p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(login.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Example 5: Settings Link from Any Page
```typescript
// Add to any component that wants to link to settings
import Link from 'next/link';

export function NotificationSettings() {
  return (
    <Link
      href="/settings?tab=notifications"
      className="text-blue-400 hover:text-blue-300"
    >
      Configure notification preferences
    </Link>
  );
}

export function SecuritySettings() {
  return (
    <Link
      href="/settings?tab=security"
      className="text-blue-400 hover:text-blue-300"
    >
      Manage security settings
    </Link>
  );
}

export function DataSettings() {
  return (
    <Link
      href="/settings?tab=data"
      className="text-blue-400 hover:text-blue-300"
    >
      Manage your data
    </Link>
  );
}
```

---

## 3. Database Schema (Optional)

### Activity Log Table
```sql
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_at_index TIMESTAMP GENERATED ALWAYS AS (created_at) STORED
);

CREATE INDEX idx_activity_user_date ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_user_action ON activity_log(user_id, action);
```

### Login Events Table
```sql
CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  device VARCHAR(255),
  browser VARCHAR(100),
  location VARCHAR(255),
  is_suspicious BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_user_date ON login_events(user_id, created_at DESC);
```

### User Sessions Table
```sql
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  ip_address INET,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_user ON user_sessions(user_id);
```

---

## 4. Environment Variables Needed

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional: For email service
RESEND_API_KEY=your_resend_key
# or
SENDGRID_API_KEY=your_sendgrid_key

# Optional: For push notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
```

---

## 5. Type Definitions

```typescript
// src/types/settings.ts
export type SecuritySettings = {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number; // in minutes
};

export type NotificationSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketplaceNotifications: boolean;
  communityNotifications: boolean;
  digestFrequency: 'instant' | 'daily' | 'weekly' | 'monthly';
};

export type DataSettings = {
  dataRetention: '3' | '6' | '12' | '24' | 'permanent'; // in months
};

export type UserSettings = {
  security_settings: SecuritySettings;
  notification_settings: NotificationSettings;
  data_settings: DataSettings;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
};

export type LoginEvent = {
  id: string;
  user_id: string;
  ip_address: string;
  device: string;
  browser: string;
  location: string;
  is_suspicious: boolean;
  created_at: string;
};
```

---

## 6. Testing Utilities

```typescript
// src/__tests__/utils/settingsTestUtils.ts
import { useUser } from '@supabase/auth-helpers-react';

/**
 * Mock user with custom settings for testing
 */
export function createMockUserWithSettings(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
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
      ...overrides,
    },
  };
}

/**
 * Mock settings with security enabled
 */
export function createSecurityEnabledMock() {
  return createMockUserWithSettings({
    security_settings: {
      twoFactorEnabled: true,
      loginAlerts: true,
      sessionTimeout: 15,
    },
  });
}

/**
 * Mock settings with notifications disabled
 */
export function createNotificationsDisabledMock() {
  return createMockUserWithSettings({
    notification_settings: {
      emailNotifications: false,
      pushNotifications: false,
      marketplaceNotifications: false,
      communityNotifications: false,
      digestFrequency: 'weekly',
    },
  });
}
```

---

## 7. Implementation Checklist

### Phase 1: Frontend (COMPLETED ✓)
- [x] Create Security tab UI
- [x] Create Notifications tab UI
- [x] Create Data tab UI
- [x] Add state management
- [x] Implement save handlers
- [x] Add Supabase integration
- [x] Test all functionality

### Phase 2: Backend (IN PROGRESS)
- [ ] Create custom hooks
- [ ] Integrate with marketplace
- [ ] Integrate with community
- [ ] Implement session timeout
- [ ] Set up activity logging
- [ ] Create login event tracking

### Phase 3: Services (TODO)
- [ ] Email digest service
- [ ] Push notification service
- [ ] Data retention cleanup
- [ ] 2FA verification service
- [ ] Analytics dashboard

### Phase 4: Advanced (PLANNED)
- [ ] Device session management
- [ ] IP whitelist functionality
- [ ] Biometric 2FA
- [ ] Custom notification rules
- [ ] Data portability

---

## 8. Quick Copy-Paste Imports

```typescript
// All imports needed for settings features
import { useUser } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Shield, Bell, Database, Mail, Smartphone, Zap, Radio,
  AlertCircle, Download, CheckCircle, Clock, XCircle,
  Volume2, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useDataSettings } from '@/hooks/useDataSettings';
```

---

**Quick Access**:
- [Settings Page](src/app/settings/page.tsx)
- [Expansion Guide](SETTINGS_PAGE_EXPANSION_GUIDE.md)
- [Implementation Guide](SETTINGS_IMPLEMENTATION_GUIDE.md)
- [Summary Document](SETTINGS_EXPANSION_COMPLETE_SUMMARY.md)
- [Visual Reference](SETTINGS_VISUAL_REFERENCE_GUIDE.md)
