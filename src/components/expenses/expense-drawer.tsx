'use client';

import { useState, useEffect } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { useUsers } from '@/lib/queries/users';
import { useAddExpense, useUpdateExpense } from '@/lib/queries/expenses';
import { getSession } from '@/lib/session';
import { Expense } from '@/types';

interface ExpenseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Expense | null;
}

export function ExpenseDrawer({ isOpen, onClose, initialData }: ExpenseDrawerProps) {
  const session = getSession();
  const { data: users } = useUsers();
  const addExpense = useAddExpense();
  const updateExpense = useUpdateExpense();

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string>(session?.id ?? '');
  const [beneficiaries, setBeneficiaries] = useState<Set<string>>(new Set());
  const [splitMode, setSplitMode] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (users) {
      setBeneficiaries(new Set(users.map((u) => u.id)));
    }
  }, [users]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description);
        setTotalAmount(initialData.total_amount.toString());
        setPaidBy(initialData.paid_by);
        setSplitMode(initialData.split_mode);

        const newBens = new Set<string>();
        const exact: Record<string, string> = {};

        if (initialData.splits) {
          initialData.splits.forEach(s => {
            newBens.add(s.user_id);
            if (initialData.split_mode === 'exact') {
              exact[s.user_id] = s.amount_owed.toString();
            }
          });
        }
        setBeneficiaries(newBens);
        setExactAmounts(exact);
      } else {
        setDescription('');
        setTotalAmount('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setPaidBy(session?.id ?? '');
        setSplitMode('equal');
        setExactAmounts({});
        if (users) {
          setBeneficiaries(new Set(users.map((u) => u.id)));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  const toggleBeneficiary = (userId: string) => {
    const next = new Set(beneficiaries);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setBeneficiaries(next);
  };

  const total = parseFloat(totalAmount) || 0;
  const beneficiaryCount = beneficiaries.size;
  const equalShare = beneficiaryCount > 0 ? Math.round((total / beneficiaryCount) * 100) / 100 : 0;

  const handleSubmit = () => {
    if (!description.trim() || total <= 0 || !paidBy || beneficiaryCount === 0) return;

    let splits: { user_id: string; amount_owed: number }[];

    if (splitMode === 'equal') {
      const ids = Array.from(beneficiaries);
      splits = ids.map((id) => ({ user_id: id, amount_owed: equalShare }));
    } else {
      splits = Array.from(beneficiaries).map((id) => ({
        user_id: id,
        amount_owed: parseFloat(exactAmounts[id] || '0'),
      }));
    }

    const payload = {
      description: description.trim(),
      total_amount: total,
      paid_by: paidBy,
      is_settlement: false,
      split_mode: splitMode,
      splits,
    };

    if (initialData) {
      updateExpense.mutate(
        { id: initialData.id, ...payload },
        { onSuccess: () => onClose() }
      );
    } else {
      addExpense.mutate(
        payload,
        { onSuccess: () => onClose() }
      );
    }
  };

  const isPending = addExpense.isPending || updateExpense.isPending;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={initialData ? "Editar gasto" : "Nuevo gasto"}>
      <div className="space-y-6">
        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cena, nafta, chocolates..."
            className="mt-1.5 w-full border-b border-zinc-800 bg-transparent py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Monto total
          </label>
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-lg text-zinc-500">$</span>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent py-1 text-2xl font-semibold text-zinc-100 placeholder:text-zinc-700 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Quién pagó
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {users?.map((user) => (
              <button
                key={user.id}
                onClick={() => setPaidBy(user.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  paidBy === user.id
                    ? 'bg-sky-400/15 text-sky-400 border border-sky-400/30'
                    : 'border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Para quiénes
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {users?.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleBeneficiary(user.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  beneficiaries.has(user.id)
                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                    : 'border border-zinc-800 text-zinc-600 hover:border-zinc-600'
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
            <button
              onClick={() => setSplitMode('equal')}
              className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
                splitMode === 'equal'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500'
              }`}
            >
              Iguales
            </button>
            <button
              onClick={() => setSplitMode('exact')}
              className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
                splitMode === 'exact'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500'
              }`}
            >
              Montos Exactos
            </button>
          </div>

          {splitMode === 'equal' && total > 0 && beneficiaryCount > 0 && (
            <p className="mt-3 text-xs text-zinc-500">
              ${equalShare.toLocaleString('es-AR')} por persona ({beneficiaryCount})
            </p>
          )}

          {splitMode === 'exact' && (
            <div className="mt-3 space-y-2">
              {users
                ?.filter((u) => beneficiaries.has(u.id))
                .map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-zinc-400">{user.name}</span>
                    <div className="flex flex-1 items-center gap-1 border-b border-zinc-800">
                      <span className="text-xs text-zinc-600">$</span>
                      <input
                        type="number"
                        value={exactAmounts[user.id] || ''}
                        onChange={(e) =>
                          setExactAmounts((prev) => ({
                            ...prev,
                            [user.id]: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="w-full bg-transparent py-1.5 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!description.trim() || total <= 0 || beneficiaryCount === 0 || isPending}
          className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-400 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isPending ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Agregar gasto'}
        </button>
      </div>
    </Drawer>
  );
}
