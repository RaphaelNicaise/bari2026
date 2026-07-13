'use client';

import { useState } from 'react';
import { getSession } from '@/lib/session';
import {
  useGroupChecklist,
  usePersonalChecklist,
  useToggleChecklistItem,
  useAddChecklistItem,
  useDeleteChecklistItem,
} from '@/lib/queries/checklists';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Check, Plus, Trash2 } from 'lucide-react';
import { ChecklistItem } from '@/types';

function ChecklistSection({
  items,
  isLoading,
  ownerId,
}: {
  items: ChecklistItem[] | undefined;
  isLoading: boolean;
  ownerId: string | null;
}) {
  const session = getSession();
  const toggleItem = useToggleChecklistItem();
  const addItem = useAddChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (!newItem.trim()) return;
    addItem.mutate({
      content: newItem.trim(),
      owner_id: ownerId,
      activity_id: null,
    });
    setNewItem('');
  };

  if (isLoading) return <ListSkeleton count={4} />;

  const pending = items?.filter((i) => !i.is_completed) ?? [];
  const completed = items?.filter((i) => i.is_completed) ?? [];

  return (
    <div className="space-y-3">
      {/* Add new */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Agregar ítem..."
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
        />
        <button
          onClick={handleAdd}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Pending items */}
      <div className="space-y-1">
        {pending.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-900/50"
          >
            <button
              onClick={() =>
                toggleItem.mutate({
                  id: item.id,
                  is_completed: true,
                  completed_by: session?.id ?? null,
                })
              }
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-600 transition-colors hover:border-zinc-400"
            />
            <span className="flex-1 text-sm text-zinc-200">{item.content}</span>
            <button
              onClick={() => deleteItem.mutate(item.id)}
              className="rounded-md p-1 text-zinc-700 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-1 pt-4">
          <p className="px-3 text-xs font-medium tracking-widest text-zinc-600 uppercase">
            Completados
          </p>
          {completed.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 opacity-40 transition-all hover:opacity-60"
            >
              <button
                onClick={() =>
                  toggleItem.mutate({
                    id: item.id,
                    is_completed: false,
                    completed_by: null,
                  })
                }
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-emerald-400/30 bg-emerald-400/10"
              >
                <Check size={12} className="text-emerald-400" />
              </button>
              <span className="flex-1 text-sm text-zinc-500 line-through">
                {item.content}
              </span>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="rounded-md p-1 text-zinc-700 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!items?.length && (
        <p className="py-12 text-center text-sm text-zinc-600">
          Sin ítems todavía
        </p>
      )}
    </div>
  );
}

export default function ChecklistPage() {
  const session = getSession();
  const [tab, setTab] = useState<'group' | 'personal'>('group');

  const groupChecklist = useGroupChecklist();
  const personalChecklist = usePersonalChecklist(session?.id ?? null);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
        <button
          onClick={() => setTab('group')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 ${
            tab === 'group'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Grupal
        </button>
        <button
          onClick={() => setTab('personal')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 ${
            tab === 'personal'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Personal
        </button>
      </div>

      {/* Content */}
      {tab === 'group' ? (
        <ChecklistSection
          items={groupChecklist.data}
          isLoading={groupChecklist.isLoading}
          ownerId={null}
        />
      ) : (
        <ChecklistSection
          items={personalChecklist.data}
          isLoading={personalChecklist.isLoading}
          ownerId={session?.id ?? null}
        />
      )}
    </div>
  );
}
