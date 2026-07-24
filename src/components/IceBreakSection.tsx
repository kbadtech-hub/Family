'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { moderateText } from '@/lib/moderation';
import { Sparkles, MessageCircle, Send, Lock, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface IceBreakSectionProps {
  currentUser: any;
  locale: string;
}

interface Discussion {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function IceBreakSection({ currentUser, locale }: IceBreakSectionProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topic, setTopic] = useState<string>('');

  // Gold+ Tier Check
  const userTier = (currentUser?.profile?.tier || 'bronze').toLowerCase();
  const isGoldPlus = 
    userTier === 'gold' || 
    userTier === 'platinum' || 
    userTier === 'diamond' || 
    userTier === 'vip' || 
    currentUser?.profile?.verification_status === 'verified' ||
    currentUser?.profile?.is_vip_member ||
    ['admin', 'super_admin', 'expert'].includes(currentUser?.profile?.role || '');

  useEffect(() => {
    // Set daily topic based on locale
    const dailyTopics: Record<string, string> = {
      am: "በትዳር ውስጥ የሚፈጠሩ አለመግባባቶችን በሰላም ለመፍታት ከሁሉም በላይ አስፈላጊው ባህሪ ምንድነው?",
      en: "What is the single most vital quality required to resolve marital conflicts peacefully?",
      om: "Gaa'ila keessatti walitti bu'iinsa karaa nagaatiin furuuf amalli baay'ee barbaachisaa ta'e maali?",
      ti: "ኣብ ሓዳር ዘጋጥሙ ዘይምስማዕናት ብሰላም ንምፍታሕ ካብ ኩሉ ንላዕሊ ኣገዳሲ ባህሪ እንታይ እዩ?",
      ar: "ما هي أهم صفة مطلوبة لحل الخلافات الزوجية بسلام؟",
      so: "Waa maxay tayada ugu muhiimsan ee looga baahan yahay xalinta khilaafaadka guurka ee nabad?"
    };
    setTopic(dailyTopics[locale] || dailyTopics['en']);

    fetchDiscussions();
  }, [locale]);

  const fetchDiscussions = async () => {
    const { data } = await supabase
      .from('ice_break_discussions')
      .select('*, profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setDiscussions(data as unknown as Discussion[]);
  };

  const handlePostResponse = async () => {
    if (!newResponse.trim() || !currentUser || !isGoldPlus || isSubmitting) return;

    setIsSubmitting(true);

    // AI Moderation
    const modResult = await moderateText(newResponse.trim());
    if (!modResult.approved) {
      alert(`⚠️ ${modResult.reason || 'Discussion response violates community standards.'}`);
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('ice_break_discussions').insert({
      user_id: currentUser.id,
      topic,
      content: newResponse.trim()
    });

    if (!error) {
      setNewResponse('');
      fetchDiscussions();
    }
    setIsSubmitting(false);
  };

  return (
    <section className="bg-gradient-to-br from-accent via-accent to-gray-900 text-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/10 relative overflow-hidden my-12">
      {/* Background Decor */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

      {/* Title */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Ice Break Section</span>
            <h3 className="text-2xl font-bold italic tracking-tight">
              {locale === 'am' ? 'የዕለቱ የውይይት ርዕስ' : 'Daily Discussion Topic'}
            </h3>
          </div>
        </div>
        <span className="text-xs font-bold bg-white/10 px-4 py-1.5 rounded-full border border-white/10 text-white/80">
          Gold+ Tier Exclusive
        </span>
      </div>

      {/* Topic Prompt */}
      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 mb-8 backdrop-blur-md">
        <p className="text-lg md:text-xl font-bold leading-relaxed italic text-secondary">
          &quot;{topic}&quot;
        </p>
      </div>

      {/* Input Box / Access Control */}
      {isGoldPlus ? (
        <div className="space-y-4 mb-10">
          <div className="flex gap-3">
            <input
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder={locale === 'am' ? 'በዚህ ርዕስ ላይ አስተያየትዎን ያካፍሉ...' : 'Share your wisdom on this topic...'}
              className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white placeholder:text-white/40 focus:ring-secondary focus:border-secondary transition-all"
            />
            <button
              onClick={handlePostResponse}
              disabled={!newResponse.trim() || isSubmitting}
              className="btn-primary bg-secondary hover:bg-secondary/90 text-accent font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all text-xs uppercase tracking-widest"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Posting...' : 'Share'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center gap-4 text-amber-200 mb-10">
          <Lock size={24} className="text-amber-400 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-300">Participation Gated (Gold Tier Required)</p>
            <p className="text-amber-200/80">
              Only Gold tier members and above can participate in the Daily Ice Break discussion. Upgrade your tier to share your perspective!
            </p>
          </div>
        </div>
      )}

      {/* Discussions Feed */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Member Perspectives</h4>
        {discussions.map((d) => (
          <div key={d.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex gap-4 items-start">
            <Image
              src={d.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'}
              alt="Avatar"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="font-bold text-xs text-white">{d.profiles?.full_name || 'Member'}</p>
                <span className="text-[10px] text-white/40 font-medium">
                  {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium leading-relaxed">{d.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
