'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  Send,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface Post {
  id: string;
  author_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    star_sign: string;
    is_verified: boolean;
  } | null;
}

export default function CommunityView({ isVerified = false }: { isVerified?: boolean }) {
  const t = useTranslations('community');
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('*, profiles(full_name, avatar_url, star_sign, is_verified)')
        .order('created_at', { ascending: false });
      
      if (data) setPosts(data as Post[]);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsSubmitting(true);
    
    // AI Moderation Simulation
    const forbiddenWords = ['hate', 'violence', 'scam', 'spam', 'rude'];
    const isUnsafe = forbiddenWords.some(word => newPostContent.toLowerCase().includes(word));
    
    if (isUnsafe) {
      alert(t('safetyAlert'));
      setIsSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase.from('community_posts').insert({
        author_id: user.id,
        content: newPostContent.trim(),
        is_approved: true // Auto-approving if "AI" check passes
      });

      if (!error) {
        setNewPostContent('');
        // Re-fetch using a separate function or just reload page
        window.location.reload(); 
      }
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="p-12 text-center text-foreground/40 font-black uppercase tracking-widest text-xs">{t('loadingFeed')}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
         <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">{t('communityTitle')}</h2>
            <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
               <ShieldCheck size={12} /> {t('moderated')}
            </div>
         </div>
      </div>

      {/* Daily Discussion Topic */}
      <div className="bg-primary text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
         <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full w-fit backdrop-blur-md border border-white/10">
               <Sparkles size={14} className="animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">{t('topicDay')}</span>
            </div>
            <h3 className="text-3xl font-black italic tracking-tighter leading-tight">
               {t('topicQuestion')}
            </h3>
            <p className="text-white/70 text-sm font-medium">{t('topicJoin')}</p>
            <button className="bg-white text-primary px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
               {t('joinBtn')}
            </button>
         </div>
      </div>

      {isVerified ? (
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          <div className="flex gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex-shrink-0 flex items-center justify-center text-primary">
              <User size={24} />
            </div>
            <form onSubmit={handlePostSubmit} className="flex-1 space-y-4">
              <textarea 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={t('newPostPlaceholder')} 
                className="w-full bg-background/30 border border-border rounded-[2rem] p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none text-foreground"
              />
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-widest">
                    <Sparkles size={12} className="animate-pulse" /> {t('aiFilter')}
                 </div>
                 <button 
                  type="submit"
                  disabled={isSubmitting || !newPostContent.trim()}
                  className="btn-primary py-3 px-8 text-xs flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                 >
                  <Send size={16} /> {isSubmitting ? t('checking') : t('postButton')}
                 </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-red-50 text-red-600 rounded-[2.5rem] border border-red-100 text-center">
          <ShieldCheck size={32} className="mx-auto mb-4" />
          <h4 className="font-black text-lg mb-2">{t('verifyToPostTitle')}</h4>
          <p className="text-sm opacity-80">{t('verifyToPostSub')}</p>
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between mb-6">
              <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-muted border border-border overflow-hidden">
                    {post.profiles?.avatar_url ? (
                      <Image 
                        src={post.profiles.avatar_url} 
                        alt={post.profiles.full_name || 'User Avatar'} 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary"><User size={24} /></div>
                    )}
                 </div>
                  <div>
                    <h4 className="font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-widest text-xs flex items-center gap-1">
                      {post.profiles?.full_name || t('anonymousUser')}
                      {post.profiles?.is_verified && <CheckCircle2 size={12} className="text-primary fill-primary/10" />}
                    </h4>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{post.profiles?.star_sign || t('memberBadge')}</p>
                  </div>
              </div>
            </div>

            <div className="mb-6 pl-4 border-l-4 border-primary/20">
               <p className="text-foreground/70 leading-relaxed italic text-lg font-medium">
                 &quot;{post.content}&quot;
               </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
