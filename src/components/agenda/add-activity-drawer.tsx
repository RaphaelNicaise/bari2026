'use client';

import { useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { useAddActivity } from '@/lib/queries/activities';

interface AddActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddActivityDrawer({ isOpen, onClose }: AddActivityDrawerProps) {
  const addActivity = useAddActivity();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // we will use this for time, e.g. "10:30 AM"
  const [dateStr, setDateStr] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !dateStr) return;

    // Convert date string YYYY-MM-DD to integer YYYYMMDD for sorting
    const dateInt = parseInt(dateStr.replace(/-/g, ''), 10);

    addActivity.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        day_index: dateInt,
        sort_order: parseInt(description.replace(/[^0-9]/g, '')) || 0, // sort by time if provided
        map_url: mapUrl.trim() || null,
        notes: null,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setDateStr('');
          setMapUrl('');
          onClose();
        },
      }
    );
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Nueva Actividad">
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
            Hora o Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: 10:30 AM (Nos encontramos en la base)"
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
          disabled={!title.trim() || !dateStr || addActivity.isPending}
          className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-400 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {addActivity.isPending ? 'Guardando...' : 'Agregar actividad'}
        </button>
      </div>
    </Drawer>
  );
}
