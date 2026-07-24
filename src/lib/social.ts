import { supabase } from '@/lib/supabase';
import { sendFollowNotification } from '@/lib/notifications';

export interface SocialStats {
  followersCount: number;
  followingCount: number;
  totalPostLikes: number;
}

/**
 * Check if current user is following a specific author.
 */
export async function isFollowingUser(followerId: string, followingId: string): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) return false;
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return !!data;
}

/**
 * Toggle Follow / Unfollow user state.
 */
export async function toggleFollowUser(
  followerId: string,
  followerName: string,
  targetUserId: string
): Promise<{ isFollowing: boolean; error?: string }> {
  if (!followerId || !targetUserId || followerId === targetUserId) {
    return { isFollowing: false, error: 'Invalid user action' };
  }

  const currentlyFollowing = await isFollowingUser(followerId, targetUserId);

  if (currentlyFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', targetUserId);
    if (error) return { isFollowing: true, error: error.message };
    return { isFollowing: false };
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: targetUserId });
    if (error) return { isFollowing: false, error: error.message };

    // Trigger Centralized Follow Notification with Follow Back action
    await sendFollowNotification(followerId, followerName, targetUserId);
    return { isFollowing: true };
  }
}

/**
 * Check if post is saved by user.
 */
export async function isPostSaved(userId: string, postId: string): Promise<boolean> {
  if (!userId || !postId) return false;
  const { data } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();
  return !!data;
}

/**
 * Toggle Save / Unsave post.
 */
export async function toggleSavePost(userId: string, postId: string): Promise<{ isSaved: boolean; error?: string }> {
  if (!userId || !postId) return { isSaved: false, error: 'User login required' };

  const saved = await isPostSaved(userId, postId);

  if (saved) {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);
    if (error) return { isSaved: true, error: error.message };
    return { isSaved: false };
  } else {
    const { error } = await supabase
      .from('saved_posts')
      .insert({ user_id: userId, post_id: postId });
    if (error) return { isSaved: false, error: error.message };
    return { isSaved: true };
  }
}

/**
 * Repost a post (In-app recommendation).
 */
export async function repostPost(userId: string, postId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId || !postId) return { success: false, error: 'User login required' };
  const { error } = await supabase
    .from('post_reposts')
    .insert({ user_id: userId, post_id: postId });
  if (error && !error.message.includes('unique constraint')) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Fetch Real-Time Profile Statistics: Followers Count, Following Count, Total Post Likes.
 */
export async function fetchProfileSocialStats(userId: string): Promise<SocialStats> {
  if (!userId) return { followersCount: 0, followingCount: 0, totalPostLikes: 0 };

  try {
    // 1. Followers Count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // 2. Following Count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // 3. Total Post Likes
    // Fetch all post IDs by this user
    const { data: userPosts } = await supabase
      .from('community_posts')
      .select('id')
      .eq('author_id', userId);

    let totalLikes = 0;
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id);
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);
      totalLikes = likesCount || 0;
    }

    return {
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      totalPostLikes: totalLikes
    };
  } catch (err) {
    console.error('[SocialStats] Error fetching stats:', err);
    return { followersCount: 0, followingCount: 0, totalPostLikes: 0 };
  }
}
