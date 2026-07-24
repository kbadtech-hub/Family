import { supabase } from '@/lib/supabase';

export type NotificationCategory = 'social' | 'support' | 'course' | 'appointment' | 'subscription';

export interface UserNotification {
  id: string;
  user_id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Create a centralized user notification in the system.
 */
export async function createNotification({
  userId,
  category,
  title,
  message,
  linkUrl,
  metadata = {}
}: {
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { data, error } = await supabase.from('user_notifications').insert({
      user_id: userId,
      category,
      title,
      message,
      link_url: linkUrl,
      metadata
    }).select().single();

    if (error) console.error('[Notifications] Error creating notification:', error.message);
    return data;
  } catch (err) {
    console.error('[Notifications] Unexpected error:', err);
    return null;
  }
}

/**
 * Fetch all notifications for a specific user.
 * Merges system_notifications with dynamic fallback alerts (e.g. support, appointments, subscriptions).
 */
export async function fetchUserNotifications(userId: string): Promise<UserNotification[]> {
  if (!userId) return [];

  try {
    // 1. Query stored notifications
    const { data: stored, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      console.warn('[Notifications] Error querying user_notifications:', error.message);
    }

    const notifications: UserNotification[] = (stored as UserNotification[]) || [];

    // 2. Fetch Support Ticket Replies dynamic fallback
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id, subject, status, created_at')
      .eq('user_id', userId)
      .limit(5);

    if (tickets) {
      tickets.forEach((t) => {
        if (!notifications.some((n) => n.metadata?.ticket_id === t.id)) {
          notifications.push({
            id: `ticket-${t.id}`,
            user_id: userId,
            category: 'support',
            title: `Support Ticket: ${t.subject || 'Update'}`,
            message: `Your ticket status is currently ${t.status}.`,
            link_url: '/dashboard?tab=support',
            is_read: false,
            metadata: { ticket_id: t.id },
            created_at: t.created_at
          });
        }
      });
    }

    // 3. Fetch Counselor Bookings dynamic fallback
    const { data: bookings } = await supabase
      .from('counselor_bookings')
      .select('id, expert_name, scheduled_date, scheduled_time, status, created_at')
      .eq('user_id', userId)
      .limit(5);

    if (bookings) {
      bookings.forEach((b) => {
        if (!notifications.some((n) => n.metadata?.booking_id === b.id)) {
          notifications.push({
            id: `booking-${b.id}`,
            user_id: userId,
            category: 'appointment',
            title: `Counselor Appointment: ${b.expert_name}`,
            message: `Session scheduled for ${b.scheduled_date} at ${b.scheduled_time} (${b.status}).`,
            link_url: '/counseling',
            is_read: false,
            metadata: { booking_id: b.id },
            created_at: b.created_at
          });
        }
      });
    }

    // Sort descending by creation date
    return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error('[Notifications] Fetch error:', err);
    return [];
  }
}

/**
 * Mark a specific notification as read.
 */
export async function markNotificationAsRead(id: string) {
  if (id.startsWith('ticket-') || id.startsWith('booking-')) return;
  await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId: string) {
  await supabase.from('user_notifications').update({ is_read: true }).eq('user_id', userId);
}

/**
 * Send a Follow notification with Instant Follow Back metadata.
 */
export async function sendFollowNotification(followerId: string, followerName: string, targetUserId: string) {
  return createNotification({
    userId: targetUserId,
    category: 'social',
    title: 'New Follower! 👤',
    message: `${followerName} started following you on Beteseb Community.`,
    linkUrl: `/dashboard`,
    metadata: {
      type: 'follow',
      follower_id: followerId,
      follower_name: followerName,
      can_follow_back: true
    }
  });
}
