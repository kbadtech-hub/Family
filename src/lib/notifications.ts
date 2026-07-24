import { supabase } from './supabase';

export type NotificationCategory = 'social' | 'support' | 'course' | 'appointment' | 'subscription';

export interface AppNotification {
  id: string;
  user_id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link_url?: string | null;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Create a new notification for a specific user
 */
export async function createNotification({
  userId,
  category,
  title,
  message,
  linkUrl,
  metadata
}: {
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}): Promise<AppNotification | null> {
  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        category,
        title,
        message,
        link_url: linkUrl || null,
        metadata: metadata || {},
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.warn('[Notifications] Error creating notification:', error.message);
      return null;
    }

    return data as AppNotification;
  } catch (err) {
    console.error('[Notifications] Exception creating notification:', err);
    return null;
  }
}

/**
 * Fetch notifications for a user, optionally filtered by category
 */
export async function fetchUserNotifications(
  userId: string,
  categoryFilter?: NotificationCategory | 'all'
): Promise<AppNotification[]> {
  try {
    let query = supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Notifications] Error fetching notifications:', error.message);
      return [];
    }

    return (data || []) as AppNotification[];
  } catch (err) {
    console.error('[Notifications] Exception fetching notifications:', err);
    return [];
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    return !error;
  } catch (err) {
    console.error('[Notifications] Exception marking notification read:', err);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return !error;
  } catch (err) {
    console.error('[Notifications] Exception marking all read:', err);
    return false;
  }
}

/**
 * Dynamic Notification Aggregator:
 * Fetches notifications and synthesizes system notifications if no records exist yet
 */
export async function getAggregatedNotifications(
  userId: string,
  categoryFilter: NotificationCategory | 'all' = 'all'
): Promise<AppNotification[]> {
  const explicitNotifications = await fetchUserNotifications(userId, categoryFilter);

  // If explicit notifications exist, return them
  if (explicitNotifications.length > 0) {
    return explicitNotifications;
  }

  // Fallback: Dynamically generate recent notifications from core tables
  const synthetic: AppNotification[] = [];
  const now = new Date().toISOString();

  // 1. Social (Friendships / Gifts)
  if (categoryFilter === 'all' || categoryFilter === 'social') {
    const { data: gifts } = await supabase
      .from('gifts')
      .select('id, amount, created_at, sender_id')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    gifts?.forEach(g => {
      synthetic.push({
        id: `synth-gift-${g.id}`,
        user_id: userId,
        category: 'social',
        title: 'የስጦታ ማሳወቂያ (New Gift Received)',
        message: `${g.amount || 'ልዩ'} ኮይን ስጦታ ደርሶዎታል።`,
        link_url: '/community-hub',
        is_read: false,
        created_at: g.created_at || now
      });
    });
  }

  // 2. Support Tickets
  if (categoryFilter === 'all' || categoryFilter === 'support') {
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id, ticket_number, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    tickets?.forEach(t => {
      synthetic.push({
        id: `synth-ticket-${t.id}`,
        user_id: userId,
        category: 'support',
        title: 'የድጋፍ ቲኬት ማሳወቂያ (Support Ticket Status)',
        message: `ቲኬት #${t.ticket_number || 'ST-1001'} አሁን በ '${t.status}' ሁኔታ ላይ ይገኛል።`,
        link_url: '/contact',
        is_read: false,
        created_at: t.created_at || now
      });
    });
  }

  // 3. Courses (Academy)
  if (categoryFilter === 'all' || categoryFilter === 'course') {
    const { data: courses } = await supabase
      .from('academy_courses')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    courses?.forEach(c => {
      synthetic.push({
        id: `synth-course-${c.id}`,
        user_id: userId,
        category: 'course',
        title: 'አዲስ የተለቀቀ ኮርስ (New Course Available)',
        message: `"${c.title}" የተሰኘው አዲስ የትምህርት ኮርስ በአካዳሚው ተለቋል።`,
        link_url: '/academy',
        is_read: false,
        created_at: c.created_at || now
      });
    });
  }

  // 4. Appointments (Counseling)
  if (categoryFilter === 'all' || categoryFilter === 'appointment') {
    const { data: bookings } = await supabase
      .from('counselor_bookings')
      .select('id, expert_name, topic, scheduled_date, scheduled_time, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    bookings?.forEach(b => {
      synthetic.push({
        id: `synth-appt-${b.id}`,
        user_id: userId,
        category: 'appointment',
        title: 'የአማካሪ ቀጠሮ ማሳወቂያ (Appointment Reminder)',
        message: `ከአማካሪ ${b.expert_name} ጋር በ ${b.scheduled_date} ${b.scheduled_time} የተያዘው ቀጠሮ ${b.status} ሆኗል።`,
        link_url: '/counseling',
        is_read: false,
        created_at: b.created_at || now
      });
    });
  }

  // 5. Subscriptions
  if (categoryFilter === 'all' || categoryFilter === 'subscription') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('premium_until, is_vip_member')
      .eq('id', userId)
      .single();

    if (profile?.premium_until) {
      synthetic.push({
        id: `synth-sub-${userId}`,
        user_id: userId,
        category: 'subscription',
        title: 'የደንበኝነት ክፍያ ማሳሰቢያ (Subscription Reminder)',
        message: `የፕሪሚየም አባልነትዎ እስከ ${new Date(profile.premium_until).toLocaleDateString()} ድረስ ይቆያል።`,
        link_url: '/dashboard',
        is_read: true,
        created_at: now
      });
    }
  }

  return synthetic.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
