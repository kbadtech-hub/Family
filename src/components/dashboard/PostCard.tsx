'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { 
  Heart, 
  ThumbsDown, 
  MessageSquare, 
  Share2, 
  Languages, 
  User, 
  CheckCircle2, 
  MoreHorizontal, 
  Link as LinkIcon, 
  Send, 
  X,
  Sparkles
} from 'lucide-react';
import { translator, SupportedLocale } from '@/lib/translator';

interface Profile {
  full_name: string;
  avatar_url: string;
  star_sign: string;
  is_verified: boolean;
  role: string;
}

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
  profiles: Profile | null;
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

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  compatibility?: number | null; // Compatibility percentage
  isVerified?: boolean;
  isPremium?: boolean;
  isAdmin?: boolean;
}

export default function PostCard({
  post: initialPost,
  currentUserId,
  compatibility = null,
  isVerified = false,
  isPremium = false,
  isAdmin = false
}: PostCardProps) {
  const t = useTranslations('Community');
  const locale = useLocale();
  
  const [post, setPost] = useState<Post>(initialPost);
  const [userReaction, setUserReaction] = useState<'heart' | 'dislike' | null>(null);
  const [activeComment, setActiveComment] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  // Fetch reaction status for the current user
  useEffect(() => {
    const fetchUserReaction = async () => {
      if (!currentUserId) return;
      const { data, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (!error && data) {
        setUserReaction(data.reaction_type as any);
      }
    };
    fetchUserReaction();
  }, [post.id, currentUserId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      const commentMap: Record<string, Comment> = {};
      const roots: Comment[] = [];
      
      data.forEach(c => {
        commentMap[c.id] = { ...c, replies: [] };
      });
      
      data.forEach(c => {
        // Safe check for parent_id column if present
        if ('parent_id' in c && c.parent_id && commentMap[c.parent_id]) {
          commentMap[c.parent_id].replies?.push(commentMap[c.id]);
        } else {
          roots.push(commentMap[c.id]);
        }
      });
      
      setPostComments(roots);
    }
  };

  const handleReaction = async (type: 'heart' | 'dislike') => {
    if (!currentUserId) return;

    const currentReaction = userReaction;
    
    if (currentReaction === type) {
      // Remove reaction
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUserId);
      setUserReaction(null);
    } else {
      // Add or update reaction
      if (currentReaction) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
      }
      await supabase
        .from('post_reactions')
        .insert({ 
          post_id: post.id, 
          user_id: currentUserId, 
          reaction_type: type // Fixed: using reaction_type instead of type
        });
      setUserReaction(type);
    }
    
    // Refresh post counts
    const { data } = await supabase
      .from('community_posts')
      .select('heart_count, dislike_count')
      .eq('id', post.id)
      .single();
    if (data) {
      setPost(prev => ({ ...prev, ...data }));
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentContent.trim() || !currentUserId) return;
    
    const insertObj: any = {
      post_id: post.id,
      author_id: currentUserId,
      content: commentContent.trim()
    };

    // Include parent_id if replying (some schemas might omit this, so we handle it dynamically)
    if (replyingToId) {
      insertObj.parent_id = replyingToId;
    }

    const { error } = await supabase
      .from('post_comments')
      .insert(insertObj);

    if (!error) {
      setCommentContent('');
      setReplyingToId(null);
      fetchComments();
    }
  };

  const translatePostContent = async () => {
    setIsTranslating(true);
    const translated = await translator.getOrTranslate(
      'community_posts',
      post.id,
      post.content,
      locale as SupportedLocale
    );
    setPost(prev => ({ ...prev, content: translated }));
    setIsTranslating(false);
  };

  const translateCommentContent = async (commentId: string, content: string) => {
    const translated = await translator.getOrTranslate(
      'post_comments',
      commentId,
      content,
      locale as SupportedLocale
    );
    
    setPostComments(prev => {
      const updateList = (list: Comment[]): Comment[] => {
        return list.map(c => {
          if (c.id === commentId) {
            return { ...c, content: translated };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateList(c.replies) };
          }
          return c;
        });
      };
      return updateList(prev);
    });
  };

  const toggleComments = () => {
    const nextState = !activeComment;
    setActiveComment(nextState);
    if (nextState) {
      fetchComments();
    }
  };

  return (
    <article className="bg-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-primary/20 hover:border-primary/60 shadow-sm hover:shadow-md transition-shadow group text-left relative">
      {/* Compatibility Match Badge */}
      {compatibility !== null && compatibility >= 70 && (
        <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-pink-500 to-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-1 animate-pulse">
          <Heart size={10} className="fill-white" />
          <span>{compatibility}% {locale === 'am' ? 'ተኳኋኝነት' : 'Match'}</span>
        </div>
      )}

      <div className="flex justify-between mb-4 md:mb-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-muted border border-border overflow-hidden relative shrink-0">
            {post.profiles?.avatar_url ? (
              <Image 
                src={post.profiles.avatar_url} 
                alt={post.profiles.full_name || 'User Avatar'} 
                fill
                sizes="(max-width: 768px) 40px, 48px"
                className="object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary">
                <User size={24} />
              </div>
            )}
          </div>
          <div>
            <h4 className="font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-widest text-xs flex items-center gap-1">
              {post.profiles?.full_name || t('anonymousUser')}
              {post.profiles?.is_verified && (
                <CheckCircle2 size={12} className="text-primary fill-primary/10" />
              )}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                {post.profiles?.star_sign || t('memberBadge')}
              </p>
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
        <button className="text-gray-400 hover:text-primary transition-colors p-2" aria-label="More options">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="mb-4 pl-4 border-l-4 border-primary/20">
        <p className="text-foreground/70 leading-relaxed italic text-lg font-medium">
          &quot;{post.content}&quot;
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <button 
          onClick={translatePostContent}
          disabled={isTranslating}
          className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-all disabled:opacity-50"
        >
          <Languages size={12} /> {locale === 'am' ? 'ተርጉም' : 'Translate'}
        </button>
      </div>

      {post.media_url && post.media_type === 'image' && (
        <div className="mb-6 rounded-3xl overflow-hidden border border-border shadow-lg relative aspect-video max-h-[400px]">
          <img src={post.media_url} className="w-full h-full object-cover" alt="Post Media" />
        </div>
      )}

      {post.media_url && post.media_type === 'link' && (
        <div className="mb-6 p-6 bg-muted rounded-3xl border border-primary/10 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <LinkIcon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
              {t('sharedLink')}
            </p>
            <a 
              href={post.media_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-bold text-accent hover:underline truncate block"
            >
              {post.media_url}
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => handleReaction('heart')}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${userReaction === 'heart' ? 'text-primary scale-110' : 'text-gray-400 hover:text-primary'}`}
          >
            <Heart size={16} className={userReaction === 'heart' ? 'fill-primary' : ''} />
            {post.heart_count || 0}
          </button>
          <button 
            onClick={() => handleReaction('dislike')}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${userReaction === 'dislike' ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-500'}`}
          >
            <ThumbsDown size={16} className={userReaction === 'dislike' ? 'fill-red-500' : ''} />
            {post.dislike_count || 0}
          </button>
          <button 
            onClick={toggleComments}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeComment ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
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
          aria-label="Share post"
        >
          <Share2 size={16} />
        </button>
      </div>

      {activeComment && (
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
                  onClick={handleCommentSubmit}
                  className="bg-primary text-white p-2 rounded-xl"
                  aria-label="Submit comment"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {postComments.length > 0 && (
            <RecursiveComments 
              comments={postComments} 
              t={t} 
              setReplyingToId={setReplyingToId} 
              translateCommentContent={translateCommentContent} 
              locale={locale} 
            />
          )}
        </div>
      )}
    </article>
  );
}

