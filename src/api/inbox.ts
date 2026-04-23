import apiClient from './client';
import { Conversation, Message } from '../types';

// ─── Conversations ───────────────────────────────────────────────────────────

export async function getConversations(filter?: {
  status?: 'open' | 'closed';
  channel?: 'internal' | 'sms' | 'email';
}): Promise<Conversation[]> {
  const params = filter || {};
  const response = await apiClient.get<Conversation[]>('/inbox', { params });
  return response.data;
}

export async function getConversation(id: number): Promise<Conversation> {
  const response = await apiClient.get<Conversation>(`/inbox/${id}`);
  return response.data;
}

export async function createConversation(data: {
  subject: string;
  body: string;
  context_type?: string;
  context_id?: number;
  client_id?: number;
  channel?: string;
}): Promise<Conversation> {
  const response = await apiClient.post<Conversation>('/inbox', { conversation: data });
  return response.data;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function getMessages(conversationId: number): Promise<Message[]> {
  const response = await apiClient.get<Message[]>(`/inbox/${conversationId}/messages`);
  return response.data;
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
    const response = await apiClient.post<Message>(
      `/inbox/${conversationId}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  const response = await apiClient.post<Message>(`/inbox/${conversationId}/messages`, {
    body,
  });
  return response.data;
}

// ─── Read Status ─────────────────────────────────────────────────────────────

export async function markRead(conversationId: number): Promise<void> {
  await apiClient.patch(`/inbox/${conversationId}/read`);
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ unread_count: number }>('/inbox/unread_count');
  return response.data.unread_count;
}
