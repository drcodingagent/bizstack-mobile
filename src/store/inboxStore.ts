import { create } from 'zustand';
import { getUnreadCount } from '../api/inbox';

interface InboxState {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
}

export const useInboxStore = create<InboxState>((set) => ({
  unreadCount: 0,

  refreshUnread: async () => {
    try {
      const count = await getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // leave stale count on network failure
    }
  },
}));
