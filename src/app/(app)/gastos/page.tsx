'use client';

import { useState, useMemo } from 'react';
import { getSession } from '@/lib/session';
import { useUsers } from '@/lib/queries/users';
import { useExpenses, useDeleteExpense } from '@/lib/queries/expenses';
import { calculateNetBalances, simplifyDebts, getUserDebts } from '@/lib/debt-solver';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ExpenseDrawer } from '@/components/expenses/expense-drawer';
import { SettleUpDrawer } from '@/components/expenses/settle-up-drawer';
import Link from 'next/link';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Handshake,
  Receipt,
  Banknote,
  Pencil,
} from 'lucide-react';
import { Expense } from '@/types';

export default function GastosPage() {
  const session = getSession();
  const { data: users } = useUsers();
  const { data: expenses, isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);

  const usersMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [users]);

  const { transfers, userDebts, totalSpent, myShare } = useMemo(() => {
    if (!expenses || !users) return { transfers: [], userDebts: { youOwe: [], theyOweYou: [] }, totalSpent: 0, myShare: 0 };

    const balances = calculateNetBalances(expenses, usersMap);
    const simplified = simplifyDebts(balances);
    const debts = session ? getUserDebts(simplified, session.id) : { youOwe: [], theyOweYou: [] };
    const total = expenses
      .filter((e) => !e.is_settlement)
      .reduce((sum, e) => sum + e.total_amount, 0);

    const myShare = session
      ? expenses
          .filter((e) => !e.is_settlement)
          .reduce((sum, e) => {
            const split = e.splits?.find((s) => s.user_id === session.id);
            return sum + (split ? split.amount_owed : 0);
          }, 0)
      : 0;

    return { transfers: simplified, userDebts: debts, totalSpent: total, myShare };
  }, [expenses, users, usersMap, session]);

  const netAmount = useMemo(() => {
    const owed = userDebts.theyOweYou.reduce((s, t) => s + t.amount, 0);
    const owing = userDebts.youOwe.reduce((s, t) => s + t.amount, 0);
    return owed - owing;
  }, [userDebts]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-24 rounded bg-zinc-800" />
            <div className="h-8 w-40 rounded bg-zinc-800" />
          </div>
        </div>
        <ListSkeleton count={3} />
      </div>
    );
  }

  const formatMoney = (n: number) =>
    `$${Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Balance Hero */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
          Tu situación
        </p>
        <p
          className={`mt-2 text-2xl font-semibold tracking-tight ${
            netAmount > 0
              ? 'text-emerald-400'
              : netAmount < 0
              ? 'text-red-400'
              : 'text-zinc-300'
          }`}
        >
          {netAmount === 0
            ? 'Estás al día'
            : netAmount > 0
            ? `Te deben ${formatMoney(netAmount)}`
            : `Debés ${formatMoney(Math.abs(netAmount))}`}
        </p>
        
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Total Viaje
            </span>
            <span className="text-sm font-semibold text-zinc-300">
              {formatMoney(totalSpent)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Mi Parte
            </span>
            <span className="text-sm font-semibold text-sky-400">
              {formatMoney(myShare)}
            </span>
          </div>
        </div>
      </div>

      {/* Your Debts Detail */}
      {(userDebts.youOwe.length > 0 || userDebts.theyOweYou.length > 0) && (
        <div className="space-y-2">
          {userDebts.youOwe.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-400/10">
                <ArrowUpRight size={14} className="text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-200">
                  Le debés <span className="font-semibold text-red-400">{formatMoney(t.amount)}</span> a{' '}
                  <span className="font-medium">{t.to_name}</span>
                </p>
              </div>
            </div>
          ))}
          {userDebts.theyOweYou.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10">
                <ArrowDownLeft size={14} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-200">
                  <span className="font-medium">{t.from_name}</span> te debe{' '}
                  <span className="font-semibold text-emerald-400">{formatMoney(t.amount)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simplified Transfers */}
      {transfers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
            Liquidación óptima
          </h2>
          {transfers.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-800 px-4 py-3"
            >
              <span className="text-sm text-zinc-400">
                {t.from_name}
              </span>
              <ArrowUpRight size={12} className="text-zinc-600" />
              <span className="text-sm font-medium text-zinc-200">
                {formatMoney(t.amount)}
              </span>
              <ArrowUpRight size={12} className="text-zinc-600" />
              <span className="text-sm text-zinc-400">
                {t.to_name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expense History Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
            Últimos Movimientos
          </h2>
          <Link
            href="/gastos/historial"
            className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
          >
            Ver todo →
          </Link>
        </div>
        {expenses?.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-600">
            No hay gastos registrados
          </p>
        )}
        {expenses?.slice(0, 3).map((expense) => (
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

      {/* FABs */}
      <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-3">
        <button
          onClick={() => setShowSettleUp(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all hover:bg-emerald-400 active:scale-95"
        >
          <Banknote size={20} />
        </button>
        <button
          onClick={() => setShowAddExpense(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition-all hover:bg-sky-400 active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Drawers */}
      <ExpenseDrawer
        isOpen={showAddExpense || !!editTarget}
        initialData={editTarget}
        onClose={() => {
          setShowAddExpense(false);
          setEditTarget(null);
        }}
      />
      <SettleUpDrawer
        isOpen={showSettleUp}
        onClose={() => setShowSettleUp(false)}
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
