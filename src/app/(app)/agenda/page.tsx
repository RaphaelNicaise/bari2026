'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { useActivities, useDeleteActivity, useUpdateActivitiesOrder, useUpdateActivity } from '@/lib/queries/activities';
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
  const updateActivity = useUpdateActivity();

  const [showAdd, setShowAdd] = useState<number | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [editTarget, setEditTarget] = useState<Activity | null>(null);
  const [localActivities, setLocalActivities] = useState<Activity[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (activities) {
      setLocalActivities(activities);
    }
  }, [activities]);

  // Group by day_index (YYYYMMDD) using local state
  const groupedActivities = useMemo(() => {
    const groups = new Map<number, Activity[]>();
    localActivities.forEach((act) => {
      const current = groups.get(act.day_index) || [];
      groups.set(act.day_index, [...current, act]);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([dateInt, acts]) => {
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
          label: readableDate.charAt(0).toUpperCase() + readableDate.slice(1),
          activities: acts, // already sorted from DB, but we may have updated local order
        };
      });
  }, [localActivities]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    const isActiveTask = localActivities.some((act) => act.id === activeIdStr);
    const isOverTask = localActivities.some((act) => act.id === overIdStr);
    const isOverDroppable = String(overIdStr).startsWith('day-');

    if (!isActiveTask) return;

    // Dragging over another task
    if (isOverTask) {
      setLocalActivities((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeIdStr);
        const overIndex = prev.findIndex((t) => t.id === overIdStr);

        if (prev[activeIndex].day_index !== prev[overIndex].day_index) {
          const newItems = [...prev];
          newItems[activeIndex] = {
            ...newItems[activeIndex],
            day_index: prev[overIndex].day_index,
          };
          return arrayMove(newItems, activeIndex, overIndex);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Dragging over an empty day container
    if (isOverDroppable) {
      const dayIndex = over.data.current?.dayIndex;
      setLocalActivities((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeIdStr);
        if (prev[activeIndex].day_index !== dayIndex) {
          const newItems = [...prev];
          newItems[activeIndex] = {
            ...newItems[activeIndex],
            day_index: dayIndex,
          };
          // Move to the end of the day list
          const targetDayItems = newItems.filter(t => t.day_index === dayIndex);
          if (targetDayItems.length === 0) {
             return newItems; // just update the day_index
          }
        }
        return prev;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const activeTask = localActivities.find((t) => t.id === activeIdStr);

    if (activeTask) {
      // Find what day the active task ended up in
      const finalDayIndex = activeTask.day_index;
      
      // Get all tasks in that day in their current visual order
      const dayTasks = localActivities.filter((t) => t.day_index === finalDayIndex);
      
      // Update sort order for all tasks in that day
      const updates = dayTasks.map((t, index) => ({
        id: t.id,
        sort_order: index,
      }));

      // Find the original task from DB to see if day_index changed
      const originalTask = activities?.find((t) => t.id === activeIdStr);
      
      if (originalTask && originalTask.day_index !== finalDayIndex) {
        // Send mutation for day_index change FIRST
        updateActivity.mutate({
          id: activeIdStr,
          day_index: finalDayIndex,
        }, {
          onSuccess: () => {
            // Then update sort orders
            updateOrder.mutate(updates);
          }
        });
      } else {
        // Just update sort orders
        updateOrder.mutate(updates);
      }
    }
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {groupedActivities.map((group) => (
          <section key={group.id} className="space-y-4">
            <div className="sticky top-14 z-20 flex items-center justify-between bg-zinc-950/90 py-2 backdrop-blur-xl">
              <h2 className="text-sm font-semibold tracking-wider text-sky-400 uppercase">
                {group.label}
              </h2>
              <button
                onClick={() => setShowAdd(group.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <SortableActivityList
              dayIndex={group.id}
              activities={group.activities}
              onEdit={(act) => setEditTarget(act)}
              onDelete={setDeleteTarget}
            />
          </section>
        ))}
      </DndContext>

      {/* FAB Add */}
      <div className="fixed bottom-20 right-4 z-30">
        <button
          onClick={() => setShowAdd(0)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <ActivityDrawer
        isOpen={showAdd !== false || !!editTarget}
        initialData={editTarget}
        defaultDateInt={typeof showAdd === 'number' ? showAdd : undefined}
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
