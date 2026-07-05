'use client';

import React, { useState, useEffect } from 'react';
import {
  Play, Lock, Unlock, Star, ArrowRight, BookOpen, ShieldCheck,
  GraduationCap, Sparkles, Heart, Users, Clock, Youtube,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

/* ─── Types ─── */
interface VideoLesson {
  id: string;
  title_am: string;
  title_en: string;
  description_am: string;
  description_en: string;
  youtube_url: string | null;
  thumbnail_url: string | null;
  duration_label: string;
  category: string;
  is_free: boolean;
  order_index: number;
}

/* ─── Free (intro) videos — shown to everyone ─── */
const FREE_VIDEOS: VideoLesson[] = [
  {
    id: 'free-1',
    title_am: 'እንኳን ወደ ቤተሰብ በደህና መጡ!',
    title_en: 'Welcome to Beteseb!',
    description_am: 'ወደ ቤተሰብ ዓለም አስደሳች ጉዞ ጀምሩ። ስለ ሲስተሙ ዓላማ እና ትልሙ በጥቂቱ ይስሙ።',
    description_en: 'Begin your journey with Beteseb. Learn about our mission, vision, and the community we are building for strong families.',
    youtube_url: null, // Admin sets via Admin Portal
    thumbnail_url: null,
    duration_label: '2 min',
    category: locale_cat('welcome'),
    is_free: true,
    order_index: 1,
  },
  {
    id: 'free-2',
    title_am: 'ቤተሰብ ምን ይሰጣል? — ሙሉ አገልግሎቶች',
    title_en: 'What Does Beteseb Offer? — Full Overview',
    description_am: 'ስለ ቤተሰብ አገልግሎቶች — ምርጫ ፕሮፋይሎች፣ ቀጥታ ምክር፣ ስጦታ ልውውጥ እና የሰርግ ዝግጅት ሞጁሎች — ሙሉ ቪዲዮ ማብራሪያ።',
    description_en: 'A complete overview of all Beteseb features: curated profiles, live counseling, gift exchange, wedding planner, and more.',
    youtube_url: null,
    thumbnail_url: null,
    duration_label: '5 min',
    category: locale_cat('overview'),
    is_free: true,
    order_index: 2,
  },
];

function locale_cat(key: string) { return key; } // placeholder for build

/* ─── Locked lesson catalog (10 modules) ─── */
const LOCKED_LESSONS_AM = [
  { id: 'l1', title: 'ጠቃሚ ዝጅነት — ትዳርን ለምን ቸኩለን?', desc: 'የትዳር ወቅት እና የዝግጁነት ምልክቶች ምን ናቸው? ልምዱ ካጋሩ ጋር ሚስጥር ቃለ-ምልልስ።', cat: '🎓 ቅድመ ትዳር ስልጠና', duration: '18 min', icon: '💍' },
  { id: 'l2', title: 'ዋጋ ስምምነት — ዘላቂ ትዳር ምስጢር', desc: 'ትዳርን ዘላቂ ያደርጉ ዋና ዋና የህይወት ግቦችን እና እሴቶችን ለይቶ ማወቅ።', cat: '🎓 ቅድመ ትዳር ስልጠና', duration: '22 min', icon: '⚖️' },
  { id: 'l3', title: 'ጤናማ ግንኙነት — ቋንቋ 5 የፍቅር ቋንቋዎች', desc: 'Gary Chapman ዘዴ መሰረት አምስቱን የፍቅር ቋንቋዎች ለኢትዮጵያ ባህል ተስማምቶ ።', cat: '❤️ ግንኙነት ልማት', duration: '25 min', icon: '🗣️' },
  { id: 'l4', title: 'ግጭት አፈታት — ያለ ቁጣ ማወያየት', desc: 'ጭቅጭቅ ሳይሆን መፍትሄ — ባል እና ሚስት እንዴት ማወያየት ይችላሉ? ተግባራዊ ቴክኒኮች።', cat: '❤️ ግንኙነት ልማት', duration: '20 min', icon: '🕊️' },
  { id: 'l5', title: 'ልጅ አስተዳደግ — ስሜታዊ ብልህነት', desc: 'ልጆቻቸውን ስሜታዊ ብልህ ያደርጓቸው ወላጆች ዘዴ — ዘመናዊ ሳይንስ + ኢትዮጵያ ባህል።', cat: '👨‍👩‍👧 ቤተሰብ ልማት', duration: '30 min', icon: '🧒' },
  { id: 'l6', title: 'ቤተሰብ ፋይናንስ — ያለ ጥጋ ቤት ማስተዳደር', desc: 'ትዳር ውስጥ ሀብትን አብሮ ለማቀድ፣ ዕዳን ለማስወገድ እና ለወደፊት ለመቆጠብ ቁልፍ ምክሮች።', cat: '💰 ቤተሰብ ፋይናንስ', duration: '28 min', icon: '💰' },
  { id: 'l7', title: 'ወሲባዊ ጤና — ቅዱስ ክብር ያለው ውይይት', desc: 'ትዳር ውስጥ ያለ ወሲባዊ ጤና እና ቅስቃሴ — ሃይማኖትን እና ሳይንስን ያጣመረ ምክር።', cat: '🏥 ጤና & ምክር', duration: '24 min', icon: '🌺' },
  { id: 'l8', title: 'ዳያስፖራ ትዳር — ሁለት ባህሎች አንድ ቤት', desc: 'ኢትዮጵያዊ ባህል እና የምዕራብ ሀገር አኗኗርን ያዋሃደ ዘላቂ ትዳር እንዴት ይፈጠራል?', cat: '🌍 ዳያስፖራ & ባህል', duration: '26 min', icon: '✈️' },
  { id: 'l9', title: 'ቤተሰብ ጸሎት — መንፈሳዊ ቤት መሰረት', desc: 'አብሮ መጸለይ፣ አብሮ ማምለክ — ጠንካራ መንፈሳዊ ቤት ለምን ቁልፍ ነው?', cat: '🙏 መንፈሳዊ ምክር', duration: '22 min', icon: '🙏' },
  { id: 'l10', title: 'ፈቃዳዊ ምርጫ — ወላጅ ፈቃድ ሚና', desc: 'ዘመናዊ ፍቅር እና ባህላዊ ፈቃድ — ወጣቱ ትውልድ ሁለቱን እንዴት ማስታረቅ ይቻለዋል?', cat: '🤝 ቤተሰብ & ፈቃድ', duration: '19 min', icon: '👨‍👩‍👦' },
];

const LOCKED_LESSONS_EN = [
  { id: 'l1', title: 'Are You Ready? — Signs of Marriage Readiness', desc: 'What are the real signs of readiness for marriage? An honest conversation with experienced couples.', cat: '🎓 Pre-Marriage Training', duration: '18 min', icon: '💍' },
  { id: 'l2', title: 'Values Alignment — Secret to a Lasting Marriage', desc: 'Identifying the core life goals and values that create lasting partnerships.', cat: '🎓 Pre-Marriage Training', duration: '22 min', icon: '⚖️' },
  { id: 'l3', title: 'Healthy Communication — The 5 Love Languages', desc: "Gary Chapman's method adapted for Ethiopian culture — discover your love language.", cat: '❤️ Relationship Development', duration: '25 min', icon: '🗣️' },
  { id: 'l4', title: 'Conflict Resolution — Discussing Without Anger', desc: 'Solutions not arguments — practical techniques for couples to resolve disputes peacefully.', cat: '❤️ Relationship Development', duration: '20 min', icon: '🕊️' },
  { id: 'l5', title: 'Child Raising — Emotional Intelligence', desc: 'How emotionally intelligent parents raise resilient children — modern science + Ethiopian wisdom.', cat: '👨‍👩‍👧 Family Development', duration: '30 min', icon: '🧒' },
  { id: 'l6', title: 'Family Finance — Managing a Home Together', desc: 'Key tips for planning wealth, eliminating debt, and saving for the future as a couple.', cat: '💰 Family Finance', duration: '28 min', icon: '💰' },
  { id: 'l7', title: 'Sexual Health — A Sacred, Respectful Discussion', desc: "Sexual health and wellness in marriage — advice that bridges faith and modern science.", cat: '🏥 Health & Counseling', duration: '24 min', icon: '🌺' },
  { id: 'l8', title: 'Diaspora Marriage — Two Cultures, One Home', desc: 'How to build a lasting marriage that blends Ethiopian heritage with a Western lifestyle.', cat: '🌍 Diaspora & Culture', duration: '26 min', icon: '✈️' },
  { id: 'l9', title: 'Family Prayer — Building a Spiritual Home', desc: 'Praying and worshiping together — why a strong spiritual foundation is key to a lasting home.', cat: '🙏 Spiritual Guidance', duration: '22 min', icon: '🙏' },
  { id: 'l10', title: 'Consent & Choice — The Role of Parental Approval', desc: 'Modern love and traditional consent — how young couples can bridge both worlds respectfully.', cat: '🤝 Family & Consent', duration: '19 min', icon: '👨‍👩‍👦' },
];

export default function ClassesPage() {
  const locale = useLocale();
  const [freeVideos, setFreeVideos] = useState<{ id: string; youtube_url: string | null; thumbnail_url: string | null }[]>([]);
  const isAm = locale === 'am';

  useEffect(() => {
    // Fetch free video YouTube links from admin-set content in Supabase
    const fetchFreeVideos = async () => {
      const { data } = await supabase
        .from('academy_videos')
        .select('id, youtube_url, thumbnail_url')
        .eq('is_free', true)
        .order('order_index')
        .limit(2);
      if (data && data.length > 0) setFreeVideos(data);
    };
    fetchFreeVideos();
  }, []);

  const lockedLessons = isAm ? LOCKED_LESSONS_AM : LOCKED_LESSONS_EN;

  const getYoutubeId = (url: string | null | undefined) => {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\n?#]+)/);
    return m ? m[1] : null;
  };

  return (
    <div className="bg-[#FDFBF9] min-h-screen" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Hero ── */}
      <section className="py-20 md:py-28 px-6 flex flex-col items-center text-center space-y-6 bg-[radial-gradient(circle_at_bottom_right,hsl(var(--primary))_0%,transparent_40%)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 rounded-full text-primary font-black text-[10px] tracking-widest uppercase z-10">
          <Sparkles className="w-3.5 h-3.5 fill-primary" />
          {isAm ? 'ቤተሰብ አካዳሚ' : 'Beteseb Academy'}
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-accent tracking-tight max-w-3xl leading-tight z-10">
          {isAm ? 'ጠቃሚ ትምህርት' : 'Life-Changing Education'} <br />
          <span className="text-primary italic">{isAm ? 'ቤቴ ያሳምር' : 'for Your Family'}</span>
        </h1>
        <p className="text-base md:text-lg text-gray-500 max-w-2xl leading-relaxed font-medium italic z-10">
          {isAm
            ? 'ስለ ትዳር፣ ስለ ልጅ አስተዳደግ እና ስለ ቤተሰብ ፋይናንስ ሙያዊ ምክሮችን ካለ ወጪ ጀምረህ ተማር። ሁለቱ ነጻ ቪዲዮዎች ሁሉም ሰው ያያቸዋል — ተጨማሪ ሞጁሎች ለደንበኞቻችን።'
            : 'Learn professional advice on marriage, child-raising, and family finance — two free intro videos for everyone, and a full curriculum unlocked for subscribers.'}
        </p>
        <Link href="/signup" className="z-10 inline-flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
          {isAm ? 'ቀጥል ወደ ሙሉ ትምህርት' : 'Unlock Full Curriculum'} <ArrowRight size={18} />
        </Link>
      </section>

      {/* ── FREE VIDEOS (2 open to all) ── */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Unlock size={16} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-accent tracking-tight">
              {isAm ? 'ነጻ የእንኳን ደህና መጡ ቪዲዮዎች' : 'Free Welcome Videos'}
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              {isAm ? 'ሁሉም ሰው ያያቸዋል — ምዝገባ አያስፈልግም' : 'Open to everyone — no sign-up required'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FREE_VIDEOS.map((video, idx) => {
            const dbVideo = freeVideos[idx];
            const ytId = getYoutubeId(dbVideo?.youtube_url ?? null);
            const thumb = dbVideo?.thumbnail_url;

            return (
              <div key={video.id} className="bg-white rounded-[2rem] shadow-lg shadow-primary/5 border border-gray-100 overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                {/* Video Embed / Placeholder */}
                <div className="relative w-full aspect-video bg-gradient-to-br from-accent/80 to-primary/60 flex items-center justify-center overflow-hidden">
                  {ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title={isAm ? video.title_am : video.title_en}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : thumb ? (
                    <img src={thumb} alt="thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white/80">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Youtube size={28} className="text-white" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest">
                        {isAm ? 'ቪዲዮ ሊንክ በቅርቡ ይጨመራል' : 'Video link coming soon'}
                      </p>
                      <p className="text-[10px] text-white/50 font-medium">
                        {isAm ? 'አድሚን ፖርታል ላይ YouTube ሊንክ ያስቀምጡ' : 'Set YouTube link via Admin Portal'}
                      </p>
                    </div>
                  )}
                  {/* Free badge */}
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                    {isAm ? '✅ ነጻ' : '✅ Free'}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <Clock size={10} /> {video.duration_label}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                    {isAm ? (idx === 0 ? '👋 አቀባበል' : '📖 አጠቃላይ እይታ') : (idx === 0 ? '👋 Welcome' : '📖 Platform Overview')}
                  </p>
                  <h3 className="text-base font-black text-accent tracking-tight mb-2">
                    {isAm ? video.title_am : video.title_en}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    {isAm ? video.description_am : video.description_en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LOCKED LESSONS CATALOG (10 modules) ── */}
      <section className="py-8 pb-24 px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Lock size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-accent tracking-tight">
                {isAm ? 'ሙሉ ሞጁሎች — ደንበኞች ብቻ' : 'Full Curriculum — Subscribers Only'}
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                {isAm ? 'ዘወትር አዳዲስ ትምህርቶች ይጨመራሉ' : 'New lessons added regularly'}
              </p>
            </div>
          </div>
          <Link href="/signup" className="hidden md:flex items-center gap-1.5 text-primary font-black text-[10px] uppercase tracking-widest hover:underline">
            {isAm ? 'ሁሉን ለቅቅ' : 'Unlock All'} <ExternalLink size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lockedLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="relative bg-white rounded-[1.5rem] border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden"
            >
              {/* Lock overlay */}
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[1.5rem] z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lock size={20} className="text-primary" />
                </div>
                <p className="text-xs font-black text-accent">
                  {isAm ? 'ለደንበኞች ብቻ' : 'Subscribers Only'}
                </p>
                <Link href="/signup" className="text-[10px] bg-primary text-white px-4 py-1.5 rounded-xl font-black uppercase tracking-wider">
                  {isAm ? 'ይቀላቀሉ' : 'Join Now'}
                </Link>
              </div>

              {/* Decorative circle */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/5 rounded-full" />

              {/* Icon */}
              <div className="text-3xl mb-3">{lesson.icon}</div>

              {/* Category badge */}
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] mb-1.5">{lesson.cat}</p>

              {/* Title */}
              <h3 className="text-sm font-black text-accent tracking-tight mb-2 leading-snug">{lesson.title}</h3>

              {/* Description */}
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium line-clamp-2">{lesson.desc}</p>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                  <Clock size={11} /> {lesson.duration}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                  <ShieldCheck size={11} /> {isAm ? 'ፕሬሚየም' : 'Premium'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-10 bg-gradient-to-r from-accent to-accent/80 text-white rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
              {isAm ? 'ሁሉም ትምህርቶች' : 'Full Access'}
            </p>
            <h3 className="text-2xl font-black tracking-tight">
              {isAm ? 'ሁሉንም ሞጁሎች ክፈቱ' : 'Unlock All 10+ Modules'}
            </h3>
            <p className="text-sm text-white/60 mt-1">
              {isAm ? 'ቤተሰብ ደንበኝነት ምዝገባ ካወጡ ሁሉም ሞጁሎች ይከፈቱልዎታል።' : 'Subscribe to Beteseb to get instant access to all modules and future lessons.'}
            </p>
          </div>
          <Link href="/signup" className="shrink-0 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/30 hover:scale-105 transition-transform flex items-center gap-2">
            {isAm ? 'አሁን ይቀላቀሉ' : 'Join Now'} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
