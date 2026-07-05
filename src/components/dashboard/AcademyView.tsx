'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Play, BookOpen, Lock, Crown, ExternalLink, 
  GraduationCap, Sparkles, ChevronRight, Star,
  Users, Clock, Heart, Video
} from 'lucide-react';
import { useLocale } from 'next-intl';
import YouTubeEmbed from '@/components/YouTubeEmbed';

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
    await supabase.from('user_unlocked_videos').upsert({ user_id: user.id, video_id: mod.id });
    await supabase.from('profiles').update({ coins: userCoins - mod.coin_price }).eq('id', user.id);
    setUnlockedIds(prev => new Set([...prev, mod.id]));
    setUnlocking(null);
  };

  const freeModules = modules.filter(m => m.is_free);
  const courseModules = modules.filter(m => !m.is_free);

  return (
    <div className="space-y-8 pb-20">

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-accent via-accent/90 to-primary/80 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -mr-40 -mt-40" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">
              {am ? 'ቤተሰብ አካዳሚ' : 'Beteseb Academy'}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-tight">
            {am ? 'ትዳር፣ ቤተሰብ እና ፍቅር' : 'Marriage, Family & Love'}
          </h2>
          <p className="text-white/60 text-sm md:text-base font-medium leading-relaxed">
            {am 
              ? 'ለጤናማ ቤተሰብ ሕይወት የሚያዘጋጁ ፕሮፌሽናል ቪዲዮ ትምህርቶች።'
              : 'Professional video lessons preparing you for a healthy family life.'
            }
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5">
              <Video size={12} /> {am ? '12 ቪዲዮዎች' : '12 Videos'}
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5">
              <Users size={12} /> {am ? '2 ነጻ' : '2 Free'}
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5">
              <Crown size={12} className="text-yellow-400" /> {am ? 'ፕሪሚየም ተጠቃሚዎች ሁሉ ይክፈቱ' : 'Premium: Unlock All'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Free Welcome Videos ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Sparkles size={16} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-accent uppercase tracking-wider">
              {am ? 'ነጻ የአቀባበል ቪዲዮዎች' : 'Free Welcome Videos'}
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold">
              {am ? 'ሁሉም ሰው ሊያይ ይችላል' : 'Open to everyone'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {freeModules.map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod)}
              className={`text-left group relative p-5 rounded-[2rem] border-2 transition-all duration-300 ${
                activeModule.id === mod.id
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-white hover:border-primary/30 hover:shadow-md'
              }`}
            >
              <div className="absolute top-4 right-4">
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">
                  {am ? 'ነጻ' : 'FREE'}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${activeModule.id === mod.id ? 'bg-primary' : 'bg-muted'}`}>
                <Play size={20} className={activeModule.id === mod.id ? 'text-white fill-white' : 'text-primary fill-primary'} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                {am ? (CATEGORY_COLORS[mod.category] ? mod.category : 'Welcome') : mod.category}
              </p>
              <h4 className="font-black text-accent text-sm leading-tight">
                {am ? mod.title_am : mod.title}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium mt-2 leading-relaxed line-clamp-2">
                {am ? mod.description_am : mod.description}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Clock size={11} className="text-gray-300" />
                <span className="text-[10px] text-gray-400 font-bold">{mod.duration_minutes} min</span>
              </div>
            </button>
          ))}
        </div>

        {/* Video Player */}
        {activeModule.is_free && (
          <div className="bg-white rounded-[2rem] border border-border p-6 space-y-4 shadow-sm">
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
              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${CATEGORY_COLORS[activeModule.category] || 'bg-primary/10 text-primary'}`}>
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
      </div>

      {/* ── Course Module Library ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-accent uppercase tracking-wider">
                {am ? 'የትዳር ትምህርት ሙሉ ቤተ-ፍጥረት' : 'Full Course Library'}
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold">
                {am ? 'ፕሪሚየም ወይም ቤተሰብ ኮይን' : 'Premium or Beteseb Coins'}
              </p>
            </div>
          </div>
          {!isPremium && (
            <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1.5">
              <Crown size={12} className="text-yellow-600" />
              <span className="text-[10px] font-black text-yellow-700">
                {am ? 'ፕሪሚየም ሁሉን ይክፍታል' : 'Premium unlocks all'}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {courseModules.map((mod, idx) => {
            const accessible = canWatch(mod);
            return (
              <div
                key={mod.id}
                className={`relative flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all duration-300 ${
                  accessible
                    ? 'border-primary/20 bg-white cursor-pointer hover:shadow-lg hover:border-primary/40 group'
                    : 'border-border bg-white/50'
                }`}
                onClick={() => accessible && setActiveModule(mod)}
              >
                {/* Index */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black ${
                  accessible ? 'bg-primary text-white' : 'bg-muted text-gray-300'
                }`}>
                  {accessible ? <Play size={18} className="fill-white" /> : <Lock size={16} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${CATEGORY_COLORS[mod.category] || 'bg-gray-100 text-gray-500'}`}>
                      {mod.category}
                    </span>
                    {mod.is_free === false && !isPremium && (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        🪙 {mod.coin_price} {am ? 'ኮይን' : 'Coins'}
                      </span>
                    )}
                    {isPremium && (
                      <span className="text-[9px] font-black text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-md">
                        <Crown size={8} className="inline mr-0.5" />{am ? 'ፕሪሚየም' : 'Premium'}
                      </span>
                    )}
                  </div>
                  <p className={`font-black text-sm leading-tight ${accessible ? 'text-accent' : 'text-gray-300'}`}>
                    {am ? mod.title_am : mod.title}
                  </p>
                  <p className={`text-[11px] font-medium mt-0.5 line-clamp-1 ${accessible ? 'text-gray-400' : 'text-gray-200'}`}>
                    {am ? mod.description_am : mod.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-gray-300" />
                      <span className="text-[10px] text-gray-400 font-bold">{mod.duration_minutes} min</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                {accessible ? (
                  <ChevronRight size={18} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUnlock(mod); }}
                    disabled={userCoins < mod.coin_price || unlocking === mod.id}
                    className="shrink-0 bg-primary text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
                  >
                    {unlocking === mod.id 
                      ? '...' 
                      : userCoins >= mod.coin_price 
                        ? (am ? 'ክፈት' : 'Unlock') 
                        : (am ? 'ኮይን የለዎትም' : 'Need Coins')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active Course Video Player ── */}
      {!activeModule.is_free && canWatch(activeModule) && (
        <div className="bg-white rounded-[2rem] border border-border p-6 space-y-4 shadow-sm">
          {activeModule.youtube_url ? (
            <YouTubeEmbed url={activeModule.youtube_url} />
          ) : (
            <div className="aspect-video bg-gradient-to-br from-accent/5 to-primary/5 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Play size={28} className="text-primary fill-primary" />
              </div>
              <div className="text-center">
                <p className="font-black text-accent text-sm">{am ? activeModule.title_am : activeModule.title}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">{am ? 'ቪዲዮ በቅርቡ ይሰቀላል...' : 'Video link coming soon...'}</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${CATEGORY_COLORS[activeModule.category] || 'bg-primary/10 text-primary'}`}>
              {activeModule.category}
            </span>
            <h3 className="text-lg font-black text-accent italic">{am ? activeModule.title_am : activeModule.title}</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{am ? activeModule.description_am : activeModule.description}</p>
          </div>
        </div>
      )}

      {/* ── Upgrade CTA ── */}
      {!isPremium && (
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-[2rem] border-2 border-primary/20 p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
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
