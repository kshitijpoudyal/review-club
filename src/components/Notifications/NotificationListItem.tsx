import React from 'react';
import { AppNotification } from '../../types/Notification';
import { formatRelativeTime } from '../../utils/relativeTime';
import { typography } from '../../utils/typography';

interface NotificationListItemProps {
  notification: AppNotification;
  compact?: boolean;
  onActivate: (notification: AppNotification) => void;
}

export const NotificationListItem: React.FC<NotificationListItemProps> = ({
  notification,
  compact = false,
  onActivate,
}) => {
  const unread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onActivate(notification)}
      className={`w-full text-left px-4 py-3 transition-colors border-b border-border last:border-b-0 focus:outline-none focus-visible:bg-secondary ${
        unread ? 'bg-brand/5 hover:bg-brand/10' : 'hover:bg-secondary/60'
      }`}
    >
      <div className="flex items-start gap-2">
        {unread && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden />
        )}
        <div className={`min-w-0 flex-1 ${unread ? '' : 'pl-4'}`}>
          <div className="flex items-baseline justify-between gap-2">
            <p className={`${typography.bodyStrong} text-foreground truncate`}>{notification.title}</p>
            <span className={`${typography.caption} text-muted-foreground shrink-0 tabular-nums`}>
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
          <p
            className={`${typography.caption} text-on-surface-variant mt-0.5 ${
              compact ? 'line-clamp-2' : 'line-clamp-3'
            }`}
          >
            {notification.body}
          </p>
        </div>
      </div>
    </button>
  );
};
