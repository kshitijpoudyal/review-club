export type NotificationKind =
  | 'stuck_status'
  | 'return_reminder'
  | 'gmail_review'
  | 'gmail_order'
  | 'gmail_paypal'
  | 'gmail_reconnect';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  url?: string | null;
  tag?: string | null;
  kind: NotificationKind;
  createdAt: Date | null;
  readAt: Date | null;
}
