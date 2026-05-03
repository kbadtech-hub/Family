'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, BookOpen, Clock, Tag, ChevronRight, GraduationCap } from 'lucide-react';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import PremiumGate from '@/components/PremiumGate';
import { useLocale, useTranslations } from 'next-intl';

interface Lesson {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  instructions: string;
  category: string;
  is_premium_only: boolean;
  created_at: string;
}

export default function LessonsView({ isPremium }: { isPremium: boolean }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('Academy');
  const locale = useLocale();

  useEffect(() => {
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setLessons(data);
        if (data.length > 0) setSelectedLesson(data[0]);
      }
      setLoading(false);
    };

    fetchLessons();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 bg-white rounded-[3rem] border border-gray-100">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <GraduationCap size={40} className="text-primary/20" />
        <p className="text-xs font-black text-primary/20 uppercase tracking-widest">{t('loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="bg-accent rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
         <div className="relative z-10 space-y-6 max-w-2xl">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.4em]">{t('tagline')}</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-none italic">
               {t('learnTitle')}
            </h3>
            <p className="text-white/50 text-lg font-medium leading-relaxed italic">
                {t('learnSub')}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Player */}
        <div className="lg:col-span-8 space-y-8">
          {selectedLesson ? (
            <>
              <YouTubeEmbed url={selectedLesson.youtube_url} />
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                     <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                       {selectedLesson.category}
                     </span>
                     <h1 className="text-3xl font-black text-accent tracking-tighter uppercase">{selectedLesson.title}</h1>
                  </div>
                  <div className="flex gap-4">
                     <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('duration')}</p>
                        <p className="text-sm font-bold text-accent italic">~15 min</p>
                     </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                   <h4 className="text-xs font-black text-accent uppercase tracking-widest border-b border-muted pb-2">{t('description')}</h4>
                   <p className="text-gray-500 leading-relaxed font-medium italic">{selectedLesson.description}</p>
                </div>

                {selectedLesson.instructions && (
                  <div className="p-8 bg-muted rounded-[2rem] border border-primary/5 space-y-4">
                     <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <BookOpen size={14} /> {t('actionableSteps')}
                     </h4>
                     <p className="text-sm text-accent font-bold leading-relaxed whitespace-pre-wrap">{selectedLesson.instructions}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center">
               <p className="text-gray-400 font-bold italic">{t('selectLesson')}</p>
            </div>
          )}
        </div>

        {/* Playlist */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xs font-black text-accent uppercase tracking-[0.2em] px-4">{t('availableLessons', { count: lessons.length })}</h3>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                className={`w-full text-left p-6 rounded-[2.5rem] border transition-all duration-300 group flex gap-4 items-center ${
                  selectedLesson?.id === lesson.id 
                    ? 'bg-primary border-primary shadow-xl shadow-primary/20 text-white' 
                    : 'bg-white border-gray-100 hover:border-primary/50 text-accent'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  selectedLesson?.id === lesson.id ? 'bg-white/20' : 'bg-muted group-hover:bg-primary/10'
                }`}>
                  <Play size={20} className={selectedLesson?.id === lesson.id ? 'fill-white' : 'fill-primary text-primary'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate uppercase tracking-tighter ${selectedLesson?.id === lesson.id ? 'text-white' : 'text-accent'}`}>
                    {lesson.title}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60`}>
                    {lesson.category}
                  </p>
                </div>
                <ChevronRight size={16} className={selectedLesson?.id === lesson.id ? 'text-white/50' : 'text-gray-300'} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
