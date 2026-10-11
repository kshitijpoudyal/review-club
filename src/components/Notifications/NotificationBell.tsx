import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

  const preview = notifications.slice(0, 8);
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  const handleActivate = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await markRead(notification.id);
    }
    setOpen(false);
    navigate(getNotificationTarget(notification));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-all text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 data-[state=open]:bg-white/10 data-[state=open]:text-white"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-amber-400 text-[10px] font-semibold text-foreground flex items-center justify-center">
            {badgeLabel}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 sm:w-96 max-w-[calc(100vw-1rem)] overflow-hidden p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className={typography.bodyStrong}>Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className={`${typography.caption} text-brand hover:underline`}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto modern-scrollbar">
            {loading && (
              <p className={`${typography.caption} px-4 py-6 text-center text-muted-foreground`}>Loading…</p>
            )}
            {!loading && preview.length === 0 && (
              <p className={`${typography.caption} px-4 py-6 text-center text-muted-foreground`}>
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

          <div className="border-t border-border px-4 py-2.5 bg-muted/60">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className={`${typography.caption} text-brand hover:underline`}
            >
              View all notifications
            </Link>
          </div>
      </PopoverContent>
    </Popover>
  );
};
