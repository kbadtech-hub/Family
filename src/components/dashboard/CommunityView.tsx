'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  X,
  Heart,
  ThumbsDown,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Languages,
  BarChart2,
  UserPlus,
  UserCheck,
  Bookmark,
  Repeat,
  Edit,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { translator, SupportedLocale } from '@/lib/translator';
import { toggleFollowUser, isFollowingUser, toggleSavePost, isPostSaved, repostPost } from '@/lib/social';
import PostCreationModal from '@/components/PostCreationModal';
import EditPostModal from '@/components/EditPostModal';
import IceBreakSection from '@/components/IceBreakSection';

interface Profile {
  id?: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  tier?: string;
  is_premium?: boolean;
  is_verified?: boolean;
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
  topic?: string;
  created_at: string;
  is_edited?: boolean;
  edit_count?: number;
  is_approved: boolean;
  is_ai_generated: boolean;
  profiles: Profile;
  post_likes: { count: number }[];
  post_comments: PostComment[];
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
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Interactions State
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});
  const [savedPostsState, setSavedPostsState] = useState<Record<string, boolean>>({});
  const [dislikeState, setDislikeState] = useState<Record<string, boolean>>({});

  // Comments State
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [aiTopic, setAiTopic] = useState<string | null>(null);

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
        profiles!community_posts_author_id_fkey(id, full_name, avatar_url, role, tier, verification_status),
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

    const { data, error: fetchError } = await query;
    if (fetchError) {
      console.error('fetchPosts error:', fetchError);
    }
    if (data) {
      const filteredData = data.map((post: any) => {
        if (post.post_comments) {
          post.post_comments = post.post_comments.filter((comment: any) => !blockedIds.includes(comment.user_id || comment.author_id));
        }
        return post;
      });
      setPosts(filteredData as unknown as CommunityPost[]);

      // Check follows and saved states for logged in user
      if (user) {
        const followMap: Record<string, boolean> = {};
        const savedMap: Record<string, boolean> = {};

        for (const post of filteredData) {
          if (post.author_id && post.author_id !== user.id) {
            followMap[post.author_id] = await isFollowingUser(user.id, post.author_id);
          }
          savedMap[post.id] = await isPostSaved(user.id, post.id);
        }
        setFollowingState(followMap);
        setSavedPostsState(savedMap);
      }
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
         setCurrentUser({ ...user, profile });
      }
      fetchPosts();
      fetchAiTopic();
    };
    initPage();
  }, [fetchPosts, fetchAiTopic]);

  // Supabase Realtime Channel for Cross-Account Global Feed Sync
  useEffect(() => {
    const channel = supabase
      .channel('global-community-feed-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);


  // Social Actions
  const handleFollowToggle = async (authorId: string, authorName: string) => {
    if (!currentUser) return;
    const res = await toggleFollowUser(currentUser.id, currentUser.profile?.full_name || 'Member', authorId);
    setFollowingState(prev => ({ ...prev, [authorId]: res.isFollowing }));
  };

  const handleSaveToggle = async (postId: string) => {
    if (!currentUser) return;
    const res = await toggleSavePost(currentUser.id, postId);
    setSavedPostsState(prev => ({ ...prev, [postId]: res.isSaved }));
  };

  const handleRepost = async (postId: string) => {
    if (!currentUser) return;
    const res = await repostPost(currentUser.id, postId);
    if (res.success) {
      alert(locale === 'am' ? 'ፖስቱ ለጓደኞችዎ ሪፖስት ተደርጓል!' : 'Post recommended to your friends!');
    }
  };

  const handleExternalShare = (postId: string) => {
    const url = `${window.location.origin}/community?post=${postId}`;
    navigator.clipboard.writeText(url);
    alert(locale === 'am' ? 'የፖስቱ Deep Link ኮፒ ተደርጓል! ለሌሎች ማጋራት ይችላሉ።' : 'Deep Link copied! Share it anywhere.');
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

  const handleDislikeToggle = (postId: string) => {
    setDislikeState(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser || !confirm(locale === 'am' ? 'ፖስቱን በቋሚነት ማጥፋት ይፈልጋሉ?' : 'Are you sure you want to permanently delete this post?')) return;
    
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setActiveMenuPostId(null);
    } else {
      alert(error.message);
    }
  };

  const handleCommentSubmit = async (postId: string, parentId: string | null = null) => {
    if (!commentText.trim() || !currentUser) return;
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      author_id: currentUser.id,
      parent_id: parentId,
      content: commentText.trim()
    });
    if (!error) {
      setCommentText('');
      setCommentingOn(null);
      setReplyingToCommentId(null);
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
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, content: translated } : p));
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
    <div className="space-y-8" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         
         {/* Left Sidebar: Categories & AI Topic */}
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

         {/* Center Feed */}
         <main className="lg:col-span-6 space-y-8">
            
            {/* Facebook-Style Post Creation Trigger Box */}
            <div 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white p-6 md:p-8 rounded-[3rem] shadow-xl border border-gray-100 cursor-pointer hover:border-primary/40 transition-all group"
            >
               <div className="flex gap-4 items-center mb-4">
                  <Image 
                    src={currentUser?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} 
                    alt="User Avatar" 
                    width={48} 
                    height={48} 
                    className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100" 
                  />
                  <div className="flex-1 bg-muted/40 group-hover:bg-muted/70 rounded-2xl p-4 text-gray-500 font-medium text-sm transition-colors flex items-center justify-between">
                     <span>{locale === 'am' ? 'ምን አዲስ ነገር አለ? ሃሳብዎን ያጋሩ...' : "What's on your mind? Share text post..."}</span>
                     <PlusCircle size={20} className="text-primary group-hover:scale-110 transition-transform" />
                  </div>
               </div>
               <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs font-bold text-gray-400">
                 <span className="flex items-center gap-1.5">✍️ Text-Only Community Hub</span>
                 <span className="text-primary group-hover:underline">Create Post &rarr;</span>
               </div>
            </div>

            {/* News Feed - Card Layout with High Contrast Black Text on White Cards */}
            <div className="space-y-8">
               {posts.map(post => {
                  const isAuthor = currentUser && post.author_id === currentUser.id;
                  const isFollowingAuthor = followingState[post.author_id];
                  const isSaved = savedPostsState[post.id];
                  const isDisliked = dislikeState[post.id];

                  return (
                    <div 
                      key={post.id} 
                      id={`post-${post.id}`}
                      className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500"
                    >
                       <div className="p-8">
                          
                          {/* Card Header: Author Info + Follow Button + 3-Dots Menu */}
                          <div className="flex justify-between items-center mb-6">
                             <div className="flex gap-4 items-center">
                                <Image 
                                  src={post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} 
                                  alt={`${post.profiles?.full_name || 'Author'}'s avatar`} 
                                  width={56} 
                                  height={56} 
                                  className="w-14 h-14 rounded-2xl object-cover shadow-md border border-gray-100" 
                                />
                                <div>
                                   <div className="flex items-center gap-3">
                                      <p className="font-black text-gray-900 text-base">{post.profiles?.full_name || 'Community Member'}</p>
                                      
                                      {/* Author Follow Button (If not author) */}
                                      {currentUser && !isAuthor && (
                                        <button
                                          onClick={() => handleFollowToggle(post.author_id, post.profiles?.full_name || 'Member')}
                                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                            isFollowingAuthor 
                                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                                              : 'bg-primary text-white shadow-sm hover:scale-105'
                                          }`}
                                        >
                                          {isFollowingAuthor ? (
                                            <>
                                              <UserCheck size={12} />
                                              <span>Following</span>
                                            </>
                                          ) : (
                                            <>
                                              <UserPlus size={12} />
                                              <span>Follow</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                   </div>
                                   
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-400 font-medium">
                                        {new Date(post.created_at).toLocaleDateString()}
                                      </span>
                                      
                                      {/* Edited Badge */}
                                      {post.is_edited && (
                                        <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                          Edited / ተስተካክሏል
                                        </span>
                                      )}
                                   </div>
                                </div>
                             </div>

                             {/* 3-Dots Menu (Post Owner Only: Edit 1x & Delete) */}
                             <div className="relative">
                                {isAuthor ? (
                                  <button 
                                    onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                                    aria-label="Post options" 
                                    className="p-3 text-gray-400 hover:text-gray-900 transition-colors rounded-2xl hover:bg-muted"
                                  >
                                    <MoreHorizontal size={20} />
                                  </button>
                                ) : null}

                                {activeMenuPostId === post.id && isAuthor && (
                                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 p-2 space-y-1 animate-in zoom-in-95">
                                     <button
                                       onClick={() => {
                                         setEditingPost(post);
                                         setActiveMenuPostId(null);
                                       }}
                                       disabled={(post.edit_count || 0) >= 1}
                                       className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-40"
                                     >
                                       <Edit size={14} className="text-blue-500" />
                                       <span>{(post.edit_count || 0) >= 1 ? 'Edited (Max 1)' : 'Edit Post (1x)'}</span>
                                     </button>

                                     <button
                                       onClick={() => handleDeletePost(post.id)}
                                       className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                     >
                                       <Trash2 size={14} />
                                       <span>Delete Post</span>
                                     </button>
                                  </div>
                                )}
                             </div>
                          </div>

                          {/* Post Topic Tag & High Contrast Text */}
                          <div className="space-y-4 mb-6">
                             <span className="inline-block text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                                #{post.topic || post.category?.replace('_', ' ') || 'Marriage'}
                             </span>

                             {/* High Contrast Text: Black Text on White Background */}
                             <p className="text-gray-900 leading-relaxed text-lg font-medium whitespace-pre-line">
                               {post.content}
                             </p>

                             <button 
                                onClick={() => translatePost(post)}
                                className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-all mt-2"
                             >
                                <Languages size={12} /> {locale === 'am' ? 'ተርጉም' : 'Translate'}
                             </button>
                          </div>

                          {/* Interactive Action Buttons Row */}
                          <div className="flex items-center justify-between border-t border-gray-100 pt-6 flex-wrap gap-3">
                             <div className="flex items-center gap-4 md:gap-6">
                                
                                {/* Like */}
                                <button 
                                   onClick={() => handleLike(post.id)}
                                   aria-label="Like post"
                                   className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors group/like"
                                >
                                   <Heart size={18} className="group-hover/like:fill-red-500 transition-all" /> 
                                   <span className="font-bold text-xs">{post.post_likes?.[0]?.count || 0}</span>
                                </button>

                                {/* Dislike */}
                                <button 
                                   onClick={() => handleDislikeToggle(post.id)}
                                   aria-label="Dislike post"
                                   className={`flex items-center gap-1.5 transition-colors ${
                                     isDisliked ? 'text-amber-600 font-bold' : 'text-gray-500 hover:text-amber-600'
                                   }`}
                                >
                                   <ThumbsDown size={18} />
                                </button>

                                {/* Comment Drawer Toggle */}
                                <button 
                                   onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                                   aria-label="Comment on post"
                                   className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors font-bold text-xs"
                                >
                                   <MessageCircle size={18} /> 
                                   <span>{post.post_comments?.length || 0}</span>
                                </button>

                                {/* In-App Repost */}
                                <button
                                   onClick={() => handleRepost(post.id)}
                                   className="flex items-center gap-1 text-gray-500 hover:text-emerald-600 transition-colors font-bold text-xs"
                                   title="Recommend to friends"
                                >
                                   <Repeat size={18} />
                                </button>

                                {/* Save Post Button */}
                                <button
                                   onClick={() => handleSaveToggle(post.id)}
                                   className={`flex items-center gap-1 transition-colors text-xs font-bold ${
                                     isSaved ? 'text-primary' : 'text-gray-500 hover:text-primary'
                                   }`}
                                   title="Save post"
                                >
                                   <Bookmark size={18} className={isSaved ? 'fill-primary' : ''} />
                                   <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                                </button>

                             </div>

                             {/* External Share (Deep Link Generator) */}
                             <button 
                                onClick={() => handleExternalShare(post.id)}
                                className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-xl border border-gray-100"
                             >
                                <Share2 size={16} /> 
                                <span>Deep Link Share</span>
                             </button>
                          </div>

                          {/* Threaded Comments Section */}
                          {commentingOn === post.id && (
                             <div className="mt-8 pt-8 border-t border-gray-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex gap-3">
                                   <input 
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      placeholder={replyingToCommentId ? "Writing a reply..." : t('interactions.writeComment')}
                                      className="flex-1 bg-muted/40 border border-gray-200 rounded-2xl px-6 py-3 text-sm font-medium focus:ring-primary focus:border-primary"
                                   />
                                   <button 
                                      onClick={() => handleCommentSubmit(post.id, replyingToCommentId)}
                                      aria-label="Send comment"
                                      className="p-3 bg-primary text-white rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                   >
                                      <Send size={18} />
                                   </button>
                                </div>

                                <div className="space-y-4">
                                   {post.post_comments?.map((comment: PostComment) => (
                                      <div key={comment.id} className="flex gap-4 group/comment">
                                         <Image 
                                           src={comment.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} 
                                           alt="Commenter Avatar" 
                                           width={40} 
                                           height={40} 
                                           className="w-10 h-10 rounded-xl object-cover shadow-sm" 
                                         />
                                         <div className="flex-1 bg-muted/30 p-4 rounded-[1.5rem] relative border border-gray-100">
                                            <p className="text-xs font-black text-gray-900 mb-1">{comment.profiles?.full_name || 'Member'}</p>
                                            <p className="text-sm text-gray-800 font-medium">{comment.content}</p>
                                            
                                            <div className="flex gap-4 mt-2">
                                               <button 
                                                 onClick={() => setReplyingToCommentId(comment.id)}
                                                 className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                               >
                                                 {t('interactions.reply')}
                                               </button>
                                            </div>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                  );
               })}
            </div>

            {/* Ice Break Section (Gold+ Tier Discussion Topic) */}
            <IceBreakSection currentUser={currentUser} locale={locale} />

         </main>

         {/* Right Sidebar: Preserved Existing Sections (Family Poll & Trending Tags) */}
         <aside className="lg:col-span-3 space-y-8">
            
            {/* Preserved Family Poll Section */}
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

            {/* Preserved Trending Tags Section */}
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
        currentUser={currentUser}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostSuccess={(newPost?: any) => {
          if (newPost) {
            setPosts(prev => [newPost, ...prev]);
          }
          fetchPosts();
        }}
      />


      {/* Edit Post Modal (1-time edit limit) */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          onPostEdited={() => {
            fetchPosts();
            setEditingPost(null);
          }}
        />
      )}
    </div>
  );
}
