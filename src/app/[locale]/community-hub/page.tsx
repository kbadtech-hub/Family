'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Heart, Users, MessageCircle, Plus, Image as ImageIcon,
  Send, Coins, Lock, ShieldCheck, AlertCircle, ArrowRight,
  Loader2, ThumbsUp, BadgeCheck, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ─── Types ─── */
interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  author_name: string;
  author_verification: string;
  user_liked: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  verification_status: string;
  subscription_status: string;
  beteseb_coins: number;
}

const COIN_COST_PER_POST = 20;
const MAX_IMAGE_KB = 50;

/* ─── Sample/Seed posts shown when DB is empty ─── */
const SEED_POSTS_AM = [
  { id: 's1', author_name: 'አቤቤ ሀ.', author_verification: 'gold', content: 'ትዳር ውስጥ እርስ በርስ ምስጋና ማቅረብ ምን ያህል ጠቃሚ ነው! ዛሬ የቤቴ አለቃ ቡና ሰርቶልኝ ወደ ሥራ ሸኘኝ — ያ ትንሽ ምልክት ቀኑን ሙሉ አስደሰተኝ። 🙏❤️', image_url: null, likes_count: 48, comments_count: 12, created_at: '2026-07-04', user_liked: false },
  { id: 's2', author_name: 'ሰርካለም ጂ.', author_verification: 'platinum', content: 'ልጆቻቸን ሲያድጉ ስናሳድጋቸው ታሪክ ትላልቅ ስናስተምርላቸው — ዘሩን ያሳውቁ ማለት ነው። 🌿 የቤተሰብ ሥሮቻቸን ያለምንም ማሰብ ሊቋረጡ አይገባቸውም። #ቤተሰብ #ትውልድ', image_url: null, likes_count: 94, comments_count: 27, created_at: '2026-07-03', user_liked: true },
  { id: 's3', author_name: 'ዳዊት ቢ.', author_verification: 'gold', content: 'ሁልጊዜ ሰዎች "ጥሩ ሰው ፈልጊ" ይሉናል ። ጥሩ ሰው ለመፈለግ ጥሩ ሰው መሆን ይቀድማል! ❤️ ትዳር ግንባታ ስራ ነው — ዝናብ ሳይሆን ሰርስሮ የሚሰራ ጉጉ ሰው ይፈልጋል።', image_url: null, likes_count: 37, comments_count: 8, created_at: '2026-07-02', user_liked: false },
];

const SEED_POSTS_EN = [
  { id: 's1', author_name: 'Abebe H.', author_verification: 'gold', content: 'Gratitude in marriage matters so much! Today my partner made me coffee and walked me to the door before work — that little gesture made my whole day. 🙏❤️', image_url: null, likes_count: 48, comments_count: 12, created_at: '2026-07-04', user_liked: false },
  { id: 's2', author_name: 'Serkalem G.', author_verification: 'platinum', content: 'As we raise our children, teaching them our history and culture ensures their roots are never severed. 🌿 No generation should grow up disconnected from their heritage. #Family #Roots', image_url: null, likes_count: 94, comments_count: 27, created_at: '2026-07-03', user_liked: true },
  { id: 's3', author_name: 'Dawit B.', author_verification: 'gold', content: 'People always say "find a good person." But to find a good person, you must first become one. ❤️ Marriage is a work of love — it requires commitment, not just luck.', image_url: null, likes_count: 37, comments_count: 8, created_at: '2026-07-02', user_liked: false },
];

const TIER_COLORS: Record<string, string> = {
  unverified: 'text-gray-400',
  silver: 'text-slate-500',
  gold: 'text-amber-500',
  platinum: 'text-purple-500',
  diamond: 'text-sky-500',
};

const TIER_ICON: Record<string, string> = {
  unverified: '○',
  silver: '◈',
  gold: '★',
  platinum: '◆',
  diamond: '💎',
};

