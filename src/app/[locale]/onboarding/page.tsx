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
  Sparkles,
  X
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
  SPOUSE_REQUIREMENTS_TAGS,
  HAVE_CHILDREN_OPTIONS,
  PARTNER_INTENT_OPTIONS
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
    star_sign: '',
    gallery_photos: [] as string[],
    spouse_requirements: [] as string[],
    has_children: '',
    partner_countries: [] as string[],
    partner_age_min: 18,
    partner_age_max: 50,
    partner_religion: '',
    partner_intent: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const idFileInputRef = React.useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();

  const updateField = (field: string, value: any) => {
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
    const emailParam = searchParams.get('email');
    if (emailParam) {
      updateField('email', emailParam);
    }
  }, [searchParams]);

  const validateStep = (currentStep: number) => {
    setErrorMsg('');
    switch (currentStep) {
      case 1:
        if (authMode === 'email' && !formData.email) return locale === 'am' ? 'እባክዎ ኢሜልዎን ያስገቡ' : 'Please enter your email';
        if (authMode === 'phone' && !formData.phone) return locale === 'am' ? 'እባክዎ ስልክ ቁጥርዎን ያስገቡ' : 'Please enter your phone number';
        if (!formData.password || formData.password.length < 6) return locale === 'am' ? 'የይለፍ ቃል ቢያንስ 6 ቁምፊ መሆን አለበት' : 'Password must be at least 6 characters';
        if (!formData.full_name) return locale === 'am' ? 'እባክዎ ሙሉ ስምዎን ያስገቡ' : 'Please enter your full name';
        if (!formData.birth_date) return locale === 'am' ? 'እባክዎ የልደት ቀንዎን ያስገቡ' : 'Please enter your birth date';
        break;
      case 2:
        if (!formData.gender) return locale === 'am' ? 'እባክዎ ጾታ ይምረጡ' : 'Please select gender';
        if (!formData.location) return locale === 'am' ? 'እባክዎ ቦታ/ሀገር ይምረጡ' : 'Please select location';
        if (!formData.religion) return locale === 'am' ? 'እባክዎ ሃይማኖት ይምረጡ' : 'Please select religion';
        if (!formData.marital_status) return locale === 'am' ? 'እባክዎ የጋብቻ ሁኔታ ይምረጡ' : 'Please select marital status';
        break;
      case 3:
        if (!formData.job) return locale === 'am' ? 'እባክዎ የሥራ መደብ ይምረጡ' : 'Please select job title';
        if (!formData.finance_habit) return locale === 'am' ? 'እባክዎ የገንዘብ አያያዝ ይምረጡ' : 'Please select finance habit';
        if (!formData.family_value) return locale === 'am' ? 'እባክዎ የቤተሰብ እሴት ይምረጡ' : 'Please select family value';
        if (!formData.conflict_resolution) return locale === 'am' ? 'እባክዎ የግጭት አፈታት ይምረጡ' : 'Please select conflict resolution style';
        if (!formData.spouse_requirements) return locale === 'am' ? 'እባክዎ የሚያገባውን ሰው መስፈርት ይግለጹ (ግዴታ)' : 'Please describe your spouse requirements';
        break;
      case 4:
        if (!formData.partner_countries.length) return locale === 'am' ? 'እባክዎ ቢያንስ አንድ የሀገር ምርጫ ይምረጡ' : 'Please select at least one partner country';
        if (!formData.partner_religion) return locale === 'am' ? 'እባክዎ የአጋር ሃይማኖት ይምረጡ' : 'Please select partner religion';
        if (!formData.partner_intent) return locale === 'am' ? 'እባክዎ የጋብቻ ሁኔታና ፍላጎት ይምረጡ' : 'Please select marital status and intent';
        break;
      case 6:
        if (!formData.otp || formData.otp.length !== 6) return locale === 'am' ? 'እባክዎ ባለ 6 ዲጂት ኮድ ያስገቡ' : 'Please enter 6-digit code';
        break;
      default:
        return null;
    }
    return null;
  };

  const nextStep = () => {
    const error = validateStep(step);
    if (error) {
      setErrorMsg(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStep(s => Math.min(s + 1, 9));
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep(s => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    const error = validateStep(4); // Review step is basically valid if previous were, but good to check
    if (error) {
      setErrorMsg(error);
      return;
    }
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
      setStep(5); // Move to OTP Verification
    } catch (error: any) {
      setErrorMsg(error.message);
      // setStep(1); // Don't reset to step 1, stay on review
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: formData.otp,
        type: 'signup'
      });

      if (error) throw error;
      
      setStep(7); // Move to Gallery
    } catch (error: any) {
      setErrorMsg(error.message);
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
                      aria-label="Select country code"
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
                    COUNTRIES.map(c => <option key={c.iso} value={c.name}>{t_const(`Countries.${c.name}`) || c.name}</option>)
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

              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                   <Users size={16} /> {t('fields.hasChildren')}
                </span>
                <select 
                  value={formData.has_children}
                  onChange={(e) => updateField('has_children', e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                >
                  <option value="">{t('fields.genderPlaceholder')}</option>
                  {HAVE_CHILDREN_OPTIONS.map(o => <option key={o} value={o}>{t_const(`Children.${o}`)}</option>)}
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
                  {JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{t_const(`Jobs.${cat}`)}</option>)}
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
                    const isSelected = formData.spouse_requirements.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const currentTags = formData.spouse_requirements;
                          const nextTags = isSelected 
                            ? currentTags.filter(t => t !== tag)
                            : [...currentTags, tag];
                          updateField('spouse_requirements', nextTags as any);
                        }}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          isSelected 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                            : 'bg-muted text-gray-400 hover:bg-muted/80'
                        }`}
                      >
                        {t_const(`Requirements.${tag}`)}
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
            <h2 className="text-3xl font-bold text-accent italic">{t('fields.partnerPrefs')}</h2>
            
            <div className="space-y-6">
              {/* Country Multi-select */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700 block">{t('fields.partnerCountry')}</span>
                <div className="flex flex-wrap gap-2">
                   {['Ethiopia', 'Germany', 'United States', 'Canada', 'United Kingdom'].map(country => {
                     const isSelected = formData.partner_countries.includes(country);
                     return (
                       <button
                         key={country}
                         type="button"
                         onClick={() => {
                           const next = isSelected 
                             ? formData.partner_countries.filter(c => c !== country)
                             : [...formData.partner_countries, country];
                           updateField('partner_countries', next);
                         }}
                         className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${isSelected ? 'bg-primary text-white border-primary' : 'bg-muted text-gray-400 border-transparent'}`}
                       >
                         {t_const(`Countries.${country}`) || country}
                       </button>
                     );
                   })}
                </div>
              </div>

              {/* Age Range Slider (Mocked with inputs for simplicity) */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700 block">{t('fields.partnerAge')}</span>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    min={18} max={formData.partner_age_max}
                    value={formData.partner_age_min}
                    onChange={(e) => updateField('partner_age_min', parseInt(e.target.value))}
                    className="w-20 p-3 bg-muted rounded-xl text-center font-bold"
                  />
                  <span className="text-gray-300">to</span>
                  <input 
                    type="number" 
                    min={formData.partner_age_min} max={100}
                    value={formData.partner_age_max}
                    onChange={(e) => updateField('partner_age_max', parseInt(e.target.value))}
                    className="w-20 p-3 bg-muted rounded-xl text-center font-bold"
                  />
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                   <BookOpen size={16} /> {t('fields.partnerReligion')}
                </span>
                <select 
                   value={formData.partner_religion}
                   onChange={(e) => updateField('partner_religion', e.target.value)}
                   className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                >
                  <option value="">{t('fields.religionPlaceholder')}</option>
                  {RELIGIONS.map(r => <option key={r} value={r}>{t_const(`Religions.${r}`)}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                   <Heart size={16} /> {t('fields.partnerIntent')}
                </span>
                <select 
                  value={formData.partner_intent}
                  onChange={(e) => updateField('partner_intent', e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-muted"
                >
                  <option value="">{t('fields.maritalPlaceholder')}</option>
                  {PARTNER_INTENT_OPTIONS.map(o => <option key={o} value={o}>{t_const(`PartnerIntent.${o}`)}</option>)}
                </select>
              </label>
            </div>
          </div>
        );
      case 5:
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
                     <span className="font-bold text-accent">{t_const(`Jobs.${formData.job}`)}</span>
                  </div>
                  <div className={`flex justify-between border-b border-muted/50 pb-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                     <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t('fields.hasChildren')}</span>
                     <span className="font-bold text-accent">{t_const(`Children.${formData.has_children}`)}</span>
                  </div>
               </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
                 <Mail size={40} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black text-accent italic">{locale === 'am' ? 'ኢሜልዎን ያረጋግጡ' : 'Verify Email'}</h2>
              <p className="text-gray-500">{locale === 'am' ? `ወደ ${formData.email} የላክነውን ባለ 6 ዲጂት ኮድ ያስገቡ` : `Enter the 6-digit code we sent to ${formData.email}`}</p>
            </div>

            <div className="space-y-4">
               <input 
                 type="text" 
                 maxLength={6}
                 value={formData.otp}
                 onChange={(e) => updateField('otp', e.target.value.replace(/\D/g, ''))}
                 className="w-full bg-muted border-none rounded-[2rem] p-6 text-center text-4xl font-black tracking-[0.5em] focus:ring-2 focus:ring-primary/20 transition-all text-accent"
                 placeholder="000000"
               />
               {errorMsg && <p className="text-red-500 text-center text-xs font-bold">{errorMsg}</p>}
               <button 
                 onClick={handleVerifyOTP}
                 disabled={isSubmitting || formData.otp.length !== 6}
                 className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50"
               >
                 {isSubmitting ? t('nav.processing') : (locale === 'am' ? 'አረጋግጥ' : 'Verify & Continue')}
               </button>
               <button 
                 onClick={handleFinish} // Resend logic
                 className="w-full text-xs font-bold text-primary uppercase tracking-widest mt-4"
               >
                 {locale === 'am' ? 'ኮዱ አልደረሰዎትም? እንደገና ላክ' : 'Didn\'t get code? Resend'}
               </button>
               <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                  <p className="text-xs text-primary font-bold">{locale === 'am' ? 'ወይም ኢሜልዎ ውስጥ ያለውን ሊንክ ይጫኑ' : 'Or click the link in your email'}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{locale === 'am' ? 'ሊንኩን ሲጫኑ ይህ ገጽ በራሱ ይዘመናል' : 'This page will auto-update after you click the link'}</p>
               </div>
            </div>
          </div>
        );
      case 7:
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
                       aria-label="Remove photo"
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
      case 8:
        return userId ? (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <VerificationGate 
               userId={userId} 
               onVerified={() => {
                 setVerificationStatus('verified');
                 setStep(8);
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
      case 8:
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
          {[1,2,3,4,5,6,7,8,9].map(i => (
             <React.Fragment key={i}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all ${step >= i ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white text-gray-300'}`}>
                   <span className="text-[8px]">{i}</span>
                </div>
                {i < 9 && <div className={`flex-1 h-1 mx-1 rounded-full ${step > i ? 'bg-primary' : 'bg-white'}`} />}
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
                  onClick={() => {
                    if (step === 4) handleFinish();
                    else nextStep();
                  }}
                  disabled={isSubmitting}
                  className={`flex-[2] btn-primary flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50' : ''}`}
                >
                  {isSubmitting ? t('nav.processing') : (step === 9 ? t('nav.finish') : t('nav.continue'))} {locale === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-accent/40 flex flex-col items-center gap-4">
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
