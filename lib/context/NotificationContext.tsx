"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type NotificationType = "like" | "comment" | "follow" | "system";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
};

type NotificationState = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  addNotification: (n: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
};

const NotificationContext = createContext<NotificationState>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  addNotification: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback(
    (n: Omit<NotificationItem, "id" | "createdAt" | "read">) => {
      const item: NotificationItem = {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [item, ...prev]);
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
