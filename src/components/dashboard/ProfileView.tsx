'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { 
  User, 
  Camera, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  Star,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';

export default function ProfileView({ profile, onUpdate }: { profile: any, onUpdate: () => void }) {
  const t = useTranslations('Dashboard.profile');
  const [photos, setPhotos] = useState<string[]>(profile?.gallery_photos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    interests: profile?.interests || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 5) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/gallery-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user_photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user_photos')
        .getPublicUrl(fileName);

      const newPhotos = [...photos, publicUrl];
      
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ gallery_photos: newPhotos })
        .eq('id', profile.id);

      if (dbError) throw dbError;

      setPhotos(newPhotos);
    } catch (error: any) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoUrl: string) => {
    try {
      const newPhotos = photos.filter(p => p !== photoUrl);
      
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ gallery_photos: newPhotos })
        .eq('id', profile.id);

      if (dbError) throw dbError;

      setPhotos(newPhotos);
    } catch (error: any) {
      alert('Delete failed: ' + error.message);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', profile.id);

    if (!error) {
      onUpdate();
      alert('Profile updated successfully!');
    } else {
      alert('Update failed: ' + error.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Header Profile Section */}
      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[2.5rem] bg-muted border-4 border-white shadow-2xl overflow-hidden">
               <Image 
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200'} 
                alt="Avatar" 
                width={160} 
                height={160} 
                className="w-full h-full object-cover"
               />
            </div>
            <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
               <Camera size={20} />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
             <div className="flex items-center justify-center md:justify-start gap-3">
                <h2 className="text-3xl font-black text-accent italic tracking-tighter">{profile?.full_name}</h2>
                {profile?.is_verified && <CheckCircle2 size={24} className="text-primary fill-primary/10" />}
             </div>
             <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">{profile?.star_sign}</span>
                <span className="px-4 py-1.5 bg-muted text-gray-500 text-[10px] font-black rounded-full uppercase tracking-widest">{profile?.location}</span>
                <span className="px-4 py-1.5 bg-accent/5 text-accent text-[10px] font-black rounded-full uppercase tracking-widest">{profile?.role}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Section */}
      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl space-y-8">
        <div className="flex justify-between items-center">
           <div className="space-y-1">
              <h3 className="text-xl font-black text-accent italic tracking-tighter flex items-center gap-2">
                 <Sparkles size={20} className="text-primary" /> Multi-Photo Gallery
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Share up to 5 additional photos ( {photos.length} / 5 )</p>
           </div>
           {photos.length < 5 && (
             <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all"
             >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add Photo
             </button>
           )}
           <input type="file" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} accept="image/*" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           {photos.map((photoUrl, index) => (
             <div key={index} className="relative aspect-[3/4] group rounded-2xl overflow-hidden border border-muted">
                <Image src={photoUrl} alt="Gallery" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                <button 
                  onClick={() => deletePhoto(photoUrl)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                   <Trash2 size={14} />
                </button>
             </div>
           ))}
           {Array.from({ length: 5 - photos.length }).map((_, i) => (
             <div key={i} className="aspect-[3/4] rounded-2xl bg-muted/50 border-2 border-dashed border-muted flex flex-col items-center justify-center text-gray-300 gap-2">
                <Camera size={24} />
                <span className="text-[8px] font-bold uppercase tracking-widest">Empty Slot</span>
             </div>
           ))}
        </div>
      </div>

      {/* Edit Details Section */}
      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl space-y-8">
        <h3 className="text-xl font-black text-accent italic tracking-tighter flex items-center gap-2">
           <User size={20} className="text-primary" /> About & Interests
        </h3>
        
        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Bio / About Me</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell others about yourself..."
                className="w-full bg-muted/30 border border-muted rounded-[2rem] p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Interests & Hobbies (Comma separated)</label>
              <input 
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({...formData, interests: e.target.value})}
                placeholder="Tradition, Family, Travel, Cooking..."
                className="w-full bg-muted/30 border border-muted rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
           </div>

           <button 
             onClick={handleSaveProfile}
             disabled={isSaving}
             className="w-full bg-accent text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
           >
              {isSaving ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
              Save Changes
           </button>
        </div>
      </div>
    </div>
  );
}
