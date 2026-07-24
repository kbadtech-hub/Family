'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Send, Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface IceBreakSectionProps {
  currentUser: any;
  userTier: string;
  locale?: string;
}

export default function IceBreakSection({
  currentUser,
  userTier = 'bronze',
  locale = 'am'
}: IceBreakSectionProps) {
  const [topic, setTopic] = useState<string>('');
  const [responses, setResponses] = useState<any[]>([]);
  const [newResponse, setNewResponse] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isGated = ['bronze', 'silver'].includes(userTier.toLowerCase());

  useEffect(() => {
    // Set daily topic
    const defaultTopic = locale === 'am'
      ? 'በትዳር ውስጥ የገንዘብ አያያዝ ግልጽነት እና የጋራ እቅድ እንዴት መዋቀር አለበት?'
      : 'How should financial transparency and joint planning be structured in marriage?';
    
    setTopic(defaultTopic);

    const fetchIceBreakResponses = async () => {
      const { data } = await supabase
        .from('ice_break_discussions')
        .select('*, profiles(full_name, avatar_url, role)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setResponses(data);
      }
    };

    fetchIceBreakResponses();
  }, [locale]);

  const handleSubmitResponse = async () => {
    if (!newResponse.trim() || isGated || isSubmitting || !currentUser) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('ice_break_discussions').insert({
      user_id: currentUser.id,
      topic: topic,
      content: newResponse.trim()
    });

    if (!error) {
      setNewResponse('');
      // Refetch
      const { data } = await supabase
        .from('ice_break_discussions')
        .select('*, profiles(full_name, avatar_url, role)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setResponses(data);
    }

    setIsSubmitting(false);
  };

  return (
    <section className="bg-gradient-to-br from-accent via-accent/95 to-slate-900 text-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/10 my-12 relative overflow-hidden">
      
      {/* Background Decorative Pattern */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-0 pointer-events-none" />

      <div className="relative z-10 space-y-8">
        
        {/* Topic Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 font-black text-[11px] uppercase tracking-widest">
            <Sparkles size={14} className="animate-spin" />
            <span>{locale === 'am' ? 'Ice Break — የዕለቱ የውይይት ርዕስ' : 'Ice Break — Daily Discussion Topic'}</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-black leading-snug tracking-tight text-white">
            &quot;{topic}&quot;
          </h3>

          <p className="text-sm text-gray-300 font-medium">
            {locale === 'am'
              ? 'በዚህ የውይይት ርዕስ ላይ መሳተፍ የሚችሉት ከ Gold Tier በላይ የሆኑ አባላት ብቻ ናቸው።'
              : 'Only Gold Tier and above members can participate in this daily discussion topic.'}
          </p>
        </div>

        {/* Input Box / Tier Lock Notice */}
        {isGated ? (
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
                <Lock size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-white">
                  {locale === 'am' ? 'በውይይቱ ለመሳተፍ ደረጃዎን ያሳድጉ' : 'Upgrade your tier to participate'}
                </p>
                <p className="text-xs text-gray-400">
                  {locale === 'am' ? 'የ Gold ደረጃ እና በላይ አባላት ብቻ አስተያየት መጻፍ ይችላሉ።' : 'Gold tier and above can reply.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder={locale === 'am' ? 'በዚህ ርዕስ ላይ ያዎትን ሐሳብ ይጻፉ...' : 'Share your opinion on this topic...'}
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/50 text-sm outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
            <button
              onClick={handleSubmitResponse}
              disabled={!newResponse.trim() || isSubmitting}
              className="px-8 py-4 bg-secondary text-accent font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{locale === 'am' ? 'ለክ' : 'Submit'}</span>
              <Send size={16} />
            </button>
          </div>
        )}

        {/* Community Discussion Feed */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={14} />
            <span>{locale === 'am' ? 'የአባላት አስተያየቶች' : 'Member Discussion'} ({responses.length})</span>
          </h4>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-none">
            {responses.map((resp) => (
              <div key={resp.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-secondary">
                    {resp.profiles?.full_name || 'Beteseb Member'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(resp.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-200 font-medium leading-relaxed">
                  {resp.content}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
