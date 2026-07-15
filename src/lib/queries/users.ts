import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []).filter(u => !['Mate', 'Monto'].includes(u.name));
    },
    staleTime: Infinity,
  });
}
