'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Heart, 
  MapPin, 
  Star, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
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

  useEffect(() => {
    const fetchMatchDetails = async () => {
      // Fetch Profile including gallery_photos
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', matchId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        if (profileData.gallery_photos) {
           setPhotos(profileData.gallery_photos.map((url: string) => ({ url })));
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

  return (
    <div className="fixed inset-0 bg-accent/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
        <button 
          onClick={onClose}
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
               <button onClick={prevPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 transition-all">
                 <ChevronLeft size={24} />
               </button>
               <button onClick={nextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 transition-all">
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
              <h3 className="text-sm font-black text-accent uppercase tracking-widest border-b border-muted pb-2">About</h3>
              <p className={`text-gray-500 leading-relaxed italic text-lg font-medium ${!isPremium ? 'blur-sm select-none' : ''}`}>
                &quot;{profile?.bio || 'No bio available yet.'}&quot;
              </p>
              {!isPremium && (
                <p className="text-[10px] font-black text-primary uppercase tracking-widest italic text-center pt-2">Upgrade to Premium to read full bio</p>
              )}
           </div>

           {profile?.interests && (
             <div className="space-y-4">
                <h3 className="text-sm font-black text-accent uppercase tracking-widest border-b border-muted pb-2">Interests</h3>
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
              <h3 className="text-sm font-black text-accent uppercase tracking-widest border-b border-muted pb-2">Contact Info</h3>
              <div className="bg-muted/30 p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Direct Email</p>
                    <p className={`text-sm font-bold text-accent ${!isPremium ? 'blur-md select-none' : ''}`}>
                       {isPremium ? profile?.email : '••••••••@••••.com'}
                    </p>
                 </div>
                 {!isPremium && (
                    <div className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black rounded-full uppercase tracking-tighter">
                       Premium Only
                    </div>
                 )}
              </div>
           </div>

           <div className="pt-10">
              {isPremium ? (
                <button 
                  onClick={() => onStartChat(matchId)}
                  className="w-full bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                >
                   <MessageCircle size={24} />
                   Start Connection
                </button>
              ) : (
                <div className="p-8 bg-muted rounded-[2.5rem] border border-primary/20 text-center space-y-4">
                   <ShieldCheck className="mx-auto text-primary" size={32} />
                   <p className="text-xs font-black text-accent uppercase tracking-widest">Premium Feature</p>
                   <p className="text-[10px] text-gray-500">Upgrade to Premium to view full details and start a conversation.</p>
                   <button 
                      onClick={() => window.location.reload()}
                      className="text-primary font-black text-[10px] uppercase tracking-[0.2em] underline"
                   >
                      Upgrade Now
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
