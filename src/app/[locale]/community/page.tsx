'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { 
  MessageCircle, 
  Heart, 
  ShieldAlert, 
  Send
} from 'lucide-react';

export default function CommunityPage() {
  const t = useTranslations('Community');
  const locale = useLocale();
  const router = useRouter();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const initPage = async () => {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         setCurrentUser(user);
      }
      
      // Fetch approved posts
      fetchPosts();
    };
    initPage();
  }, []);

  const fetchPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('community_posts')
      .select('*, profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (data) {
      const visible = data.filter(post => post.is_approved || (user && post.author_id === user.id));
      setPosts(visible);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || !currentUser) return;
    setIsSubmitting(true);
    
    const { error } = await supabase.from('community_posts').insert({
       author_id: currentUser.id,
       content: newPost.trim(),
       is_approved: false // Moderation first
    });
    
    if (!error) {
       setNewPost('');
       fetchPosts(); // Refresh feed
    } else {
       console.error("Error posting:", error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-primary text-white p-6 md:px-12 flex justify-between items-center shadow-md">
         <div>
            <Link href="/" className="text-2xl font-bold tracking-wider decoration-transparent hover:text-white/90 transition-colors">
               {locale === 'am' ? 'ቤተሰብ' : 'BETESEB'}
            </Link>
         </div>
         <div className="flex gap-4 items-center">
            <Link href="/dashboard" className="hover:text-white/80 font-semibold text-sm uppercase tracking-widest">{locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard'}</Link>
         </div>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-4">
         <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-4xl font-bold text-accent mb-4">{t('title')}</h2>
            <p className="text-gray-600 text-lg">{t('subtitle')}</p>
         </div>

         {/* Create Post Area */}
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10 relative overflow-hidden">
            <div className={`flex gap-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
               <div className="w-12 h-12 rounded-full bg-secondary flex-shrink-0" />
               <div className="flex-1">
                  <textarea 
                     disabled={!currentUser}
                     value={newPost}
                     onChange={(e) => setNewPost(e.target.value)}
                     className={`w-full bg-muted/50 rounded-2xl p-4 border-transparent focus:border-primary focus:ring-primary min-h-[120px] resize-none ${locale === 'ar' ? 'text-right' : 'text-left'}`}
                     placeholder={currentUser ? t('newPostPlaceholder') : t('loginRequired')}
                  />
               </div>
            </div>
            
            <div className={`mt-4 flex justify-between items-center ${locale === 'ar' ? 'flex-row-reverse' : 'sm:pl-16'}`}>
               <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl font-medium">
                  <ShieldAlert size={14} />
                  {t('adminApprovalNote')}
               </div>
               
               <button 
                  onClick={handlePost}
                  disabled={!currentUser || !newPost.trim() || isSubmitting}
                  className="btn-primary py-2 px-6 flex items-center gap-2 disabled:opacity-50"
               >
                  {t('postButton')} <Send size={16} className={locale === 'ar' ? 'rotate-180' : ''} />
               </button>
            </div>
         </div>

         {/* Feed */}
         <div>
            <h3 className={`text-xl font-bold text-accent mb-6 flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
               <MessageCircle className="text-primary" /> {t('feedTitle')}
            </h3>

            <div className="space-y-6">
               {posts.length === 0 ? (
                  <div className="text-center p-12 bg-white rounded-[2rem] border border-gray-100 border-dashed text-gray-400">
                     {t('noPosts')}
                  </div>
               ) : (
                  posts.map(post => (
                     <div key={post.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-primary/20 transition-all group">
                        <div className={`flex justify-between items-start mb-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                           <div className={`flex gap-4 items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                              <img src={post.profiles?.avatar_url || 'https://images.unsplash.com/placeholder.jpg'} alt="Avatar" className="w-12 h-12 rounded-full object-cover bg-gray-200" />
                              <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                                 <p className="font-bold text-accent">
                                    {locale === 'am' ? `${t('authorFormat')} ${post.profiles?.full_name}` : post.profiles?.full_name}
                                 </p>
                                 <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           
                           {!post.is_approved && (
                              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                                 {t('pending')}
                              </span>
                           )}
                        </div>

                        <p className={`text-gray-700 leading-relaxed mb-6 text-lg ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{post.content}</p>

                        <div className={`flex items-center gap-6 border-t border-gray-100 pt-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                           <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-medium text-sm">
                              <Heart size={18} /> {t('like')}
                           </button>
                           <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-medium text-sm">
                              <MessageCircle size={18} /> {t('reply')}
                           </button>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>
      </main>
    </div>
  );
}
