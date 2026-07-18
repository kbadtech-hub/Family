import { supabase } from './supabase';

export interface VipProfile {
  id: string;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url: string | null;
  bio?: string | null;
  username?: string | null;
  gender: string | null;
  is_vip_member: boolean;
  is_ghost_mode_active: boolean;
  hide_online_status: boolean;
  hide_read_receipts: boolean;
  strict_incognito: boolean;
  vip_expires_at: string | null;
  [key: string]: any;
}

/**
 * Mask a full name into initials (e.g., "Abel Bekele" -> "A. B.")
 */
export function maskNameToInitials(fullName: string | null): string {
  if (!fullName) return 'Anonymous';
  return fullName
    .split(' ')
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + '.')
    .join(' ');
}

/**
 * Checks if a user has an active VIP membership
 */
export async function isActiveVip(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_vip_member, vip_expires_at')
      .eq('id', userId)
      .single();

    if (error || !data) return false;

    if (!data.is_vip_member) return false;

    if (data.vip_expires_at) {
      const expiry = new Date(data.vip_expires_at);
      if (expiry < new Date()) {
        return false; // Expired
      }
    }

    return true;
  } catch (err) {
    console.error('Error in isActiveVip check:', err);
    return false;
  }
}

/**
 * Fetches a profile and applies VIP asymmetric visibility / Ghost Mode masking if necessary.
 */
export async function getProfileForUser(viewerId: string, targetProfileId: string): Promise<any | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetProfileId)
      .single();

    if (error || !profile) return null;

    // Check if target is an active VIP
    const isTargetVip = profile.is_vip_member && 
      (!profile.vip_expires_at || new Date(profile.vip_expires_at) > new Date());

    if (isTargetVip) {
      // Check if Ghost Mode is active
      if (profile.is_ghost_mode_active) {
        // Viewer is authorized if they are the VIP user themselves
        let isAuthorized = viewerId === targetProfileId;

        // If not the same user, check if there is an explicit photo reveal record
        if (!isAuthorized && viewerId) {
          const { data: reveal } = await supabase
            .from('vip_photo_reveals')
            .select('id')
            .eq('vip_id', targetProfileId)
            .eq('viewer_id', viewerId)
            .maybeSingle();

          if (reveal) {
            isAuthorized = true;
          }
        }

        // If NOT authorized, apply masking and blur indicator
        if (!isAuthorized) {
          return {
            ...profile,
            full_name: maskNameToInitials(profile.full_name),
            is_photo_blurred: true, // Signal to the frontend to apply heavy blur (blurRadius=25)
            bio: 'This VIP profile is in Ghost Mode.', // Mask bio for privacy
            gallery_urls: [], // Hide gallery photos from unauthorized viewers
          };
        }
      }
    }

    return {
      ...profile,
      is_photo_blurred: false
    };
  } catch (err) {
    console.error('Error in getProfileForUser:', err);
    return null;
  }
}

/**
 * Authorize a specific viewer to see the VIP's profile unblurred.
 */
export async function revealVipPhoto(vipId: string, viewerId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('vip_photo_reveals')
      .insert({ vip_id: vipId, viewer_id: viewerId })
      .select();

    return !error;
  } catch (err) {
    console.error('Error in revealVipPhoto:', err);
    return false;
  }
}

/**
 * Checks if daily communication limits should be bypassed for a user (returns true for active VIP)
 */
export async function checkDailyLimitsBypass(userId: string): Promise<boolean> {
  return isActiveVip(userId);
}
