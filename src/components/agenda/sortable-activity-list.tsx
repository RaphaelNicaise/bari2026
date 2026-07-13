'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Activity } from '@/types';
import { Clock, MapPin, Trash2, GripVertical, Pencil } from 'lucide-react';

interface SortableActivityItemProps {
  activity: Activity;
  onEdit: (act: Activity) => void;
  onDelete: (act: Activity) => void;
}

function SortableActivityItem({ activity, onEdit, onDelete }: SortableActivityItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:bg-zinc-900/60 ml-4 ${
        isDragging ? 'shadow-2xl shadow-sky-900/20 opacity-80 ring-1 ring-sky-500/50' : ''
      }`}
    >
      {/* Timeline node */}
      <div className="absolute -left-[21px] top-5 h-2 w-2 rounded-full bg-sky-500 ring-4 ring-zinc-950" />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="mt-0.5 -ml-2 cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-300 touch-none"
      >
        <GripVertical size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-zinc-100">{activity.title}</h3>
        {activity.description && (
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-sky-400 font-medium">
            <Clock size={14} className="shrink-0" />
            <span>{activity.description}</span>
          </div>
        )}
        {activity.notes && (
          <div className="mt-1.5 text-sm text-zinc-400">
            {activity.notes}
          </div>
        )}
        {activity.map_url && (
          <a
            href={activity.map_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
          >
            <MapPin size={12} />
            Ver en Maps
          </a>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 z-10">
        <button
          onClick={() => onEdit(activity)}
          className="rounded-md p-1.5 text-zinc-600 opacity-100 transition-all hover:bg-sky-400/10 hover:text-sky-400"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(activity)}
          className="rounded-md p-1.5 text-zinc-600 opacity-100 transition-all hover:bg-red-400/10 hover:text-red-400"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

interface SortableActivityListProps {
  activities: Activity[];
  onEdit: (act: Activity) => void;
  onDelete: (act: Activity) => void;
  onReorder: (updates: { id: string; sort_order: number }[]) => void;
}

export function SortableActivityList({
  activities,
  onEdit,
  onDelete,
  onReorder,
}: SortableActivityListProps) {
  const [items, setItems] = useState(activities);

  // Sync internal state with external props when they change
  useEffect(() => {
    setItems(activities);
  }, [activities]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // allows clicking the delete button without triggering drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(prev, oldIndex, newIndex);

        // Calculate new sort_orders
        // Supabase has sort_order. We just use the array index for simplicity
        const updates = newItems.map((item, index) => ({
          id: item.id,
          sort_order: index,
        }));

        // Fire callback to save to DB
        onReorder(updates);

        return newItems;
      });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 pl-2 border-l border-zinc-800/60 ml-2">
          {items.map((act) => (
            <SortableActivityItem key={act.id} activity={act} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
