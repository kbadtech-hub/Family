'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Lock, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { moderateText } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_verified?: boolean;
  is_vip_member?: boolean;
  premium_until?: string;
}

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  userTier: string; // 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'vip'
  onPostSuccess: () => void;
  locale?: string;
}

export default function PostCreationModal({
  isOpen,
  onClose,
  currentUser,
  userTier = 'bronze',
  onPostSuccess,
  locale = 'am'
}: PostCreationModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPostDate, setLastPostDate] = useState<Date | null>(null);
  const [timeRemainingText, setTimeRemainingText] = useState<string | null>(null);

  // Determine posting limits based on user tier
  const isBronzeOrSilver = ['bronze', 'silver'].includes(userTier.toLowerCase());
  const isGold = userTier.toLowerCase() === 'gold';
  const isPlatinum = userTier.toLowerCase() === 'platinum';
  const isDiamondOrVIP = ['diamond', 'vip'].includes(userTier.toLowerCase()) || 
                          ['admin', 'super_admin', 'expert'].includes(currentUser?.profile?.role);

  const maxChars = isDiamondOrVIP ? 1000 : 500;
  const cooldownHours = isGold ? 72 : 24; // 3 days for Gold, 1 day for Platinum/Diamond/VIP

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;

    const checkLastPostFrequency = async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('created_at')
        .eq('author_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.created_at) {
        const lastDate = new Date(data.created_at);
        setLastPostDate(lastDate);

        const now = new Date();
        const diffMs = now.getTime() - lastDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < cooldownHours) {
          const remainingMs = (cooldownHours * 60 * 60 * 1000) - diffMs;
          const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
          const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

          if (isGold) {
            setTimeRemainingText(
              locale === 'am' 
                ? `በ3 ቀን 1 ፖስት ብቻ መለቀቅ ይቻላል። ቀጣይ መፖሰት የሚችሉት ከ ${remainingHours} ሰዓት እና ${remainingMins} ደቂቃ በኋላ ነው።`
                : `Gold tier allows 1 post per 3 days. Next available in ${remainingHours}h ${remainingMins}m.`
            );
          } else {
            setTimeRemainingText(
              locale === 'am'
                ? `በቀን 1 ፖስት ብቻ መለቀቅ ይቻላል። ቀጣይ መፖሰት የሚችሉት ከ ${remainingHours} ሰዓት እና ${remainingMins} ደቂቃ በኋላ ነው።`
                : `Allows 1 post per day. Next available in ${remainingHours}h ${remainingMins}m.`
            );
          }
        } else {
          setTimeRemainingText(null);
        }
      }
    };

    checkLastPostFrequency();
  }, [isOpen, currentUser, cooldownHours, isGold, locale]);

  if (!isOpen) return null;

  const charCount = content.length;
  const isExceedingCharLimit = charCount > maxChars;
  const isTextEmpty = content.trim().length === 0;
  const isPostingBlocked = isBronzeOrSilver || Boolean(timeRemainingText) || isExceedingCharLimit || isTextEmpty;

  const handlePostSubmit = async () => {
    if (isPostingBlocked || isSubmitting || !currentUser) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // 1. Strict AI Content Moderation Check
    const moderation = await moderateText(content.trim());
    if (!moderation.approved) {
      setErrorMessage(
        locale === 'am'
          ? `⚠️ ጽሁፍዎ አልተፈቀደም፦ ${moderation.reason || 'ከቤተሰብ፣ ትዳር ወይም የገንዘብ አያያዝ ርዕስ ውጪ የሆኑ ወይም ያልተፈቀዱ ቃላትን ይዟል።'}`
          : `⚠️ Post rejected: ${moderation.reason || 'Content violates topic guidelines.'}`
      );
      setIsSubmitting(false);
      return;
    }

    // 2. Insert Post to Supabase (Text-Only Policy enforced)
    const { error } = await supabase.from('community_posts').insert({
      author_id: currentUser.id,
      content: content.trim(),
      topic: 'General',
      category: 'general',
      media_url: null, // Text-only policy
      media_type: 'text'
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setContent('');
    setIsSubmitting(false);
    onPostSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-accent">
                {locale === 'am' ? 'አዲስ የሀሳብ ፖስት አዘጋጅ' : 'Create Community Post'}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {userTier.toUpperCase()} TIER (TEXT-ONLY)
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-accent rounded-full hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">

          {/* User Profile Header */}
          <div className="flex items-center gap-3">
            <Image 
              src={currentUser?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} 
              alt="User Avatar" 
              width={48} 
              height={48} 
              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100" 
            />
            <div>
              <p className="font-bold text-accent text-sm">
                {currentUser?.profile?.full_name || 'Beteseb Member'}
              </p>
              <span className="text-[10px] text-gray-500 font-medium">
                {locale === 'am' ? 'በትዳር፣ ልጅ አስተዳደግና ቤተሰብ ርዕሶች ብቻ' : 'Marriage, Parenting & Family Topics Only'}
              </span>
            </div>
          </div>

          {/* Bronze & Silver Read-Only Restriction Warning */}
          {isBronzeOrSilver && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-700 text-xs font-bold">
              <Lock size={18} className="flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p>
                  {locale === 'am' 
                    ? 'የ Bronze እና Silver ደረጃ ተጠቃሚዎች መፖሰት አይችሉም (Read-only)።' 
                    : 'Bronze & Silver tiers are read-only.'}
                </p>
                <p className="text-[11px] opacity-80 mt-1 font-normal">
                  {locale === 'am' 
                    ? 'እባክዎ መታወቂያዎን በማረጋገጥ ደረጃዎን ወደ Gold ያሳድጉ።' 
                    : 'Please complete ID verification to upgrade to Gold tier and enable posting.'}
                </p>
              </div>
            </div>
          )}

          {/* Cooldown Frequency Notice */}
          {!isBronzeOrSilver && timeRemainingText && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3 text-blue-700 text-xs font-bold">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-blue-600" />
              <p>{timeRemainingText}</p>
            </div>
          )}

          {/* Error / AI Moderation Message */}
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-xs font-bold">
              {errorMessage}
            </div>
          )}

          {/* Text Area Creation Box */}
          <div className="relative">
            <textarea
              disabled={isBronzeOrSilver || Boolean(timeRemainingText) || isSubmitting}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className={`w-full bg-[#FDFBF9] border rounded-2xl p-5 text-accent text-base font-medium focus:ring-2 focus:ring-primary outline-none transition-all resize-none ${
                isExceedingCharLimit ? 'border-red-500 text-red-900 bg-red-50/20' : 'border-gray-200'
              }`}
              placeholder={
                isBronzeOrSilver
                  ? (locale === 'am' ? 'መፖሰት የሚችሉት ከGold ደረጃ በኋላ ነው።' : 'Posting disabled for Bronze/Silver tiers.')
                  : (locale === 'am' ? 'ስለ ትዳር፣ ልጅ አስተዳደግ ወይም የገንዘብ አያያዝ ሐሳብዎን እዚህ ይጻፉ...' : "Share your thoughts on marriage, parenting, or family finance...")
              }
            />

            {/* Real-time Character Counter Indicator */}
            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <span className="text-gray-400 font-medium text-[11px]">
                {locale === 'am' ? 'ጽሁፍ ብቻ (Text-only policy)' : 'Strict text-only policy'}
              </span>
              <span className={`font-black ${isExceedingCharLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {charCount}/{maxChars}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-gray-500 font-bold hover:bg-gray-200 text-xs uppercase tracking-widest transition-all"
          >
            {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
          </button>

          <button
            onClick={handlePostSubmit}
            disabled={isPostingBlocked || isSubmitting}
            className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
              isPostingBlocked || isSubmitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-primary text-white hover:shadow-primary/30 hover:scale-105 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <span>{locale === 'am' ? 'በመላክ ላይ...' : 'Posting...'}</span>
            ) : (
              <>
                <span>{locale === 'am' ? 'ፖስት አድርግ' : 'Post'}</span>
                <Send size={16} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
