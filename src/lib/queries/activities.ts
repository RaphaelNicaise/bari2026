import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/types';

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('day_index')
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: Omit<Activity, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: Partial<Activity> & { id: string }) => {
      const { data, error } = await supabase
        .from('activities')
        .update(activity)
        .eq('id', activity.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateActivitiesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      // Supabase doesn't have bulk update via RPC out of the box unless defined,
      // so we do it in a Promise.all for now.
      const promises = updates.map((update) =>
        supabase
          .from('activities')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
      );
      const results = await Promise.all(promises);
      const hasError = results.some((r) => r.error);
      if (hasError) throw new Error('Error updating order');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
