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
  Loader2 
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
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
          .single();
        
        if (friendship) {
          setFriendshipStatus(friendship.status);
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
      alert(locale === 'am' ? 'ተጠቃሚው ሪፖርት ተደርጓል።' : 'User reported successfully.');
      setIsReportOpen(false);
      setReportDetails('');
    } else {
      alert("Report failed: " + error.message);
    }
    setIsProcessing(false);
  };

  const handleBlockUser = async () => {
    const confirmBlock = confirm(
      locale === 'am' 
        ? 'በእርግጥ ይህንን ተጠቃሚ ማገድ ይፈልጋሉ? ይህ ተጠቃሚ ከጓደኛ ዝርዝርዎ እና ከምርጫዎችዎ ውስጥ ወዲያውኑ ይወገዳል።' 
        : 'Are you sure you want to block this user? They will be removed from your match feed and chat list immediately.'
    );
    if (!confirmBlock) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsProcessing(true);
    const { error } = await supabase.from('blocks').insert({
      blocker_id: user.id,
      blocked_id: matchId
    });

    if (!error) {
      alert(locale === 'am' ? 'ተጠቃሚው ታግዷል።' : 'User blocked successfully.');
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
              <p className="text-[9px] text-gray-400 font-bold italic leading-relaxed">
                 {locale === 'am' 
                   ? '*የአቡሻህር ባህላዊ የኮከብ ምልክት ግንዛቤዎች ለተጨማሪ መረጃ ብቻ የሚያገለግሉ ሲሆን ለትዳር ስኬት ፍጹም ዋስትና አይደሉም።'
                   : '*Abushakir star sign insights are supplementary cultural indicators only and do not guarantee relationship or marriage success.'}
               </p>
           </div>

           {guardianEndorsement && (
              <div className={`p-6 rounded-[2rem] border flex items-start gap-4 shadow-md ${guardianEndorsement.status === 'endorsed' ? 'bg-green-50/50 border-green-100 text-green-800' : 'bg-red-50/50 border-red-100 text-red-800'}`}>
                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    {guardianEndorsement.status === 'endorsed' ? <CheckCircle2 className="text-green-600" size={20} /> : <X className="text-red-600" size={20} />}
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">
                       {locale === 'am' ? 'የሚዜ ምክርና ምርቃት' : 'Mediator Approval Note'}
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

           <div className="space-y-4">
              <h3 className="text-sm font-black text-accent uppercase tracking-widest border-b border-muted pb-2">
                 {locale === 'am' ? 'የግንኙነት መረጃ (Contact Info)' : 'Contact Info'}
              </h3>
              <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 space-y-2">
                 <p className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} /> {locale === 'am' ? "ደህንነቱ የተጠበቀ ግንኙነት" : "Privacy Shield Enabled"}
                 </p>
                 <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                    {locale === 'am'
                      ? "ስልክ ቁጥር እና ኢሜይል ለደህንነት ሲባል ተደብቀዋል። እባክዎ ጥበቃ የተደረገበትን የውስጥ ቻት፣ የድምጽ ወይም የቪዲዮ ጥሪን በመጠቀም ይነጋገሩ።"
                      : "Direct phone numbers and emails are permanently hidden for privacy. Please use the secure built-in chat, audio call, or video call features."}
                 </p>
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
                     <Clock size={24} />
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

                {/* Block and Report Panel */}
                <div className="flex gap-4 pt-4 border-t border-muted">
                  <button
                    onClick={() => setIsReportOpen(!isReportOpen)}
                    className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-amber-200 transition-all flex items-center justify-center gap-2"
                  >
                    ⚠️ {locale === 'am' ? 'ሪፖርት አድርግ (Report)' : 'Report User'}
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-red-200 transition-all flex items-center justify-center gap-2"
                  >
                    🚫 {locale === 'am' ? 'አግድ (Block)' : 'Block User'}
                  </button>
                </div>

                {/* Inline Report Dialog */}
                {isReportOpen && (
                  <div className="p-6 bg-amber-50/50 border border-amber-200 rounded-3xl space-y-4 animate-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-accent uppercase tracking-wider">{locale === 'am' ? 'ሪፖርት የማድረጊያ ምክንያት' : 'Select Reason for Report'}</p>
                      <select 
                        value={reportReason} 
                        onChange={(e) => setReportReason(e.target.value as any)}
                        className="w-full p-3 bg-white border border-amber-200 rounded-xl font-bold text-xs"
                      >
                        <option value="abuse">{locale === 'am' ? 'ማስፈራራት ወይም ስድብ (Abuse / Harassment)' : 'Abuse or Harassment'}</option>
                        <option value="explicit content">{locale === 'am' ? 'ያልተገባ ምስል ወይም ፅሁፍ (Explicit Content)' : 'Explicit Content'}</option>
                        <option value="scam">{locale === 'am' ? 'ማጭበርበር (Scam / Fraud)' : 'Scam or Fraud'}</option>
                        <option value="other">{locale === 'am' ? 'ሌላ ምክንያት (Other Reason)' : 'Other Reason'}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-accent uppercase tracking-wider">{locale === 'am' ? 'ተጨማሪ ማብራሪያ' : 'Details / Explanation'}</p>
                      <textarea
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder={locale === 'am' ? 'ስለ ሁኔታው በዝርዝር ይፃፉ...' : 'Please describe the behavior...'}
                        className="w-full bg-white border border-amber-200 rounded-xl p-3 text-xs min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleReportUser}
                        disabled={isProcessing}
                        className="flex-1 bg-accent text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md"
                      >
                        {isProcessing ? 'Submitting...' : (locale === 'am' ? 'ሪፖርት ላክ' : 'Submit Report')}
                      </button>
                      <button
                        onClick={() => setIsReportOpen(false)}
                        className="px-4 bg-white border border-border text-gray-500 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                      >
                        {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
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
