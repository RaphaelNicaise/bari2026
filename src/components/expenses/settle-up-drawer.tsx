'use client';

import { useState, useEffect } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { useUsers } from '@/lib/queries/users';
import { useAddExpense } from '@/lib/queries/expenses';
import { getSession } from '@/lib/session';

interface SettleUpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettleUpDrawer({ isOpen, onClose }: SettleUpDrawerProps) {
  const session = getSession();
  const { data: users } = useUsers();
  const addExpense = useAddExpense();

  const [fromUser, setFromUser] = useState<string>(session?.id ?? '');
  const [toUser, setToUser] = useState<string>('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFromUser(session?.id ?? '');
      setToUser('');
      setAmount('');
    }
  }, [isOpen, session]);

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (!fromUser || !toUser || parsedAmount <= 0 || fromUser === toUser) return;

    const fromName = users?.find(u => u.id === fromUser)?.name ?? '?';
    const toName = users?.find(u => u.id === toUser)?.name ?? '?';

    addExpense.mutate(
      {
        description: `${fromName} le pagó a ${toName}`,
        total_amount: parsedAmount,
        paid_by: fromUser,
        is_settlement: true,
        split_mode: 'exact',
        splits: [{ user_id: toUser, amount_owed: parsedAmount }],
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  const otherUsers = users?.filter((u) => u.id !== fromUser) ?? [];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Registrar pago">
      <div className="space-y-6">
        <p className="text-xs text-zinc-500 leading-relaxed">
          Registrá una transferencia o pago entre amigos. Esto no cuenta como gasto del viaje.
        </p>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Quién pagó
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {users?.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setFromUser(user.id);
                  if (toUser === user.id) setToUser('');
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  fromUser === user.id
                    ? 'bg-sky-400/15 text-sky-400 border border-sky-400/30'
                    : 'border border-zinc-800 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            A quién le pagó
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {otherUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setToUser(user.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  toUser === user.id
                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                    : 'border border-zinc-800 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Monto
          </label>
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-lg text-zinc-500">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent py-1 text-2xl font-semibold text-zinc-100 placeholder:text-zinc-700 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!fromUser || !toUser || !(parseFloat(amount) > 0) || addExpense.isPending}
          className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {addExpense.isPending ? 'Guardando...' : 'Registrar pago'}
        </button>
      </div>
    </Drawer>
  );
}
