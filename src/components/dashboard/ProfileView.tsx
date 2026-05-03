'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
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
  const router = useRouter();
  const pathname = usePathname();
  const [photos, setPhotos] = useState<string[]>(profile?.gallery_photos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    interests: profile?.interests || '',
    preferred_language: profile?.preferred_language || 'en'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user_photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user_photos')
        .getPublicUrl(fileName);
      
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (dbError) throw dbError;
      onUpdate();
    } catch (error: any) {
      alert(t('alerts.avatarFailed') + ': ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

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
        .update({ gallery_urls: newPhotos })
        .eq('id', profile.id);

      if (dbError) throw dbError;

      setPhotos(newPhotos);
    } catch (error: any) {
      alert(t('alerts.uploadFailed') + ': ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoUrl: string) => {
    try {
      const newPhotos = photos.filter(p => p !== photoUrl);
      
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ gallery_urls: newPhotos })
        .eq('id', profile.id);

      if (dbError) throw dbError;

      setPhotos(newPhotos);
    } catch (error: any) {
      alert(t('alerts.deleteFailed') + ': ' + error.message);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    // Check if username is taken if changed
    if (formData.username && formData.username !== profile.username) {
       const { data: existing } = await supabase.from('profiles').select('id').eq('username', formData.username).single();
       if (existing) {
          alert(t('alerts.usernameTaken'));
          setIsSaving(false);
          return;
       }
    }

    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', profile.id);

    if (!error) {
      onUpdate();
      alert(t('alerts.updateSuccess'));
    } else {
      alert(t('alerts.updateFailed') + ': ' + error.message);
    }
    setIsSaving(false);
  };

  const handleLanguageChange = (newLocale: string) => {
    setFormData({...formData, preferred_language: newLocale});
    router.replace(pathname, { locale: newLocale });
  };

  const languages = [
    { id: 'en', label: 'English' },
    { id: 'am', label: 'አማርኛ' },
    { id: 'om', label: 'Oromoo' },
    { id: 'ar', label: 'العربية' },
    { id: 'ti', label: 'ትግርኛ' },
    { id: 'so', label: 'Soomaali' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-12 pb-20">
      {/* Header Profile Section */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] md:rounded-[2.5rem] bg-muted border-4 border-white shadow-2xl overflow-hidden">
               <Image 
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200'} 
                alt="Avatar" 
                width={160} 
                height={160} 
                className="w-full h-full object-cover"
               />
            </div>
            <button 
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
            >
               {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} md:size={20} />}
            </button>
            <input type="file" ref={avatarInputRef} className="hidden" onChange={handleAvatarUpload} accept="image/*" />
          </div>

          <div className="flex-1 text-center md:text-left space-y-3 md:space-y-4">
             <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl md:text-3xl font-black text-accent italic tracking-tighter">{profile?.full_name}</h2>
                <div className="flex items-center justify-center gap-2">
                   {profile?.is_verified && <CheckCircle2 size={16} md:size={20} className="text-primary fill-primary/10" />}
                   {profile?.username && <span className="text-[10px] md:text-xs font-bold text-gray-400">@{profile.username}</span>}
                </div>
             </div>
             <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                <span className="px-3 py-1 md:px-4 md:py-1.5 bg-primary/10 text-primary text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest">{profile?.star_sign}</span>
                <span className="px-3 py-1 md:px-4 md:py-1.5 bg-muted text-gray-500 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest">{profile?.location?.city || t('defaultCity')}</span>
                <span className="px-3 py-1 md:px-4 md:py-1.5 bg-accent/5 text-accent text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest">{t('roles.' + (profile?.role || 'user'))}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8">
        <h3 className="text-lg md:text-xl font-black text-accent italic tracking-tighter flex items-center gap-2 justify-center md:justify-start">
           <ShieldCheck size={20} className="text-primary" /> {t('settings')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
           <div className="space-y-2">
              <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{t('fullName')}</label>
              <input 
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full bg-muted/30 border border-muted rounded-xl md:rounded-2xl p-4 md:p-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{t('username')}</label>
              <div className="relative">
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                 <input 
                   type="text"
                   value={formData.username}
                   onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '')})}
                   placeholder={t('usernamePlaceholder')}
                   className="w-full bg-muted/30 border border-muted rounded-xl md:rounded-2xl p-4 md:p-5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{t('systemLanguage')}</label>
              <select 
                value={formData.preferred_language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full bg-muted/30 border border-muted rounded-xl md:rounded-2xl p-4 md:p-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
              >
                 {languages.map(lang => (
                   <option key={lang.id} value={lang.id}>{lang.label}</option>
                 ))}
              </select>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg md:text-xl font-black text-accent italic tracking-tighter flex items-center gap-2 justify-center md:justify-start">
                 <Sparkles size={20} className="text-primary" /> {t('gallery')}
              </h3>
              <p className="text-[8px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">{t('gallerySub', { count: photos.length })}</p>
           </div>
           {photos.length < 5 && (
             <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full md:w-auto bg-primary text-white px-6 py-4 md:py-3 rounded-xl md:rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-105 transition-all"
             >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {t('addPhoto')}
             </button>
           )}
           <input type="file" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} accept="image/*" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
           {photos.map((photoUrl, index) => (
             <div key={index} className="relative aspect-[3/4] group rounded-xl md:rounded-2xl overflow-hidden border border-border">
                <Image src={photoUrl} alt="Gallery" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                <button 
                  onClick={() => deletePhoto(photoUrl)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg md:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                   <Trash2 size={14} />
                </button>
             </div>
           ))}
           {Array.from({ length: 5 - photos.length }).map((_, i) => (
             <div key={i} className="aspect-[3/4] rounded-xl md:rounded-2xl bg-muted/50 border-2 border-dashed border-muted flex flex-col items-center justify-center text-gray-300 gap-2">
                <Camera size={20} />
                <span className="text-[8px] font-bold uppercase tracking-widest">{t('emptySlot')}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8">
        <h3 className="text-lg md:text-xl font-black text-accent italic tracking-tighter flex items-center gap-2 justify-center md:justify-start">
           <User size={20} className="text-primary" /> {t('aboutInterests')}
        </h3>
        
           <div className="space-y-2">
              <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{t('bio')}</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder={t('bioPlaceholder')}
                className="w-full bg-muted/30 border border-muted rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none text-foreground"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{t('interests')}</label>
              <input 
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({...formData, interests: e.target.value})}
                placeholder={t('interestsPlaceholder')}
                className="w-full bg-muted/30 border border-muted rounded-xl md:rounded-2xl p-5 md:p-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
              />
           </div>

           <button 
             onClick={handleSaveProfile}
             disabled={isSaving}
             className="w-full bg-accent text-white py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
           >
              {isSaving ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
              {t('saveChanges')}
           </button>
      </div>
    </div>
  );
}
