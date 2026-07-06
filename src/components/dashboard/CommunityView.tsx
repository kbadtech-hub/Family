'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import BetesebCoinIcon from '@/components/BetesebCoinIcon';
import { 
  Send,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Camera,
  Heart,
  ThumbsDown,
  MessageSquare,
  Share2,
  ChevronDown,
  MessageCircle,
  MoreVertical,
  Languages,
  BarChart2,
  MoreHorizontal
} from 'lucide-react';
import { translator, SupportedLocale } from '@/lib/translator';

interface Post {
  id: string;
  author_id: string;
  content: string;
  topic: string;
  category?: string;
  heart_count: number;
  dislike_count: number;
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

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  } | null;
  replies?: Comment[];
}

export default function CommunityView({ 
  isVerified = false, 
  isPremium = false,
  isAdmin = false,
  userCoins = 0
}: { 
  isVerified?: boolean, 
  isPremium?: boolean,
  isAdmin?: boolean,
  userCoins?: number
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
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [coinPostConfirm, setCoinPostConfirm] = useState(false);
  const COIN_PER_POST = 20;
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [userReactions, setUserReactions] = useState<Record<string, 'heart' | 'dislike' | null>>({});
  const pollRef = React.useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const pollOptions = [
      { label: "Daily Video Chat", percent: 45 },
      { label: "Trust & Transparency", percent: 82 },
      { label: "Future Plan", percent: 34 }
    ];
    pollOptions.forEach((opt, i) => {
      if (pollRef.current[i]) {
        pollRef.current[i]!.style.width = `${opt.percent}%`;
      }
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('community_posts')
        .select('*, profiles(full_name, avatar_url, star_sign, is_verified, role)')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      const { data: postsData } = await query;
      if (postsData) setPosts(postsData as any[]);

      if (user) {
        const { data: reactionsData } = await supabase
          .from('post_reactions')
          .select('post_id, type')
          .eq('user_id', user.id);
        
        const reactions: Record<string, 'heart' | 'dislike' | null> = {};
        reactionsData?.forEach(r => reactions[r.post_id] = r.type as any);
        setUserReactions(reactions);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [selectedCategory]);

  const fetchComments = async (postId: string) => {
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (data) {
      // Organize into nested structure
      const commentMap: Record<string, Comment> = {};
      const roots: Comment[] = [];
      
      data.forEach(c => {
        commentMap[c.id] = { ...c, replies: [] };
      });
      
      data.forEach(c => {
        if (c.parent_id && commentMap[c.parent_id]) {
          commentMap[c.parent_id].replies?.push(commentMap[c.id]);
        } else {
          roots.push(commentMap[c.id]);
        }
      });
      
      setPostComments(prev => ({ ...prev, [postId]: roots }));
    }
  };

  const handleReaction = async (postId: string, type: 'heart' | 'dislike') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentReaction = userReactions[postId];
    
    if (currentReaction === type) {
      // Remove reaction
      await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', user.id);
      setUserReactions(prev => ({ ...prev, [postId]: null }));
    } else {
      // Add or update reaction
      if (currentReaction) {
        await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', user.id);
      }
      await supabase.from('post_reactions').insert({ post_id: postId, user_id: user.id, type });
      setUserReactions(prev => ({ ...prev, [postId]: type }));
    }
    
    // Refresh post counts (simplified for demo, usually use RPC or triggers)
    const { data } = await supabase.from('community_posts').select('heart_count, dislike_count').eq('id', postId).single();
    if (data) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...data } : p));
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!commentContent.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      author_id: user.id,
      parent_id: replyingToId,
      content: commentContent.trim()
    });

    if (!error) {
      setCommentContent('');
      setReplyingToId(null);
      fetchComments(postId);
    }
  };

  const translatePost = async (post: Post) => {
    const translated = await translator.getOrTranslate(
      'community_posts',
      post.id,
      post.content,
      locale as SupportedLocale
    );
    
    setPosts(prev => prev.map(p => 
      p.id === post.id ? { ...p, content: translated } : p
    ));
  };

  const translateComment = async (comment: Comment) => {
    const translated = await translator.getOrTranslate(
      'post_comments',
      comment.id,
      comment.content,
      locale as SupportedLocale
    );
    
    setPostComments(prev => {
      const updated = { ...prev };
      for (const postId in updated) {
        updated[postId] = updated[postId].map(c => 
          c.id === comment.id ? { ...c, content: translated } : c
        );
      }
      return updated;
    });
  };

  const handleJoinDiscussion = () => {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };


  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    // Subscription check: allow premium, admin, or 20-coin payment
    if (!isPremium && !isAdmin) {
      if (userCoins < COIN_PER_POST) {
        alert(locale === 'am' 
          ? `ለማስጠቀም ${COIN_PER_POST} ቤተሰብ ኮይን ያስፈልጋቸዋል። ሰብስክሪፕሽን ወይም ኮይን ይግዙ።`
          : `You need ${COIN_PER_POST} Beteseb Coins to post. Please subscribe or buy coins.`);
        return;
      }
      if (!coinPostConfirm) {
        setCoinPostConfirm(true);
        return; // Wait for user to confirm coin spend
      }
    }

    // Link Restriction Check
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-z]{2,})/gi;
    const hasLinks = urlRegex.test(newPostContent);

    if (hasLinks && !isAdmin) {
       alert(t('adminOnly'));
       return;
    }

    setIsSubmitting(true);
    setCoinPostConfirm(false);
    
    // AI Moderation API Call
    try {
      const response = await fetch(`/${locale}/api/ai/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent.trim() })
      });
      const safety = await response.json();
      
      if (!safety.approved) {
        alert(`${t('unsafeContent')}: ${safety.reason}`);
        setIsSubmitting(false);
        return;
      }
    } catch (e) {
      console.error("AI Moderation failed, using fallback", e);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Deduct coins if not premium
    if (!isPremium && !isAdmin) {
      await supabase.from('profiles').update({ coins: userCoins - COIN_PER_POST }).eq('id', user.id);
    }

    const { error } = await supabase.from('community_posts').insert({
      author_id: user.id,
      content: newPostContent.trim(),
      topic: selectedTopic,
      category: selectedTopic,
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
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── Coin Confirmation Modal ── */}
      {coinPostConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-primary/20 text-center space-y-5">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
              <BetesebCoinIcon className="w-12 h-12" />
            </div>
            <div>
              <h4 className="font-black text-accent text-lg italic">
                {locale === 'am' ? `${COIN_PER_POST} ኮይን ይጠቀሙ?` : `Use ${COIN_PER_POST} Coins?`}
              </h4>
              <p className="text-xs text-gray-500 font-medium mt-2">
                {locale === 'am' 
                  ? `ይህ ፖስት ለማደርግ ${COIN_PER_POST} ቤተሰብ ኮይን ይቀነሳሉ። ቀሪ ኮይን: ${userCoins - COIN_PER_POST}`
                  : `This post will deduct ${COIN_PER_POST} Beteseb Coins. Remaining: ${userCoins - COIN_PER_POST}`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCoinPostConfirm(false)}
                className="flex-1 py-3 rounded-2xl border-2 border-border text-accent font-black text-xs uppercase tracking-wider hover:bg-muted transition-all"
              >
                {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                onClick={(e) => { setCoinPostConfirm(false); handlePostSubmit(e as any); }}
                className="flex-1 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                {locale === 'am' ? 'አረጋግጥ' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: 3-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2 md:px-4">
         {/* Left Sidebar: Categories & AI Topic */}
         <aside className="lg:col-span-3 space-y-4">
            <div className="bg-card p-6 rounded-[2.5rem] shadow-sm border border-primary/20 sticky top-28">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-2">{locale === 'am' ? 'ምድቦች' : 'Categories'}</h4>
               <nav className="space-y-2">
                  {[
                    { id: 'all', label: t('categories.all'), icon: MessageCircle },
                    { id: 'success_story', label: t('categories.success_story'), icon: Heart },
                    { id: 'lesson_learned', label: t('categories.lesson_learned'), icon: Sparkles },
                    { id: 'expert_class', label: t('categories.expert_class'), icon: CheckCircle2 }
                  ].map((cat) => (
                     <button 
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${
                           selectedCategory === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-gray-500 hover:bg-muted'
                        }`}
                     >
                        <cat.icon size={18} className={selectedCategory === cat.id ? 'fill-white' : ''} />
                        {cat.label}
                     </button>
                  ))}
               </nav>

               <div className="mt-10 p-6 bg-secondary/10 rounded-3xl border border-secondary/20">
                  <div className="flex items-center gap-2 text-secondary mb-2">
                     <Sparkles size={18} />
                     <span className="font-black text-xs uppercase tracking-widest">AI Topic of Day</span>
                  </div>
                  <p className="text-sm font-bold text-accent italic">"How can traditional Abushakir logic solve modern dating burnout?"</p>
               </div>
            </div>
         </aside>

         {/* Middle Column: Create Post & Post Feed */}
         <main className="lg:col-span-6 space-y-8">
            {/* Header banner */}
            <div className="flex justify-between items-center bg-card p-4 md:p-6 rounded-[2rem] border border-primary/20 shadow-sm">
               <div className="flex items-center gap-4">
                  <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase italic">{t('title')}</h2>
                  <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                     <ShieldCheck size={12} /> {t('moderated')}
                  </div>
               </div>
            </div>

            {/* Daily Discussion Topic */}
            <div className="bg-primary text-white p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden group border border-primary/20">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
               <div className="relative z-10 space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full w-fit backdrop-blur-md border border-white/10">
                     <Sparkles size={14} className="animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{t('topicDay')}</span>
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter leading-tight">
                     {t('topicQuestion')}
                  </h3>
                  <p className="text-white/70 text-xs font-medium">{t('topicJoin')}</p>
                  <button 
                    onClick={handleJoinDiscussion}
                    className="w-full md:w-auto bg-white text-primary px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                  >
                     {t('joinBtn')}
                  </button>
               </div>
            </div>

            {/* Post Submission Form Card */}
            <div className="bg-card p-8 rounded-[2.5rem] border border-primary/20 shadow-xl relative overflow-hidden">
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
                        {t('completeProfile')}
                      </button>
                   </div>
                </div>
              )}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              <div className="flex flex-col md:flex-row gap-4 relative z-10 items-center md:items-start">
                <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex-shrink-0 flex items-center justify-center text-primary">
                  <User size={24} />
                </div>
                <form onSubmit={handlePostSubmit} className="w-full flex-1 space-y-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                     {[
                       { id: 'general', label: t('categories.all').replace('All Posts', 'General').replace('ሁሉም ፖስቶች', 'ጠቅላላ') },
                       { id: 'success_story', label: t('categories.success_story') },
                       { id: 'lesson_learned', label: t('categories.lesson_learned') },
                       ...(isAdmin ? [{ id: 'expert_class', label: t('categories.expert_class') }] : [])
                     ].map(topic => (
                       <button
                         key={topic.id}
                         type="button"
                         onClick={() => setSelectedTopic(topic.id)}
                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedTopic === topic.id ? 'bg-primary text-white border-primary border-2 shadow-lg' : 'bg-muted text-gray-500 border-border hover:border-primary/50'}`}
                       >
                          {topic.label}
                       </button>
                     ))}
                  </div>
                  <textarea 
                    ref={textareaRef}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder={t('newPostPlaceholder')} 
                    aria-label="Post content"
                    className="w-full bg-background/30 border border-border rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none text-foreground"
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

                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3 bg-muted rounded-xl text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                        >
                          <Camera size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{t('photo')}</span>
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
                            
                            let uploadFile: File | Blob = file;
                            if (file.type.startsWith('image/')) {
                              try {
                                const compressed = await new Promise<Blob>((resolve) => {
                                  const reader = new FileReader();
                                  reader.readAsDataURL(file);
                                  reader.onload = (event) => {
                                    const img = new window.Image();
                                    img.src = event.target?.result as string;
                                    img.onload = () => {
                                      const canvas = document.createElement('canvas');
                                      let width = img.width;
                                      let height = img.height;
                                      
                                      const MAX_DIM = 800;
                                      if (width > MAX_DIM || height > MAX_DIM) {
                                        if (width > height) {
                                          height = Math.round((height * MAX_DIM) / width);
                                          width = MAX_DIM;
                                        } else {
                                          width = Math.round((width * MAX_DIM) / height);
                                          height = MAX_DIM;
                                        }
                                      }
                                      
                                      canvas.width = width;
                                      canvas.height = height;
                                      const ctx = canvas.getContext('2d');
                                      if (!ctx) {
                                        resolve(file);
                                        return;
                                      }
                                      ctx.drawImage(img, 0, 0, width, height);
                                      
                                      let quality = 0.7;
                                      const tryCompress = () => {
                                        canvas.toBlob((blob) => {
                                          if (!blob) {
                                            resolve(file);
                                            return;
                                          }
                                          if (blob.size > 50 * 1024 && quality > 0.1) {
                                            quality -= 0.15;
                                            tryCompress();
                                          } else {
                                            resolve(blob);
                                          }
                                        }, 'image/jpeg', quality);
                                      };
                                      tryCompress();
                                    };
                                    img.onerror = () => resolve(file);
                                  };
                                  reader.onerror = () => resolve(file);
                                });
                                uploadFile = compressed;
                              } catch (err) {
                                console.error("Compression failed", err);
                              }
                            }

                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                const path = `community/${user.id}-${Date.now()}.jpg`;
                                const { error } = await supabase.storage.from('user_photos').upload(path, uploadFile, {
                                  contentType: 'image/jpeg'
                                });
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
                      className="w-full md:w-auto btn-primary py-4 md:py-3 px-8 text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                      >
                      <Send size={16} /> {isSubmitting ? t('checking') : t('postButton')}
                      </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Posts Timeline Feed */}
            <div className="space-y-4 md:space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="bg-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-primary/20 hover:border-primary/60 shadow-sm hover:shadow-md transition-shadow group text-left">
                  <div className="flex justify-between mb-4 md:mb-6">
                    <div className="flex gap-4">
                       <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-muted border border-border overflow-hidden">
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
                          <div className="flex items-center gap-2 mt-1">
                             <p className="text-[10px] text-primary font-black uppercase tracking-widest">{post.profiles?.star_sign || t('memberBadge')}</p>
                             <span className="w-1 h-1 bg-border rounded-full" />
                             <p className="text-[8px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                {post.category === 'success_story' && t('categories.success_story')}
                                {post.category === 'lesson_learned' && t('categories.lesson_learned')}
                                {post.category === 'expert_class' && t('categories.expert_class')}
                                {post.category !== 'success_story' && post.category !== 'lesson_learned' && post.category !== 'expert_class' && (t(`topics.${post.topic || 'General'}`) || 'General')}
                             </p>
                          </div>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-primary transition-colors p-2"><MoreHorizontal size={16} /></button>
                  </div>

                  <div className="mb-4 pl-4 border-l-4 border-primary/20">
                     <p className="text-foreground/70 leading-relaxed italic text-lg font-medium">
                       &quot;{post.content}&quot;
                     </p>
                  </div>

                  <div className="mb-4 flex gap-2">
                     <button 
                        onClick={() => translatePost(post)}
                        className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-all"
                     >
                        <Languages size={12} /> {locale === 'am' ? 'ተርጉም' : 'Translate'}
                     </button>
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
                           <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{t('sharedLink')}</p>
                           <a href={post.media_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-accent hover:underline truncate block">
                              {post.media_url}
                           </a>
                        </div>
                     </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                     <div className="flex items-center gap-6">
                       <button 
                        onClick={() => handleReaction(post.id, 'heart')}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${userReactions[post.id] === 'heart' ? 'text-primary scale-110' : 'text-gray-400 hover:text-primary'}`}
                       >
                          <Heart size={16} className={userReactions[post.id] === 'heart' ? 'fill-primary' : ''} />
                          {post.heart_count || 0}
                       </button>
                       <button 
                        onClick={() => handleReaction(post.id, 'dislike')}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${userReactions[post.id] === 'dislike' ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-500'}`}
                       >
                          <ThumbsDown size={16} className={userReactions[post.id] === 'dislike' ? 'fill-red-500' : ''} />
                          {post.dislike_count || 0}
                       </button>
                       <button 
                        onClick={() => {
                          if (activeCommentPostId === post.id) setActiveCommentPostId(null);
                          else {
                            setActiveCommentPostId(post.id);
                            fetchComments(post.id);
                          }
                        }}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeCommentPostId === post.id ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
                       >
                          <MessageSquare size={16} />
                          {t('comments')}
                       </button>
                     </div>
                     <button 
                      onClick={() => {
                         navigator.clipboard.writeText(`${window.location.origin}/dashboard?post=${post.id}`);
                         alert(t('linkCopied'));
                      }}
                      className="text-gray-400 hover:text-primary transition-all p-2 rounded-full hover:bg-muted"
                     >
                        <Share2 size={16} />
                     </button>
                  </div>

                  {activeCommentPostId === post.id && (
                     <div className="mt-6 space-y-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex gap-4">
                           <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-primary">
                              <User size={16} />
                           </div>
                           <div className="flex-1 space-y-2">
                              {replyingToId && (
                                 <div className="flex items-center justify-between bg-primary/5 p-2 rounded-lg mb-2">
                                    <span className="text-[8px] font-black text-primary uppercase">{t('replyingTo')}</span>
                                    <button onClick={() => setReplyingToId(null)} className="text-primary"><X size={12} /></button>
                                 </div>
                              )}
                              <div className="flex gap-2">
                                 <input 
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder={t('commentPlaceholder')}
                                    className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary transition-all"
                                 />
                                 <button 
                                    onClick={() => handleCommentSubmit(post.id)}
                                    className="bg-primary text-white p-2 rounded-xl"
                                 >
                                    <Send size={16} />
                                 </button>
                              </div>
                           </div>
                        </div>
                        
                        {postComments[post.id] && (
                           <RecursiveComments comments={postComments[post.id]} t={t} setReplyingToId={setReplyingToId} translateComment={translateComment} locale={locale} />
                        )}
                     </div>
                  )}
                </article>
              ))}
            </div>
         </main>

         {/* Right Sidebar: Family Poll & Trending Tags */}
         <aside className="lg:col-span-3 space-y-8">
            <div className="bg-card p-8 rounded-[3rem] shadow-xl border border-primary/20 relative overflow-hidden group text-left">
               <div className="absolute top-0 left-0 w-2 h-full bg-secondary group-hover:w-4 transition-all" />
               <div className="flex items-center gap-3 mb-6">
                  <BarChart2 className="text-secondary" />
                  <h4 className="text-lg font-black text-accent italic">Family Poll</h4>
               </div>
               <p className="font-bold text-accent mb-6 leading-relaxed">"What is the most important trait for a long-distance relationship?"</p>
               <div className="space-y-3">
                  {[
                     { label: "Daily Video Chat", percent: 45 },
                     { label: "Trust & Transparency", percent: 82 },
                     { label: "Future Plan", percent: 34 }
                  ].map((opt, i) => (
                     <button key={i} type="button" className="w-full p-4 rounded-2xl border border-gray-100 hover:border-secondary transition-all text-left relative overflow-hidden group/opt">
                        <div className="relative z-10 flex justify-between items-center font-bold text-sm">
                           <span>{opt.label}</span>
                           <span className="text-secondary">{opt.percent}%</span>
                        </div>
                        <div 
                          ref={el => { pollRef.current[i] = el; }}
                          className="absolute inset-y-0 left-0 bg-secondary/5 transition-all group-hover/opt:bg-secondary/10" 
                        />
                     </button>
                  ))}
               </div>
            </div>

            <div className="bg-card p-8 rounded-[3rem] shadow-2xl border border-primary/20 text-left">
               <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">Trending Tags</h4>
               <div className="flex flex-wrap gap-2">
                  {['#Abushakir', '#SuccessStories', '#HabeshaWeddings', '#FamilyValues', '#EthiopianHeritage'].map(tag => (
                     <span key={tag} className="text-[10px] font-black bg-white/5 hover:bg-primary hover:text-white px-4 py-2 rounded-full cursor-pointer transition-all border border-white/5">{tag}</span>
                  ))}
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
}

