'use client';

import { useState, useEffect } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { useAddActivity, useUpdateActivity } from '@/lib/queries/activities';
import { Activity } from '@/types';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Activity | null;
}

export function ActivityDrawer({ isOpen, onClose, initialData }: ActivityDrawerProps) {
  const addActivity = useAddActivity();
  const updateActivity = useUpdateActivity();

  const [title, setTitle] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  // When drawer opens, load initial data or clear fields
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setTimeStr(initialData.description || ''); // We stored time in description
        setDescription(initialData.notes || ''); // We stored notes in notes
        setMapUrl(initialData.map_url || '');
        
        // Parse day_index (YYYYMMDD) back to YYYY-MM-DD
        const diStr = initialData.day_index.toString();
        if (diStr.length === 8) {
          setDateStr(`${diStr.substring(0, 4)}-${diStr.substring(4, 6)}-${diStr.substring(6, 8)}`);
        } else {
          setDateStr('');
        }
      } else {
        setTitle('');
        setTimeStr('');
        setDescription('');
        setDateStr('');
        setMapUrl('');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (!title.trim() || !dateStr) return;

    // Convert date string YYYY-MM-DD to integer YYYYMMDD for sorting
    const dateInt = parseInt(dateStr.replace(/-/g, ''), 10);

    const payload = {
      title: title.trim(),
      description: timeStr ? timeStr : null,
      day_index: dateInt,
      map_url: mapUrl.trim() || null,
      notes: description.trim() || null,
    };

    const onSuccess = () => {
      onClose();
    };

    if (initialData) {
      updateActivity.mutate({ id: initialData.id, ...payload }, { onSuccess });
    } else {
      addActivity.mutate({ ...payload, sort_order: 0 }, { onSuccess });
    }
  };

  const isPending = addActivity.isPending || updateActivity.isPending;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Actividad" : "Nueva Actividad"}>
      <div className="space-y-6">
        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Fecha exacta
          </label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="mt-1.5 w-full border-b border-zinc-800 bg-transparent py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-colors [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Esquiar en Cerro Catedral"
            className="mt-1.5 w-full border-b border-zinc-800 bg-transparent py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Horario (Opcional)
          </label>
          <input
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            className="mt-1.5 w-full border-b border-zinc-800 bg-transparent py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-colors [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Notas o Descripción Corta (Opcional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Nos encontramos en la base..."
            className="mt-1.5 w-full border-b border-zinc-800 bg-transparent py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Link de Google Maps (Opcional)
          </label>
          <input
            type="url"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className="mt-1.5 w-full border-b border-zinc-800 bg-transparent py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !dateStr || isPending}
          className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-400 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isPending ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Agregar actividad'}
        </button>
      </div>
    </Drawer>
  );
}
