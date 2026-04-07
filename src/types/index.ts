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
  name: string;
  job_number: string;
  description: string;
  status: JobStatus;
  scheduled_date: string;
  scheduled_start_time: string;
  client: Client;
  tasks: Task[];
  line_items: LineItem[];
}

export interface AvailableJob {
  id: number;
  name: string;
  job_number: string;
  client_name: string;
  scheduled_time: string | null;
}

export interface TimeClock {
  id: number;
  job_id: number | null;
  user_id: number;
  status: 'clocked_in' | 'on_break' | 'clocked_out';
  work_status: 'traveling' | 'arrived' | 'working' | 'completed';
  clock_in_at: string;
  clock_out_at: string | null;
  travel_started_at: string | null;
  arrived_at: string | null;
  work_started_at: string | null;
  total_duration: number;
  hourly_rate: number | null;
  labor_cost: number | null;
  approved: boolean | null;
  notes: string | null;
  user: User;
  job: { id: number; name: string; job_number: string } | null;
}

export interface TimeSummary {
  active_clock: TimeClock | null;
  today_clocks: TimeClock[];
  week_minutes: number;
  week_hours: number;
  available_jobs: AvailableJob[];
  team_active: TimeClock[] | null;
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
