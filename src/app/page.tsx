'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, setSession } from '@/lib/session';
import { useUsers } from '@/lib/queries/users';
import { User } from '@/types';
import { UserCircle2, Plus } from 'lucide-react';

const PRESET_NAMES = ['Teixe', 'Matu', 'Rapha', 'Monto'];

export default function LoginPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const { data: users, isLoading } = useUsers();

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace('/gastos');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleSelect = (user: User) => {
    setSession(user);
    router.push('/gastos');
  };

  if (isChecking || isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    );
  }

  const presetUsers = users?.filter((u) => PRESET_NAMES.includes(u.name)) ?? [];
  const mateUser = users?.find((u) => u.name === 'Mate');

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 bg-zinc-950">
      <div className="w-full max-w-sm space-y-10">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            ¿Quién sos?
          </h1>
          <p className="text-sm text-zinc-500">
            Bari 2026
          </p>
        </div>

        {/* Profile buttons */}
        <div className="grid grid-cols-2 gap-3">
          {presetUsers.map((user, i) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="group flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/80 active:scale-[0.97]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors group-hover:bg-sky-400/10 group-hover:text-sky-400">
                <UserCircle2 size={24} strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-zinc-200">
                {user.name}
              </span>
            </button>
          ))}
        </div>

        {/* Add Mate button */}
        {mateUser && (
          <button
            onClick={() => handleSelect(mateUser)}
            className="mx-auto flex items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-4 py-2.5 text-sm text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
          >
            <Plus size={14} />
            <span>Agregar a Mate</span>
          </button>
        )}
      </div>
    </div>
  );
}
