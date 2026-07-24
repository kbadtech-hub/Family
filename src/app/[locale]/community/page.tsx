'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { 
  MessageCircle, 
  Heart, 
  ThumbsDown,
  Repeat,
  Send,
  MoreHorizontal,
  Share2,
  CheckCircle2,
  Sparkles,
  BarChart2,
  X,
  Languages,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { translator, SupportedLocale } from '@/lib/translator';
import PostCreationModal from '@/components/PostCreationModal';
import IceBreakSection from '@/components/IceBreakSection';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_verified?: boolean;
  is_vip_member?: boolean;
  premium_until?: string;
  verification_status?: string;
}

interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: Profile;
}

interface CommunityPost {
  id: string;
  author_id: string;
  content: string;
  category: string;
  media_url: string | null;
  media_type: string;
  created_at: string;
  is_approved: boolean;
  is_ai_generated: boolean;
  dislike_count?: number;
  profiles: Profile;
  post_likes: { count: number }[];
  post_comments: PostComment[];
  repost_count?: number;
}

interface CommunityUser {
  id: string;
  email?: string;
  profile: Profile;
}

function CommunityContent() {
  const t = useTranslations('Community');
  const locale = useLocale();
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [userTier, setUserTier] = useState<string>('bronze');
  const [activeCategory, setActiveCategory] = useState('all');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const [highlightedPost, setHighlightedPost] = useState<string | null>(searchParams.get('post'));
  const [aiTopic, setAiTopic] = useState<string | null>(null);

  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId) {
      setTimeout(() => {
        document.getElementById(`post-${postId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 800);
    }
  }, [searchParams]);

  const handleShare = (postId: string) => {
    const deepLinkUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Beteseb Community Post',
        text: 'የBeteseb ማህበረሰብ ፖስትን ይመልከቱ (Check out this post on Beteseb):',
        url: deepLinkUrl
      }).catch(() => {
        navigator.clipboard.writeText(deepLinkUrl);
      });
    } else {
      navigator.clipboard.writeText(deepLinkUrl);
      setShareToast(locale === 'am' ? 'የፖስቱ Deep Link ተገልብጧል!' : 'Post Deep Link copied to clipboard!');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  const handleRepost = async (postId: string) => {
    if (!currentUser) return;

    const { error } = await supabase.from('post_reposts').insert({
      post_id: postId,
      user_id: currentUser.id
    });

    if (!error) {
      setShareToast(locale === 'am' ? 'ፖስቱ በድጋሚ ተለጥፏል (Reposted to your friends)!' : 'Post successfully reposted!');
      setTimeout(() => setShareToast(null), 3000);
      fetchPosts();
    } else {
      await supabase.from('post_reposts').delete().match({ post_id: postId, user_id: currentUser.id });
      fetchPosts();
    }
  };

  const handleDislike = async (postId: string) => {
    if (!currentUser) return;

    const { error } = await supabase.from('post_reactions').insert({
      post_id: postId,
      user_id: currentUser.id,
      reaction_type: 'dislike'
    });

    if (!error) {
      fetchPosts();
    } else {
      await supabase.from('post_reactions').delete().match({ post_id: postId, user_id: currentUser.id, reaction_type: 'dislike' });
      fetchPosts();
    }
  };

  const categories = [
    { id: 'all', label: t('categories.all'), icon: MessageCircle },
    { id: 'success_story', label: t('categories.success_story'), icon: Heart },
    { id: 'lesson_learned', label: t('categories.lesson_learned'), icon: Sparkles },
    { id: 'expert_class', label: t('categories.expert_class'), icon: CheckCircle2 },
  ];

  const fetchPosts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let blockedIds: string[] = [];
    if (user) {
      const { data: blockedData } = await supabase
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
      blockedIds = (blockedData || []).map(b => b.blocker_id === user.id ? b.blocked_id : b.blocker_id);
    }

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        profiles(full_name, avatar_url, role, verification_status),
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

    if (blockedIds.length > 0) {
      query = query.not('author_id', 'in', `(${blockedIds.join(',')})`);
    }

    const { data } = await query;
    if (data) {
      const filteredData = data.map((post: any) => {
        if (post.post_comments) {
          post.post_comments = post.post_comments.filter((comment: any) => !blockedIds.includes(comment.author_id));
        }
        return post;
      });
      setPosts(filteredData as unknown as CommunityPost[]);
    }
  }, [activeCategory]);

  const fetchAiTopic = useCallback(async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('content')
      .eq('is_ai_generated', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setAiTopic(data.content);
    }
  }, []);

  useEffect(() => {
    const initPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
         setCurrentUser({ ...user, profile: profile as Profile });

         // Resolve User Tier
         const { data: tierLog } = await supabase
           .from('user_reward_tiers')
           .select('tier')
           .eq('user_id', user.id)
           .order('awarded_at', { ascending: false })
           .limit(1)
           .maybeSingle();

         if (tierLog?.tier) {
           setUserTier(tierLog.tier);
         } else if (profile?.is_vip_member) {
           setUserTier('vip');
         } else if (profile?.verification_status === 'verified') {
           setUserTier('gold');
         } else if (profile?.onboarding_completed) {
           setUserTier('silver');
         } else {
           setUserTier('bronze');
         }
      }
      fetchPosts();
      fetchAiTopic();
    };
    initPage();
  }, [fetchPosts, fetchAiTopic]);

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
      parent_id: parentId,
      content: commentText.trim()
    });
    if (!error) {
      setCommentText('');
      setCommentingOn(null);
      fetchPosts();
    }
  };

  const translatePost = async (post: CommunityPost) => {
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

  const translateComment = async (comment: PostComment) => {
    const translated = await translator.getOrTranslate(
      'post_comments',
      comment.id,
      comment.content,
      locale as SupportedLocale
    );
    
    setPosts(prev => prev.map(p => ({
      ...p,
      post_comments: p.post_comments?.map(c => 
        c.id === comment.id ? { ...c, content: translated } : c
      )
    })));
  };

  const pollRef = useRef<(HTMLDivElement | null)[]>([]);

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

  return (
    <div className="min-h-screen bg-[#FDFBF9]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-20 right-6 z-[200] bg-accent text-white px-6 py-4 rounded-2xl shadow-2xl border border-primary/30 font-bold text-xs animate-in slide-in-from-top duration-300">
          {shareToast}
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 py-10 px-4">
         
         {/* Left Sidebar: Categories Navigation */}
         <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 sticky top-28">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-2">
                 {locale === 'am' ? 'ምድቦች' : 'Categories'}
               </h4>
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
                     <span className="font-black text-xs uppercase tracking-widest">
                       {locale === 'am' ? 'የዕለቱ የAI መወያያ አርዕስት' : 'AI Topic of the Day'}
                     </span>
                  </div>
                  <p className="text-sm font-bold text-accent italic">
                    &quot;{aiTopic || (locale === 'am' ? 'ባህላዊው የአቡሻኪር የቀን አቆጣጠር ዘመናዊ የፍቅር ግንኙነት ድካምን እንዴት ሊፈታ ይችላል?' : 'How can traditional Abushakir logic solve modern dating burnout?')}&quot;
                  </p>
               </div>
            </div>
         </aside>

         {/* Center Feed: Post Creation Trigger & News Feed */}
         <main className="lg:col-span-6 space-y-8">
            
            {/* Facebook-Style Creation Input Box (Feed Header Trigger) */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-4">
                <Image 
                  src={currentUser?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} 
                  alt="User Avatar" 
                  width={48} 
                  height={48} 
                  className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shadow-sm" 
                />
                
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex-1 bg-[#F8F4F1] hover:bg-gray-200/80 rounded-2xl px-6 py-4 text-left text-gray-500 font-medium text-sm transition-all flex items-center justify-between group"
                >
                  <span>
                    {currentUser 
                      ? (locale === 'am' ? 'ስለ ትዳር፣ ልጅ አስተዳደግና ቤተሰብ ሐሳብዎን እዚህ ያጋሩ...' : "What's on your mind regarding family, marriage & parenting?") 
                      : (locale === 'am' ? 'ለመፖሰት እባክዎ መጀመሪያ ይግቡ...' : 'Log in to write a community post...')}
                  </span>
                  <PlusCircle size={20} className="text-primary group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs font-bold text-gray-500 px-2">
                <span className="flex items-center gap-1.5 text-primary">
                  <Sparkles size={14} />
                  {locale === 'am' ? 'የይዘት ማጣሪያ (Text-Only & AI Moderated)' : 'Strict Text-Only & AI Moderated'}
                </span>
                <span className="uppercase text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black">
                  {userTier.toUpperCase()} TIER
                </span>
              </div>
            </div>

            {/* Card-Based News Feed */}
            <div className="space-y-6">
               {posts.map(post => (
                  <div 
                    key={post.id} 
                    id={`post-${post.id}`}
                    className={`bg-white rounded-[2.5rem] shadow-sm border overflow-hidden transition-all duration-300 ${
                      highlightedPost === post.id ? 'border-primary border-2 ring-4 ring-primary/10' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                     <div className="p-8 space-y-6">
                        
                        {/* Post Header */}
                        <div className="flex justify-between items-start">
                           <div className="flex gap-4 items-center">
                              <Image 
                                src={post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} 
                                alt={`${post.profiles?.full_name || 'User'}'s avatar`} 
                                width={52} 
                                height={52} 
                                className="w-13 h-13 rounded-2xl object-cover shadow-sm border border-gray-100" 
                              />
                              <div>
                                 <div className="flex items-center gap-2">
                                    <p className="font-bold text-[#1C1917] text-base">{post.profiles?.full_name || 'Beteseb User'}</p>
                                    {post.profiles?.role === 'expert' && (
                                       <span className="flex items-center gap-1 text-[10px] font-black bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-500/20">
                                          <CheckCircle2 size={10} /> EXPERT
                                       </span>
                                    )}
                                 </div>
                                 <p className="text-xs text-gray-400 font-medium">{new Date(post.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <button aria-label="Post options" className="p-2 text-gray-300 hover:text-accent transition-colors">
                              <MoreHorizontal size={20} />
                           </button>
                        </div>

                        {/* High-Contrast Post Content (Black text on clean white card) */}
                        <div className="space-y-4">
                           <span className="inline-block text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">
                              #{post.category?.replace('_', ' ') || 'general'}
                           </span>
                           <p className="text-[#1C1917] leading-relaxed text-base font-semibold">
                              {post.content}
                           </p>

                           <button 
                              onClick={() => translatePost(post)}
                              className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-all mt-2"
                           >
                              <Languages size={12} /> {locale === 'am' ? 'ተርጉም' : 'Translate'}
                           </button>
                        </div>

                        {/* Interactive Action Buttons (Like, Dislike, Comment, Repost, External Share) */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                           <div className="flex items-center gap-6">
                              {/* Like */}
                              <button 
                                 onClick={() => handleLike(post.id)}
                                 aria-label="Like post"
                                 className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group/like"
                              >
                                 <Heart size={18} className="group-hover/like:fill-red-500 transition-all" /> 
                                 <span className="font-bold text-xs">{post.post_likes?.[0]?.count || 0}</span>
                              </button>

                              {/* Dislike */}
                              <button 
                                 onClick={() => handleDislike(post.id)}
                                 aria-label="Dislike post"
                                 className="flex items-center gap-2 text-gray-500 hover:text-amber-600 transition-colors"
                              >
                                 <ThumbsDown size={18} />
                                 <span className="font-bold text-xs">{post.dislike_count || 0}</span>
                              </button>

                              {/* Comment */}
                              <button 
                                 onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                                 aria-label="Comment on post"
                                 className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
                              >
                                 <MessageCircle size={18} /> 
                                 <span className="font-bold text-xs">{post.post_comments?.length || 0}</span>
                              </button>

                              {/* Repost */}
                              <button 
                                 onClick={() => handleRepost(post.id)}
                                 aria-label="Repost"
                                 className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors"
                                 title={locale === 'am' ? 'በድጋሚ ለጥፍ (Repost)' : 'Repost'}
                              >
                                 <Repeat size={18} />
                              </button>
                           </div>

                           {/* External Share (Deep Link) */}
                           <button 
                              onClick={() => handleShare(post.id)}
                              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest"
                           >
                              <Share2 size={16} /> 
                              <span>{t('interactions.share')}</span>
                           </button>
                        </div>

                        {/* Comment Drawer / Input */}
                        {commentingOn === post.id && (
                           <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-4 duration-300">
                              <div className="flex gap-3">
                                 <input 
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder={t('interactions.writeComment')}
                                    className="flex-1 bg-[#F8F4F1] border-none rounded-2xl px-5 py-3 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                 />
                                 <button 
                                    onClick={() => handleComment(post.id)}
                                    aria-label="Send comment"
                                    className="p-3 bg-primary text-white rounded-2xl hover:scale-105 transition-all shadow-md shadow-primary/20"
                                 >
                                    <Send size={18} />
                                 </button>
                              </div>
                              
                              {/* Comments List */}
                              <div className="space-y-3">
                                 {post.post_comments?.map((comment: PostComment) => (
                                    <div key={comment.id} className="flex gap-3">
                                       <Image 
                                         src={comment.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} 
                                         alt="Commenter Avatar" 
                                         width={36} 
                                         height={36} 
                                         className="w-9 h-9 rounded-xl object-cover border border-gray-100" 
                                       />
                                       <div className="flex-1 bg-[#F8F4F1] p-3.5 rounded-2xl">
                                          <p className="text-xs font-bold text-accent mb-1">{comment.profiles?.full_name || 'Member'}</p>
                                          <p className="text-xs text-gray-700 font-medium">{comment.content}</p>
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

            {/* Ice Break Daily Discussion Section (Placed after news feed posts) */}
            <IceBreakSection 
              currentUser={currentUser}
              userTier={userTier}
              locale={locale}
            />

         </main>

         {/* Right Sidebar: Preserved Existing Sections (Family Poll & Trending Tags) */}
         <aside className="lg:col-span-3 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-2 h-full bg-secondary group-hover:w-4 transition-all" />
               <div className="flex items-center gap-3 mb-6">
                  <BarChart2 className="text-secondary" />
                  <h4 className="text-lg font-black text-accent italic">
                    {locale === 'am' ? 'የቤተሰብ የህዝብ አስተያየት' : 'Family Poll'}
                  </h4>
               </div>
               <p className="font-bold text-accent mb-6 leading-relaxed">
                 {locale === 'am' ? 'ለረጅም ርቀት የፍቅር ግንኙነት በጣም አስፈላጊው ባህሪ ምንድነው?' : 'What is the most important trait for a long-distance relationship?'}
               </p>
               <div className="space-y-3">
                  {[
                     { label: locale === 'am' ? 'የዕለታዊ የቪዲዮ ወሬ' : 'Daily Video Chat', percent: 45 },
                     { label: locale === 'am' ? 'እምነት እና ግልጽነት' : 'Trust & Transparency', percent: 82 },
                     { label: locale === 'am' ? 'የወደፊት እቅድ' : 'Future Plan', percent: 34 }
                  ].map((opt, i) => (
                     <button key={i} className="w-full p-4 rounded-2xl border border-gray-100 hover:border-secondary transition-all text-left relative overflow-hidden group/opt">
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

            <div className="bg-card p-8 rounded-[3rem] shadow-2xl border border-white/5">
               <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">
                 {locale === 'am' ? 'በብዛት የተጎበኙ መለያዎች' : 'Trending Tags'}
               </h4>
               <div className="flex flex-wrap gap-2">
                  {(locale === 'am' ? ['#አቡሻኪር', '#የስኬትታሪኮች', '#የሐበሻሰርግ', '#የቤተሰብእሴቶች', '#የኢትዮጵያቅርስ'] : ['#Abushakir', '#SuccessStories', '#HabeshaWeddings', '#FamilyValues', '#EthiopianHeritage']).map(tag => (
                     <span key={tag} className="text-[10px] font-black bg-white/5 hover:bg-primary hover:text-white px-4 py-2 rounded-full cursor-pointer transition-all border border-white/5">{tag}</span>
                  ))}
               </div>
            </div>
         </aside>

      </div>

      {/* Post Creation Modal */}
      <PostCreationModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        userTier={userTier}
        onPostSuccess={fetchPosts}
        locale={locale}
      />
    </div>
   );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center font-bold text-primary animate-pulse">Loading Beteseb Community...</div>}>
      <CommunityContent />
    </Suspense>
  );
}
