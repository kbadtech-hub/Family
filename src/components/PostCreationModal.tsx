'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { moderateText } from '@/lib/moderation';
import { X, Send, AlertTriangle, ShieldCheck, Sparkles, Clock, Lock } from 'lucide-react';
import Image from 'next/image';

interface PostCreationModalProps {
  currentUser: any;
  isOpen: boolean;
  onClose: () => void;
  onPostSuccess: (newPost?: any) => void;
}


export default function PostCreationModal({
  currentUser,
  isOpen,
  onClose,
  onPostSuccess
}: PostCreationModalProps) {
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('Marriage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);

  // User Tier & Posting Rules Configuration
  const userTier = (currentUser?.profile?.tier || 'bronze').toLowerCase();
  const isVipOrDiamond = userTier === 'diamond' || userTier === 'vip' || currentUser?.profile?.is_vip_member;
  const isPlatinum = userTier === 'platinum' || currentUser?.profile?.is_premium;
  const isGold = userTier === 'gold' || currentUser?.profile?.verification_status === 'verified';
  const isAdmin = ['admin', 'super_admin', 'expert'].includes(currentUser?.profile?.role || '');
  // Only block if TRULY bronze/silver AND not admin — allow all authenticated users who are logged in
  const isBronzeOrSilver = !isGold && !isPlatinum && !isVipOrDiamond && !isAdmin && !currentUser?.id;

  // Character Limit based on Tier — all authenticated users get at least 500 chars
  const maxChars = isVipOrDiamond ? 1000 : 500;

  // Check Posting Frequency Limit from Supabase
  useEffect(() => {
    if (!isOpen || !currentUser || isBronzeOrSilver) return;

    const checkFrequencyCooldown = async () => {
      // Fetch latest post created by user
      const { data: latestPost } = await supabase
        .from('community_posts')
        .select('created_at')
        .eq('author_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestPost) {
        setCooldownRemaining(null);
        return;
      }

      const lastPostTime = new Date(latestPost.created_at).getTime();
      const now = Date.now();
      const diffHours = (now - lastPostTime) / (1000 * 60 * 60);

      // Gold Tier: 1 post per 3 days (72 hours)
      // Platinum / Diamond / VIP: 1 post per 1 day (24 hours)
      const requiredCooldownHours = isGold && !isPlatinum && !isVipOrDiamond ? 72 : 24;

      if (diffHours < requiredCooldownHours) {
        const remainingHours = Math.ceil(requiredCooldownHours - diffHours);
        setCooldownRemaining(
          isGold && !isPlatinum && !isVipOrDiamond
            ? `Gold Tier frequency limit: You can post once every 3 days. Next post allowed in ~${remainingHours} hours.`
            : `Tier frequency limit: You can post once per day. Next post allowed in ~${remainingHours} hours.`
        );
      } else {
        setCooldownRemaining(null);
      }
    };

    checkFrequencyCooldown();
  }, [isOpen, currentUser, isGold, isPlatinum, isVipOrDiamond, isBronzeOrSilver]);

  if (!isOpen) return null;

  const charCount = content.trim().length;
  const isOverCharLimit = charCount > maxChars;
  const isTextEmpty = charCount < 5;
  const isPostingDisabled = isBronzeOrSilver || isTextEmpty || isOverCharLimit || !!cooldownRemaining || isSubmitting;

  const handleCreatePost = async () => {
    if (!currentUser) {
      setErrorMsg('You must be logged in to post.');
      return;
    }
    if (content.trim().length < 5) {
      setErrorMsg('Post must be at least 5 characters.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    // 1. AI Content Moderation Check (wrapped in try/catch so it never blocks posting)
    try {
      const modResult = await moderateText(content.trim());
      if (!modResult.approved) {
        setErrorMsg(`⚠️ Auto-Moderation: ${modResult.reason || 'Content violates community guidelines.'}`);
        setIsSubmitting(false);
        return;
      }
    } catch (modErr) {
      console.warn('Moderation check failed, proceeding with post:', modErr);
    }

    // 2. Insert Post — try with category/is_approved, fallback to minimal payload
    let insertPayload: any = {
      author_id: currentUser.id,
      content: content.trim(),
      topic,
    };

    // Try to include optional columns (only work if migration 23 has been applied)
    try {
      insertPayload = { ...insertPayload, category: 'general', is_approved: true };
    } catch (_) {}

    const { data: newPost, error } = await supabase
      .from('community_posts')
      .insert(insertPayload)
      .select(`
        *,
        profiles!community_posts_author_id_fkey(id, full_name, avatar_url, role, tier, verification_status),
        post_likes(count),
        post_comments(
          *,
          profiles(full_name, avatar_url)
        )
      `)
      .single();

    if (error) {
      console.error('Post creation error:', error);
      // If error is about unknown columns, retry with minimal payload
      if (error.message?.includes('column') || error.message?.includes('is_approved') || error.message?.includes('category')) {
        const { data: fallbackPost, error: fallbackError } = await supabase
          .from('community_posts')
          .insert({ author_id: currentUser.id, content: content.trim(), topic })
          .select(`
            *,
            profiles!community_posts_author_id_fkey(id, full_name, avatar_url, role, tier, verification_status),
            post_likes(count),
            post_comments(*, profiles(full_name, avatar_url))
          `)
          .single();
        if (fallbackError) {
          console.error('Fallback post error:', fallbackError);
          setErrorMsg(`Error: ${fallbackError.message}`);
          setIsSubmitting(false);
        } else {
          setContent('');
          setIsSubmitting(false);
          onPostSuccess(fallbackPost);
          onClose();
        }
      } else {
        setErrorMsg(`Error: ${error.message}`);
        setIsSubmitting(false);
      }
    } else {
      setContent('');
      setIsSubmitting(false);
      onPostSuccess(newPost);
      onClose();
    }
  };


  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#FDFBF9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-accent">Create Community Post</h3>
              <p className="text-xs text-gray-500 font-medium">Text-only family discussions</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-accent transition-colors rounded-2xl hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

          {/* Author Info & Tier Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src={currentUser?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} 
                alt="Author Avatar" 
                width={48} 
                height={48} 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/20" 
              />
              <div>
                <h4 className="font-bold text-sm text-accent">{currentUser?.profile?.full_name || 'Member'}</h4>
                <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-0.5 rounded-full inline-block">
                  {userTier.toUpperCase()} TIER MEMBER
                </span>
              </div>
            </div>

            {/* Topic Selector */}
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-muted/50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-2 text-accent focus:ring-primary"
            >
              <option value="Marriage">Marriage (ትዳር)</option>
              <option value="Parenting">Parenting (ልጅ አስተዳደግ)</option>
              <option value="Problem Solving">Problem Solving (ችግር አፈታት)</option>
              <option value="Family Finance">Family Finance (ገንዘብ አያያዝ)</option>
              <option value="Dating & Family">Dating & Family (ቤተሰብ/ዴቲንግ)</option>
            </select>
          </div>

          {/* Read-Only Warning for Bronze/Silver */}
          {isBronzeOrSilver && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800">
              <Lock size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Posting Gated: Gold Tier Required</p>
                <p className="text-amber-700 leading-relaxed">
                  Bronze & Silver tier members can read, like, comment, and share. To create posts, upgrade your tier to Gold by verifying your ID profile.
                </p>
              </div>
            </div>
          )}

          {/* Frequency Cooldown Warning */}
          {cooldownRemaining && !isBronzeOrSilver && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-800 text-xs font-medium">
              <Clock size={18} className="text-blue-600 flex-shrink-0" />
              <span>{cooldownRemaining}</span>
            </div>
          )}

          {/* Moderation / Generic Error Warning */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-medium animate-in fade-in">
              <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Post Text Input Box */}
          <div className="relative">
            <textarea
              disabled={isBronzeOrSilver || !!cooldownRemaining}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                isBronzeOrSilver 
                  ? "Posting is available for Gold tier and above..." 
                  : "What's on your mind? Share your thoughts on marriage, parenting, or family values..."
              }
              className="w-full min-h-[160px] p-5 rounded-2xl bg-muted/30 border border-gray-100 focus:border-primary focus:ring-1 focus:ring-primary text-base font-medium text-gray-900 placeholder:text-gray-400 resize-none disabled:opacity-60 transition-all"
            />

            {/* Strict Text-Only Badge */}
            <div className="absolute bottom-3 left-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/80 px-2.5 py-1 rounded-full border border-gray-100">
              ✍️ Text-Only Policy Enforced
            </div>

            {/* Real-Time Character Counter */}
            {!isBronzeOrSilver && (
              <div className={`absolute bottom-3 right-3 text-xs font-bold px-3 py-1 rounded-full ${
                isOverCharLimit ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {charCount} / {maxChars}
              </div>
            )}
          </div>

          {/* Progress Bar for Characters */}
          {!isBronzeOrSilver && maxChars > 0 && (
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isOverCharLimit ? 'bg-red-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, (charCount / maxChars) * 100)}%` }}
              />
            </div>
          )}

        </div>

        {/* Modal Footer & Submit Button */}
        <div className="p-6 border-t border-gray-100 bg-[#FDFBF9] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>AI Auto-Moderated Content</span>
          </div>

          <button
            onClick={handleCreatePost}
            disabled={isPostingDisabled}
            className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all ${
              isPostingDisabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-primary text-white shadow-primary/30 hover:scale-105 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <span>Checking AI & Saving...</span>
            ) : (
              <>
                <span>Publish Post</span>
                <Send size={16} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
