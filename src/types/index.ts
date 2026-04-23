// ─── Core Entities ───────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface Client {
  id: number;
  full_name: string;
  name?: string; // alias from inbox context
  email: string;
  phone: string;
  address?: string;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export type JobStatus = 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';

export type PriceType = 'fixed' | 'hourly';
export type JobType = 'one_off' | 'recurring';

export interface JobAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Task {
  id: number;
  title: string;
  name?: string; // alias
  status: 'pending' | 'completed';
  requires_photo: boolean;
  photo_before: string | null;
  photo_after: string | null;
}

/** Derived helper — use this instead of task.completed */
export function isTaskComplete(task: Task): boolean {
  return task.status === 'completed';
}

export interface LineItem {
  id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Job {
  id: number;
  title: string;
  name?: string; // alias used in some components
  description: string;
  status: JobStatus;
  scheduled_date: string;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  price_type: PriceType;
  fixed_price: number | null;
  hourly_rate: number | null;
  estimated_duration: number | null;
  job_address: JobAddress;
  job_number: string;
  job_type: JobType;
  client_signature: string | null;
  client_rating: number | null;
  client_feedback: string | null;
  total_cost: number | null;
  total_price: number | null;
  customer_notes: string | null;
  internal_notes: string | null;
  client: Client;
  assigned_workers: User[];
  tasks: Task[];
  line_items: LineItem[];
  attachments_count: number;
  photos_count: number;
}

// ─── Time Clock ──────────────────────────────────────────────────────────────

export type ClockStatus = 'clocked_in' | 'clocked_out' | 'on_break';
export type WorkStatus = 'traveling' | 'arrived' | 'working' | 'completed';

export interface ClockLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
  address: string | null;
}

export interface TimeClock {
  id: number;
  clock_in_at: string;
  clock_out_at: string | null;
  status: ClockStatus;
  work_status: WorkStatus;
  total_duration: number | null;
  total_minutes: number | null;
  hourly_rate: number | null;
  labor_cost: number | null;
  approved: boolean | null;
  notes: string | null;
  clock_in_location: ClockLocation | null;
  user: User;
  job: { id: number; title: string; job_number: string } | null;
}

export interface TimeSummary {
  active_clock: TimeClock | null;
  today_clocks: TimeClock[];
  week_minutes: number;
  week_hours: number;
  available_jobs: AvailableJob[];
  team_active: TimeClock[] | null;
}

export interface AvailableJob {
  id: number;
  title: string;
  job_number: string;
  client_name: string;
  scheduled_time: string | null;
}

// ─── Inbox / Messaging ───────────────────────────────────────────────────────

export type ConversationChannel = 'internal' | 'sms' | 'email';
export type ConversationStatus = 'open' | 'closed';
export type ContextType = 'Job' | 'Quote' | 'Invoice' | 'Request';

export interface ConversationPreview {
  body: string;
  sender: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  subject: string;
  status: ConversationStatus;
  channel: ConversationChannel;
  context_type: ContextType;
  context_id: number;
  client: { id: number; name: string };
  last_message: ConversationPreview | null;
  unread_count: number;
}

export type MessageType = 'message' | 'internal_note';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface MessageSender {
  id: number;
  type: string;
  name: string;
  role: string;
}

export interface Message {
  id: number;
  body: string;
  message_type: MessageType;
  status: MessageStatus;
  sender: MessageSender;
  created_at: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ─── Attachments / Photos ────────────────────────────────────────────────────

export interface Photo {
  id: number;
  filename: string;
  content_type: string;
  url: string;
  thumbnail_url: string;
  caption: string | null;
  created_at: string;
}

// ─── Services ────────────────────────────────────────────────────────────────

export interface Service {
  id: number;
  name: string;
  description: string | null;
  hourly_rate: number | null;
  fixed_price: number | null;
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export interface JobNote {
  id: number;
  message: string;
  author: string;
  created_at: string;
}

// ─── Offline ─────────────────────────────────────────────────────────────────

export interface OfflineAction {
  id: string;
  type: 'complete_task' | 'update_status' | 'clock_in' | 'clock_out' | 'upload_photo' | 'upload_signature';
  payload: Record<string, unknown>;
  timestamp: number;
}

// ─── API / Auth ──────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'job/[id]': { id: string };
};
