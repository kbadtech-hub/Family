/**
 * BETESEB AI MODERATION HOOK
 * Auto-triggers content moderation for messages, community posts, and profile bios.
 * Calls /api/ai/moderate before any content is saved.
 *
 * USAGE:
 *   const { moderateText, moderateImage } = useAIModeration();
 *
 *   // Before saving a message:
 *   const result = await moderateText(messageContent);
 *   if (!result.approved) { showWarning(result.reason); return; }
 */

export interface ModerationResult {
  approved: boolean;
  reason?: string;
}

/**
 * Moderate a text message, post, or bio before saving.
 * Returns { approved: true } if safe, or { approved: false, reason } if flagged.
 */
export async function moderateText(content: string): Promise<ModerationResult> {
  // Skip empty or very short content
  if (!content || content.trim().length < 3) {
    return { approved: true };
  }

  try {
    const res = await fetch('/api/ai/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      // If moderation API fails, allow content (fail-open for UX)
      console.warn('[Moderation] API error, allowing content by default.');
      return { approved: true };
    }

    const data = await res.json();
    return {
      approved: !!data.approved,
      reason: data.reason,
    };
  } catch (e) {
    console.warn('[Moderation] Network error, allowing content by default:', e);
    return { approved: true };
  }
}

/**
 * Moderate a profile image URL before saving to Supabase Storage.
 * Returns { approved: true } if safe, or { approved: false, reason } if flagged.
 */
export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  if (!imageUrl) return { approved: true };

  try {
    const res = await fetch('/api/ai/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    if (!res.ok) {
      console.warn('[Moderation] Image moderation API error, allowing by default.');
      return { approved: true };
    }

    const data = await res.json();
    return {
      approved: !!data.approved,
      reason: data.reason,
    };
  } catch (e) {
    console.warn('[Moderation] Image moderation network error:', e);
    return { approved: true };
  }
}

/**
 * React hook wrapper for moderation — provides loading state.
 * Use this inside components for async moderation with UI feedback.
 */
import { useState, useCallback } from 'react';

export function useAIModeration() {
  const [isChecking, setIsChecking] = useState(false);

  const checkText = useCallback(async (content: string): Promise<ModerationResult> => {
    setIsChecking(true);
    try {
      return await moderateText(content);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const checkImage = useCallback(async (imageUrl: string): Promise<ModerationResult> => {
    setIsChecking(true);
    try {
      return await moderateImage(imageUrl);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { checkText, checkImage, isChecking };
}
