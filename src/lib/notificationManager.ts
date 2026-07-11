import { BackupPayload, Session } from '../types';

export type NotificationCategory =
  | 'Milestones'
  | 'Capsules'
  | 'Legacy Cards'
  | 'Analytics'
  | 'Focus Goals'
  | 'System'
  | 'Updates';

export interface TimerraNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: number;
  isRead: boolean;
  isCritical: boolean;
}

const LOCAL_STORAGE_KEY = 'timerra_notifications_v1';
const SILENCE_QUEUE_KEY = 'timerra_silence_queue_v1';

export const NotificationManager = {
  // --- Core Persistence ---
  loadNotifications(): TimerraNotification[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!str) {
      // Seed default system update notification on first load
      const defaultNotif: TimerraNotification = {
        id: 'system_init_v11',
        title: 'Timerra Workspace v1.1 Active',
        message: 'Welcome to Timerra. We have updated your dashboard with Absolute Silence Mode, a centralized Notification Center, and fluid cross-device responsiveness.',
        category: 'Updates',
        timestamp: Date.now(),
        isRead: false,
        isCritical: false,
      };
      this.saveNotifications([defaultNotif]);
      return [defaultNotif];
    }
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  },

  saveNotifications(list: TimerraNotification[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    // Dispatch a custom event to notify React states to update
    window.dispatchEvent(new Event('timerra_notifications_changed'));
  },

  // --- Silence Queue Persistence ---
  loadSilenceQueue(): TimerraNotification[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem(SILENCE_QUEUE_KEY);
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  },

  saveSilenceQueue(list: TimerraNotification[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SILENCE_QUEUE_KEY, JSON.stringify(list));
  },

  clearSilenceQueue() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SILENCE_QUEUE_KEY);
  },

  // --- Operations ---
  addNotification(
    title: string,
    message: string,
    category: NotificationCategory,
    isCritical = false,
    isSilenceModeActive = false
  ): TimerraNotification {
    const newNotif: TimerraNotification = {
      id: `${category.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      category,
      timestamp: Date.now(),
      isRead: false,
      isCritical,
    };

    // If Silence Mode is Active and this is NOT a critical notification, queue it
    if (isSilenceModeActive && !isCritical) {
      const silenceQueue = this.loadSilenceQueue();
      silenceQueue.push(newNotif);
      this.saveSilenceQueue(silenceQueue);
    } else {
      // Add directly to main active notifications list
      const list = this.loadNotifications();
      list.unshift(newNotif); // prepend
      this.saveNotifications(list);

      // Dispatch a custom event for new notifications
      if (typeof window !== 'undefined') {
        const customEvent = new CustomEvent('timerra_new_notification', { detail: newNotif });
        window.dispatchEvent(customEvent);
      }

      // Trigger Web Browser Notification API if enabled and granted
      if (this.hasBrowserPermission()) {
        try {
          new Notification(title, {
            body: message,
            icon: '/assets/logo.png', // Fallback relative path
          });
        } catch (e) {
          console.warn('Failed to dispatch browser notification:', e);
        }
      }
    }

    return newNotif;
  },

  markAsRead(id: string) {
    const list = this.loadNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveNotifications(updated);
  },

  markAllAsRead() {
    const list = this.loadNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(updated);
  },

  deleteNotification(id: string) {
    const list = this.loadNotifications();
    const updated = list.filter((n) => n.id !== id);
    this.saveNotifications(updated);
  },

  clearAll() {
    this.saveNotifications([]);
  },

  getUnreadCount(): number {
    return this.loadNotifications().filter((n) => !n.isRead).length;
  },

  // --- Browser Notification Permission helpers ---
  async requestBrowserPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  },

  hasBrowserPermission(): boolean {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  },

  getBrowserPermissionState(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  },

  // --- Release Silence Queue ---
  // Returns all queued notifications that are now being pushed to the main system
  flushSilenceQueue(): TimerraNotification[] {
    const queue = this.loadSilenceQueue();
    if (queue.length === 0) return [];

    const list = this.loadNotifications();
    // Prepend all queued items to list
    const updatedList = [...queue, ...list];
    this.saveNotifications(updatedList);
    this.clearSilenceQueue();

    return queue;
  }
};
