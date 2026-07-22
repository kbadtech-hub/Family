'use client';

import React, { useState } from 'react';
import { Sparkles, Bell, X, Check, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FeatureLockModalProps {
  isOpen: boolean;
  featureKey: string;
  featureTitle?: string;
  locale?: string;
  onClose: () => void;
}

export default function FeatureLockModal({
  isOpen,
  featureKey,
  featureTitle,
  locale = 'am',
  onClose
}: FeatureLockModalProps) {
  const [notifyOptIn, setNotifyOptIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const isAm = locale === 'am';

  // Multi-lingual translations for System Branding
  const content = {
    am: {
      badge: 'በቅርብ ቀን የሚጀምር',
      title: 'በቅርብ ቀን ይጠብቁን! (Coming Soon)',
      message: 'ይህ አገልግሎት በቅርቡ የሚጀምር በመሆኑ በትግስት ጠብቁን።',
      toggleLabel: 'አገልግሎቱ ሲጀምር መልእክት (Notification) እንዲደርስዎት ይፈልጋሉ?',
      closeBtn: 'እሺ / ዝጋ',
      successNotice: 'እናመሰግናለን! አገልግሎቱ ሲጀምር ወዲያውኑ መልእክት ይደርስዎታል።'
    },
    om: {
      badge: 'Dhiyoo Dhiyaata',
      title: 'Dhiyotti Eegaa! (Coming Soon)',
      message: 'Tajaajilli kun dhiyotti waan eegaluuf maaloo obsaan nu eegaa.',
      toggleLabel: 'Tajaajilli kun yeroo eegalu beeksisni (Notification) akka isin ga'u ni barbaaduu?',
      closeBtn: 'Tole / Cufaa',
      successNotice: 'Galatoomaa! Tajaajilli yeroo eegalu beeksisni isiniif ni ergama.'
    },
    ti: {
      badge: 'ኣብ ቀረባ እዋን',
      title: 'ኣብ ቀረባ እዋን ተጸበዩና! (Coming Soon)',
      message: 'እዚ ኣገልግሎት ኣብ ቀረባ እዋን ዝጅምር ብምዃኑ ብትዕግስቲ ተጸበዩና።',
      toggleLabel: 'ኣገልግሎት ክጅምር ከሎ መልእኽቲ (Notification) ክበጽሓኩም ትደልዩዶ?',
      closeBtn: 'ሕራይ / ዐጽው',
      successNotice: 'የቐንየልና! ኣገልግሎት ክጅምር ከሎ ብኡንብኡ መልእኽቲ ክበጽሓኩም እዩ።'
    },
    so: {
      badge: 'Dhawaan Filo',
      title: 'Naga suga dhawaan! (Coming Soon)',
      message: 'Adeeggan waxa uu bilaaban doonaa dhawaan, fadlan si samir leh noo suga.',
      toggleLabel: 'Ma doonaysaa in aad hesho ogeysiis (Notification) markay bilaabato?',
      closeBtn: 'Haa / Xir',
      successNotice: 'Waad mahadsan tahay! Waxaad heshi doontaa ogeysiis markay bilaabato.'
    },
    ar: {
      badge: 'قريباً جداً',
      title: 'ترقبونا قريباً! (Coming Soon)',
      message: 'هذه الخدمة ستنطلق قريباً، يرجى الانتظار بصبور.',
      toggleLabel: 'هل ترغب في تلقي إشعار (Notification) عند إطلاق الخدمة؟',
      closeBtn: 'حسناً / إغلاق',
      successNotice: 'شكراً لك! سيصلك إشعار فور إطلاق الخدمة.'
    },
    en: {
      badge: 'Feature Coming Soon',
      title: 'Coming Soon! (በቅርብ ቀን ይጠብቁን!)',
      message: 'This service will be launching very soon. Thank you for your patience!',
      toggleLabel: 'Would you like to receive a notification (Notification) when this feature launches?',
      closeBtn: 'OK / Close',
      successNotice: 'Thank you! We will notify you as soon as this feature launches.'
    }
  };

  const t = content[locale as keyof typeof content] || content.am;

  const handleClose = async () => {
    if (notifyOptIn && !submitted) {
      setIsSubmitting(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('support_tickets').insert({
          user_id: user?.id || null,
          message: `[FEATURE_NOTIFY_OPTIN]\nFeature: ${featureKey}\nEmail: ${user?.email || 'Guest/Anon'}`,
          status: 'pending',
          ticket_number: `NOTIFY-${featureKey.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
        });
        setSubmitted(true);
      } catch (err) {
        console.error('Failed to log notification opt-in:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-accent/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl border border-primary/20 relative animate-in zoom-in-95 duration-300"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header Ribbon */}
        <div className="bg-accent text-white p-8 pb-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10" />
          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-5 right-5 text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>

          <div className="w-16 h-16 bg-primary/20 border border-primary/30 rounded-3xl flex items-center justify-center mx-auto mb-4 text-primary shadow-xl animate-bounce">
            <Lock size={30} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-widest mb-2">
            <Sparkles size={12} className="fill-primary" /> {t.badge}
          </div>

          <h3 className="text-2xl font-black italic tracking-tight text-white uppercase">
            {t.title}
          </h3>
          {featureTitle && (
            <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">
              [{featureTitle}]
            </p>
          )}
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          <p className="text-sm font-bold text-gray-600 text-center leading-relaxed italic">
            {t.message}
          </p>

          {/* Toggle Switch Card */}
          <div className="p-5 bg-[#F8FAFC] rounded-3xl border border-gray-150 space-y-3 transition-all hover:border-primary/30">
            <label className="flex items-start gap-4 cursor-pointer select-none">
              <div className="relative shrink-0 mt-0.5">
                <input 
                  type="checkbox"
                  checked={notifyOptIn}
                  onChange={(e) => setNotifyOptIn(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black text-accent block leading-snug">
                  {t.toggleLabel}
                </span>
                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                  <Bell size={10} className="text-primary" /> Instant Push/SMS Notification
                </span>
              </div>
            </label>
          </div>

          {/* Action Button */}
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="btn-primary w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            {t.closeBtn}
          </button>

          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-primary" /> Beteseb Platform Protection System
          </p>
        </div>
      </div>
    </div>
  );
}
