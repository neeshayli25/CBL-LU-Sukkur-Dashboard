import { useEffect, useState } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../services/api/socketClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  link?: string;
  read: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    // Listen to initial notifications if backend sends them on connect
    socket.on('notifications:initial', (data: Notification[]) => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    });

    // Listen to new events
    const handleNewNotification = (event: any) => {
      const newNotif: Notification = {
        id: event.id || Date.now().toString(),
        title: event.title || 'New Notification',
        message: event.message || '',
        type: event.type || 'info',
        createdAt: event.createdAt || new Date().toISOString(),
        link: event.link,
        read: false,
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification.created', handleNewNotification);
    socket.on('hazard.created', handleNewNotification);
    socket.on('hazard.updated', handleNewNotification);
    socket.on('hazard.closed', handleNewNotification);
    socket.on('incident.created', handleNewNotification);
    socket.on('dashboard.updated', () => {
      // Trigger a dashboard refresh if needed, or dispatch event
      window.dispatchEvent(new Event('dashboard-refresh'));
    });

    return () => {
      socket.off('notifications:initial');
      socket.off('notification.created', handleNewNotification);
      socket.off('hazard.created', handleNewNotification);
      socket.off('hazard.updated', handleNewNotification);
      socket.off('hazard.closed', handleNewNotification);
      socket.off('incident.created', handleNewNotification);
      socket.off('dashboard.updated');
      disconnectSocket();
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    // Optionally emit to backend
    // getSocket().emit('notification:read', { id });
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    // getSocket().emit('notification:readAll');
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
};