const RecursiveComments = ({ 
  comments, 
  level = 0, 
  t, 
  setReplyingToId,
  translateComment,
  locale
}: { 
  comments: Comment[], 
  level?: number, 
  t: any, 
  setReplyingToId: (id: string) => void,
  translateComment: (comment: Comment) => void,
  locale: string
}) => {
  return (
    <div className={`space-y-4 ${level > 0 ? 'ml-8 border-l-2 border-primary/10 pl-4' : ''} text-left`}>
      {comments.map(comment => (
        <div key={comment.id} className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="flex items-start gap-3 bg-muted/30 p-4 rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-muted border border-border overflow-hidden flex-shrink-0">
              {comment.profiles?.avatar_url ? (
                <Image src={comment.profiles.avatar_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="m-auto text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-[10px] uppercase tracking-widest text-foreground">{comment.profiles?.full_name}</span>
                <span className="text-[8px] text-gray-400 font-bold uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">{comment.content}</p>
              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => setReplyingToId(comment.id)}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {t('reply')}
                </button>
                <button 
                  onClick={() => translateComment(comment)}
                  className="text-[10px] font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <Languages size={10} /> {locale === 'am' ? 'ተርጉም' : 'Translate'}
                </button>
              </div>
            </div>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <RecursiveComments comments={comment.replies} level={level + 1} t={t} setReplyingToId={setReplyingToId} translateComment={translateComment} locale={locale} />
          )}
        </div>
      ))}
    </div>
  );
};