export default function CommunityHubPage() {
  const locale = useLocale();
  const isAm = locale === 'am';
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [postText, setPostText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState(false);

  /* ─── Auth & profile ─── */
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('id, full_name, verification_status, subscription_status, beteseb_coins').eq('id', user.id).single();
        if (data) setProfile(data);
      }
      setAuthLoading(false);
    };
    fetchProfile();
  }, []);

  /* ─── Posts ─── */
  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('community_posts')
        .select('id, user_id, content, image_url, created_at, likes_count, comments_count, author_name, author_verification')
        .order('created_at', { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        // Check user likes
        let userLikes: string[] = [];
        if (user) {
          const { data: likeData } = await supabase.from('community_likes').select('post_id').eq('user_id', user.id);
          userLikes = (likeData || []).map((l: any) => l.post_id);
        }
        setPosts(data.map((p: any) => ({ ...p, user_liked: userLikes.includes(p.id) })));
      } else {
        // Show seed posts if table is empty
        setPosts((isAm ? SEED_POSTS_AM : SEED_POSTS_EN) as Post[]);
      }
      setPostsLoading(false);
    };
    fetchPosts();
  }, [isAm, postSuccess]);

  /* ─── Image handler ─── */
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate & compress: reject if > 50KB after read
    if (file.size > MAX_IMAGE_KB * 1024) {
      setPostError(isAm
        ? `ፎቶው ከ${MAX_IMAGE_KB}KB መብለጥ የለበትም። ትንሽ ፎቶ ይምረጡ።`
        : `Image must be under ${MAX_IMAGE_KB}KB. Please choose a smaller file.`);
      return;
    }
    setPostError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  /* ─── Check if user can post ─── */
  const canPost = (): { allowed: boolean; reason?: string; costCoins?: boolean } => {
    if (!profile) return { allowed: false, reason: 'auth' };
    const isSubscribed = profile.subscription_status === 'premium' || profile.subscription_status === 'active';
    const isVerified = ['gold', 'platinum', 'diamond', 'silver'].includes(profile.verification_status);

    if (isSubscribed) return { allowed: true };
    if (isVerified && profile.beteseb_coins >= COIN_COST_PER_POST) return { allowed: true, costCoins: true };
    if (!isVerified) return { allowed: false, reason: 'not_verified' };
    return { allowed: false, reason: 'no_coins' };
  };

  /* ─── Content moderation: basic keyword check ─── */
  const isOnTopic = (text: string): boolean => {
    const familyKeywords = [
      'ቤተሰብ', 'ትዳር', 'ልጅ', 'ወላጅ', 'ፍቅር', 'አስተዳደግ', 'ቤት', 'ሃይማኖት', 'ምክር', 'ሠርግ', 'family',
      'marriage', 'child', 'parent', 'love', 'upbringing', 'home', 'faith', 'advice', 'wedding',
      'relationship', 'husband', 'wife', 'ባል', 'ሚስት', 'ዳያስፖራ', 'diaspora', 'culture', 'ባህል'
    ];
    const lower = text.toLowerCase();
    return familyKeywords.some(kw => lower.includes(kw));
  };

  /* ─── Submit post ─── */
  const handlePost = async () => {
    setPostError('');
    if (!postText.trim()) {
      setPostError(isAm ? 'ፅሁፍ ያስፈልጋል' : 'Post content is required');
      return;
    }
    if (!isOnTopic(postText)) {
      setPostError(isAm
        ? 'ፖስቱ ከቤተሰብ ጋር ተያያዥ ያልሆነ ይመስላል። ስለ ቤተሰብ፣ ትዳር ወይም ልጅ አስተዳደግ ጽሁፍ ያስቀምጡ።'
        : 'Your post does not appear to be family-related. Please share thoughts about family, marriage, or parenting.');
      return;
    }

    const check = canPost();
    if (!check.allowed) return;

    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let image_url: string | null = null;
      if (imageFile) {
        const filePath = `community/${user.id}/${Date.now()}_${imageFile.name}`;
        const { error: uploadErr } = await supabase.storage.from('uploads').upload(filePath, imageFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
          image_url = urlData?.publicUrl ?? null;
        }
      }

      // Deduct coins if not subscriber
      if (check.costCoins && profile) {
        await supabase.from('profiles').update({ beteseb_coins: (profile.beteseb_coins || 0) - COIN_COST_PER_POST }).eq('id', user.id);
      }

      await supabase.from('community_posts').insert({
        user_id: user.id,
        content: postText.trim(),
        image_url,
        author_name: profile?.full_name || 'ተጠቃሚ',
        author_verification: profile?.verification_status || 'unverified',
        likes_count: 0,
        comments_count: 0,
      });

      setPostText('');
      setImageFile(null);
      setImagePreview(null);
      setShowComposer(false);
      setPostSuccess(prev => !prev);
    } catch (err: any) {
      setPostError(err.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  /* ─── Like a post ─── */
  const handleLike = async (post: Post) => {
    if (!profile) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (post.user_liked) {
      await supabase.from('community_likes').delete().match({ user_id: user.id, post_id: post.id });
      await supabase.from('community_posts').update({ likes_count: Math.max(0, post.likes_count - 1) }).eq('id', post.id);
    } else {
      await supabase.from('community_likes').insert({ user_id: user.id, post_id: post.id });
      await supabase.from('community_posts').update({ likes_count: post.likes_count + 1 }).eq('id', post.id);
    }
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, user_liked: !p.user_liked, likes_count: p.user_liked ? p.likes_count - 1 : p.likes_count + 1 }
      : p
    ));
  };

  const postCheck = canPost();

  return (
    <div className="min-h-screen bg-[#FDFBF9]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Hero ── */}
      <section className="relative pt-16 pb-20 px-6 bg-gradient-to-br from-accent to-accent/80 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,hsl(var(--primary)/0.3)_0%,transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em]">
            <Users size={12} /> {isAm ? 'ቤተሰብ ማህበረሰብ' : 'Beteseb Community'}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {isAm ? 'ሃሳቦን እናካፍል' : 'Share Your Wisdom'}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-medium">
            {isAm
              ? 'ስለ ቤተሰብ፣ ስለ ትዳር እና ስለ ልጅ አስተዳደግ ሃሳቦን እናካፍል። ማህበረሰቡ ይጠናከር።'
              : 'Share thoughts on family, marriage, and parenting. Build a stronger community together.'}
          </p>
        </div>
      </section>

      {/* ── Main layout: Composer + Feed ── */}
      <section className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* ── Post Composer / Access Gate ── */}
        {authLoading ? null : !profile ? (
          /* Not logged in */
          <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"><Lock size={20} className="text-primary" /></div>
            <p className="font-black text-accent">{isAm ? 'ለፖስት ማድረግ ግቡ' : 'Sign in to Post'}</p>
            <p className="text-xs text-gray-400 font-medium max-w-xs">{isAm ? 'ቬሪፋይ የሆኑ አባላት ወይም ሰብስክሪፕሽን ያወጡ ሰዎች ፖስት ማድረግ ይችላሉ።' : 'Verified members or subscribers can post. Others can like and comment.'}</p>
            <Link href="/login" className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest">{isAm ? 'ይግቡ' : 'Sign In'}</Link>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
            {/* Composer trigger row */}
            {!showComposer ? (
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                  {profile.full_name?.[0] || '?'}
                </div>
                <button
                  onClick={() => {
                    if (!postCheck.allowed && postCheck.reason === 'auth') return;
                    setShowComposer(true);
                  }}
                  className="flex-1 text-left px-4 py-3 bg-[#F8F4F1] rounded-xl text-sm text-gray-400 font-medium hover:bg-primary/5 transition-colors"
                >
                  {isAm ? 'ስለ ቤተሰብ ሃሳብ አካፍሉ...' : 'Share a thought about family...'}
                </button>
                <div className="flex items-center gap-1.5">
                  {postCheck.costCoins ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Coins size={10} /> {COIN_COST_PER_POST} {isAm ? 'ኮይን' : 'Coins'}
                    </span>
                  ) : !postCheck.allowed ? (
                    <span className="text-[10px] font-bold text-gray-400">
                      {postCheck.reason === 'not_verified' ? (isAm ? '🔒 ቬሪፋይ ሳልሆን' : '🔒 Not verified') : isAm ? '🔒 ኮይን የለም' : '🔒 No coins'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">✅ {isAm ? 'ነጻ' : 'Free'}</span>
                  )}
                </div>
              </div>
            ) : (
              /* Full composer */
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-black text-accent uppercase tracking-widest">
                    {isAm ? 'ፖስት ያድርጉ' : 'Create Post'}
                  </p>
                  <button onClick={() => { setShowComposer(false); setPostError(''); }} className="text-gray-400 hover:text-primary transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {postError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    {postError}
                  </div>
                )}

                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full p-3.5 bg-[#F8F4F1] rounded-xl text-sm text-accent font-medium outline-none resize-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder={isAm
                    ? 'ስለ ቤተሰብ፣ ትዳር ወይም ልጅ አስተዳደግ ሃሳብዎን ያካፍሉ...'
                    : 'Share your thoughts on family, marriage, or parenting...'}
                />

                <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium px-1">
                  <span>{isAm ? 'ፅሁፍ ከቤተሰብ ጋር ተያያዥ ሊሆን ይገባል' : 'Content must be family-related'}</span>
                  <span>{postText.length}/500</span>
                </div>

                {/* Image upload */}
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover rounded-xl" />
                    <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-black transition-colors">
                      <X size={13} />
                    </button>
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {isAm ? `ፎቶ (${(imageFile!.size / 1024).toFixed(1)}KB)` : `Photo (${(imageFile!.size / 1024).toFixed(1)}KB)`}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary transition-colors font-medium"
                  >
                    <ImageIcon size={15} /> {isAm ? `ፎቶ አያይዙ (ከ${MAX_IMAGE_KB}KB ያነሰ)` : `Attach photo (under ${MAX_IMAGE_KB}KB)`}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

                {/* Coin notice */}
                {postCheck.costCoins && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-700">
                    <Coins size={13} />
                    {isAm
                      ? `ሰብስክሪፕሽን ሳይኖር ለፖስት ${COIN_COST_PER_POST} ቤተሰብ ኮይን ይወሰዳሉ። አሁን ያለዎ: ${profile.beteseb_coins} ኮይን።`
                      : `Posting without a subscription costs ${COIN_COST_PER_POST} Beteseb Coins. Your balance: ${profile.beteseb_coins} coins.`}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button onClick={() => setShowComposer(false)} className="text-xs text-gray-400 font-bold hover:text-primary transition-colors">
                    {isAm ? 'ሰርዝ' : 'Cancel'}
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={posting || !postText.trim()}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {isAm ? 'ፖስት አድርግ' : 'Post'}
                  </button>
                </div>
              </div>
            )}

            {/* Access rules summary */}
            <div className="px-5 pb-4 pt-1 border-t border-border bg-[#FDFBF9]/50">
              <p className="text-[10px] font-bold text-gray-400 leading-relaxed">
                {isAm
                  ? `✅ ሰብስክሪፕሽን ካወጡ — ነጻ ፖስቲ ➕ ቬሪፋይ + ${COIN_COST_PER_POST} ኮይን — ፖስቲ ➕ ሌሎቹ — ላይክ እና ኮሜንት ብቻ`
                  : `✅ Subscribers — free posting ➕ Verified + ${COIN_COST_PER_POST} coins — post ➕ Others — like & comment only`}
              </p>
            </div>
          </div>
        )}

        {/* ── Posts Feed ── */}
        {postsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-sm">{isAm ? 'ፖስቶች እስካሁን የሉም' : 'No posts yet'}</p>
            <p className="text-xs mt-1">{isAm ? 'ወደ ማህበረሰቡ ዕድሉ ይሁኑ — ይጀምሩ!' : 'Be the first to share in this community!'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Post Header */}
                <div className="p-4 pb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-black text-primary text-sm shrink-0">
                    {post.author_name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-accent text-sm">{post.author_name}</span>
                      <span className={`text-sm ${TIER_COLORS[post.author_verification] || 'text-gray-300'}`} title={post.author_verification}>
                        {TIER_ICON[post.author_verification] || '○'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">{post.created_at?.slice(0, 10)}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-2">
                  <p className="text-sm text-accent font-medium leading-relaxed">{post.content}</p>
                </div>

                {/* Image */}
                {post.image_url && (
                  <div className="mx-4 mb-2 rounded-xl overflow-hidden">
                    <img src={post.image_url} alt="post" className="w-full max-h-64 object-cover" />
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 py-3 border-t border-border flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${post.user_liked ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
                  >
                    <Heart size={14} className={post.user_liked ? 'fill-primary' : ''} />
                    {post.likes_count}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-primary transition-colors">
                    <MessageCircle size={14} />
                    {post.comments_count}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
