import apiClient from './client';
import { Conversation, Message } from '../types';

// Helper to unwrap Rails API response { success, data, message }
function unwrap<T>(response: { data: any }): T {
  return (response.data?.data ?? response.data) as T;
}

// ─── Conversations ───────────────────────────────────────────────────────────

export async function getConversations(filter?: Record<string, string>): Promise<Conversation[]> {
  const response = await apiClient.get('/inbox', { params: filter || {} });
  return unwrap<Conversation[]>(response);
}

export async function getConversation(id: number): Promise<Conversation> {
  const response = await apiClient.get(`/inbox/${id}`);
  return unwrap<Conversation>(response);
}

export async function createConversation(data: {
  subject: string;
  body: string;
  context_type?: string;
  context_id?: number;
  client_id?: number;
  channel?: string;
}): Promise<Conversation> {
  const response = await apiClient.post('/inbox', { conversation: data });
  return unwrap<Conversation>(response);
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function getMessages(conversationId: number): Promise<Message[]> {
  const response = await apiClient.get(`/inbox/${conversationId}/messages`);
  return unwrap<Message[]>(response);
}

export async function sendMessage(
  conversationId: number,
  body: string,
  attachments?: File[]
): Promise<Message> {
  if (attachments && attachments.length > 0) {
    const formData = new FormData();
    formData.append('body', body);
    attachments.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file as any);
    });
    const response = await apiClient.post(
      `/inbox/${conversationId}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return unwrap<Message>(response);
  }

  const response = await apiClient.post(`/inbox/${conversationId}/messages`, { body });
  return unwrap<Message>(response);
}

// ─── Read Status ─────────────────────────────────────────────────────────────

export async function markRead(conversationId: number): Promise<void> {
  await apiClient.patch(`/inbox/${conversationId}/read`);
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get('/inbox/unread_count');
  const data = response.data?.data ?? response.data;
  return data?.unread_count ?? 0;
}
