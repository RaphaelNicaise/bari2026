'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, Map, ListChecks } from 'lucide-react';

const tabs = [
  { href: '/gastos', label: 'Gastos', icon: Wallet },
  { href: '/agenda', label: 'Agenda', icon: Map },
  { href: '/checklist', label: 'Checklist', icon: ListChecks },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center justify-around pt-2 pb-4">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-colors duration-200 ${
                isActive ? 'text-sky-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[11px] font-medium leading-none tracking-wide">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
