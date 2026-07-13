'use client';

import { useState, useMemo } from 'react';
import { useActivities, useDeleteActivity } from '@/lib/queries/activities';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { AddActivityDrawer } from '@/components/agenda/add-activity-drawer';
import { Plus, Trash2, MapPin, Clock } from 'lucide-react';
import { Activity } from '@/types';

export default function AgendaPage() {
  const { data: activities, isLoading } = useActivities();
  const deleteActivity = useDeleteActivity();

  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  // Group by day_index (YYYYMMDD)
  const groupedActivities = useMemo(() => {
    if (!activities) return [];
    
    const groups = new Map<number, Activity[]>();
    activities.forEach((act) => {
      const current = groups.get(act.day_index) || [];
      groups.set(act.day_index, [...current, act]);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([dateInt, acts]) => {
        // Parse YYYYMMDD to a readable date
        const str = dateInt.toString();
        const dateObj = new Date(
          parseInt(str.substring(0, 4)),
          parseInt(str.substring(4, 6)) - 1,
          parseInt(str.substring(6, 8))
        );
        
        const readableDate = isNaN(dateObj.getTime()) 
          ? `Día ${dateInt}` 
          : dateObj.toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            });

        return {
          id: dateInt,
          label: readableDate.charAt(0).toUpperCase() + readableDate.slice(1), // capitalize
          activities: acts,
        };
      });
  }, [activities]);

  if (isLoading) {
    return <ListSkeleton count={4} />;
  }

  return (
    <div className="space-y-8 pb-10">
      {groupedActivities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-500">No hay actividades todavía.</p>
          <p className="text-sm text-zinc-600 mt-1">Sumá la primera para armar el viaje.</p>
        </div>
      )}

      {groupedActivities.map((group) => (
        <section key={group.id} className="space-y-4">
          <h2 className="sticky top-14 z-20 bg-zinc-950/90 py-2 text-sm font-semibold tracking-wider text-sky-400 uppercase backdrop-blur-xl">
            {group.label}
          </h2>
          
          <div className="space-y-3 pl-2 border-l border-zinc-800/60 ml-2">
            {group.activities.map((act) => (
              <div 
                key={act.id} 
                className="relative flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:bg-zinc-900/60 ml-4"
              >
                {/* Timeline node */}
                <div className="absolute -left-[21px] top-5 h-2 w-2 rounded-full bg-sky-500 ring-4 ring-zinc-950" />
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-zinc-100">{act.title}</h3>
                  {act.description && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-400">
                      <Clock size={14} className="shrink-0" />
                      <span>{act.description}</span>
                    </div>
                  )}
                  {act.map_url && (
                    <a 
                      href={act.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
                    >
                      <MapPin size={12} />
                      Ver en Maps
                    </a>
                  )}
                </div>
                
                <button
                  onClick={() => setDeleteTarget(act)}
                  className="rounded-md p-1.5 text-zinc-600 opacity-100 transition-all hover:bg-red-400/10 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* FAB Add */}
      <div className="fixed bottom-20 right-4 z-30">
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <AddActivityDrawer
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteActivity.mutate(deleteTarget.id);
        }}
        title="Eliminar actividad"
        message={`¿Seguro que querés borrar "${deleteTarget?.title}"?`}
      />
    </div>
  );
}