const RecursiveComments = ({ 
  comments, 
  level = 0, 
  t, 
  setReplyingToId,
  translateCommentContent,
  locale
}: { 
  comments: Comment[], 
  level?: number, 
  t: any, 
  setReplyingToId: (id: string | null) => void,
  translateCommentContent: (commentId: string, content: string) => void,
  locale: string
}) => {
  return (
    <div className={`space-y-4 ${level > 0 ? 'ml-8 border-l-2 border-primary/10 pl-4' : ''} text-left`}>
      {comments.map(comment => (
        <div key={comment.id} className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="flex items-start gap-3 bg-muted/30 p-4 rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-muted border border-border overflow-hidden flex-shrink-0 relative">
              {comment.profiles?.avatar_url ? (
                <Image 
                  src={comment.profiles.avatar_url} 
                  alt="" 
                  fill
                  sizes="32px"
                  className="object-cover" 
                />
              ) : (
                <User size={16} className="m-auto text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-[10px] uppercase tracking-widest text-foreground">
                  {comment.profiles?.full_name}
                </span>
                <span className="text-[8px] text-gray-400 font-bold uppercase">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                {comment.content}
              </p>
              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => setReplyingToId(comment.id)}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {t('reply')}
                </button>
                <button 
                  onClick={() => translateCommentContent(comment.id, comment.content)}
                  className="text-[10px] font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <Languages size={10} /> {locale === 'am' ? 'ተርጉም' : 'Translate'}
                </button>
              </div>
            </div>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <RecursiveComments 
              comments={comment.replies} 
              level={level + 1} 
              t={t} 
              setReplyingToId={setReplyingToId} 
              translateCommentContent={translateCommentContent} 
              locale={locale} 
            />
          )}
        </div>
      ))}
    </div>
  );
};
