export interface HistoryEntry {
  id: string;
  task_id: string;
  action: 'decrement' | 'reset' | 'custom_reset';
  previous_value: number;
  new_value: number;
  created_at: string;
}
