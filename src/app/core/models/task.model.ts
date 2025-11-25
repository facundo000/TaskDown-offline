export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  url?: string;
  initial_count: number;
  current_count: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}
