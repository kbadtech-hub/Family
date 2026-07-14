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
  Clock, 
  Loader2,
  Lightbulb 
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { getUserTier, calculateCompletionRate } from '@/lib/tiers';
import { calculateCompatibility } from '@/lib/compatibility';

interface MatchDetailProps {
  matchId: string;
  currentUserProfile?: any;
  isPremium?: boolean;
  onClose: () => void;
  onStartChat: (id: string) => void;
}

export default function MatchDetailView({ matchId, currentUserProfile, isPremium = false, onClose, onStartChat }: MatchDetailProps) {
  const [profile, setProfile] = useState<any>(null);
  const t = useTranslations('Dashboard.matchDetail');
  const tr = useTranslations('Dashboard.reports');
  const [photos, setPhotos] = useState<any[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const candCompletionRate = calculateCompletionRate(profile);
  const candTier = getUserTier(profile, !!profile?.has_vouched);
  const isRoyal = candCompletionRate === 100 && candTier === 'diamond';
  const matchPercent = currentUserProfile && profile ? calculateCompatibility(currentUserProfile, profile) : 75;

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'diamond': return { label: 'Diamond', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', emoji: '💎' };
      case 'platinum': return { label: 'Platinum', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', emoji: '🌟' };
      case 'gold': return { label: 'Gold', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', emoji: '🥇' };
      case 'silver': return { label: 'Silver', color: 'bg-slate-400/10 text-slate-600 border-slate-400/20', emoji: '🥈' };
      case 'bronze':
      default: return { label: 'Unverified', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', emoji: '🥉' };
    }
  };
  const badge = getTierBadge(candTier);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [friendshipSenderId, setFriendshipSenderId] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'abuse' | 'explicit content' | 'scam' | 'other'>('abuse');
  const [reportDetails, setReportDetails] = useState('');
  const [guardianEndorsement, setGuardianEndorsement] = useState<any>(null);
  const t = useTranslations('Friendship');
  const locale = useLocale();

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
          .maybeSingle();
        
        if (friendship) {
          setFriendshipStatus(friendship.status);
          setFriendshipSenderId(friendship.sender_id);
          setFriendshipId(friendship.id);
        } else {
          setFriendshipStatus(null);
          setFriendshipSenderId(null);
          setFriendshipId(null);
        }

        const { data: myGuardians } = await supabase
          .from('guardians')
          .select('id')
          .eq('user_id', user.id);
        
        if (myGuardians && myGuardians.length > 0) {
          const guardianIds = myGuardians.map(g => g.id);
          const { data: endorsement } = await supabase
            .from('guardian_endorsements')
            .select('*')
            .in('guardian_id', guardianIds)
            .eq('match_id', matchId)
            .maybeSingle();
          
          if (endorsement) {
            setGuardianEndorsement(endorsement);
          }
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
      setFriendshipSenderId(user.id);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptFriend = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('sender_id', matchId)
        .eq('receiver_id', user.id);

      if (error) throw error;
      setFriendshipStatus('accepted');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineFriend = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('sender_id', matchId)
        .eq('receiver_id', user.id);

      if (error) throw error;
      setFriendshipStatus(null);
      setFriendshipSenderId(null);
      setFriendshipId(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReportUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setIsProcessing(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_id: matchId,
      reason: reportReason,
      details: reportDetails.trim()
    });
    
    if (!error) {
      alert(t('reportSuccess'));
      setIsReportOpen(false);
      setReportDetails('');
    } else {
      alert("Report failed: " + error.message);
    }
    setIsProcessing(false);
  };

  const handleBlockUser = async () => {
    const confirmBlock = confirm(t('blockConfirm'));
    if (!confirmBlock) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsProcessing(true);
    const { error } = await supabase.from('blocks').insert({
      blocker_id: user.id,
      blocked_id: matchId
    });

    if (!error) {
      alert(t('blockSuccess'));
      onClose(); // Close details view
      window.location.reload(); // Refresh candidates feed
    } else {
      alert("Block failed: " + error.message);
    }
    setIsProcessing(false);
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
        <div className={`relative w-full md:w-1/2 h-2/3 md:h-full bg-accent ${
          isRoyal 
            ? (profile?.gender === 'Male' ? 'border-8 border-amber-400 ring-4 ring-amber-300/50 ring-inset' : 'border-8 border-pink-400 ring-4 ring-pink-300/50 ring-inset')
            : 'border-none'
        }`}>
           {isRoyal && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 text-3xl drop-shadow-xl animate-bounce z-20">
               👑
             </div>
           )}
           <Image 
             src={allPhotos[currentPhotoIndex].url} 
             alt="Profile" 
             fill 
             className="object-cover transition-all duration-700 pointer-events-none select-none"
           />
           
           <div className="absolute inset-0 bg-gradient-to-t from-accent/85 via-transparent to-transparent" />

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
           <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black text-accent italic tracking-tighter">{profile?.full_name}</h2>
                  {profile?.is_verified && <CheckCircle2 size={28} className="text-primary fill-primary/10" />}
               </div>
               
               {/* Compatibility & Trust Row */}
               <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                     <Sparkles size={12} className="fill-primary animate-pulse" /> {matchPercent}% {t('compatibility')}
                  </span>
                  <span className={`px-4 py-2 border text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${badge.color}`}>
                     <span>{badge.emoji}</span> <span>{badge.label}</span>
                  </span>
                  <span className="px-4 py-2 bg-muted text-gray-500 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                     <MapPin size={12} /> {typeof profile?.location === 'string' ? profile.location : profile?.location?.city || 'Addis Ababa'}
                  </span>
               </div>

               {/* Profile Completion Bar */}
               <div className="p-5 bg-muted/40 rounded-2xl border border-muted space-y-2.5">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-gray-400">
                    <span>{t('profileCompletion')}</span>
                    <span className="text-primary">{candCompletionRate}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden shadow-inner border border-border">
                    <div 
                      style={{ width: `${candCompletionRate}%` }}
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000"
                    />
                  </div>
                  {candCompletionRate === 100 && (
                    <p className="text-[8px] text-green-600 font-bold uppercase tracking-widest text-center leading-none">
                      💯 100% Completed Profile Badge Unlocked
                    </p>
                  )}
               </div>

               <p className="text-[9px] text-gray-400 font-bold italic leading-relaxed">
                  {tr('starSignDisclaimer')}
               </p>
           </div>

           {guardianEndorsement && (
              <div className={`p-6 rounded-[2rem] border flex items-start gap-4 shadow-md ${guardianEndorsement.status === 'endorsed' ? 'bg-green-50/50 border-green-100 text-green-800' : 'bg-red-50/50 border-red-100 text-red-800'}`}>
                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    {guardianEndorsement.status === 'endorsed' ? <CheckCircle2 className="text-green-600" size={20} /> : <X className="text-red-600" size={20} />}
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">
                       {t('mediatorApprovalNote')}
                    </h4>
                    <p className="text-xs font-bold mt-1 italic">
                       « {guardianEndorsement.note} »
                    </p>
                 </div>
              </div>
            )}

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
            {/* Abushakir Compatibility Insights Section */}
            {currentUserProfile && (
              <div className="space-y-6 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                <div className="flex items-center gap-2 text-accent font-black text-xs uppercase tracking-widest border-b border-slate-200 pb-2">
                  <Sparkles size={14} className="text-primary fill-primary/10" />
                  {t('compatibilityBreakdown')}
                </div>

                <div className="space-y-4">
                  {/* Hobbies Match */}
                  {(() => {
                    const parseHobbies = (h: any) => {
                      if (Array.isArray(h)) return h;
                      if (typeof h === 'string') return h.split(',').map(x => x.trim().toLowerCase());
                      return [];
                    };
                    const userH = parseHobbies(currentUserProfile.hobbies);
                    const candH = parseHobbies(profile?.hobbies);
                    const shared = userH.filter((h: string) => candH.includes(h));
                    
                    if (shared.length > 0) {
                      return (
                        <div className="text-xs space-y-1">
                          <p className="font-black text-accent uppercase tracking-wider">
                            🎒 {t('sharedHobbies')}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {shared.map((h: string, idx: number) => (
                              <span key={idx} className="bg-primary/5 border border-primary/10 text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Values Match */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="font-bold text-[8px] text-gray-400 uppercase tracking-widest">{t('familyValues')}</p>
                      <p className="font-black text-accent mt-0.5 uppercase tracking-wide truncate">
                        {profile?.family_values === currentUserProfile.family_values ? '🤝 Shared' : profile?.family_values || 'Traditional'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="font-bold text-[8px] text-gray-400 uppercase tracking-widest">{t('conflictStyle')}</p>
                      <p className="font-black text-accent mt-0.5 uppercase tracking-wide truncate">
                        {profile?.conflict_resolution === currentUserProfile.conflict_resolution ? '🤝 Shared' : profile?.conflict_resolution || 'Discussion'}
                      </p>
                    </div>
                  </div>

                  {/* Cultural Conversation Starters */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/50">
                    <p className="font-black text-[9px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Lightbulb size={12} className="text-yellow-600 fill-yellow-100" />
                      {t('conversationStarters')}
                    </p>
                    <div className="space-y-1.5">
                      <p className="p-3 bg-white rounded-xl border border-slate-100 text-[10px] text-gray-600 leading-relaxed font-bold italic">
                        {t('zodiacPrompt', { zodiac1: currentUserProfile.star_sign || 'Aries', zodiac2: profile?.star_sign || 'Virgo' })}
                      </p>
                      {profile?.family_values === currentUserProfile.family_values && (
                        <p className="p-3 bg-white rounded-xl border border-slate-100 text-[10px] text-gray-600 leading-relaxed font-bold italic">
                          {t('familyValuesPrompt', { value: profile?.family_values || '' })}
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="text-sm font-black text-accent uppercase tracking-widest border-b border-muted pb-2">
                 {t('contactInfo')}
              </h3>
              <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 space-y-2">
                 <p className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} /> t("privacyShieldEnabled")
                 </p>
                 <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                    {tr('privacyShieldInfo')}
                 </p>
              </div>
            </div>

            <div className="pt-10 space-y-4">
                {friendshipStatus === 'accepted' ? (
                  <div className="w-full bg-green-500/10 text-green-500 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4">
                     <UserCheck size={24} />
                     {t('friends')}
                  </div>
                ) : friendshipStatus === 'pending' ? (
                  friendshipSenderId === matchId ? (
                    <div className="flex flex-col sm:flex-row gap-4 w-full animate-in fade-in duration-350">
                      <button
                        onClick={handleAcceptFriend}
                        disabled={isProcessing}
                        className="flex-1 bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.1em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <UserCheck size={20} />}
                        {t('accept')}
                      </button>
                      <button
                        onClick={handleDeclineFriend}
                        disabled={isProcessing}
                        className="flex-1 bg-red-500/10 text-red-500 py-6 rounded-[2rem] font-black uppercase tracking-[0.1em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <X size={20} />}
                        {t('decline')}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-muted text-gray-400 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4">
                       <Clock size={24} />
                       {t('requestSent')}
                    </div>
                  )
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

                {/* Block and Report Panel */}
                <div className="flex gap-4 pt-4 border-t border-muted">
                  <button
                    onClick={() => setIsReportOpen(!isReportOpen)}
                    className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-amber-200 transition-all flex items-center justify-center gap-2"
                  >
                    ⚠️ {t('reportUser')}
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-red-200 transition-all flex items-center justify-center gap-2"
                  >
                    🚫 {t('blockUser')}
                  </button>
                </div>

                {/* Inline Report Dialog */}
                {isReportOpen && (
                  <div className="p-6 bg-amber-50/50 border border-amber-200 rounded-3xl space-y-4 animate-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-accent uppercase tracking-wider">{tr('selectReason')}</p>
                      <select 
                        value={reportReason} 
                        onChange={(e) => setReportReason(e.target.value as any)}
                        className="w-full p-3 bg-white border border-amber-200 rounded-xl font-bold text-xs"
                      >
                        <option value="abuse">tr('reasonAbuse')</option>
                        <option value="explicit content">tr('reasonExplicit')</option>
                        <option value="scam">tr('reasonScam')</option>
                        <option value="other">tr('reasonOther')</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-accent uppercase tracking-wider">{tr('detailsExplanation')}</p>
                      <textarea
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder={tr('describeBehavior')}
                        className="w-full bg-white border border-amber-200 rounded-xl p-3 text-xs min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleReportUser}
                        disabled={isProcessing}
                        className="flex-1 bg-accent text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md"
                      >
                        {isProcessing ? 'Submitting...' : tr('submitReport')}
                      </button>
                      <button
                        onClick={() => setIsReportOpen(false)}
                        className="px-4 bg-white border border-border text-gray-500 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                      >
                        {tr('cancel')}
                      </button>
                    </div>
                  </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
}
