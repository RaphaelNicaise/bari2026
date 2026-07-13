import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Expense } from '@/types';

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          payer:users!paid_by(*),
          splits:expense_splits(
            *,
            user:users(*)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });
}

interface AddExpenseInput {
  description: string;
  total_amount: number;
  paid_by: string;
  is_settlement: boolean;
  split_mode: 'equal' | 'exact' | 'percentage';
  splits: { user_id: string; amount_owed: number }[];
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddExpenseInput) => {
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          description: input.description,
          total_amount: input.total_amount,
          paid_by: input.paid_by,
          is_settlement: input.is_settlement,
          split_mode: input.split_mode,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      const splitsToInsert = input.splits.map((s) => ({
        expense_id: expense.id,
        user_id: s.user_id,
        amount_owed: s.amount_owed,
      }));

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splitsToInsert);

      if (splitsError) throw splitsError;

      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      // Splits will be cascade-deleted via FK
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
