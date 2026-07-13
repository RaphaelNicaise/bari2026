export interface User {
  id: string;
  name: string;
  avatar_seed: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  day_index: number;
  sort_order: number;
  map_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  activity_id: string | null; // null = belongs to general checklist
  owner_id: string | null; // null = group checklist, user_id = personal checklist
  content: string;
  is_completed: boolean;
  completed_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  total_amount: number;
  paid_by: string;
  is_settlement: boolean;
  split_mode: 'equal' | 'exact' | 'percentage';
  created_at: string;
  splits?: ExpenseSplit[];
  payer?: User;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount_owed: number;
  user?: User;
}

export interface DebtTransfer {
  from: string;
  from_name: string;
  to: string;
  to_name: string;
  amount: number;
}

export interface UserBalance {
  userId: string;
  userName: string;
  netBalance: number; // positive = others owe you, negative = you owe others
}
