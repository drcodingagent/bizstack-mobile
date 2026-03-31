export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface Client {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Task {
  id: number;
  name: string;
  completed: boolean;
  completed_at: string | null;
}

export interface LineItem {
  id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export type JobStatus = 'scheduled' | 'en_route' | 'in_progress' | 'completed';

export interface Job {
  id: number;
  title: string;
  description: string;
  status: JobStatus;
  scheduled_date: string;
  scheduled_start_time: string;
  client: Client;
  tasks: Task[];
  line_items: LineItem[];
}

export interface ClockEntry {
  id: number;
  job_id: number;
  clock_in: string;
  clock_out: string | null;
}

export interface OfflineAction {
  id: string;
  type: 'complete_task' | 'update_status' | 'clock_in' | 'clock_out' | 'upload_photo' | 'upload_signature';
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'job/[id]': { id: string };
};
