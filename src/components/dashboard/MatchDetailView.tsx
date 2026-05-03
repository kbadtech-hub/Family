'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Heart, 
  MapPin, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  X,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  UserPlus,
  UserCheck,
  UserClock,
  Loader2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface MatchDetailProps {
  matchId: string;
  isPremium?: boolean;
  onClose: () => void;
  onStartChat: (id: string) => void;
}

export default function MatchDetailView({ matchId, isPremium = false, onClose, onStartChat }: MatchDetailProps) {
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const t = useTranslations('Friendship');

  useEffect(() => {
    const fetchMatchDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile including gallery_photos
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', matchId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        if (profileData.gallery_urls) {
           setPhotos(profileData.gallery_urls.map((url: string) => ({ url })));
        }

        // Check Friendship Status
        const { data: friendship } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${matchId}),and(sender_id.eq.${matchId},receiver_id.eq.${user.id})`)
          .single();
        
        if (friendship) {
          setFriendshipStatus(friendship.status);
        }
      }
      setLoading(false);
    };

    fetchMatchDetails();
  }, [matchId]);

  if (loading) return (
    <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
       <div className="animate-bounce"><Heart size={40} className="text-primary fill-primary" /></div>
    </div>
  );

  const allPhotos = [
    { url: profile?.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=400' },
    ...photos
  ];

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);

  const handleAddFriend = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('friendships')
        .insert({
          sender_id: user.id,
          receiver_id: matchId,
          status: 'pending'
        });

      if (error) throw error;
      setFriendshipStatus('pending');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-accent/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
        <button 
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-6 right-6 z-[110] w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:bg-white/40 transition-all shadow-xl"
        >
          <X size={24} />
        </button>

        {/* Image Slider Section */}
        <div className="relative w-full md:w-1/2 h-2/3 md:h-full bg-accent">
           <Image 
             src={allPhotos[currentPhotoIndex].url} 
             alt="Profile" 
             fill 
             className="object-cover transition-all duration-700"
           />
           
           <div className="absolute inset-0 bg-gradient-to-t from-accent/80 via-transparent to-transparent" />

           {allPhotos.length > 1 && (
             <>
                <button onClick={prevPhoto} aria-label="Previous photo" className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 transition-all">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={nextPhoto} aria-label="Next photo" className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 transition-all">
                  <ChevronRight size={24} />
                </button>
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                 {allPhotos.map((_, i) => (
                   <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentPhotoIndex ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`} />
                 ))}
               </div>
             </>
           )}
        </div>

        {/* Info Section */}
        <div className="w-full md:w-1/2 h-1/3 md:h-full overflow-y-auto p-10 md:p-16 custom-scrollbar space-y-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <h2 className="text-4xl font-black text-accent italic tracking-tighter">{profile?.full_name}</h2>
                 {profile?.is_verified && <CheckCircle2 size={28} className="text-primary fill-primary/10" />}
              </div>
              <div className="flex flex-wrap gap-3">
                 <span className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} /> {profile?.star_sign}
                 </span>
                 <span className="px-4 py-2 bg-muted text-gray-500 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} /> {profile?.location}
                 </span>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-sm font-black text-accent uppercase tracking-widest border-b border-muted pb-2">{t('about')}</h3>
              <p className={`text-gray-500 leading-relaxed italic text-lg font-medium ${!isPremium ? 'blur-sm select-none' : ''}`}>
                &quot;{profile?.bio || t('noBio')}&quot;
              </p>
              {!isPremium && (
                <p className="text-[10px] font-black text-primary uppercase tracking-widest italic text-center pt-2">{t('upgradeToRead')}</p>
              )}
           </div>

           {profile?.interests && (
             <div className="space-y-4">
                <h3 className="text-sm font-black text-accent uppercase tracking-widest border-b border-muted pb-2">{t('interests')}</h3>
                <div className={`flex flex-wrap gap-2 ${!isPremium ? 'blur-md select-none pointer-events-none' : ''}`}>
                   {profile.interests.split(',').map((interest: string) => (
                     <span key={interest} className="px-5 py-2.5 bg-muted text-accent text-[10px] font-black rounded-2xl uppercase tracking-widest">
                        {interest.trim()}
                     </span>
                   ))}
                </div>
             </div>
           )}

           <div className="space-y-4">
              <h3 className="text-sm font-black text-accent uppercase tracking-widest border-b border-muted pb-2">{t('contactInfo')}</h3>
              <div className="bg-muted/30 p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('directEmail')}</p>
                    <p className={`text-sm font-bold text-accent ${!isPremium ? 'blur-md select-none' : ''}`}>
                       {isPremium ? profile?.email : '••••••••@••••.com'}
                    </p>
                 </div>
                 {!isPremium && (
                    <div className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black rounded-full uppercase tracking-tighter">
                       {t('premiumOnly')}
                    </div>
                 )}
              </div>
           </div>

            <div className="pt-10 space-y-4">
               {/* Friendship Button */}
               {friendshipStatus === 'accepted' ? (
                 <div className="w-full bg-green-500/10 text-green-500 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4">
                    <UserCheck size={24} />
                    {t('friends')}
                 </div>
               ) : friendshipStatus === 'pending' ? (
                 <div className="w-full bg-muted text-gray-400 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4">
                    <UserClock size={24} />
                    {t('requestSent')}
                 </div>
               ) : (
                 <button 
                  onClick={handleAddFriend}
                  disabled={isProcessing}
                  className="w-full bg-accent text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                 >
                    {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <UserPlus size={24} />}
                    {t('addFriend')}
                 </button>
               )}

               {isPremium || friendshipStatus === 'accepted' ? (
                 <button 
                   onClick={() => onStartChat(matchId)}
                   className="w-full bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                 >
                    <MessageCircle size={24} />
                    {friendshipStatus === 'accepted' ? t('openChat') : t('startConnection')}
                 </button>
               ) : (
                 <div className="p-8 bg-muted rounded-[2.5rem] border border-primary/20 text-center space-y-4">
                    <ShieldCheck className="mx-auto text-primary" size={32} />
                    <p className="text-xs font-black text-accent uppercase tracking-widest">{t('premiumFriendsOnly')}</p>
                    <p className="text-[10px] text-gray-500">{t('upgradeOrFriendSub')}</p>
                    <button 
                       onClick={() => window.location.reload()}
                       className="text-primary font-black text-[10px] uppercase tracking-[0.2em] underline"
                    >
                       {t('upgradeNow')}
                    </button>
                 </div>
               )}
            </div>
        </div>
      </div>
    </div>
  );
}
