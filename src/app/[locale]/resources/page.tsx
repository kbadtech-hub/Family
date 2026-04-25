'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { BookOpen, Clock, ArrowRight, Sparkles, Filter, Search } from 'lucide-react';
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

export default function ResourcesPage() {
  const t = useTranslations('Resources');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_posts')
      .select('*')
      .eq('is_published', true)
      .in('category', ['education', 'course'])
      .order('created_at', { ascending: false });

    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.category === filter;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent -z-10 blur-3xl opacity-50" />
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={14} />
            <span>{t('learningHub')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-accent italic tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {t.rich('heroTitle', {
              betterLife: (chunks) => <span className="text-primary italic">{chunks}</span>
            })}
          </h1>
          <p className="max-w-2xl mx-auto text-gray-500 text-lg md:text-xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {t('joinDesc')}
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="container mx-auto px-6 mb-16">
        <div className="bg-white p-4 rounded-[2rem] shadow-xl shadow-primary/5 border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex gap-2 p-1 bg-muted rounded-2xl w-full md:w-auto">
            {['all', 'education', 'course'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  filter === cat 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-400 hover:text-accent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-muted border-transparent rounded-2xl focus:bg-white focus:ring-primary focus:shadow-inner transition-all text-accent font-medium placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="container mx-auto px-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-[2.5rem]" />
                <div className="h-6 bg-gray-200 rounded-full w-3/4" />
                <div className="h-4 bg-gray-200 rounded-full w-full" />
                <div className="h-4 bg-gray-200 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
              <Filter size={32} />
            </div>
            <h3 className="text-2xl font-bold text-accent mb-2">{t('noMatch')}</h3>
            <p className="text-gray-500">{t('noMatchSubtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredPosts.map((post) => (
              <div 
                key={post.id} 
                className="group flex flex-col bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 hover:-translate-y-2"
              >
                {/* Media Section */}
                <div className="relative">
                  {post.video_url ? (
                    <YouTubeEmbed url={post.video_url} />
                  ) : (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={post.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop'} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                    </div>
                  )}
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em] shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-10 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(post.created_at).toLocaleDateString()}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="flex items-center gap-1"><BookOpen size={12} /> {post.category === 'course' ? 'Curriculum' : 'Guide'}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-accent leading-tight mb-4 group-hover:text-primary transition-colors duration-500">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 line-clamp-3 leading-relaxed mb-8 flex-1">
                    {post.content}
                  </p>
                  <button className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-primary group/btn overflow-hidden">
                    <span className="relative z-10">{t('readCollection')}</span>
                    <ArrowRight className="group-hover/btn:translate-x-2 transition-transform duration-300" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 mt-32">
        <div className="relative bg-accent rounded-[4rem] p-12 md:p-20 overflow-hidden text-center text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full -ml-48 -mb-48" />
          
          <h2 className="text-4xl md:text-5xl font-black italic mb-6 relative z-10">
            {t.rich('deepLearn', {
              deeply: (chunks) => <span className="text-primary italic">{chunks}</span>
            })}
          </h2>
          <p className="max-w-xl mx-auto text-gray-400 text-lg mb-10 relative z-10">
            {t('joinDesc')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <button className="px-10 py-5 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
              Join Community
            </button>
            <button className="px-10 py-5 bg-white/10 backdrop-blur-md text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
              Browse Courses
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
