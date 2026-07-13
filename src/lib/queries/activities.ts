import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/types';

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('day_index', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60,
  });
}
