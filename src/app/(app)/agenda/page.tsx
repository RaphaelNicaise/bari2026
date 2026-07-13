'use client';

import { useState, useMemo } from 'react';
import { useActivities, useDeleteActivity, useUpdateActivitiesOrder } from '@/lib/queries/activities';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ActivityDrawer } from '@/components/agenda/activity-drawer';
import { SortableActivityList } from '@/components/agenda/sortable-activity-list';
import { Plus } from 'lucide-react';
import { Activity } from '@/types';

export default function AgendaPage() {
  const { data: activities, isLoading } = useActivities();
  const deleteActivity = useDeleteActivity();
  const updateOrder = useUpdateActivitiesOrder();

  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [editTarget, setEditTarget] = useState<Activity | null>(null);

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
          
          <SortableActivityList
            activities={group.activities}
            onEdit={(act) => setEditTarget(act)}
            onDelete={setDeleteTarget}
            onReorder={(updates) => updateOrder.mutate(updates)}
          />
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

      <ActivityDrawer
        isOpen={showAdd || !!editTarget}
        initialData={editTarget}
        onClose={() => {
          setShowAdd(false);
          setEditTarget(null);
        }}
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
