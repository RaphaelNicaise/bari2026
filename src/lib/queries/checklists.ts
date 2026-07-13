import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChecklistItem } from '@/types';

/**
 * Fetch group checklist items (owner_id IS NULL and activity_id IS NULL)
 */
export function useGroupChecklist() {
  return useQuery({
    queryKey: ['checklists', 'group'],
    queryFn: async (): Promise<ChecklistItem[]> => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .is('owner_id', null)
        .is('activity_id', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Fetch personal checklist items for a specific user
 */
export function usePersonalChecklist(userId: string | null) {
  return useQuery({
    queryKey: ['checklists', 'personal', userId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('owner_id', userId)
        .is('activity_id', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

/**
 * Fetch checklist items for a specific activity
 */
export function useActivityChecklist(activityId: string | null) {
  return useQuery({
    queryKey: ['checklists', 'activity', activityId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      if (!activityId) return [];
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activityId,
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      is_completed,
      completed_by,
    }: {
      id: string;
      is_completed: boolean;
      completed_by: string | null;
    }) => {
      const { error } = await supabase
        .from('checklist_items')
        .update({ is_completed, completed_by })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      owner_id,
      activity_id,
    }: {
      content: string;
      owner_id: string | null;
      activity_id: string | null;
    }) => {
      const { error } = await supabase.from('checklist_items').insert({
        content,
        owner_id,
        activity_id,
        is_completed: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}
