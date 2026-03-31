import * as Network from './network-check';
import { OfflineAction } from '../types';

const QUEUE_KEY = 'offline_queue';

let queue: OfflineAction[] = [];

export function getQueue(): OfflineAction[] {
  return [...queue];
}

export function addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>): OfflineAction {
  const entry: OfflineAction = {
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
  };
  queue.push(entry);
  return entry;
}

export function removeFromQueue(id: string): void {
  queue = queue.filter((a) => a.id !== id);
}

export function clearQueue(): void {
  queue = [];
}

export function getQueueLength(): number {
  return queue.length;
}

// Simple connectivity check using fetch
export async function isConnected(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}
