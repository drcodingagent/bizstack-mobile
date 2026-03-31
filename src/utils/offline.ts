import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineAction } from '../types';

const QUEUE_KEY = 'offline_queue';

let queue: OfflineAction[] = [];
let loaded = false;

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) {
      queue = JSON.parse(raw);
    }
  } catch {
    queue = [];
  }
  loaded = true;
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Best effort persistence
  }
}

export async function getQueue(): Promise<OfflineAction[]> {
  await ensureLoaded();
  return [...queue];
}

export async function addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<OfflineAction> {
  await ensureLoaded();
  const entry: OfflineAction = {
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
  };
  queue.push(entry);
  await persist();
  return entry;
}

export async function removeFromQueue(id: string): Promise<void> {
  await ensureLoaded();
  queue = queue.filter((a) => a.id !== id);
  await persist();
}

export async function clearQueue(): Promise<void> {
  queue = [];
  await persist();
}

export async function getQueueLength(): Promise<number> {
  await ensureLoaded();
  return queue.length;
}

// Connectivity check using fetch with timeout
export async function isConnected(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}
