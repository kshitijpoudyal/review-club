import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationInbox } from '../contexts/NotificationsContext';
import { NotificationListItem } from '../components/Notifications/NotificationListItem';
import { AppNotification } from '../types/Notification';
import { typography } from '../utils/typography';
import { getNotificationTarget } from '../utils/notificationTarget';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotificationInbox();

  const handleActivate = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await markRead(notification.id);
    }
    navigate(getNotificationTarget(notification));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={typography.pageTitle}>Notifications</h1>
          <p className={`${typography.caption} mt-1`}>
            Alerts from reminders, Gmail imports, and account updates — the same messages as push
            notifications.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className={`${typography.caption} text-[#006a68] hover:underline shrink-0 pt-1`}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-[#e4e2dd] bg-white overflow-hidden shadow-sm">
        {loading && (
          <p className={`${typography.caption} px-4 py-10 text-center text-gray-500`}>Loading…</p>
        )}
        {error && (
          <p className={`${typography.caption} px-4 py-10 text-center text-red-600`}>{error}</p>
        )}
        {!loading && !error && notifications.length === 0 && (
          <p className={`${typography.caption} px-4 py-10 text-center text-gray-500`}>
            No notifications yet. When the app sends you a push alert, it will show up here too.
          </p>
        )}
        {!loading &&
          !error &&
          notifications.map((notification) => (
            <NotificationListItem
              key={notification.id}
              notification={notification}
              onActivate={handleActivate}
            />
          ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
