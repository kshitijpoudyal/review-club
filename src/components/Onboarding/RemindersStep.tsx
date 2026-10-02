import React from 'react';
import { StuckItemNotificationSettings } from '../Settings/StuckItemNotificationSettings';
import { NotificationSettings } from '../Settings/NotificationSettings';

// Stuck-item alerts and return-window reminders are both "notify me after N
// days" settings, so they share one onboarding step instead of two.
export const RemindersStep: React.FC = () => (
  <div className="space-y-4">
    <StuckItemNotificationSettings />
    <NotificationSettings />
  </div>
);
