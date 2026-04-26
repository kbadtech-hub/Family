import { supabase } from './supabase';

/**
 * Checks if the contact information should be revealed between two users.
 * Rule: 15 days of interaction required.
 */
export async function shouldRevealContact(userId: string, otherUserId: string): Promise<boolean> {
  // 1. Fetch the first message between these two users
  const { data, error } = await supabase
    .from('messages')
    .select('created_at')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return false;

  const firstInteraction = new Date(data.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - firstInteraction.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 15;
}

/**
 * Masks sensitive information like email or phone number.
 */
export function maskContactInfo(info: string): string {
  if (!info) return '••••••••';
  if (info.includes('@')) {
    const [name, domain] = info.split('@');
    return `${name.charAt(0)}${'*'.repeat(name.length - 1)}@${domain}`;
  }
  return `${info.substring(0, 3)}${'*'.repeat(info.length - 3)}`;
}
