'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { 
  MessageCircle, 
  Heart, 
  ShieldAlert, 
  Send,
  Image as ImageIcon,
  Video,
  MoreHorizontal,
  Share2,
  CheckCircle2,
  Sparkles,
  BarChart2,
  Trash2,
  ChevronDown,
  X,
  Layout
} from 'lucide-react';

export default function CommunityPage() {
  const t = useTranslations('Community');
  const locale = useLocale();
  const router = useRouter();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [postCategory, setPostCategory] = useState('general');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [highlightedPost, setHighlightedPost] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    if (postId) {
      setHighlightedPost(postId);
      // Optional: scroll to post
      setTimeout(() => {
        document.getElementById(`post-${postId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1000);
    }
  }, []);

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    navigator.clipboard.writeText(url);
    alert(t('interactions.linkCopied') || "Link copied to clipboard!");
  };

  const categories = [
    { id: 'all', label: t('categories.all'), icon: MessageCircle },
    { id: 'success_story', label: t('categories.success_story'), icon: Heart },
    { id: 'lesson_learned', label: t('categories.lesson_learned'), icon: Sparkles },
    { id: 'expert_class', label: t('categories.expert_class'), icon: CheckCircle2 },
  ];

  useEffect(() => {
    const initPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
         setCurrentUser({ ...user, profile });
      }
      fetchPosts();
    };
    initPage();
  }, [activeCategory]);

  const fetchPosts = async () => {
    let query = supabase
      .from('community_posts')
      .select(`
        *,
        profiles(full_name, avatar_url, role),
        post_likes(count),
        post_comments(
          *,
          profiles(full_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (activeCategory !== 'all') {
      query = query.eq('category', activeCategory);
    }

    const { data, error } = await query;
    if (data) {
      setPosts(data);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || !currentUser) return;
    setIsSubmitting(true);
    
    let mediaUrl = null;
    let mediaType = 'image';

    if (mediaFile) {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('community_media')
        .upload(fileName, mediaFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('community_media')
          .getPublicUrl(fileName);
        mediaUrl = publicUrl;
        mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
      }
    }

    const isPremium = currentUser.profile?.is_premium || 
                     (currentUser.profile?.trial_ends_at && new Date(currentUser.profile.trial_ends_at) > new Date()) ||
                     ['admin', 'super_admin', 'expert'].includes(currentUser.profile?.role);

    if (!isPremium) {
       alert(locale === 'am' ? "ይህ ፊቸር ለፕሪሚየም አባላት ብቻ ነው" : "This feature is for premium members only");
       setIsSubmitting(false);
       return;
    }

    const { error } = await supabase.from('community_posts').insert({
       author_id: currentUser.id,
       content: newPost.trim(),
       category: postCategory,
       media_url: mediaUrl,
       media_type: mediaType,
       is_approved: currentUser.profile?.role === 'admin' || currentUser.profile?.role === 'expert'
    });
    
    if (!error) {
       setNewPost('');
       setMediaFile(null);
       setMediaPreview(null);
       fetchPosts();
    } else {
       alert(error.message);
    }
    setIsSubmitting(false);
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: currentUser.id
    });
    if (!error) fetchPosts();
    else {
      await supabase.from('post_likes').delete().match({ post_id: postId, user_id: currentUser.id });
      fetchPosts();
    }
  };

  const handleComment = async (postId: string, parentId: string | null = null) => {
    if (!commentText.trim() || !currentUser) return;
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: currentUser.id,
      parent_id: parent_id,
      content: commentText.trim()
    });
    if (!error) {
      setCommentText('');
      setCommentingOn(null);
      fetchPosts();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-primary text-white p-6 md:px-12 flex justify-between items-center shadow-lg sticky top-0 z-50">
         <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-black tracking-tighter decoration-transparent hover:scale-105 transition-transform flex items-center gap-2">
               <Heart size={28} className="fill-white" />
               <span>{locale === 'am' ? 'ቤተሰብ' : 'BETESEB'}</span>
            </Link>
         </div>
         <div className="flex gap-6 items-center">
            <Link href="/dashboard" className="hover:text-white/80 font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full transition-all">{locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard'}</Link>
         </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 py-10 px-4">
         <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 sticky top-28">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-2">{locale === 'am' ? 'ምድቦች' : 'Categories'}</h4>
               <nav className="space-y-2">
                  {categories.map((cat) => (
                     <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${
                           activeCategory === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-gray-500 hover:bg-muted'
                        }`}
                     >
                        <cat.icon size={18} />
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

         <main className="lg:col-span-6 space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden relative">
               <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex-shrink-0 shadow-inner" />
                  <div className="flex-1">
                     <textarea 
                        disabled={!currentUser}
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        className="w-full bg-muted/30 rounded-2xl p-6 border-none focus:ring-0 text-lg font-medium min-h-[120px] resize-none"
                        placeholder={currentUser ? t('newPostPlaceholder') : t('loginRequired')}
                     />
                     {mediaPreview && (
                        <div className="mt-4 relative rounded-2xl overflow-hidden border-2 border-primary/20 group">
                           {mediaFile?.type.startsWith('video') ? (
                              <video src={mediaPreview} controls className="w-full h-auto" />
                           ) : (
                              <img src={mediaPreview} className="w-full h-auto object-cover" alt="Preview" />
                           )}
                           <button onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors">
                              <X size={16} />
                           </button>
                        </div>
                     )}
                  </div>
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex gap-2">
                     <label className="p-3 bg-muted rounded-xl hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                        <ImageIcon size={20} />
                        <input type="file" accept="image/*" className="hidden" onChange={handleMediaSelect} />
                     </label>
                     <label className="p-3 bg-muted rounded-xl hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                        <Video size={20} />
                        <input type="file" accept="video/*" className="hidden" onChange={handleMediaSelect} />
                     </label>
                     <select 
                        value={postCategory} 
                        onChange={(e) => setPostCategory(e.target.value)}
                        className="bg-muted text-xs font-black uppercase tracking-widest border-none rounded-xl focus:ring-primary"
                     >
                        <option value="general">General</option>
                        <option value="success_story">Success Story</option>
                        <option value="lesson_learned">Lessons</option>
                        {currentUser?.profile?.role === 'expert' && <option value="expert_class">Expert Class</option>}
                     </select>
                  </div>
                  <button 
                     onClick={handlePost}
                     disabled={!currentUser || !newPost.trim() || isSubmitting}
                     className="btn-primary py-3 px-8 rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/30 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-xs"
                  >
                     {t('postButton')} <Send size={18} />
                  </button>
               </div>
            </div>

            <div className="space-y-8">
               {posts.map(post => (
                  <div 
                    key={post.id} 
                    id={`post-${post.id}`}
                    className={`bg-white rounded-[3rem] shadow-sm border overflow-hidden group hover:shadow-2xl transition-all duration-500 ${
                      highlightedPost === post.id ? 'border-primary border-4 scale-[1.02] shadow-2xl ring-4 ring-primary/10' : 'border-gray-100'
                    }`}
                  >
                     <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex gap-4 items-center">
                              <img src={post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                              <div>
                                 <div className="flex items-center gap-2">
                                    <p className="font-black text-accent">{post.profiles?.full_name}</p>
                                    {post.profiles?.role === 'expert' && (
                                       <span className="flex items-center gap-1 text-[10px] font-black bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20">
                                          <CheckCircle2 size={10} /> VERIFIED EXPERT
                                       </span>
                                    )}
                                 </div>
                                 <p className="text-xs text-gray-400 font-medium">{new Date(post.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <button className="p-3 text-gray-300 hover:text-accent transition-colors"><MoreHorizontal size={20} /></button>
                        </div>
                        <div className="space-y-4 mb-6">
                           <span className="inline-block text-[10px] font-black bg-primary/5 text-primary px-3 py-1 rounded-full uppercase tracking-widest border border-primary/10">
                              #{post.category?.replace('_', ' ') || 'general'}
                           </span>
                           <p className="text-gray-700 leading-relaxed text-lg font-medium">{post.content}</p>
                        </div>
                        {post.media_url && (
                           <div className="mb-6 rounded-[2rem] overflow-hidden border-4 border-muted shadow-inner">
                              {post.media_type === 'video' ? (
                                 <video src={post.media_url} controls className="w-full h-auto" />
                              ) : (
                                 <img src={post.media_url} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" alt="Post media" />
                              )}
                           </div>
                        )}
                        <div className="flex items-center justify-between border-t border-gray-0 pt-6">
                           <div className="flex items-center gap-6">
                              <button 
                                 onClick={() => handleLike(post.id)}
                                 className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group/like"
                              >
                                 <Heart size={20} className="group-hover/like:fill-red-500 transition-all" /> 
                                 <span className="font-bold text-sm">{post.post_likes?.[0]?.count || 0}</span>
                              </button>
                              <button 
                                 onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                                 className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
                              >
                                 <MessageCircle size={20} /> 
                                 <span className="font-bold text-sm">{post.post_comments?.length || 0}</span>
                              </button>
                           </div>
                           <button 
                              onClick={() => handleShare(post.id)}
                              className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest"
                           >
                              <Share2 size={18} /> {t('interactions.share')}
                           </button>
                        </div>
                        {commentingOn === post.id && (
                           <div className="mt-8 pt-8 border-t border-gray-50 space-y-6 animate-in slide-in-from-top-4 duration-300">
                              <div className="flex gap-3">
                                 <input 
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder={t('interactions.writeComment')}
                                    className="flex-1 bg-muted/50 border-none rounded-2xl px-6 py-3 font-medium focus:ring-primary"
                                 />
                                 <button 
                                    onClick={() => handleComment(post.id)}
                                    className="p-3 bg-primary text-white rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                 >
                                    <Send size={20} />
                                 </button>
                              </div>
                              <div className="space-y-4">
                                 {post.post_comments?.map((comment: any) => (
                                    <div key={comment.id} className="flex gap-4 group/comment">
                                       <img src={comment.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                                       <div className="flex-1 bg-muted/30 p-4 rounded-[1.5rem] relative">
                                          <p className="text-xs font-black text-accent mb-1">{comment.profiles?.full_name}</p>
                                          <p className="text-sm text-gray-600 font-medium">{comment.content}</p>
                                          <button className="mt-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">{t('interactions.reply')}</button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </main>

         <aside className="lg:col-span-3 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden group">
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
                     <button key={i} className="w-full p-4 rounded-2xl border border-gray-100 hover:border-secondary transition-all text-left relative overflow-hidden group/opt">
                        <div className="relative z-10 flex justify-between items-center font-bold text-sm">
                           <span>{opt.label}</span>
                           <span className="text-secondary">{opt.percent}%</span>
                        </div>
                        <div className="absolute inset-y-0 left-0 bg-secondary/5 transition-all group-hover/opt:bg-secondary/10" style={{ width: `${opt.percent}%` }} />
                     </button>
                  ))}
               </div>
            </div>

            <div className="bg-card p-8 rounded-[3rem] shadow-2xl border border-white/5">
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
