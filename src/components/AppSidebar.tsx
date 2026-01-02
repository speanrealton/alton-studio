// src/components/AppSidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, LayoutTemplate, Sparkles, FolderOpen } from 'lucide-react';
import { useLanguageContext } from '@/providers/LanguageProvider';

const items = [
  { icon: Home, labelKey: 'nav.studio', href: '/home' },
  { icon: Plus, labelKey: 'nav.create', href: '/studio' },
  { icon: LayoutTemplate, labelKey: 'nav.templates', href: '/templates' },
  { icon: Sparkles, labelKey: 'nav.magic', href: '/ai' },
  { icon: FolderOpen, labelKey: 'nav.designs', href: '/designs' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguageContext();

  return (
    <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-10 space-y-10">
      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl mb-10" />
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div className={`flex flex-col items-center gap-1 p-3 rounded-xl transition ${active ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}>
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}