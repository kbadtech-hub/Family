'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MessageSquare, X, Send, Heart, Star, ShieldCheck, CreditCard } from 'lucide-react';

import { supabase } from '@/lib/supabase';

export default function AIChatbot() {
  const t = useTranslations('Chatbot');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot' | 'system'; text: string }[]>([
    { role: 'bot', text: t('welcome') }
  ]);
  const [input, setInput] = useState('');
  const [isEscalated, setIsEscalated] = useState(false);

  React.useEffect(() => {
    const checkVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      const { data } = await supabase.from('verifications').select('status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
      if (data?.status === 'verified') {
        setIsVerified(true);
      }
      setIsLoading(false);
    };
    checkVerification();
  }, []);

  const FAQ_RESPONSES: Record<string, string> = {
    'abushakir': t('faq.abushakir'),
    'pricing': t('faq.pricing'),
    'verified': t('faq.verified'),
    'hello': t('faq.hello'),
    'default': t('faq.default')
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    const userMsg = trimmedInput.toLowerCase();
    const newMessages = [...messages, { role: 'user' as const, text: trimmedInput }];
    setMessages(newMessages);
    setInput('');

    setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/chat', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ message: trimmedInput, locale })
        });
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'bot' as const, text: data.text || FAQ_RESPONSES['default'] }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'bot' as const, text: FAQ_RESPONSES['default'] }]);
      }
    }, 800);
  };

  const handleEscalate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsLoading(true);
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.text || 'Request for support';

    const { error } = await supabase.from('support_tickets').insert([{
       user_id: user.id,
       subject: 'AI Escalation',
       message: lastUserMessage,
       status: 'open'
    }]);

    if (!error) {
       setMessages(prev => [...prev, { role: 'system' as const, text: locale === 'am' ? 'ጥያቄዎ ወደ አድሚን ተልኳል! በቅርቡ ምላሽ ያገኛሉ።' : 'Ticket sent to Admin! You will get a reply soon.' }]);
       setIsEscalated(true);
    }
    setIsLoading(false);
  };

  if (isLoading) return null;

  return (
    <div className={`fixed bottom-8 ${locale === 'ar' ? 'left-8' : 'right-8'} z-[200]`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Floating Bubble */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Chat"
          className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce duration-300 group"
        >
          <MessageSquare className="group-hover:rotate-12 transition-transform" />
          <div className="absolute top-0 right-0 w-4 h-4 bg-accent border-2 border-white rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
          {/* Header */}
          <div className="bg-accent p-6 text-white flex justify-between items-center relative overflow-hidden">
            <div className={`absolute top-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-24 h-24 bg-primary/20 rounded-full ${locale === 'ar' ? '-ml-12' : '-mr-12'} -mt-12 blur-2xl`} />
            <div className="flex items-center gap-3 relative z-10">
               <div className="w-10 h-10 bg-primary/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Heart size={20} className="fill-primary" />
               </div>
               <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="font-bold text-sm">{t('botName')}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-black">{t('status')}</p>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Close Chat" className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
               <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-6 h-[400px] overflow-y-auto space-y-4 bg-muted/20 custom-scrollbar">
             {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      m.role === 'user' 
                         ? 'bg-primary text-white ' + (locale === 'ar' ? 'rounded-tl-none' : 'rounded-tr-none')
                         : m.role === 'system'
                         ? 'bg-accent/10 text-accent font-bold text-center w-full'
                         : 'bg-white text-accent ' + (locale === 'ar' ? 'rounded-tr-none' : 'rounded-tl-none') + ' border border-gray-50'
                   }`}>
                      {m.text}
                   </div>
                </div>
             ))}
             {messages.length > 3 && !isEscalated && (
                <div className="flex justify-center pt-2">
                   <button 
                      onClick={handleEscalate}
                      className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-6 py-3 rounded-2xl border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                   >
                      Speak to Human / ለአድሚን ይላኩ
                   </button>
                </div>
             )}
          </div>

          {/* Quick Buttons */}
          <div className="p-4 bg-white border-t border-gray-50 flex gap-2 overflow-x-auto no-scrollbar">
             {[
                { icon: Star, label: t('btn.abushakir'), key: 'abushakir' },
                { icon: CreditCard, label: t('btn.pricing'), key: 'pricing' },
                { icon: ShieldCheck, label: t('btn.verified'), key: 'verified' }
             ].map(btn => (
                <button 
                   key={btn.key}
                   onClick={() => setInput(btn.key)}
                   className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-[10px] font-bold text-accent hover:bg-primary/10 hover:text-primary transition-all uppercase tracking-widest"
                >
                   <btn.icon size={12} /> {btn.label}
                </button>
             ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-50 flex gap-2">
             <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('placeholder')}
                className="flex-1 bg-muted rounded-2xl px-4 py-2 text-sm border-transparent focus:ring-0 focus:border-transparent" 
             />
             <button 
                onClick={handleSend}
                aria-label="Send message"
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
             >
                <Send size={18} className={locale === 'ar' ? 'rotate-180' : ''} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
