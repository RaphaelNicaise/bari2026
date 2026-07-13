'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useExpenses, useDeleteExpense } from '@/lib/queries/expenses';
import { useUsers } from '@/lib/queries/users';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ExpenseDrawer } from '@/components/expenses/expense-drawer';
import { ArrowLeft, Trash2, Handshake, Receipt, Pencil } from 'lucide-react';
import { Expense } from '@/types';

export default function HistorialGastosPage() {
  const { data: users } = useUsers();
  const { data: expenses, isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);

  const usersMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [users]);

  const formatMoney = (n: number) =>
    `$${Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <ListSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link 
          href="/gastos"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          Historial completo
        </h1>
      </div>

      <div className="space-y-2">
        {expenses?.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-600">
            No hay gastos registrados
          </p>
        )}
        {expenses?.map((expense) => (
          <div
            key={expense.id}
            className="group flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:bg-zinc-900"
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                expense.is_settlement
                  ? 'bg-sky-400/10'
                  : 'bg-zinc-800'
              }`}
            >
              {expense.is_settlement ? (
                <Handshake size={14} className="text-sky-400" />
              ) : (
                <Receipt size={14} className="text-zinc-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {expense.description}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {expense.is_settlement ? 'Liquidación' : `Pagó ${usersMap.get(expense.paid_by) || '?'}`}
                {' · '}
                {new Date(expense.created_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold text-zinc-200">
                {formatMoney(expense.total_amount)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditTarget(expense)}
                  className="rounded-md p-1.5 text-zinc-600 transition-all hover:bg-sky-400/10 hover:text-sky-400"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(expense)}
                  className="rounded-md p-1.5 text-zinc-600 transition-all hover:bg-red-400/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ExpenseDrawer
        isOpen={!!editTarget}
        initialData={editTarget}
        onClose={() => setEditTarget(null)}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteExpense.mutate(deleteTarget.id);
        }}
        title="Eliminar gasto"
        message={`¿Seguro que querés eliminar "${deleteTarget?.description}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
