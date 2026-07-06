'use client';

import React, { useEffect, useState } from 'react';
import { Heart, Target, Users, ShieldCheck, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import YouTubeEmbed from '@/components/YouTubeEmbed';

interface Post {
  id: string;
  title: string;
  content: string;
  video_url: string;
  image_url: string;
  category: string;
  created_at: string;
}

export default function AboutPage() {
  const t = useTranslations('About');
  const locale = useLocale();
  const [dynamicContent, setDynamicContent] = useState<Post[]>([]);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    const { data } = await supabase
      .from('site_posts')
      .select('*')
      .eq('category', 'about')
      .eq('is_published', true)
      .order('created_at', { ascending: true });

    if (data) setDynamicContent(data);
  };

  return (
    <div className="bg-[#FDFBF9] min-h-screen pb-20">
      {/* Hero Section */}
      <section className="py-32 px-6 flex flex-col items-center text-center space-y-8 bg-[radial-gradient(circle_at_top,_var(--secondary)_0%,_transparent_50%)] bg-opacity-10 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10 blur-3xl opacity-50" />
        <h1 className="text-5xl md:text-7xl font-black text-accent tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-700">
          {t('tagline')}
        </h1>
        <p className="text-xl text-gray-500 max-w-3xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {t('subtitle')}
        </p>
      </section>

      {/* Dynamic Sections from Admin */}
      {dynamicContent.length > 0 && (
        <section className="py-20 px-6 container mx-auto space-y-32">
          {dynamicContent.map((post, index) => (
            <div key={post.id} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-20 items-center`}>
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest">
                  <Sparkles size={14} />
                  <span>{t('ourStory')}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-accent tracking-tight leading-tight italic">
                  {post.title}
                </h2>
                <div className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>
              </div>
              <div className="flex-1 w-full">
                {post.video_url ? (
                  <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/20">
                    <YouTubeEmbed url={post.video_url} />
                  </div>
                ) : post.image_url ? (
                  <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/20 aspect-video">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-[3rem] flex items-center justify-center text-primary/20 border-2 border-dashed border-primary/10">
                    <Heart size={120} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Core Mission (Keep as static foundation) */}
      <section className="py-32 px-8 max-w-7xl mx-auto border-t border-gray-100 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-inner">
               <Target size={32} />
            </div>
            <h2 className="text-4xl font-black text-accent tracking-tighter uppercase italic">{t('missionTitle')}</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('missionDesc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {[
                  t('mission1'),
                  t('mission2'),
                  t('mission3'),
                  t('mission4')
               ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 font-bold text-accent p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                     <ShieldCheck className="text-primary" size={20} />
                     <span className="text-sm uppercase tracking-wide">{item}</span>
                  </div>
               ))}
            </div>
          </div>
          <div className="relative">
             <div className="w-full aspect-square bg-[#F5F2F0] rounded-[4rem] shadow-inner flex items-center justify-center overflow-hidden border border-gray-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-5" />
                <Globe size={180} className="text-primary/10 relative z-10 animate-pulse" />
             </div>
          </div>
        </div>
      </section>

      {/* Trust Ladder Section */}
      <section className="py-24 px-8 max-w-7xl mx-auto border-t border-gray-100 mt-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-primary uppercase tracking-[0.3em] text-[10px] font-black">
            {locale === 'am' ? 'የታማኝነት መሰላል ደረጃዎች' : 'The Beteseb Trust Ladder'}
          </h2>
          <h3 className="text-3xl font-black text-[#0F172A] italic tracking-tight">
            {locale === 'am' ? 'ባለ አምስት ደረጃ የታማኝነት ባጅ መለያዎች' : 'Five Distinct Levels of Trust Badges'}
          </h3>
          <p className="text-gray-500 max-w-xl mx-auto text-sm font-medium leading-relaxed">
            {locale === 'am' 
              ? 'ተጠቃሚዎች በመድረኩ ላይ በሚያደርጉት የተግባር እና የማንነት ማረጋገጫዎች ደረጃቸውን ከፍ በማድረግ ልዩ ልዩ የባጅ ምልክቶችን በፕሮፋይላቸው ላይ ያገኛሉ'
              : 'Members progress through verification stages to earn unique profile badges and boost recommendation visibility.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { 
              level: 'Level 0', 
              badge: locale === 'am' ? 'የብሮንዝ አይኮን' : 'Bronze Badge', 
              status: locale === 'am' ? 'ያልተረጋገቀ አባል' : 'Unverified Member', 
              desc: locale === 'am' ? 'መሰረታዊ ምዝገባ ብቻ ያጠናቀቀ። ሲስተሙን ከመመልከት ውጪ መልዕክት መለዋወጥ አይችልም' : 'Basic registration completed. View-only access, cannot exchange messages.',
              color: 'border-amber-700 bg-amber-50/50 text-amber-900' 
            },
            { 
              level: 'Level 1', 
              badge: locale === 'am' ? 'የሲልቨር አይኮን' : 'Silver Badge', 
              status: locale === 'am' ? 'መሰረታዊ የተረጋገቀ' : 'Basic Verified', 
              desc: locale === 'am' ? 'በሶሻል ሚዲያ የገባ ወይም የኢሜይል/ስልክ ማረጋገጫ ያደረገና የ 3 ሰከንድ የቀጥታ ቪዲዮ ሰልፊ የጸደቀለት' : 'Signed in via Google/Apple or verified email/phone plus completed a 3-second live selfie video.',
              color: 'border-slate-400 bg-slate-50/50 text-slate-800' 
            },
            { 
              level: 'Level 2', 
              badge: locale === 'am' ? 'የጎልድ አይኮን' : 'Gold Badge', 
              status: locale === 'am' ? 'በመታወቂያ የተረጋገቀ' : 'ID Verified', 
              desc: locale === 'am' ? 'በሕጋዊ የመንግስት መታወቂያ ወይም በፓስፖርት የተረጋገጠ አባል (በምዝገባ ወቅት ስኪፕ ማድረግ ይቻላል)' : 'Verified with official government ID or passport (can be skipped during onboarding).',
              color: 'border-yellow-500 bg-yellow-50/50 text-yellow-800' 
            },
            { 
              level: 'Level 3', 
              badge: locale === 'am' ? 'የፕላቲኒየም አይኮን' : 'Platinum Badge', 
              status: locale === 'am' ? 'በማህበረሰብ የተመሰከረለት' : 'Community Vouched', 
              desc: locale === 'am' ? 'በመታወቂያ የተረጋገቀ ሆኖ በመድረኩ ላይ ባሉ ሌሎች እሙናት አባላት ምስክርነት የተሰጠው' : 'ID-verified member who has been vouched for by other high-trust members of the community.',
              color: 'border-emerald-500 bg-emerald-50/50 text-emerald-950' 
            },
            { 
              level: 'Level 4', 
              badge: locale === 'am' ? 'የዳይመንድ አይኮን' : 'Diamond Badge', 
              status: locale === 'am' ? 'ከፍተኛ እምነት ያለው' : 'High-Trust Seal', 
              desc: locale === 'am' ? 'ሁሉንም ማረጋገጫዎች አሟልቶ ንቁ የፕሪሚየም ሰብስክሪፕሽን የከፈለ ወይም ከአስጠኚ/ቤተሰብ ጋር የተገናኘ' : 'Fully verified active premium subscriber or linked with a family elder/guardian.',
              color: 'border-indigo-600 bg-indigo-50/50 text-indigo-900' 
            }
          ].map((item, index) => (
            <div key={index} className={`p-6 rounded-[2rem] border-2 ${item.color} space-y-4 hover:scale-105 transition-all duration-300`}>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{item.level}</div>
              <h4 className="text-lg font-black italic">{item.badge}</h4>
              <p className="text-xs font-black uppercase tracking-wider">{item.status}</p>
              <p className="text-[11px] font-medium leading-relaxed opacity-80">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Meet the Values */}
      <section className="py-40 bg-accent text-white px-8 rounded-[5rem] mx-6">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
               <h3 className="text-sm font-black text-primary uppercase tracking-[0.4em] mb-4">{t('principlesTag')}</h3>
               <p className="text-4xl md:text-6xl font-black tracking-tight italic">{t('principlesTitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
               <div className="bg-white/5 p-12 rounded-[3rem] backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                    <Heart size={32} />
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">{t('value1Title')}</h4>
                  <p className="text-white/50 leading-relaxed font-medium">{t('value1Desc')}</p>
               </div>
               <div className="bg-white/5 p-12 rounded-[3rem] backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform">
                    <Users size={32} />
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">{t('value2Title')}</h4>
                  <p className="text-white/50 leading-relaxed font-medium">{t('value2Desc')}</p>
               </div>
               <div className="bg-white/5 p-12 rounded-[3rem] backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-8 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={32} />
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">{t('value3Title')}</h4>
                  <p className="text-white/50 leading-relaxed font-medium">{t('value3Desc')}</p>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-40 px-8 flex flex-col items-center text-center">
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-8">
            <Users size={12} />
            <span>{t('joinStats')}</span>
         </div>
         <h3 className="text-4xl md:text-7xl font-black text-accent tracking-tighter mb-12 leading-none italic max-w-4xl">{t('ctaTitle')}</h3>
         <Link href="/signup" className="bg-primary text-white text-xl py-6 px-20 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group">
            {t('ctaButton')} <ArrowRight className="group-hover:translate-x-3 transition-transform duration-500" size={24} />
         </Link>
      </section>
    </div>
  );
}

