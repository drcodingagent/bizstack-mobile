import apiClient from './client';
import { Conversation, Message } from '../types';

// ─── Conversations ───────────────────────────────────────────────────────────

export async function getConversations(filter?: Record<string, string>): Promise<Conversation[]> {
  const response = await apiClient.get('/inbox', { params: filter || {} });
  return response.data?.conversations ?? [];
}

export async function getConversation(id: number): Promise<{ conversation: Conversation; messages: Message[] }> {
  const response = await apiClient.get(`/inbox/${id}`);
  return {
    conversation: response.data?.conversation,
    messages: response.data?.messages ?? [],
  };
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
  return response.data?.conversation;
}

// ─── Messages ────────────────────────────────────────────────────────────────

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
      `/inbox/${conversationId}/create_message`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data?.message;
  }

  const response = await apiClient.post(`/inbox/${conversationId}/create_message`, { body });
  return response.data?.message;
}

// ─── Read Status ─────────────────────────────────────────────────────────────

export async function markRead(conversationId: number): Promise<void> {
  await apiClient.patch(`/inbox/${conversationId}/mark_read`);
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get('/inbox/unread_count');
  const data = response.data?.data ?? response.data;
  return data?.unread_count ?? 0;
}
