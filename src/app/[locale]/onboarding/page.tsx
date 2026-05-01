'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Camera,
  Loader2,
  X,
  Upload
} from 'lucide-react';
import { calculateStarSign } from '@/lib/abushakir';
import { simulateIdentityVerification } from '@/lib/verification';
import { 
  RELIGIONS, 
  GENDERS, 
  FAMILY_VALUES,
  FINANCE_HABITS,
  CONFLICT_RESOLUTIONS,
  JOB_CATEGORIES,
  SPOUSE_REQUIREMENTS_TAGS,
  HAVE_CHILDREN_OPTIONS,
  FUTURE_CHILDREN_OPTIONS,
  MARITAL_STATUS_MALE,
  MARITAL_STATUS_FEMALE,
  PARTNER_MARITAL_PREF_OPTIONS
} from '@/lib/constants';
import { COUNTRIES } from '@/lib/countries';
import ethiopianDate from 'ethiopian-date';

function OnboardingContent() {
  const t = useTranslations('Onboarding');
  const t_const = useTranslations('Constants');
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [prefLocation, setPrefLocation] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
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
    star_sign: '',
    gallery_photos: [] as string[],
    spouse_requirements: [] as string[],
    has_children: '',
    partner_countries: [] as string[],
    partner_age_min: 18,
    partner_age_max: 50,
    partner_religion: '',
    partner_intent: '',
    partner_children_pref: '',
    eth_birth_day: '',
    eth_birth_month: '',
    eth_birth_year: '',
    calendar_type: (locale === 'am' || locale === 'om' || locale === 'ti' || locale === 'so') ? 'ethiopian' : 'gregorian',
    future_children: '',
    id_photo: '',
    selfie_photo: ''
  });

  const searchParams = useSearchParams();

  const updateField = React.useCallback((field: string, value: string | number | string[]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Handle Ethiopian Date Conversion
      if (field.startsWith('eth_') && (locale === 'am' || locale === 'om' || locale === 'ti' || locale === 'so')) {
        if (next.eth_birth_day && next.eth_birth_month && next.eth_birth_year) {
          try {
            const [gy, gm, gd] = ethiopianDate.toGregorian(
              parseInt(next.eth_birth_year),
              parseInt(next.eth_birth_month),
              parseInt(next.eth_birth_day)
            );
            next.birth_date = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
          } catch (e) {
            console.error("Invalid Ethiopian date", e);
          }
        }
      }

      if (field === 'birth_date' || field === 'birth_time') {
        if (next.birth_date) {
            const date = new Date(next.birth_date);
            next.star_sign = calculateStarSign(date, next.birth_time);
        }
      }
      return next;
    });
  }, [locale]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setPrefLocation(user.user_metadata?.pref_location || null);
        // Pre-fill existing data if any
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) {
            setFormData(prev => ({
              ...prev,
              full_name: data.full_name || '',
              birth_date: data.birth_date || '',
              gender: data.gender || '',
              location: data.location || '',
              religion: data.religion || '',
              marital_status: data.marital_status || '',
              has_children: data.has_children || '',
              future_children: data.future_children || '',
              job: data.job_title || '',
              finance_habit: data.finance_habit || '',
              family_value: data.family_values || '',
              conflict_resolution: data.conflict_resolution || '',
              spouse_requirements: data.spouse_requirements || [],
              gallery_photos: data.gallery_urls || [],
              partner_countries: data.partner_countries || [],
              partner_age_min: data.partner_age_min || 18,
              partner_age_max: data.partner_age_max || 50,
              partner_religion: data.partner_religion || '',
              partner_intent: data.partner_marital_pref || ''
            }));
          }
        });
      } else {
        router.push('/login');
      }
    });

    const stepParam = searchParams.get('step');
    if (stepParam) {
      setStep(parseInt(stepParam));
    }
  }, [searchParams, router]);

  const validateStep = (currentStep: number) => {
    setErrorMsg('');
    switch (currentStep) {
      case 1: // Basic Profile
        if (!formData.full_name) return t('errors.fullNameRequired');
        if (!formData.birth_date) return t('errors.birthDateRequired');
        if (!formData.gender) return t('errors.genderRequired');
        if (!formData.location) return t('errors.locationRequired');
        

        if (!formData.religion) return t('errors.religionRequired');
        if (!formData.marital_status) return t('errors.maritalRequired');
        break;
      case 2: // Career & Psychology
        if (!formData.job) return t('errors.jobRequired');
        if (!formData.finance_habit) return t('errors.financeRequired');
        if (!formData.family_value) return t('errors.valuesRequired');
        if (!formData.conflict_resolution) return t('errors.conflictRequired');
        if (!formData.spouse_requirements.length) return t('errors.requirementsRequired');
        break;
      case 3: // Partner Prefs
        if (!formData.partner_countries.length) return t('errors.partnerCountryRequired');
        if (!formData.partner_religion) return t('errors.partnerReligionRequired');
        if (!formData.partner_intent) return t('errors.partnerIntentRequired');
        break;
      case 4: // ID Upload
        if (!formData.id_photo) return t('idVerification.doc');
        break;
      case 5: // Selfie
        if (!formData.selfie_photo) return t('idVerification.takeSelfie');
        break;
      default:
        return null;
    }
    return null;
  };

  const nextStep = async () => {
    const error = validateStep(step);
    if (error) {
      setErrorMsg(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (userId) {
        await supabase.from('profiles').update({ 
          full_name: formData.full_name,
          birth_date: formData.birth_date,
          gender: formData.gender,
          location: formData.location,
          religion: formData.religion,
          marital_status: formData.marital_status,
          has_children: formData.has_children,
          future_children: formData.future_children,
          job_title: formData.job,
          finance_habit: formData.finance_habit,
          family_values: formData.family_value,
          conflict_resolution: formData.conflict_resolution,
          spouse_requirements: formData.spouse_requirements,
          gallery_urls: formData.gallery_photos,
          star_sign: formData.star_sign,
          partner_countries: formData.partner_countries,
          partner_age_min: formData.partner_age_min,
          partner_age_max: formData.partner_age_max,
          partner_religion: formData.partner_religion,
          partner_marital_pref: formData.partner_intent
        }).eq('id', userId);
      }
      setStep(s => Math.min(s + 1, 7));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep(s => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      if (userId) {
        await supabase.from('profiles').update({ 
          onboarding_completed: true,
          is_onboarded: true 
        }).eq('id', userId);
        router.push('/dashboard');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-3xl font-bold text-accent italic">{t('demographics')}</h2>
            
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">{t('fields.fullName')}</span>
                <input 
                   type="text" 
                   value={formData.full_name}
                   aria-label={t('fields.fullName')}
                   onChange={(e) => updateField('full_name', e.target.value)}
                   className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted" 
                   placeholder={t('fields.fullNamePlaceholder')}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-full">
                  <div className="flex gap-2 p-1 bg-muted rounded-2xl w-fit">
                    <button type="button" onClick={() => updateField('calendar_type', 'gregorian')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${formData.calendar_type === 'gregorian' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>{t('calendar.gregorian')}</button>
                    <button type="button" onClick={() => updateField('calendar_type', 'ethiopian')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${formData.calendar_type === 'ethiopian' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>{t('calendar.ethiopian')}</button>
                  </div>
                  {formData.calendar_type === 'ethiopian' ? (
                    <div className="grid grid-cols-3 gap-2">
                       <input type="number" placeholder={t('calendar.day')} value={formData.eth_birth_day} aria-label={t('calendar.day')} onChange={(e) => updateField('eth_birth_day', e.target.value)} className="p-3 bg-muted rounded-xl text-center" />
                       <select value={formData.eth_birth_month} aria-label={t('calendar.month')} onChange={(e) => updateField('eth_birth_month', e.target.value)} className="p-3 bg-muted rounded-xl">
                         <option value="">{t('calendar.month')}</option>
                         {['Meskerem', 'Tikemt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'].map((m, i) => <option key={m} value={i + 1}>{t_const(`Months.${m}`)}</option>)}
                       </select>
                       <input type="number" placeholder={t('calendar.year')} value={formData.eth_birth_year} aria-label={t('calendar.year')} onChange={(e) => updateField('eth_birth_year', e.target.value)} className="p-3 bg-muted rounded-xl text-center" />
                    </div>
                  ) : (
                    <input type="date" value={formData.birth_date} aria-label={t('fields.birthDate')} onChange={(e) => updateField('birth_date', e.target.value)} className="w-full rounded-xl border-gray-300 p-3 bg-muted" />
                  )}
                </div>

                <select value={formData.gender} aria-label={t('fields.gender')} onChange={(e) => updateField('gender', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                  <option value="">{t('fields.gender')}</option>
                  {GENDERS.map(g => <option key={g} value={g}>{t_const(`Genders.${g}`)}</option>)}
                </select>

                <select value={formData.location} aria-label={t('fields.location')} onChange={(e) => updateField('location', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                  <option value="">{t('fields.location')}</option>
                  {[...COUNTRIES].sort((a, b) => (t_const(`Countries.${a.name}`) || a.name).localeCompare(t_const(`Countries.${b.name}`) || b.name, locale)).map(c => <option key={c.iso} value={c.name}>{t_const(`Countries.${c.name}`) || c.name}</option>)}
                </select>

                <select value={formData.religion} aria-label={t('fields.religion')} onChange={(e) => updateField('religion', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                  <option value="">{t('fields.religion')}</option>
                  {RELIGIONS.map(r => <option key={r} value={r}>{t_const(`Religions.${r}`)}</option>)}
                </select>

                <select value={formData.marital_status} aria-label={t('fields.maritalStatus')} onChange={(e) => updateField('marital_status', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                  <option value="">{t('fields.maritalStatus')}</option>
                  {(formData.gender === 'Female' ? MARITAL_STATUS_FEMALE : MARITAL_STATUS_MALE).map(s => <option key={s} value={s}>{t_const(`Marital.${s}`)}</option>)}
                </select>

                <select value={formData.has_children} aria-label={t('fields.hasChildren')} onChange={(e) => updateField('has_children', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                  <option value="">{t('fields.hasChildren')}</option>
                  {HAVE_CHILDREN_OPTIONS.map((o: string) => <option key={o} value={o}>{t_const(`Children.${o}`)}</option>)}
                </select>

                <select value={formData.future_children} aria-label={t('fields.futureChildren') || t('fields.partnerIntent')} onChange={(e) => updateField('future_children', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                  <option value="">{t('fields.futureChildren') || t('fields.partnerIntent')}</option>
                  {FUTURE_CHILDREN_OPTIONS.map((o: string) => <option key={o} value={o}>{t_const(`FutureChildren.${o}`)}</option>)}
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-accent italic">{t('career')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <select value={formData.job} aria-label={t('fields.jobTitle')} onChange={(e) => updateField('job', e.target.value)} className="p-3 bg-muted rounded-xl col-span-full font-bold">
                  <option value="">{t('fields.jobTitle')}</option>
                  {JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{t_const(`Jobs.${cat}`)}</option>)}
               </select>
               <select value={formData.finance_habit} aria-label={t('fields.financeHabit')} onChange={(e) => updateField('finance_habit', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                  <option value="">{t('fields.financeHabit')}</option>
                  {FINANCE_HABITS.map(h => <option key={h} value={h}>{t_const(`Finance.${h}`)}</option>)}
               </select>
               <select value={formData.family_value} aria-label={t('fields.familyValues')} onChange={(e) => updateField('family_value', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                  <option value="">{t('fields.familyValues')}</option>
                  {FAMILY_VALUES.map(v => <option key={v} value={v}>{t_const(`Values.${v}`)}</option>)}
               </select>
               <select value={formData.conflict_resolution} aria-label={t('fields.conflictResolution')} onChange={(e) => updateField('conflict_resolution', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                  <option value="">{t('fields.conflictResolution')}</option>
                  {CONFLICT_RESOLUTIONS.map(c => <option key={c} value={c}>{t_const(`Conflict.${c}`)}</option>)}
               </select>
               <div className="col-span-full space-y-4">
                  <span className="text-sm font-bold text-primary uppercase tracking-widest">{t('fields.spouseRequirements')}</span>
                  <div className="flex flex-wrap gap-2">
                    {SPOUSE_REQUIREMENTS_TAGS.map(tag => (
                       <button key={tag} type="button" aria-label={t_const(`Requirements.${tag}`)} onClick={() => {
                        const next = formData.spouse_requirements.includes(tag) ? formData.spouse_requirements.filter(t => t !== tag) : [...formData.spouse_requirements, tag];
                        updateField('spouse_requirements', next);
                      }} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${formData.spouse_requirements.includes(tag) ? 'bg-primary text-white' : 'bg-muted text-gray-400'}`}>
                        {t_const(`Requirements.${tag}`)}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-accent italic">{t('fields.partnerPrefs')}</h2>
            <div className="space-y-6">
                <div className="space-y-2">
                   <span className="text-sm font-bold text-gray-700">{t('fields.partnerCountry')}</span>
                   <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-muted/50 rounded-xl">
                     {[{name:'Anywhere'}, ...[...COUNTRIES].sort((a, b) => (t_const(`Countries.${a.name}`) || a.name).localeCompare(t_const(`Countries.${b.name}`) || b.name, locale))].map(c => (
                       <button key={c.name} type="button" aria-label={c.name === 'Anywhere' ? 'Anywhere' : t_const(`Countries.${c.name}`) || c.name} onClick={() => {
                         if (c.name === 'Anywhere') return updateField('partner_countries', ['Anywhere']);
                         const next = formData.partner_countries.filter(pc => pc !== 'Anywhere');
                         updateField('partner_countries', formData.partner_countries.includes(c.name) ? next.filter(pc => pc !== c.name) : [...next, c.name].slice(0, 5));
                       }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.partner_countries.includes(c.name) ? 'bg-primary text-white' : 'bg-white text-gray-400'}`}>
                         {c.name === 'Anywhere' ? 'Anywhere' : t_const(`Countries.${c.name}`) || c.name}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <span className="text-sm font-bold text-gray-700">{locale === 'am' ? 'የእድሜ ምርጫ (ከ - እስከ)' : 'Age Range Preference (From - To)'}</span>
                   <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'am' ? 'ቢያንስ' : 'Min Age'}</label>
                        <input 
                          type="number" 
                          value={formData.partner_age_min} 
                          onChange={(e) => updateField('partner_age_min', parseInt(e.target.value))}
                          className="w-full p-3 bg-muted rounded-xl font-bold"
                          min={18}
                          max={100}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{locale === 'am' ? 'ቢበዛ' : 'Max Age'}</label>
                        <input 
                          type="number" 
                          value={formData.partner_age_max} 
                          onChange={(e) => updateField('partner_age_max', parseInt(e.target.value))}
                          className="w-full p-3 bg-muted rounded-xl font-bold"
                          min={18}
                          max={100}
                        />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.partner_religion} aria-label={t('fields.partnerReligion')} onChange={(e) => updateField('partner_religion', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                     <option value="">{t('fields.partnerReligion')}</option>
                     {RELIGIONS.map(r => <option key={r} value={r}>{t_const(`Religions.${r}`)}</option>)}
                  </select>
                  <select value={formData.partner_intent} aria-label={t('fields.partnerIntent')} onChange={(e) => updateField('partner_intent', e.target.value)} className="p-3 bg-muted rounded-xl font-bold">
                     <option value="">{t('fields.partnerIntent')}</option>
                     {PARTNER_MARITAL_PREF_OPTIONS.map((o: string) => <option key={o} value={o}>{t_const(`Marital.${o}`)}</option>)}
                  </select>
                </div>
             </div>
          </div>
        );
      case 4: // ID Upload
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
                 <Upload size={40} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black text-accent italic">{t('idVerification.title')}</h2>
              <p className="text-gray-500 max-w-sm mx-auto">{t('idVerification.subtitle')}</p>
            </div>

            <label className="block w-full aspect-video rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-muted/30 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden group">
               {formData.id_photo ? (
                 <Image src={formData.id_photo} fill className="object-cover" alt="ID Preview" />
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                       <Camera size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{t('idVerification.uploadClick').replace('{type}', '')}</span>
                 </div>
               )}
               <input 
                 type="file" 
                 accept="image/*" 
                 aria-label={t('idVerification.doc')}
                 className="hidden" 
                 onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if (!file || !userId) return;
                   setIsSubmitting(true);
                   const fileName = `${userId}/verification-id-${Date.now()}.jpg`;
                   const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
                   if (!error) {
                     const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                     updateField('id_photo', publicUrl);
                   }
                   setIsSubmitting(false);
                 }}
               />
            </label>
          </div>
        );
      case 5: // Selfie & Simulation
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
                 <User size={40} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black text-accent italic">{t('idVerification.takeSelfie')}</h2>
              <p className="text-gray-500 max-w-sm mx-auto">{t('idVerification.livePhoto')}</p>
            </div>

            <label className="block w-64 h-64 mx-auto rounded-full border-4 border-dashed border-primary/20 bg-muted/30 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden group">
               {formData.selfie_photo ? (
                 <Image src={formData.selfie_photo} fill className="object-cover" alt="Selfie Preview" />
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Camera size={32} className="text-primary group-hover:scale-110 transition-all" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('idVerification.takeSelfie')}</span>
                 </div>
               )}
               <input 
                 type="file" 
                 accept="image/*" 
                 aria-label={t('idVerification.takeSelfie')}
                 className="hidden" 
                 onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if (!file || !userId) return;
                   setIsSubmitting(true);
                   const fileName = `${userId}/verification-selfie-${Date.now()}.jpg`;
                   const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
                   if (!error) {
                     const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                     updateField('selfie_photo', publicUrl);
                     
                     // Trigger Simulation
                     setIsVerifying(true);
                     simulateIdentityVerification(formData.id_photo, publicUrl, {
                       full_name: formData.full_name,
                       birth_date: formData.birth_date
                     }).then(async (result) => {
                       setIsVerifying(false);
                       if (result.isMatch) {
                         // Save verification record
                         await supabase.from('verifications').insert({
                           user_id: userId,
                           id_url: formData.id_photo,
                           selfie_url: publicUrl,
                           id_data: result.extractedData,
                           match_score: result.score,
                           status: 'verified',
                           verified_at: new Date().toISOString()
                         });
                         // Update profile
                         await supabase.from('profiles').update({
                           verification_status: 'verified'
                         }).eq('id', userId);
                       } else {
                         setErrorMsg(t('idVerification.rejected') + ": " + result.reason);
                       }
                     });
                   }
                   setIsSubmitting(false);
                 }}
               />
            </label>

            {(isVerifying || formData.selfie_photo) && (
              <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                 {isVerifying ? (
                   <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse">
                     <Loader2 className="animate-spin" size={14} /> {locale === 'am' || locale === 'ti' ? (locale === 'am' ? 'መረጃዎችዎን እያመሳከርን ነው...' : 'ሓበሬታታትኩም ነረጋግጽ ኣለና...') : 'Verifying Identity Match...'}
                   </p>
                 ) : (
                   <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-green-600 font-bold uppercase tracking-widest text-[10px]">
                         <CheckCircle2 size={16} /> {t('idVerification.uploaded')}
                      </div>
                      <p className="text-[10px] text-gray-400">{t('idVerification.idCaptured')}</p>
                   </div>
                 )}
              </div>
            )}
          </div>
        );
      case 6: // Gallery
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300 text-center">
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-accent italic">{t('gallery')}</h2>
                <p className="text-gray-500">{t('gallerySubtitle')}</p>
             </div>
             <div className="grid grid-cols-3 gap-3">
                {formData.gallery_photos.map((url, i) => (
                   <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
                      <Image src={url} fill className="object-cover" alt="Gallery" />
                      <button type="button" aria-label={t('Nav.about')} onClick={() => updateField('gallery_photos', formData.gallery_photos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                   </div>
                ))}
                {formData.gallery_photos.length < 5 && (
                  <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted">
                    <Camera size={20} className="text-gray-300" />
                    <input type="file" multiple aria-label={t('galleryUpload')} className="hidden" onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length || !userId) return;
                      setIsSubmitting(true);
                      const urls = [...formData.gallery_photos];
                      for (const file of files) {
                        if (urls.length >= 5) break;
                        const fileName = `${userId}/gallery-${Date.now()}-${Math.random()}.jpg`;
                        const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
                        if (!error) {
                          const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                          urls.push(publicUrl);
                        }
                      }
                      updateField('gallery_photos', urls);
                      setIsSubmitting(false);
                    }} />
                  </label>
                )}
             </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-8 text-center animate-in zoom-in duration-500">
             <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-green-500" />
             </div>
             <h2 className="text-4xl font-bold text-accent italic">{t('finishTitle')}</h2>
             <p className="text-lg text-gray-600">{t('finishSubtitle')}</p>
             <button onClick={handleFinish} disabled={isSubmitting} className="w-full btn-primary py-4 flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 className="animate-spin" /> : t('finishCTA')}
             </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--secondary)] bg-opacity-10 py-12 px-4 flex items-center justify-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-xl w-full">
        <div className="mb-8 flex justify-between items-center px-4">
          {[1,2,3,4,5,6,7].map(i => (
             <React.Fragment key={i}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all ${step >= i ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white text-gray-300'}`}>
                   <span className="text-[8px]">{i}</span>
                </div>
                {i < 7 && <div className={`flex-1 h-1 mx-1 rounded-full ${step > i ? 'bg-primary' : 'bg-white'}`} />}
             </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100 relative overflow-hidden">
          <div className={`absolute top-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-32 h-32 bg-primary/5 rounded-full ${locale === 'ar' ? '-ml-16' : '-mr-16'} -mt-16 blur-3xl opacity-50`} />
          <div className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} w-32 h-32 bg-secondary/10 rounded-full ${locale === 'ar' ? '-mr-16' : '-ml-16'} -mb-16 blur-2xl opacity-40`} />
          
          <div className="relative">
            {renderStep()}

            {step < 7 && (
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
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className={`flex-[2] btn-primary flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50' : ''}`}
                >
                  {isSubmitting ? t('nav.processing') : t('nav.continue')} {locale === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-accent/40 flex flex-col items-center gap-4">
           <Image 
             src="/logo.png" 
             alt="Beteseb" 
             width={140} 
             height={36} 
             className="h-9 w-auto grayscale opacity-50 contrast-125"
           />
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
