import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotificationInbox } from '../../contexts/NotificationsContext';
import { AppNotification } from '../../types/Notification';
import { NotificationListItem } from './NotificationListItem';
import { typography } from '../../utils/typography';
import { getNotificationTarget } from '../../utils/notificationTarget';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotificationInbox();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const preview = notifications.slice(0, 8);
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleActivate = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await markRead(notification.id);
    }
    setOpen(false);
    navigate(getNotificationTarget(notification));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-all text-white/70 hover:text-white"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-amber-400 text-[10px] font-semibold text-gray-900 flex items-center justify-center">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className={typography.bodyStrong}>Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className={`${typography.caption} text-[#006a68] hover:underline`}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className={`${typography.caption} px-4 py-6 text-center text-gray-500`}>Loading…</p>
            )}
            {!loading && preview.length === 0 && (
              <p className={`${typography.caption} px-4 py-6 text-center text-gray-500`}>
                No notifications yet.
              </p>
            )}
            {!loading &&
              preview.map((notification) => (
                <NotificationListItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onActivate={handleActivate}
                />
              ))}
          </div>

          <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/80">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className={`${typography.caption} text-[#006a68] hover:underline`}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
