'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, FolderOpen, Sparkles } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Plus, label: 'Create', href: '/studio' },
  { icon: FolderOpen, label: 'My Designs', href: '/designs' },
  { icon: Sparkles, label: 'Alton Magic', href: '/ai' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-8 space-y-10">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg" />
      </div>

      {/* Navigation */}
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${active ? 'bg-purple-100 text-purple-600 scale-110' : 'hover:bg-gray-100'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}