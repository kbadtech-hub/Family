'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  Send,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Camera
} from 'lucide-react';

interface Post {
  id: string;
  author_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'link' | 'none';
  profiles: {
    full_name: string;
    avatar_url: string;
    star_sign: string;
    is_verified: boolean;
    role: string;
  } | null;
}

export default function CommunityView({ 
  isVerified = false, 
  isPremium = false,
  isAdmin = false 
}: { 
  isVerified?: boolean, 
  isPremium?: boolean,
  isAdmin?: boolean 
}) {
  const t = useTranslations('Community');
  const locale = useLocale();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'none'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('*, profiles(full_name, avatar_url, star_sign, is_verified, role)')
        .order('created_at', { ascending: false });
      
      if (data) setPosts(data as any[]);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    if (!isPremium && !isAdmin) {
       alert(locale === 'am' ? "ይህ ፊቸር ለፕሪሚየም አባላት ብቻ ነው" : "This feature is for premium members only");
       return;
    }

    // Link Restriction Check
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-z]{2,})/gi;
    const hasLinks = urlRegex.test(newPostContent);

    if (hasLinks && !isAdmin) {
       alert(locale === 'am' ? "ሊንክ መጫን ለአድሚን ብቻ የተፈቀደ ነው" : "Posting links is allowed for Admins only");
       return;
    }

    setIsSubmitting(true);
    
    // AI Moderation Simulation
    const forbiddenWords = ['hate', 'violence', 'scam', 'spam', 'rude'];
    const isUnsafe = forbiddenWords.some(word => newPostContent.toLowerCase().includes(word));
    
    if (isUnsafe) {
      alert(t('safetyAlert') || "Your post contains unsafe content.");
      setIsSubmitting(false);
      return;
    }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('community_posts').insert({
        author_id: user.id,
        content: newPostContent.trim(),
        media_url: mediaUrl,
        media_type: mediaType === 'none' && hasLinks ? 'link' : mediaType,
        is_approved: true
      });

      if (!error) {
        setNewPostContent('');
        setMediaUrl(null);
        setMediaType('none');
        // Re-fetch posts
        const { data } = await supabase
          .from('community_posts')
          .select('*, profiles(full_name, avatar_url, star_sign, is_verified, role)')
          .order('created_at', { ascending: false });
        if (data) setPosts(data as any[]);
      }
    setIsSubmitting(false);
  };

  if (loading) return <div className="p-12 text-center text-foreground/40 font-black uppercase tracking-widest text-xs">{t('loadingFeed')}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
         <div className="flex items-center gap-4">
             <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">{t('title')}</h2>
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

      <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl relative overflow-hidden">
        {!isVerified && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
             <div className="space-y-4 max-w-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                   <ShieldCheck size={32} />
                </div>
                <h4 className="font-black text-lg text-accent italic">{t('verifyToPostTitle')}</h4>
                <p className="text-xs text-gray-500 font-medium">{t('verifyToPostSub')}</p>
                <button 
                  onClick={() => window.location.href = `/${locale}/onboarding`}
                  className="bg-primary text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                >
                  {locale === 'am' ? 'ፕሮፋይል ይሙሉ።' : 'Complete Profile'}
                </button>
             </div>
          </div>
        )}
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
              aria-label="Post content"
              className="w-full bg-background/30 border border-border rounded-[2rem] p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none text-foreground"
            />

            {mediaUrl && (
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-border">
                <img src={mediaUrl} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  type="button"
                  onClick={() => { setMediaUrl(null); setMediaType('none'); }}
                  aria-label="Remove media"
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-muted rounded-xl text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                  >
                    <Camera size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Photo</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    aria-label="Upload photo"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                          const ext = file.name.split('.').pop();
                          const path = `community/${user.id}-${Date.now()}.${ext}`;
                          const { error } = await supabase.storage.from('user_photos').upload(path, file);
                          if (!error) {
                            const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(path);
                            setMediaUrl(publicUrl);
                            setMediaType('image');
                          }
                      }
                      setIsUploading(false);
                    }}
                  />
                  <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-widest">
                      <Sparkles size={12} className="animate-pulse" /> {t('aiFilter')}
                  </div>
                </div>
                <button 
                type="submit"
                disabled={isSubmitting || isUploading || (!newPostContent.trim() && !mediaUrl)}
                className="btn-primary py-3 px-8 text-xs flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                <Send size={16} /> {isSubmitting ? t('checking') : t('postButton')}
                </button>
            </div>
          </form>
        </div>
      </div>

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

            {post.media_url && post.media_type === 'image' && (
               <div className="mb-6 rounded-3xl overflow-hidden border border-border shadow-lg">
                  <img src={post.media_url} className="w-full h-auto object-cover max-h-[500px]" alt="Post Media" />
               </div>
            )}

            {post.media_url && post.media_type === 'link' && (
               <div className="mb-6 p-6 bg-muted rounded-3xl border border-primary/10 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                     <LinkIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Shared Link</p>
                     <a href={post.media_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-accent hover:underline truncate block">
                        {post.media_url}
                     </a>
                  </div>
               </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
