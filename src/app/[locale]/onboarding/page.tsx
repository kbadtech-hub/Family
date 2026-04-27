'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { 
  Heart, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Briefcase, 
  ShieldCheck, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Wallet,
  Users,
  Handshake,
  BookOpen,
  UploadCloud,
  Eye,
  EyeOff,
  Camera,
  Loader2,
  Sparkles
} from 'lucide-react';
import VerificationGate from '@/components/dashboard/VerificationGate';
import { calculateStarSign, StarSignLabels } from '@/lib/abushakir';
import { 
  RELIGIONS, 
  GENDERS, 
  LOCATIONS, 
  MARITAL_STATUSES,
  FAMILY_VALUES,
  FINANCE_HABITS,
  CONFLICT_RESOLUTIONS,
  JOB_CATEGORIES,
  SPOUSE_REQUIREMENTS_TAGS
} from '@/lib/constants';
import { COUNTRIES } from '@/lib/countries';
import { Mail, Phone, Globe } from 'lucide-react';

function OnboardingContent() {
  const t = useTranslations('Onboarding');
  const t_const = useTranslations('Constants');
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'Local' | 'Diaspora' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    country_code: '+251',
    password: '',
    full_name: '',
    birth_date: '',
    birth_time: '12:00',
    location: '',
    gender: '',
    religion: '',
    education: '',
    job: '',
    marital_status: '',
    finance_habit: '',
    conflict_resolution: '',
    family_value: '',
    spouse_requirements: '',
    star_sign: '',
    gallery_photos: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);
  const idFileInputRef = React.useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();

  const updateField = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'birth_date' || field === 'birth_time') {
        if (next.birth_date) {
            const date = new Date(next.birth_date);
            next.star_sign = calculateStarSign(date, next.birth_time);
        }
      }
      return next;
    });
  }

  useEffect(() => {
    const pref = searchParams.get('pref_location') as 'Local' | 'Diaspora' | null;
    if (pref) {
      setUserType(pref);
      if (pref === 'Diaspora') {
        updateField('location', 'United States'); // Default country for diaspora
      } else if (pref === 'Local') {
        updateField('location', 'Addis Ababa'); // Default city for local
      }
    }

    const stepParam = searchParams.get('step');
    if (stepParam) {
      setStep(parseInt(stepParam));
      // Try to get userId if it exists in session
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setUserId(user.id);
      });
    }
  }, [searchParams]);

  const nextStep = () => setStep(s => Math.min(s + 1, 7));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const currency = userType === 'Diaspora' ? 'USD' : 'ETB';

      const signUpOptions: any = {
        password: formData.password,
        options: {
          data: { 
            ...formData,
            currency_locked: currency,
            is_onboarded: true,
            birth_date: formData.birth_date || null
          }
        }
      };

      if (authMode === 'email') {
        signUpOptions.email = formData.email;
      } else {
        signUpOptions.phone = `${formData.country_code}${formData.phone}`;
      }

      const { data, error: authError } = await supabase.auth.signUp(signUpOptions);

      if (authError) throw authError;

      if (data.user) {
        setUserId(data.user.id);
      }
      setStep(5); // Move to Gallery
    } catch (error: any) {
      setErrorMsg(error.message);
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-accent italic">{t('personalDetails')}</h2>
            <p className="text-gray-500">{t('personalSubtitle')}</p>
            
            {errorMsg && <div className="p-4 bg-red-100 text-red-600 rounded-xl">{errorMsg}</div>}
            
            {/* Auth Mode Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
              <button
                onClick={() => setAuthMode('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'email' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
              >
                <Mail size={14} /> {t('fields.email')}
              </button>
              <button
                onClick={() => setAuthMode('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'phone' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
              >
                <Phone size={14} /> {t('fields.phoneTab')}
              </button>
            </div>

            <div className="space-y-4">
              {authMode === 'email' ? (
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('fields.email')}</span>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted" 
                    placeholder="name@example.com"
                  />
                </label>
              ) : (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">{t('fields.phone')}</span>
                  <div className="flex gap-2">
                    <select
                      value={formData.country_code}
                      onChange={(e) => updateField('country_code', e.target.value)}
                      className="block w-32 rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted font-bold text-sm"
                    >
                      {COUNTRIES.map(c => <option key={c.iso} value={c.code}>{c.iso} {c.code}</option>)}
                    </select>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="block flex-1 rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted" 
                      placeholder="912345678"
                    />
                  </div>
                </div>
              )}
              <label className="block">
                <span className="text-sm font-medium text-gray-700">{t('fields.password')}</span>
                <div className="relative">
                  <input 
                     type={showPassword ? 'text' : 'password'} 
                     value={formData.password}
                     onChange={(e) => updateField('password', e.target.value)}
                     className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted pr-12" 
                     placeholder={t('fields.passwordHint')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-all rounded-xl mt-0.5"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">{t('fields.fullName')}</span>
                <input 
                   type="text" 
                   value={formData.full_name}
                   onChange={(e) => updateField('full_name', e.target.value)}
                   className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted" 
                   placeholder={t('fields.fullNamePlaceholder')}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar size={16} /> {t('fields.birthDate')}
                  </span>
                  <input 
                    type="date" 
                    value={formData.birth_date}
                    onChange={(e) => updateField('birth_date', e.target.value)}
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted" 
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock size={16} /> {t('fields.birthTime')}
                  </span>
                  <input 
                    type="time" 
                    value={formData.birth_time}
                    onChange={(e) => updateField('birth_time', e.target.value)}
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted" 
                  />
                </label>
              </div>

              {formData.star_sign && (
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-3">
                  <ShieldCheck className="text-primary" />
                  <div>
                    <p className="text-[10px] text-primary font-black uppercase tracking-wider">{t('fields.abushakirBadge')}</p>
                    <p className="text-accent font-bold">{(StarSignLabels as any)[formData.star_sign]}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-accent italic">{t('demographics')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                   <User size={16} /> {t('fields.gender')}
                </span>
                <select 
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                >
                  <option value="">{t('fields.genderPlaceholder')}</option>
                  {GENDERS.map(g => <option key={g} value={g}>{t_const(`Genders.${g}`)}</option>)}
                </select>
              </label>
              
              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                   <MapPin size={16} /> {userType === 'Local' ? t('fields.location') : t('fields.country')}
                </span>
                <select 
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                >
                  <option value="">{userType === 'Local' ? t('fields.locationPlaceholder') : t('fields.countryPlaceholder')}</option>
                  {userType === 'Local' ? (
                    LOCATIONS.filter(l => l !== 'Other (International)').map(l => <option key={l} value={l}>{t_const(`Locations.${l}`)}</option>)
                  ) : (
                    COUNTRIES.map(c => <option key={c.iso} value={c.name}>{c.name}</option>)
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                   <BookOpen size={16} /> {t('fields.religion')}
                </span>
                <select 
                   value={formData.religion}
                   onChange={(e) => updateField('religion', e.target.value)}
                   className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                >
                  <option value="">{t('fields.religionPlaceholder')}</option>
                  {RELIGIONS.map(r => <option key={r} value={r}>{t_const(`Religions.${r}`)}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                   <Heart size={16} /> {t('fields.maritalStatus')}
                </span>
                <select 
                  value={formData.marital_status}
                  onChange={(e) => updateField('marital_status', e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                >
                  <option value="">{t('fields.maritalPlaceholder')}</option>
                  {MARITAL_STATUSES.map(s => <option key={s} value={s}>{t_const(`Marital.${s}`)}</option>)}
                </select>
              </label>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-accent italic">{t('career')}</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Briefcase size={16} /> {t('fields.jobTitle')}
                </span>
                <select 
                  value={formData.job}
                  onChange={(e) => updateField('job', e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                >
                  <option value="">{t('fields.jobPlaceholder')}</option>
                  {JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                     <Wallet size={16} /> {t('fields.financeHabit')}
                  </span>
                  <select 
                     value={formData.finance_habit}
                     onChange={(e) => updateField('finance_habit', e.target.value)}
                     className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                  >
                    <option value="">{t('fields.financePlaceholder')}</option>
                    {FINANCE_HABITS.map(h => <option key={h} value={h}>{t_const(`Finance.${h}`)}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                     <Users size={16} /> {t('fields.familyValues')}
                  </span>
                  <select 
                    value={formData.family_value}
                    onChange={(e) => updateField('family_value', e.target.value)}
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                  >
                    <option value="">{t('fields.familyPlaceholder')}</option>
                    {FAMILY_VALUES.map(v => <option key={v} value={v}>{t_const(`Values.${v}`)}</option>)}
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                     <Handshake size={16} /> {t('fields.conflictResolution')}
                  </span>
                  <select 
                    value={formData.conflict_resolution}
                    onChange={(e) => updateField('conflict_resolution', e.target.value)}
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                  >
                    <option value="">{t('fields.conflictPlaceholder')}</option>
                    {CONFLICT_RESOLUTIONS.map(c => <option key={c} value={c}>{t_const(`Conflict.${c}`)}</option>)}
                  </select>
                </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-4">
                   <Heart size={16} className="text-primary" /> {t('fields.spouseRequirements')}
                </span>
                <div className="flex flex-wrap gap-3">
                  {SPOUSE_REQUIREMENTS_TAGS.map(tag => {
                    const isSelected = formData.spouse_requirements.split(', ').includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const currentTags = formData.spouse_requirements ? formData.spouse_requirements.split(', ') : [];
                          const nextTags = isSelected 
                            ? currentTags.filter(t => t !== tag)
                            : [...currentTags, tag].filter(Boolean);
                          updateField('spouse_requirements', nextTags.join(', '));
                        }}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          isSelected 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                            : 'bg-muted text-gray-400 hover:bg-muted/80'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </label>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-accent italic">{t('reviewTitle')}</h2>
            <p className="text-gray-500">{t('reviewSubtitle')}</p>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               <div className="bg-muted/30 p-6 rounded-[2rem] space-y-4">
                  <div className={`flex justify-between border-b border-muted/50 pb-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                     <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t('fields.fullName')}</span>
                     <span className="font-bold text-accent">{formData.full_name}</span>
                  </div>
                  <div className={`flex justify-between border-b border-muted/50 pb-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                     <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t('fields.starSign')}</span>
                     <span className="font-bold text-primary">{(StarSignLabels as any)[formData.star_sign] || t('fields.unknown')}</span>
                  </div>
                  <div className={`flex justify-between border-b border-muted/50 pb-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                     <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{userType === 'Local' ? t('fields.location') : t('fields.country')}</span>
                     <span className="font-bold text-accent">{formData.location}</span>
                  </div>
                  <div className={`flex justify-between border-b border-muted/50 pb-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                     <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t('fields.religion')}</span>
                     <span className="font-bold text-accent">{formData.religion}</span>
                  </div>
                  <div className={`flex justify-between border-b border-muted/50 pb-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                     <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t('fields.jobTitle')}</span>
                     <span className="font-bold text-accent">{formData.job}</span>
                  </div>
               </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
             <div className="space-y-4 text-center">
                <h2 className="text-3xl font-black text-accent italic">{t('gallery')}</h2>
                <p className="text-gray-500">{t('gallerySubtitle')}</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.gallery_photos.map((url, i) => (
                  <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden group border border-muted shadow-lg">
                     <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt="Gallery" />
                     <button 
                       onClick={() => {
                         const next = formData.gallery_photos.filter((_, idx) => idx !== i);
                         setFormData({ ...formData, gallery_photos: next });
                       }}
                       className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <X size={14} />
                     </button>
                  </div>
                ))}
                {formData.gallery_photos.length < 5 && (
                  <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/30 transition-all group">
                     <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Camera size={24} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('galleryUpload')}</span>
                     <input 
                       type="file" 
                       multiple 
                       className="hidden" 
                       accept="image/*"
                       onChange={async (e) => {
                         const files = Array.from(e.target.files || []);
                         if (!files.length || !userId) return;
                         
                         setIsSubmitting(true);
                         const uploadedUrls = [...formData.gallery_photos];
                         
                         for (const file of files) {
                           if (uploadedUrls.length >= 5) break;
                           const fileExt = file.name.split('.').pop();
                           const fileName = `${userId}/onboarding-${Date.now()}-${Math.random()}.${fileExt}`;
                           
                           const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
                           if (!error) {
                             const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                             uploadedUrls.push(publicUrl);
                           }
                         }
                         
                         // Sync with DB
                         await supabase.from('profiles').update({ gallery_photos: uploadedUrls }).eq('id', userId);
                         setFormData({ ...formData, gallery_photos: uploadedUrls });
                         setIsSubmitting(false);
                       }}
                     />
                  </label>
                )}
             </div>

             <div className="text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t('galleryLimit')} ( {formData.gallery_photos.length} / 5 )</p>
             </div>
          </div>
        );
      case 6:
        return userId ? (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <VerificationGate 
               userId={userId} 
               onVerified={() => {
                 setVerificationStatus('verified');
                 setStep(7);
                 setTimeout(() => router.push('/dashboard'), 2000);
               }} 
             />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20">
             <Loader2 size={40} className="text-primary animate-spin" />
             <p className="mt-4 font-bold text-accent italic">Preparing Verification...</p>
          </div>
        );
      case 7:
        return (
          <div className="space-y-8 text-center animate-in zoom-in duration-500">
             <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-xl shadow-green-500/10">
                <CheckCircle2 size={48} className="text-green-500" />
             </div>
             <h2 className="text-4xl font-bold text-accent italic">{t('finishTitle')}</h2>
             <p className="text-lg text-gray-600">{t('finishSubtitle')}</p>
             
             <button 
                onClick={() => router.push('/dashboard')}
                className="w-full btn-primary text-xl py-4 shadow-xl shadow-primary/20"
             >
                {t('finishCTA')}
             </button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[var(--secondary)] bg-opacity-10 py-12 px-4 flex items-center justify-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-xl w-full">
        <div className="mb-8 flex justify-between items-center px-4">
          {[1,2,3,4,5,6,7].map(i => (
             <React.Fragment key={i}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${step >= i ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white text-gray-300'}`}>
                   <span className="text-[10px]">{i}</span>
                </div>
                {i < 7 && <div className={`flex-1 h-1 mx-2 rounded-full ${step > i ? 'bg-primary' : 'bg-white'}`} />}
             </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100 relative overflow-hidden">
          <div className={`absolute top-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-32 h-32 bg-primary/5 rounded-full ${locale === 'ar' ? '-ml-16' : '-mr-16'} -mt-16 blur-3xl opacity-50`} />
          <div className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} w-32 h-32 bg-secondary/10 rounded-full ${locale === 'ar' ? '-mr-16' : '-ml-16'} -mb-16 blur-2xl opacity-40`} />
          
          <div className="relative">
            {renderStep()}

            {step < 6 && (
              <div className={`mt-12 flex justify-between gap-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                {step > 1 && (
                  <button 
                    onClick={prevStep}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    {locale === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />} {t('nav.back')}
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (step === 3 && !formData.spouse_requirements) {
                      alert(locale === 'am' ? 'እባክዎ የሚያገባውን ሰው መስፈርት ይግለጹ (ግዴታ)' : 'Please fill in Spouse Requirements (Mandatory)');
                      return;
                    }
                    if (step === 4) handleFinish();
                    else nextStep();
                  }}
                  disabled={isSubmitting}
                  className={`flex-[2] btn-primary flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50' : ''}`}
                >
                  {isSubmitting ? t('nav.processing') : (step === 7 ? t('nav.finish') : t('nav.continue'))} {locale === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-accent/40 flex flex-col items-center gap-4">
           <Heart size={24} className="fill-primary text-primary" />
           <p className="font-bold text-lg tracking-widest uppercase">{locale === 'am' ? 'ቤተሰብ' : 'Beteseb'}</p>
           <p className="text-sm">{t('footerTagline')}</p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const t = useTranslations('Onboarding');
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-accent italic">{t('loading')}</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
