'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Play, BookOpen, Lock, Crown, ExternalLink, 
  GraduationCap, Sparkles, ChevronRight, Star,
  Users, Clock, Heart, Video, ShieldCheck
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import BetesebCoinIcon from '@/components/BetesebCoinIcon';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface VideoItem {
  id: string;
  title: string;
  title_am: string;
  description: string;
  description_am: string;
  youtube_url: string;
  category: string;
  is_free: boolean;
  coin_price: number;
  order_index: number;
  duration_minutes: number;
}

/* ─── Static Fallback Course Modules ─────────────────────────────────── */
const STATIC_MODULES: VideoItem[] = [
  {
    id: 'mod-1', title: 'Welcome to Beteseb – Your Ethiopian Family Platform', title_am: 'እንኳን ወደ ቤተሰብ ተዎደቃችሁ',
    description: 'An introductory welcome video to the Beteseb platform, its values, and community vision.', description_am: 'ወደ ቤተሰብ ሲስተም ያልዎ አቀባበል ቪዲዮ ነው።',
    youtube_url: '', category: 'Welcome', is_free: true, coin_price: 0, order_index: 1, duration_minutes: 3
  },
  {
    id: 'mod-2', title: 'What is Beteseb & How It Works', title_am: 'ቤተሰብ ምንድነው? እንዴት ይሰራል?',
    description: 'A full overview of all features: matching, verification, gifts, academy, and counseling.', description_am: 'ሁሉም አገልግሎቶቻችን ምን ምን እንደሆኑ የሚገልጽ ቪዲዮ።',
    youtube_url: '', category: 'Welcome', is_free: true, coin_price: 0, order_index: 2, duration_minutes: 8
  },
  {
    id: 'mod-3', title: 'The Foundation of a Healthy Marriage', title_am: 'ጤናማ ትዳር መሰረቶች',
    description: 'What makes marriages last? Learn the key pillars of a strong, lasting family bond.', description_am: 'ጠንካራ ትዳር ለመጥረቅ ምን ያስፈልጋቸዋል?',
    youtube_url: '', category: 'Pre-Marriage', is_free: false, coin_price: 30, order_index: 3, duration_minutes: 20
  },
  {
    id: 'mod-4', title: 'Communication Skills for Couples', title_am: 'ለባልና ሚስት የሚሆን የግንኙነት ክህሎቶች',
    description: 'Master the art of deep, meaningful communication to prevent conflict and strengthen bonds.', description_am: 'ጥልቅ ግንኙነት ለማምጣት የሚረዱ ክህሎቶች።',
    youtube_url: '', category: 'Communication', is_free: false, coin_price: 30, order_index: 4, duration_minutes: 25
  },
  {
    id: 'mod-5', title: 'Understanding Cultural Expectations in Ethiopian Marriages', title_am: 'በኢትዮጵያ ትዳር ውስጥ ባህላዊ ይጠበቃሉ',
    description: 'How Ethiopian cultural values shape marriage expectations and how couples can navigate differences.', description_am: 'የኢትዮጵያ ባህላዊ እሴቶች ትዳርን እንዴት ይቀርፃሉ?',
    youtube_url: '', category: 'Culture', is_free: false, coin_price: 25, order_index: 5, duration_minutes: 18
  },
  {
    id: 'mod-6', title: 'Parenting & Child Development Essentials', title_am: 'ልጅ አስተዳደግ መሰረታዊ እውቀቶች',
    description: 'Build a nurturing environment for your children with proven parenting strategies.', description_am: 'ልጆቻቸው ጥሩ አካባቢ ለመፍጠር የሚረዱ ስልቶች።',
    youtube_url: '', category: 'Parenting', is_free: false, coin_price: 30, order_index: 6, duration_minutes: 22
  },
  {
    id: 'mod-7', title: 'Resolving Conflict Without Breaking the Bond', title_am: 'ችግሮችን ያለ ጠብ መፍታት',
    description: 'Practical conflict resolution tools that strengthen rather than weaken your relationship.', description_am: 'ጠብ ሳይፈጠር ልዩነቶችን ለመፍታት ተጠቃሚ የሚሆኑ መሳሪያዎች።',
    youtube_url: '', category: 'Conflict', is_free: false, coin_price: 25, order_index: 7, duration_minutes: 17
  },
  {
    id: 'mod-8', title: 'Financial Planning for the New Ethiopian Family', title_am: 'ለኢትዮጵያ ቤተሰብ የፋይናንስ እቅድ',
    description: 'Managing family finances, savings, and investment strategies tailored for Ethiopian couples.', description_am: 'ቤተሰብ ፋይናንስ እንዴት ማቀናጀት ይቻላል?',
    youtube_url: '', category: 'Finance', is_free: false, coin_price: 35, order_index: 8, duration_minutes: 28
  },
  {
    id: 'mod-9', title: 'Emotional Intelligence in Marriage', title_am: 'በትዳር ውስጥ ስሜታዊ ብልህነት',
    description: 'How emotional awareness and empathy transform your marriage into a safe, loving space.', description_am: 'ስሜትን መረዳት ትዳርን እንዴት ያሻሽላል?',
    youtube_url: '', category: 'Wellbeing', is_free: false, coin_price: 25, order_index: 9, duration_minutes: 15
  },
  {
    id: 'mod-10', title: 'Spirituality & Faith in the Ethiopian Household', title_am: 'ለኢትዮጵያ ቤተሰብ ሃይማኖት እና እምነት',
    description: 'The role of faith, prayer, and spiritual alignment in building a united household.', description_am: 'ሃይማኖት እና እምነት ቤትን ለማሳደግ ያላቸው ሚና።',
    youtube_url: '', category: 'Spirituality', is_free: false, coin_price: 20, order_index: 10, duration_minutes: 12
  }
];

