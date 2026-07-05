'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { queueSMS } from '@/lib/sms';
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
  const [photos, setPhotos] = useState<string[]>(profile?.gallery_urls || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    interests: profile?.interests || '',
    preferred_language: profile?.preferred_language || 'en',
    enable_abushakir: profile?.enable_abushakir !== false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Guardian System Addon State
  const [guardian, setGuardian] = useState<any>(null);
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Vouching System State
  const [vouchRequests, setVouchRequests] = useState<any[]>([]);
  const [vouchName, setVouchName] = useState('');
  const [vouchEmail, setVouchEmail] = useState('');
  const [vouchRelationship, setVouchRelationship] = useState<'friend' | 'clergy' | 'family_elder' | 'colleague'>('friend');
  const [vouchDuration, setVouchDuration] = useState(1);
  const [isSendingVouchInvite, setIsSendingVouchInvite] = useState(false);

  useEffect(() => {
    const fetchGuardian = async () => {
      const { data } = await supabase.from('guardians').select('*').eq('user_id', profile.id).limit(1);
      if (data && data.length > 0) {
        setGuardian(data[0]);
        setGuardianEmail(data[0].guardian_email || '');
        setGuardianPhone(data[0].guardian_phone || '');
      }
    };
    const fetchVouches = async () => {
      const { data } = await supabase.from('vouch_records').select('*').eq('user_id', profile.id);
      if (data) setVouchRequests(data);
    };
    fetchGuardian();
    fetchVouches();
  }, [profile.id]);

  const linkGuardian = async () => {
    setIsLinking(true);
    const { data, error } = await supabase.from('guardians').insert({
      user_id: profile.id,
      guardian_email: guardianEmail,
      guardian_phone: guardianPhone,
      status: 'pending'
    }).select().single();
    
    if (!error && data) {
      setGuardian(data);
      alert("Guardian connection code generated successfully!");
    } else {
      alert("Failed to link guardian: " + (error?.message || "Unknown error"));
    }
    setIsLinking(false);
  };

  const sendVouchInvite = async () => {
    if (!vouchName || !vouchEmail) return;
    setIsSendingVouchInvite(true);
    const { data, error } = await supabase.from('vouch_records').insert({
      user_id: profile.id,
      voucher_name: vouchName,
      voucher_email: vouchEmail,
      relationship: vouchRelationship,
      know_duration_years: vouchDuration,
      vouch_status: 'pending'
    }).select().single();

    if (!error && data) {
      setVouchRequests(prev => [data, ...prev]);
      setVouchName('');
      setVouchEmail('');
      
      // Queue SMS notification task
      await queueSMS(
        '+251946414018',
        `Hello ${vouchName}, you have been invited to vouch for ${profile?.full_name || 'a Beteseb candidate'}. Vouch here: http://beteseb1.online/${profile?.preferred_language || 'en'}/vouch?id=${data.id}`
      ).catch(() => {});

      alert(profile?.preferred_language === 'am' ? 'የምስክርነት ግብዣ ጥያቄ በተሳካ ሁኔታ ተልኳል!' : 'Character witness request sent successfully!');
    } else {
      alert("Failed to send invite: " + (error?.message || "Unknown error"));
    }
    setIsSendingVouchInvite(false);
  };

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
               {isUploading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Camera className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <input type="file" ref={avatarInputRef} className="hidden" onChange={handleAvatarUpload} accept="image/*" />
          </div>

          <div className="flex-1 text-center md:text-left space-y-3 md:space-y-4">
             <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl md:text-3xl font-black text-accent italic tracking-tighter">{profile?.full_name}</h2>
                <div className="flex items-center justify-center gap-2">
                   {profile?.is_verified && <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary fill-primary/10" />}
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

            <div className="space-y-4 pt-2 col-span-full">
               <label className="flex items-center gap-3 cursor-pointer">
                 <input 
                   type="checkbox"
                   checked={formData.enable_abushakir}
                   onChange={(e) => setFormData({...formData, enable_abushakir: e.target.checked})}
                   className="w-5 h-5 rounded-lg border-muted text-primary focus:ring-primary/20 accent-primary"
                 />
                 <span className="text-xs font-bold text-slate-600">
                   {profile?.preferred_language === 'am' 
                     ? 'የአቡሻህር ባህላዊ የኮከብ ምልክት ተኳኋኝነትን አሳይ (Enable Abushakir Star Matching)'
                     : 'Enable Abushakir Star Sign Matching (Optional)'}
                 </span>
               </label>
               <p className="text-[10px] text-gray-400 font-semibold italic pl-8">
                 {profile?.preferred_language === 'am'
                   ? '*ሲበራ የኮከብ ምልክትዎን በኢትዮጵያ ዘመን አቆጣጠር መሰረት በማስላት ተጨማሪ ባህላዊ ተኳኋኝነትን ያሳያል።'
                   : '*Allows supplementary cultural/heritage calculations based on the Ethiopian calendar.'}
               </p>
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

      {/* Guardian (Mize) Mediator System Card */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-black text-accent italic tracking-tighter flex items-center gap-2 justify-center md:justify-start">
             <ShieldCheck size={20} className="text-primary" /> 
             {profile?.preferred_language === 'am' ? 'የሚዜ / የአስታራቂ ሲስተም (Mize System)' : 'Guardian / Mediator (Mize) System'}
          </h3>
          <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
            {profile?.preferred_language === 'am' ? 'ባህላዊ እሴትን የጠበቀ የቤተሰብ እቅድ መከታተያ' : 'Culturally Safe Mediator Integration'}
          </p>
        </div>

        {guardian ? (
          <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
             <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                   <p className="text-xs font-bold text-accent">
                      {profile?.preferred_language === 'am' ? 'የአስታራቂ ዝርዝር' : 'Linked Mediator'}
                   </p>
                   <p className="text-sm font-medium text-gray-500 mt-1">{guardian.guardian_email || guardian.guardian_phone}</p>
                </div>
                <div className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">
                   {guardian.status}
                </div>
             </div>
             
             <div className="p-5 bg-white rounded-2xl border border-primary/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {profile?.preferred_language === 'am' ? 'የሚዜ መግቢያ ኮድ' : 'Mediator Access Code'}
                   </p>
                   <p className="text-2xl font-black tracking-widest text-primary mt-1">{guardian.access_code}</p>
                </div>
                <p className="text-[10px] text-gray-400 font-bold max-w-xs leading-relaxed text-center sm:text-left">
                   {profile?.preferred_language === 'am' 
                     ? 'ይህንን ኮድ ለአስታራቂዎ (ለምሳሌ ለሚዜ ወይም ለወላጅዎ) ይስጡ። እቃውን እና ተኳኋኝነትዎን በደህንነት ለመከታተል ይጠቀሙበታል።' 
                     : 'Provide this code to your mediator. They can use it to securely log in and overview your compatibility journey.'}
                </p>
             </div>
          </div>
        ) : (
          <div className="space-y-6">
             <p className="text-xs text-gray-500 leading-relaxed font-bold">
                {profile?.preferred_language === 'am'
                  ? 'የኢትዮጵያን ባህል በጠበቀ መልኩ፥ ትዳርን በግልጽነት ለመምረጥ አስታራቂ (የሚዜ ወይም ወላጅ) ማገናኘት ይችላሉ። አስታራቂዎ በመተግበሪያው ላይ ተኳኋኝነትዎን እንዲመለከት ፍቃድ ይሰጡታል።'
                  : 'In line with our cultural values, you can connect a mediator (such as a parent or mize) to overview your matches. They will receive secure access to guide you.'}
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="email" 
                  placeholder="Mediator Email" 
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                />
                <input 
                  type="text" 
                  placeholder="Mediator Phone (Optional)" 
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                />
             </div>
             <button 
               onClick={linkGuardian}
               disabled={isLinking || (!guardianEmail && !guardianPhone)}
               className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 disabled:opacity-50"
             >
                {isLinking ? 'GENERATING CODE...' : 'Generate Mediator Access Code (የሚዜ አገናኝ ኮድ ፍጠር)'}
             </button>
          </div>
        )}
      </div>
      {/* Vouching & Character References */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-muted shadow-xl space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-black text-accent italic tracking-tighter flex items-center gap-2 justify-center md:justify-start">
             {profile?.preferred_language === 'am' ? 'የታማኝነት ምስክርነት (Character Reference)' : 'Character Vouching & References'}
          </h3>
          <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
            {profile?.preferred_language === 'am' ? 'ባህላዊ እና ማህበረሰባዊ እምነት ማረጋገጫ' : 'Invite Witnesses to Verify Intent'}
          </p>
        </div>

        <div className="space-y-6">
           <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {profile?.preferred_language === 'am'
                ? 'የሚያምኑትን ጓደኛ፣ የሃይማኖት አባት ወይም የቅርብ የስራ ባልደረባ በመጋበዝ ምስክርነት እንዲሰጡዎት ማድረግ ይችላሉ። ምስክርነቱ ሲረጋገጥ በመገለጫዎ ላይ የታማኝነት ባጅ ይታያል።'
                : 'Build credit by inviting a trusted friend, spiritual leader, family elder, or colleague to vouch for your serious marriage intent.'}
           </p>

           {vouchRequests.length > 0 && (
             <div className="space-y-3">
               <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">
                 {profile?.preferred_language === 'am' ? 'የምስክርነቶች ሁኔታ' : 'References Status'}
               </h4>
               <div className="grid grid-cols-1 gap-3">
                 {vouchRequests.map(vouch => (
                   <div key={vouch.id} className="p-4 bg-muted/20 border border-muted rounded-2xl flex justify-between items-center text-xs">
                     <div>
                       <p className="font-bold">{vouch.voucher_name} <span className="text-[10px] text-gray-400 font-medium capitalize">({vouch.relationship})</span></p>
                       <p className="text-[10px] text-gray-400">{vouch.voucher_email}</p>
                       {vouch.witness_statement && <p className="mt-2 italic text-accent font-medium">« {vouch.witness_statement} »</p>}
                     </div>
                     <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                       vouch.vouch_status === 'approved' ? 'bg-green-500/10 text-green-500' :
                       vouch.vouch_status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                       'bg-yellow-500/10 text-yellow-500'
                     }`}>
                       {vouch.vouch_status}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
           )}

           <div className="border-t border-muted pt-6 space-y-4">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                {profile?.preferred_language === 'am' ? 'አዲስ ምስክር ጋብዝ' : 'Invite a New Witness'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <input 
                   type="text" 
                   placeholder="Witness Full Name" 
                   value={vouchName}
                   onChange={(e) => setVouchName(e.target.value)}
                   className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                 />
                 <input 
                   type="email" 
                   placeholder="Witness Email Address" 
                   value={vouchEmail}
                   onChange={(e) => setVouchEmail(e.target.value)}
                   className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                 />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <select 
                   value={vouchRelationship}
                   onChange={(e) => setVouchRelationship(e.target.value as any)}
                   className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                 >
                   <option value="friend">Friend / ጓደኛ</option>
                   <option value="clergy">Spiritual Leader / የሃይማኖት አባት</option>
                   <option value="family_elder">Family Elder / የቤተሰብ ሽማግሌ</option>
                   <option value="colleague">Colleague / የስራ ባልደረባ</option>
                 </select>
                 <input 
                   type="number" 
                   min={1}
                   placeholder="Years Known" 
                   value={vouchDuration}
                   onChange={(e) => setVouchDuration(parseInt(e.target.value) || 1)}
                   className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                 />
              </div>
              <button 
                onClick={sendVouchInvite}
                disabled={isSendingVouchInvite || !vouchName || !vouchEmail}
                className="w-full btn-primary py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
              >
                 {isSendingVouchInvite ? 'SENDING INVITATION...' : 'Send Vouch Invite (የምስክርነት ግብዣ ላክ)'}
              </button>
           </div>
        </div>
      </div>
      {/* Account Lifecycle & Security Compliance */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-red-100 shadow-xl space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-black text-red-600 italic tracking-tighter flex items-center gap-2 justify-center md:justify-start">
             {profile?.preferred_language === 'am' ? 'አካውንት በዘላቂነት ማጥፊያ (Danger Zone)' : 'Account Lifecycle (Danger Zone)'}
          </h3>
          <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
            {profile?.preferred_language === 'am' ? 'የአካውንት መረጃዎችን ሙሉ በሙሉ ማጥፊያ' : 'Unconditional Account Deletion'}
          </p>
        </div>
        
        <div className="space-y-6">
           <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {profile?.preferred_language === 'am'
                ? 'ማስጠንቀቂያ፦ አካውንቶን ማጥፋት የእርስዎን መገለጫ ፎቶዎች፣ ውይይቶች እና ሁሉንም መረጃዎች ከዳታቤዝ ውስጥ ሙሉ በሙሉ ያጠፋል። ይህ ድርጊት ወደ ኋላ መመለስ አይቻልም።'
                : 'Warning: Deleting your account will completely and permanently expunge all associated user data, profile images, and chat logs from the database. This action is irreversible.'}
           </p>
           
           <button 
             onClick={async () => {
               const confirmMsg = profile?.preferred_language === 'am'
                 ? 'በእርግጥ አካውንትዎን በዘላቂነት ማጥፋት ይፈልጋሉ? ይህ ድርጊት ሊመለስ አይችልም!'
                 : 'Are you absolutely sure you want to permanently delete your account? This will erase all your messages, profile details, and files. This action is irreversible.';
               
               if (confirm(confirmMsg)) {
                 const { error } = await supabase.rpc('delete_own_user_account');
                 if (!error) {
                   await supabase.auth.signOut();
                   alert(profile?.preferred_language === 'am' 
                     ? 'አካውንትዎ በደህንነት ተሰርዟል።' 
                     : 'Your account and all associated data have been permanently deleted.');
                   window.location.href = '/';
                 } else {
                   alert("Deletion failed: " + error.message);
                 }
               }
             }}
             className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20"
           >
              {profile?.preferred_language === 'am' ? 'አካውንት በዘላቂነት ሰርዝ' : 'Permanently Delete My Account'}
           </button>
        </div>
      </div>
    </div>
  );
}
