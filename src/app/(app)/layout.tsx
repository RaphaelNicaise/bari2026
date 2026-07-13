'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/session';
import { BottomNav } from '@/components/ui/bottom-nav';
import { LogOut, ArrowLeftRight } from 'lucide-react';
import { User } from '@/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/');
    } else {
      setCurrentUser(session);
    }
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.replace('/');
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-950 pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <span className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
            Bari 2026
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <span className="text-xs">{currentUser.name}</span>
              <ArrowLeftRight size={12} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                  <LogOut size={14} />
                  Cambiar perfil
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="mx-auto max-w-lg px-4 py-4">{children}</div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