const CATEGORY_COLORS: Record<string, string> = {
  'Welcome': 'bg-emerald-100 text-emerald-700',
  'Pre-Marriage': 'bg-rose-100 text-rose-700',
  'Communication': 'bg-blue-100 text-blue-700',
  'Culture': 'bg-amber-100 text-amber-700',
  'Parenting': 'bg-purple-100 text-purple-700',
  'Conflict': 'bg-orange-100 text-orange-700',
  'Finance': 'bg-teal-100 text-teal-700',
  'Wellbeing': 'bg-pink-100 text-pink-700',
  'Spirituality': 'bg-indigo-100 text-indigo-700',
};

/* ─── Component ──────────────────────────────────────────────────────── */
export default function AcademyView({ 
  isPremium = false, 
  userCoins = 0 
}: { 
  isPremium?: boolean; 
  userCoins?: number; 
}) {
  const t = useTranslations('Classes');
  const locale = useLocale();
  const am = locale === 'am';

  const [modules, setModules] = useState<VideoItem[]>(STATIC_MODULES);
  const [activeModule, setActiveModule] = useState<VideoItem>(STATIC_MODULES[0]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  /* Fetch video URLs from database if available */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('academy_videos')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (data && data.length > 0) {
        setModules(data);
        setActiveModule(data[0]);
      }
      setLoading(false);
    };
    load();
  }, []);

  /* Fetch user unlocked modules */
  useEffect(() => {
    const loadUnlocked = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_unlocked_videos')
        .select('video_id')
        .eq('user_id', user.id);
      if (data) setUnlockedIds(new Set(data.map((r: { video_id: string }) => r.video_id)));
    };
    loadUnlocked();
  }, []);

  const canWatch = (mod: VideoItem) => mod.is_free || isPremium || unlockedIds.has(mod.id);

  const handleUnlock = async (mod: VideoItem) => {
    if (userCoins < mod.coin_price) return;
    setUnlocking(mod.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUnlocking(null); return; }
    
    // 1. Record unlock video authorization
    const { error: unlockError } = await supabase.from('user_unlocked_videos').upsert({ user_id: user.id, video_id: mod.id });
    if (unlockError) {
      alert("Failed to unlock video: " + unlockError.message);
      setUnlocking(null);
      return;
    }
    
    // 2. Insert debit transaction into coin_transactions (Blueprint v4.0)
    // The DB trigger handles updating user_wallets.coin_balance automatically.
    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: -mod.coin_price,
      type: 'coin_transfer',
      note: `unlock_video_${mod.id}`
    });

    // 3. Mirror Course Unlock Payment to Master Ledger ───────────────────────
    try {
      const txRef = `COURSE-UNLOCK-${user.id.substring(0, 8)}-${mod.id.substring(0, 8)}-${Date.now()}`;
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      await supabase.from('financial_transactions').insert({
        tx_ref: txRef,
        user_id: user.id,
        user_name_snapshot: prof?.full_name || prof?.email || 'Beteseb User',
        user_email_snapshot: prof?.email || null,
        revenue_source: 'course_sale',
        payment_gateway: 'coin_balance',
        currency: 'COINS',
        gross_amount: mod.coin_price,
        gateway_fee: 0,
        net_amount: mod.coin_price,
        payment_status: 'completed'
      });
    } catch (logErr) {
      console.error('Failed to log course transaction:', logErr);
    }

    setUnlockedIds(prev => new Set([...prev, mod.id]));
    setUnlocking(null);
  };

  if (loading) {
    return <div className="p-12 text-center text-foreground/40 font-black uppercase tracking-widest text-xs">Loading...</div>;
  }

  return (
    <div className="space-y-12 pb-20" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero Banner (No Start Learning or Sign In buttons) */}
      <section className="py-12 md:py-20 px-6 flex flex-col items-center text-center space-y-6 bg-[radial-gradient(circle_at_bottom_right,_var(--primary)_0%,_transparent_40%)] bg-opacity-5 rounded-[3rem] bg-white border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[#FDFBF9] opacity-30" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 rounded-full text-primary font-black text-[10px] md:text-xs tracking-widest uppercase">
             <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 fill-primary" />
             {t('hero.tagline')}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-accent tracking-tight leading-tight uppercase">
            {t('hero.title1')} <br /> <span className="text-primary italic underline decoration-primary/20">{t('hero.title2')}</span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium italic">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Video Player Section (Only shown when activeModule is selected) */}
      {activeModule && (
        <div className="bg-white rounded-[3rem] border border-border p-6 space-y-4 shadow-xl max-w-4xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
          {activeModule.youtube_url ? (
            <YouTubeEmbed url={activeModule.youtube_url} />
          ) : (
            <div className="aspect-video bg-gradient-to-br from-accent/5 to-primary/5 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Play size={28} className="text-primary fill-primary" />
              </div>
              <div className="text-center">
                <p className="font-black text-accent text-sm">
                  {am ? activeModule.title_am : activeModule.title}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {am ? 'ቪዲዮ በቅርቡ ይሰቀላል...' : 'Video link coming soon...'}
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
              {activeModule.category}
            </span>
            <h3 className="text-lg font-black text-accent italic">
              {am ? activeModule.title_am : activeModule.title}
            </h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              {am ? activeModule.description_am : activeModule.description}
            </p>
          </div>
        </div>
      )}

      {/* Course Highlights / Curriculum (Featured Tables) */}
      <section className="py-8 max-w-7xl mx-auto">
         <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-6">
            <div className="space-y-4 text-center md:text-left">
               <h2 className="text-[10px] md:text-sm font-black text-primary uppercase tracking-[0.4em]">{t('curriculum')}</h2>
               <h3 className="text-3xl md:text-4xl font-black text-accent tracking-tighter uppercase">{t('featured')}</h3>
            </div>
            {!isPremium && (
              <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
                <Crown size={14} className="text-yellow-600 animate-pulse" />
                <span className="text-[10px] font-black text-yellow-700">
                  {am ? 'ፕሪሚየም ሁሉን ይክፍታል' : 'Premium unlocks all'}
                </span>
              </div>
            )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {modules.map((mod) => {
              const accessible = canWatch(mod);
              return (
                 <div
                    key={mod.id}
                    onClick={() => {
                      if (accessible) {
                        setActiveModule(mod);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      } else {
                        handleUnlock(mod);
                      }
                    }}
                    className={`bg-white p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden border border-primary/20 hover:border-primary/80 relative text-left cursor-pointer ${
                      !accessible && 'opacity-90'
                    }`}
                 >
                    <div className={`absolute top-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-24 h-24 bg-primary/5 rounded-full ${locale === 'ar' ? '-ml-12' : '-mr-12'} -mt-12 group-hover:scale-150 transition-transform duration-700`} />
                    
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner relative z-10 transition-all ${
                      accessible ? 'bg-muted text-primary group-hover:bg-primary group-hover:text-white' : 'bg-amber-50 text-amber-600'
                    }`}>
                       {unlocking === mod.id ? (
                         <span className="animate-spin font-black text-xs">...</span>
                       ) : accessible ? (
                         <Play size={32} className="fill-current" />
                       ) : (
                         <Lock size={28} />
                       )}
                    </div>
                    
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{mod.category || 'General'}</p>
                    <h3 className="text-2xl font-black text-accent mb-4 tracking-tighter uppercase line-clamp-1">
                      {am ? mod.title_am : mod.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-2 italic font-medium">
                      {am ? mod.description_am : mod.description}
                    </p>
                    
                    <div className="pt-6 border-t border-muted/50 flex items-center justify-between">
                       <div className="flex items-center gap-3 text-[10px] font-black text-accent italic uppercase tracking-widest">
                          <ShieldCheck size={14} className="text-primary" />
                          {mod.is_free ? (
                             <span className="text-emerald-600">{am ? 'ነጻ' : 'FREE'}</span>
                          ) : accessible ? (
                             <span className="text-primary">{am ? 'የተከፈተ' : 'UNLOCKED'}</span>
                          ) : (
                             <span className="text-amber-700 flex items-center gap-1">
                               <BetesebCoinIcon className="w-3.5 h-3.5" />
                               {mod.coin_price} {am ? 'ኮይን' : 'Coins'}
                             </span>
                          )}
                       </div>
                       <div className="p-3 bg-muted rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <ChevronRight size={18} />
                       </div>
                    </div>
                 </div>
              );
            })}
         </div>
      </section>

      {/* Counseling Feature (WISDOM CURRICULUM DETAILS) */}
      <section className="py-16 bg-accent text-white px-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--secondary)_0%,_transparent_70%)] opacity-10" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center relative z-10">
           <div className={`flex-1 space-y-6 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              <h2 className="text-[10px] md:text-sm font-black text-primary uppercase tracking-[0.4em]">{t('counseling.tagline')}</h2>
              <h3 className="text-3xl md:text-5xl font-black tracking-tight leading-tight italic">
                {t('counseling.title1')} <br /> <span className="text-primary">{t('counseling.title2')}</span>
              </h3>
              <p className="text-sm md:text-base text-white/50 leading-relaxed font-medium italic">
                 {t('counseling.subtitle')}
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                 <div className="space-y-2">
                    <p className="text-2xl md:text-3xl font-black text-primary">{t('counseling.stat1Value')}</p>
                    <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">{t('counseling.stat1Label')}</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-2xl md:text-3xl font-black text-primary">{t('counseling.stat2Value')}</p>
                    <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">{t('counseling.stat2Label')}</p>
                 </div>
              </div>
           </div>
           <div className="flex-1 w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] p-8 md:p-12 border border-white/10 shadow-2xl relative">
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center shadow-xl shadow-primary/30 animate-bounce">
                 <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-6 md:space-y-8">
                 <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                       <BookOpen className="text-primary w-5 h-5" />
                    </div>
                    <p className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">{t('counseling.curriculumTitle')}</p>
                 </div>
                 <div className="space-y-3">
                    {[
                      t('counseling.topics.t1'),
                      t('counseling.topics.t2'),
                      t('counseling.topics.t3'),
                      t('counseling.topics.t4')
                    ].map((f, i) => (
                       <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-[1.5rem] hover:bg-white/10 transition-all cursor-default border border-white/5">
                          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{f}</p>
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <Heart className="w-2 h-2 fill-white text-white" />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Upgrade Premium CTA card */}
      {!isPremium && (
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-[2rem] border-2 border-primary/20 p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left shadow-sm">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 text-primary">
            <Crown size={32} />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-accent text-lg italic">
              {am ? 'ሁሉንም ትምህርቶች ለማግኘት ፕሪሚየም ይሁኑ!' : 'Unlock All Lessons with Premium!'}
            </h4>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {am ? 'ፕሪሚየም አባላት ሁሉንም ቪዲዮዎች ያለምንም ክፍያ ሙሉ ይክፈቱ።' : 'Premium members access all video courses without coin payments.'}
            </p>
          </div>
          <button className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            {am ? 'ፕሪሚየም ሁን' : 'Go Premium'}
          </button>
        </div>
      )}
    </div>
  );
}
