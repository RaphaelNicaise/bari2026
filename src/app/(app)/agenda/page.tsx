'use client';

import { useMemo, useState } from 'react';
import { useActivities } from '@/lib/queries/activities';
import { useActivityChecklist, useToggleChecklistItem, useAddChecklistItem } from '@/lib/queries/checklists';
import { getSession } from '@/lib/session';
import { ListSkeleton } from '@/components/ui/skeleton';
import { MapPin, ChevronDown, Plus, Check } from 'lucide-react';
import { Activity } from '@/types';

function ActivityCard({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);
  const { data: checkItems } = useActivityChecklist(expanded ? activity.id : null);
  const toggleItem = useToggleChecklistItem();
  const addItem = useAddChecklistItem();
  const [newItem, setNewItem] = useState('');
  const session = getSession();

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    addItem.mutate({
      content: newItem.trim(),
      owner_id: null,
      activity_id: activity.id,
    });
    setNewItem('');
  };

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-zinc-600 bg-zinc-950" />

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-start justify-between p-4 text-left"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-200">
              {activity.title}
            </h3>
            {activity.description && (
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            {activity.map_url && (
              <a
                href={activity.map_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-sky-400/10 hover:text-sky-400 transition-colors"
              >
                <MapPin size={14} />
              </a>
            )}
            <ChevronDown
              size={14}
              className={`text-zinc-500 transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {expanded && (
          <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
            {activity.notes && (
              <p className="text-xs text-zinc-400 leading-relaxed">
                {activity.notes}
              </p>
            )}

            {/* Activity sub-checklist */}
            <div className="space-y-1">
              {checkItems?.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    toggleItem.mutate({
                      id: item.id,
                      is_completed: !item.is_completed,
                      completed_by: item.is_completed ? null : session?.id ?? null,
                    })
                  }
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-all duration-200 hover:bg-zinc-800/50 ${
                    item.is_completed ? 'opacity-40' : ''
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      item.is_completed
                        ? 'border-emerald-400/50 bg-emerald-400/10'
                        : 'border-zinc-600'
                    }`}
                  >
                    {item.is_completed && (
                      <Check size={10} className="text-emerald-400" />
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      item.is_completed
                        ? 'text-zinc-500 line-through'
                        : 'text-zinc-300'
                    }`}
                  >
                    {item.content}
                  </span>
                </button>
              ))}
            </div>

            {/* Add item */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder="Agregar ítem..."
                className="flex-1 rounded-md border border-zinc-800 bg-transparent px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                onClick={handleAddItem}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const { data: activities, isLoading } = useActivities();

  const grouped = useMemo(() => {
    if (!activities) return new Map<number, Activity[]>();
    const map = new Map<number, Activity[]>();
    for (const a of activities) {
      const existing = map.get(a.day_index) || [];
      existing.push(a);
      map.set(a.day_index, existing);
    }
    return map;
  }, [activities]);

  if (isLoading) return <ListSkeleton count={4} />;

  if (!activities?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-zinc-500">No hay actividades todavía</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([dayIndex, dayActivities]) => (
        <div key={dayIndex} className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Día {String(dayIndex).padStart(2, '0')}
          </h2>
          {/* Timeline line */}
          <div className="relative">
            <div className="absolute left-[5px] top-0 bottom-0 w-px bg-zinc-800" />
            <div className="space-y-3">
              {dayActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
