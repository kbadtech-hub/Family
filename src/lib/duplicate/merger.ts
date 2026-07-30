/**
 * Account Merging Logic for Beteseb Platform
 */
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface MergeAccountRequest {
  primaryUserId: string;
  secondaryUserId: string;
  performedByUserId?: string;
  reason?: string;
}

export async function mergeUserAccounts({
  primaryUserId,
  secondaryUserId,
  performedByUserId,
  reason = 'User initiated account merge',
}: MergeAccountRequest) {
  if (primaryUserId === secondaryUserId) {
    throw new Error('Primary and Secondary user IDs cannot be identical.');
  }

  // 1. Verify profiles exist
  const { data: primaryProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, phone, full_name')
    .eq('id', primaryUserId)
    .single();

  const { data: secondaryProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, phone, full_name')
    .eq('id', secondaryUserId)
    .single();

  if (!primaryProfile || !secondaryProfile) {
    throw new Error('One or both profiles were not found.');
  }

  // 2. Transfer coin balance / transactions if table exists
  try {
    await supabaseAdmin
      .from('coin_transactions')
      .update({ user_id: primaryUserId })
      .eq('user_id', secondaryUserId);
  } catch (err) {
    console.warn('Could not transfer coin transactions:', err);
  }

  // 3. Transfer matches & messages if tables exist
  try {
    await supabaseAdmin
      .from('matches')
      .update({ user_1: primaryUserId })
      .eq('user_1', secondaryUserId);

    await supabaseAdmin
      .from('matches')
      .update({ user_2: primaryUserId })
      .eq('user_2', secondaryUserId);
  } catch (err) {
    console.warn('Could not transfer matches:', err);
  }

  // 4. Mark secondary profile as merged / locked
  await supabaseAdmin
    .from('profiles')
    .update({
      is_locked: true,
      warning_message: `Account merged into primary account ${primaryUserId}`,
      bio: `[Merged into Account ${primaryUserId}]`,
    })
    .eq('id', secondaryUserId);

  // 5. Update duplicate_flags status to 'merged'
  await supabaseAdmin
    .from('duplicate_flags')
    .update({
      status: 'merged',
      resolved_at: new Date().toISOString(),
      resolved_by: performedByUserId || primaryUserId,
      match_details: {
        merged_reason: reason,
        primary_user_id: primaryUserId,
        secondary_user_id: secondaryUserId,
      },
    })
    .or(`and(primary_user_id.eq.${primaryUserId},flagged_user_id.eq.${secondaryUserId}),and(primary_user_id.eq.${secondaryUserId},flagged_user_id.eq.${primaryUserId})`);

  return {
    success: true,
    primaryUserId,
    mergedUserId: secondaryUserId,
    message: 'Accounts successfully merged.',
  };
}
