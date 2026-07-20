'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations, useLocale } from 'next-intl';
import { queueSMS } from '@/lib/sms';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  Camera, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  Star,
  Sparkles,
  Coins,
  Lock,
  LockOpen
} from 'lucide-react';
import Image from 'next/image';
import { getUserTier, calculateCompletionRate } from '@/lib/tiers';
import { COUNTRIES } from '@/lib/countries';
import { isAppLockEnabled, setAppLockEnabled, clearStoredPin } from '@/components/AppLockGate';

const locationData: Record<string, Record<string, string[]>> = {
  'Ethiopia': {
    'Harar': ['Harar'],
    'Addis Ababa': ['Addis Ababa'],
    'Oromia': ['Adama', 'Jimma', 'Bishoftu'],
    'Amhara': ['Bahir Dar', 'Gondar', 'Dessie'],
    'Tigray': ['Mekelle', 'Adigrat', 'Axum'],
    'Sidama': ['Hawassa', 'Yirgalem'],
    'South Ethiopia': ['Arba Minch', 'Dila'],
    'Others': []
  },
  'USA': {
    'Minnesota': ['Minneapolis', 'St. Paul', 'Rochester'],
    'Texas': ['Houston', 'Dallas', 'Austin'],
    'Virginia': ['Fairfax', 'Richmond', 'Alexandria'],
    'California': ['Los Angeles', 'San Jose', 'San Diego'],
    'Washington': ['Seattle', 'Spokane'],
    'Georgia': ['Atlanta', 'Decatur'],
    'Colorado': ['Denver', 'Aurora'],
    'Others': []
  },
  'Canada': {
    'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'London'],
    'British Columbia': ['Vancouver', 'Victoria', 'Burnaby'],
    'Alberta': ['Calgary', 'Edmonton'],
    'Quebec': ['Montreal', 'Quebec City'],
    'Others': []
  },
  'United Kingdom': {
    'England': ['London', 'Birmingham', 'Manchester', 'Leeds'],
    'Scotland': ['Edinburgh', 'Glasgow'],
    'Others': []
  },
  'Germany': {
    'Hesse': ['Frankfurt', 'Wiesbaden'],
    'Bavaria': ['Munich', 'Nuremberg'],
    'Berlin': ['Berlin'],
    'North Rhine-Westphalia': ['Cologne', 'Düsseldorf'],
    'Others': []
  },
  'Saudi Arabia': {
    'Riyadh Region': ['Riyadh'],
    'Makkah Region': ['Jeddah', 'Mecca'],
    'Eastern Province': ['Dammam', 'Khobar'],
    'Others': []
  },
  'UAE': {
    'Dubai': ['Dubai'],
    'Abu Dhabi': ['Abu Dhabi', 'Al Ain'],
    'Sharjah': ['Sharjah'],
    'Others': []
  },
  'Sweden': {
    'Stockholm County': ['Stockholm', 'Solna'],
    'Västra Götaland': ['Gothenburg'],
    'Skåne': ['Malmö'],
    'Others': []
  },
  'Australia': {
    'Victoria': ['Melbourne', 'Geelong'],
    'New South Wales': ['Sydney', 'Newcastle'],
    'Queensland': ['Brisbane'],
    'Others': []
  }
};

const getTranslation = (key: string, lang: string): string => {
  const dictionary: Record<string, Record<string, string>> = {
    am: {
      'Ethiopia': 'ኢትዮጵያ',
      'USA': 'አሜሪካ (USA)',
      'Canada': 'ካናዳ',
      'United Kingdom': 'ዩናይትድ ኪንግደም (UK)',
      'Australia': 'አውስትራሊያ',
      'Anywhere': 'የትም ቦታ',
      'Others': 'ሌላ',
      
      'Harar': 'ሐረር',
      'Addis Ababa': 'አዲስ አበባ',
      'Oromia': 'ኦሮሚያ',
      'Amhara': 'አማራ',
      'Tigray': 'ትግራይ',
      'Sidama': 'ሲዳማ',
      'South Ethiopia': 'ደቡብ ኢትዮጵያ',
      'Minnesota': 'Minnesota (ሚኒሶታ)',
      'Texas': 'Texas (ቴክሳስ)',
      'Virginia': 'Virginia (ቨርጂኒያ)',
      'California': 'California (ካሊፎርኒያ)',
      'Washington': 'Washington (ዋሽንግተን)',
      'Georgia': 'Georgia (ጆርጂያ)',
      'Colorado': 'Colorado (ኮሎራዶ)',
      'Ontario': 'Ontario (ኦንታሪዮ)',
      'British Columbia': 'British Columbia (ብሪቲሽ ኮሎምቢያ)',
      'Alberta': 'Alberta (አልበርታ)',
      'Quebec': 'Quebec (ኩቤክ)',
      'England': 'England (እንግሊዝ)',
      'Scotland': 'Scotland (ስኮትላንድ)',
      'New South Wales': 'New South Wales (ኒው ሳውዝ ዌልስ)',
      'Queensland': 'Queensland (ኩዊንስላንድ)',

      'Adama': 'አዳማ',
      'Jimma': 'ጅማ',
      'Bishoftu': 'ቢሾፍቱ',
      'Bahir Dar': 'ባህር ዳር',
      'Gondar': 'ጎንደር',
      'Dessie': 'ደሴ',
      'Mekelle': 'መቀሌ',
      'Adigrat': 'ዓዲግራት',
      'Axum': 'አክሱም',
      'Hawassa': 'ሀዋሳ',
      'Yirgalem': 'ይርጋለም',
      'Arba Minch': 'አርባ ምንጭ',
      'Dila': 'ዲላ',
      'Minneapolis': 'Minneapolis (ሚኒያፖሊስ)',
      'St. Paul': 'St. Paul (ሴንት ፖል)',
      'Rochester': 'Rochester (ሮቼስተር)',
      'Houston': 'Houston (ሂውስተን)',
      'Dallas': 'Dallas (ዳላስ)',
      'Austin': 'Austin (ኦስቲን)',
      'Fairfax': 'Fairfax (ፌርፋክስ)',
      'Richmond': 'Richmond (ሪችመንድ)',
      'Alexandria': 'Alexandria (አሌክሳንድሪያ)',
      'Los Angeles': 'Los Angeles (ሎስ አንጀለስ)',
      'San Jose': 'San Jose (ሳን ሆዜ)',
      'San Diego': 'San Diego (ሳን ዲዬጎ)',
      'Seattle': 'Seattle (ሲያትል)',
      'Spokane': 'Spokane (ስፖካን)',
      'Atlanta': 'Atlanta (አትላንታ)',
      'Decatur': 'Decatur (ዲኬተር)',
      'Denver': 'Denver (ዴንቨር)',
      'Aurora': 'Aurora (ኦሮራ)',
      'Toronto': 'Toronto (ቶሮንቶ)',
      'Ottawa': 'Ottawa (ኦታዋ)',
      'Mississauga': 'Mississauga (ሚሲሳጋ)',
      'London': 'London (ለንደን)',
      'Vancouver': 'Vancouver (ቫንኩቨር)',
      'Victoria': 'Victoria (ቪክቶሪያ)',
      'Burnaby': 'Burnaby (በርናቢ)',
      'Calgary': 'Calgary (ካልጋሪ)',
      'Edmonton': 'Edmonton (ኤድመንተን)',
      'Montreal': 'Montreal (ሞንትሪያል)',
      'Quebec City': 'Quebec City (ኩቤክ ሲቲ)',
      'Birmingham': 'Birmingham (በርሚንግሃም)',
      'Manchester': 'Manchester (ማንቸስተር)',
      'Leeds': 'Leeds (ሊድስ)',
      'Glasgow': 'Glasgow (ግላስጎው)',
      'Edinburgh': 'Edinburgh (ኤዲንብራ)',
      'Melbourne': 'Melbourne (ሜልበርን)',
      'Geelong': 'Geelong (ጂሎንግ)',
      'Sydney': 'Sydney (ሲድኒ)',
      'Newcastle': 'Newcastle (ኒውካስል)',
      'Brisbane': 'Brisbane (ብሪስቤን)'
    },
    ti: {
      'Ethiopia': 'ኢትዮጵያ',
      'USA': 'አሜሪካ (USA)',
      'Canada': 'ካናዳ',
      'United Kingdom': 'ዓባይ ብሪታንያ (UK)',
      'Australia': 'አውስትራሊያ',
      'Anywhere': 'ኣብ ዝኾነ ቦታ',
      'Others': 'ካልእ',
      
      'Harar': 'ሃረር',
      'Addis Ababa': 'አዲስ ኣበባ',
      'Oromia': 'ኦሮሚያ',
      'Amhara': 'ኣምሓራ',
      'Tigray': 'ትግራይ',
      'Sidama': 'ሲማዳ',
      'South Ethiopia': 'ደቡብ ኢትዮጵያ',
      
      'Mekelle': 'መቐለ',
      'Adigrat': 'ዓዲግራት',
      'Axum': 'ኣኽሱም'
    },
    om: {
      'Ethiopia': 'Itoophiyaa',
      'USA': 'USA',
      'Canada': 'Kanaadaa',
      'United Kingdom': 'UK',
      'Australia': 'Awustiraaliyaa',
      'Anywhere': 'Bakka kamiyyuu',
      'Others': 'Kan biraa',
      
      'Harar': 'Harar',
      'Addis Ababa': 'Finfinnee',
      'Oromia': 'Oromiyaa',
      'Amhara': 'Amaaraa',
      'Tigray': 'Tigraay',
      'Sidama': 'Sidaamaa',
      'South Ethiopia': 'Kibba Itoophiyaa',
      
      'Adama': 'Adaamaa',
      'Jimma': 'Jimmaa',
      'Bishoftu': 'Bishooftuu',
      'Hawassa': 'Hawaasaa'
    }
  };

  return dictionary[lang]?.[key] || key;
};

// ── Inline sub-component: App Lock toggle (local-only, no server call) ──
function AppLockToggle({ locale }: { locale: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isAppLockEnabled());
  }, []);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setAppLockEnabled(next);
    if (!next) clearStoredPin(); // wipe stored PIN when disabling
    setEnabled(next);
  };

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={handleToggle}
        className="w-5 h-5 rounded-lg border-muted text-primary focus:ring-primary/20 accent-primary"
      />
      <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
        {enabled ? <Lock size={14} className="text-primary" /> : <LockOpen size={14} className="text-gray-400" />}
        {locale === 'am'
          ? 'አፕ ቆልፍ ያብሩ (Enable App Lock)'
          : 'Enable App Lock (Biometric / PIN)'}
      </span>
    </label>
  );
}

export default function ProfileView({ profile, onUpdate }: { profile: any, onUpdate: () => void }) {
  const t = useTranslations('Dashboard.profile');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [photos, setPhotos] = useState<string[]>(profile?.gallery_urls || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    interests: profile?.interests || '',
    preferred_language: profile?.preferred_language || 'en',
    enable_abushakir: profile?.enable_abushakir !== false,
    show_age: profile?.show_age !== false,
    show_city: profile?.show_city !== false,
    allow_friend_requests: profile?.allow_friend_requests !== false,
    enable_read_receipts: profile?.enable_read_receipts !== false,
    enable_last_seen: profile?.enable_last_seen !== false,
    is_vip_member: profile?.is_vip_member || false,
    is_ghost_mode_active: profile?.is_ghost_mode_active || false,
    hide_online_status: profile?.hide_online_status || false,
    hide_read_receipts: profile?.hide_read_receipts || false,
    strict_incognito: profile?.strict_incognito || false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [selectedCountry, setSelectedCountry] = useState(profile?.location?.country || (typeof profile?.location === 'string' ? profile.location : ''));
  const [selectedRegion, setSelectedRegion] = useState(profile?.location?.region || '');
  const [selectedCity, setSelectedCity] = useState(profile?.location?.city || '');
  const [customCountry, setCustomCountry] = useState('');
  const [customRegion, setCustomRegion] = useState('');
  const [customCity, setCustomCity] = useState('');

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

  const userCompletion = calculateCompletionRate(profile);
  const hasVouched = vouchRequests.some(v => v.vouch_status === 'approved');
  const userTier = getUserTier(profile, hasVouched);
  const isRoyal = userCompletion === 100 && userTier === 'diamond';
  const isPremiumUser = profile?.is_premium || ['gold', 'platinum', 'diamond'].includes(userTier) || profile?.is_vip_member;
  const isVipUser = profile?.is_vip_member;

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
  const badge = getTierBadge(userTier);

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

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('coin_transactions')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        if (!error && data) {
          setTransactions(data);
        }
      } catch (err) {
        console.error("Failed to load coin transactions:", err);
      } finally {
         setLoadingTx(false);
      }
    };
    fetchTransactions();
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
      // Queue SMS notification task for the guardian
      if (guardianPhone) {
        let smsContent = '';
        const lang = profile?.preferred_language || 'en';
        if (lang === 'am') {
          smsContent = `ሰላም፥ ${profile?.full_name || 'የቤተሰብ እጩ'} እርስዎን የሚዜ/ወላጅ አስታራቂ አድርጎ መርጦዎታል። የገቡበት ኮድ፡ ${data.access_code}። በዚ ሊንክ ይግቡ፡ http://beteseb1.online/am/guardian`;
        } else if (lang === 'om') {
          smsContent = `Akkam, ${profile?.full_name || 'kandidatii Beteseb'} akka mizeetti si afeereera. Koodiin kee: ${data.access_code}. Asitti seeni: http://beteseb1.online/om/guardian`;
        } else if (lang === 'ti') {
          smsContent = `ሰላም፥ ${profile?.full_name || 'እጩ ቤተሰብ'} ንዓኹም ከም ዓራቂ/ሚዜ መሪጹኹም ኣሎ። ኮድኩም፡ ${data.access_code} እዩ። ኣብዚ ይእተዉ፡ http://beteseb1.online/ti/guardian`;
        } else if (lang === 'so') {
          smsContent = `Haye, ${profile?.full_name || 'kandidaat Beteseb'} wuxuu kuu martiqaaday inaad noqoto dhexdhexaadiye. Koodhkaagu waa: ${data.access_code}. Halkan ka gal: http://beteseb1.online/so/guardian`;
        } else if (lang === 'ar') {
          smsContent = `مرحباً، لقد قام ${profile?.full_name || 'مرشح بيتسب'} بدعوتك لتكون مصلحاً عائلياً. رمز الوصول الخاص بك هو: ${data.access_code}. سجل الدخول هنا: http://beteseb1.online/ar/guardian`;
        } else {
          smsContent = `Hello, ${profile?.full_name || 'a Beteseb candidate'} has invited you to be their family mediator. Your access code is: ${data.access_code}. Login here: http://beteseb1.online/en/guardian`;
        }
        await queueSMS(guardianPhone, smsContent).catch(() => {});
      }
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

      alert(locale === 'am' ? 'የምስክርነት ግብዣ ጥያቄ በተሳካ ሁኔታ ተልኳል!' : 'Character witness request sent successfully!');
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
    
    // Biography character limit check (100 to 150 characters) (Phase 4.5)
    if (formData.bio && (formData.bio.length < 100 || formData.bio.length > 150)) {
       alert(locale === 'am' 
         ? `ማሳሰቢያ፦ መገለጫ ባዮ (Biography) በትንሹ 100 እና ቢበዛ 150 ፊደላት መሆን አለበት። (አሁን ያለው ርዝመት፡ ${formData.bio.length})`
         : `Biography must be between 100 and 150 characters long. (Current length: ${formData.bio.length})`);
       setIsSaving(false);
       return;
    }
    
    // Check if username is taken if changed
    if (formData.username && formData.username !== profile.username) {
       const { data: existing } = await supabase.from('profiles').select('id').eq('username', formData.username).single();
       if (existing) {
          alert(t('alerts.usernameTaken'));
          setIsSaving(false);
          return;
       }
    }

    const locationJson = { 
      country: selectedCountry === 'Others' ? customCountry : selectedCountry, 
      region: selectedRegion === 'Others' ? customRegion : selectedRegion,
      city: selectedCity === 'Others' ? customCity : selectedCity 
    };

    let { error } = await supabase
      .from('profiles')
      .update({
        ...formData,
        location: locationJson
      })
      .eq('id', profile.id);

    if (error) {
      console.warn("Failed to update profile with privacy toggles, retrying without them:", error);
      const fallbackFormData = { ...formData };
      delete (fallbackFormData as any).enable_read_receipts;
      delete (fallbackFormData as any).enable_last_seen;

      const { error: retryError } = await supabase
        .from('profiles')
        .update({
          ...fallbackFormData,
          location: locationJson
        })
        .eq('id', profile.id);
      
      error = retryError;
    }

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
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const queryString = params.toString();
    const targetPath = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(targetPath, { locale: newLocale });
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
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-muted overflow-hidden border-4 shadow-2xl relative ${
              isRoyal 
                ? (profile?.gender === 'Male' ? 'border-amber-400 ring-4 ring-amber-300' : 'border-pink-400 ring-4 ring-pink-300')
                : 'border-white'
            }`}>
               {isRoyal && (
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl z-10 animate-bounce">
                   👑
                 </div>
               )}
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
                <h2 className="text-2xl md:text-3xl font-black text-accent italic tracking-tighter flex items-center gap-2 justify-center md:justify-start">
                  <span>{profile?.full_name}</span>
                  <span className={`px-3 py-1 text-[8px] font-black rounded-full border ${badge.color}`}>
                     <span>{badge.emoji}</span> <span>{badge.label}</span>
                  </span>
                </h2>
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

             {/* Profile Completion Indicator */}
             <div className="max-w-xs mx-auto md:mx-0 p-3 bg-muted/40 rounded-xl border border-muted space-y-1.5">
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-gray-400">
                  <span>Profile Completion</span>
                  <span className="text-primary font-bold">{userCompletion}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden shadow-inner border border-border">
                  <div 
                    style={{ width: `${userCompletion}%` }}
                    className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000"
                  />
                </div>
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

            {/* Location Cascading Picker */}
            <div className="space-y-4 col-span-full bg-muted/20 p-6 rounded-2xl border border-muted mt-2 animate-in slide-in-from-top-4 duration-300">
               <span className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">
                 {locale === 'am' ? 'የመኖሪያ አድራሻ (Location)' : locale === 'ti' ? 'ናይ መበቆል ኣድራሻ (Location)' : locale === 'om' ? 'Bakka Jireenyaa (Location)' : 'Location Details'}
               </span>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider ml-1">
                     {locale === 'am' ? 'ሀገር' : locale === 'ti' ? 'ሃገር' : locale === 'om' ? 'Biyya' : 'Country'}
                   </label>
                   <select
                     value={selectedCountry}
                     onChange={(e) => {
                       setSelectedCountry(e.target.value);
                       setSelectedRegion('');
                       setSelectedCity('');
                     }}
                     className="w-full p-4 bg-white border border-muted rounded-xl font-bold text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                   >
                     <option value="">{locale === 'am' ? 'ሀገር ይምረጡ' : locale === 'ti' ? 'ሃገር ይምረጡ' : locale === 'om' ? 'Biyya Filadhu' : 'Select Country'}</option>
                     {[...COUNTRIES]
                       .sort((a, b) => {
                         const nameA = locale === 'am' ? a.nameAm : a.name;
                         const nameB = locale === 'am' ? b.nameAm : b.name;
                         return nameA.localeCompare(nameB, locale);
                       })
                       .map(c => (
                         <option key={c.iso} value={c.name}>
                           {locale === 'am' ? c.nameAm : c.name}
                         </option>
                       ))
                     }
                     <option value="Others">{locale === 'am' ? 'ሌላ' : locale === 'ti' ? 'ካልእ' : locale === 'om' ? 'Kan biraa' : 'Others'}</option>
                   </select>
                   {selectedCountry === 'Others' && (
                     <input
                       type="text"
                       placeholder={locale === 'am' ? 'እባክዎ ሀገር ይጥቀሱ...' : 'Specify country...'}
                       value={customCountry}
                       onChange={(e) => setCustomCountry(e.target.value)}
                       className="w-full p-3 mt-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none"
                     />
                   )}
                 </div>

                 <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider ml-1">
                     {locale === 'am' ? 'ክልል/ግዛት' : locale === 'ti' ? 'ክፍለ ሃገር' : locale === 'om' ? 'Naannoo' : 'Region'}
                   </label>
                   <select
                     value={selectedRegion}
                     disabled={!selectedCountry}
                     onChange={(e) => {
                       setSelectedRegion(e.target.value);
                       setSelectedCity('');
                     }}
                     className="w-full p-4 bg-white border border-muted rounded-xl font-bold text-xs disabled:opacity-50 focus:ring-1 focus:ring-primary focus:outline-none"
                   >
                     <option value="">{locale === 'am' ? 'ክልል/ግዛት ይምረጡ' : locale === 'ti' ? 'ክፍለ ሃገር ይምረጡ' : locale === 'om' ? 'Naannoo Filadhu' : 'Select Region'}</option>
                     {selectedCountry && selectedCountry !== 'Others' && 
                       Object.keys(locationData[selectedCountry] || {}).map(region => (
                         <option key={region} value={region}>{getTranslation(region, locale)}</option>
                       ))
                     }
                     {selectedCountry && <option value="Others">{locale === 'am' ? 'ሌላ' : locale === 'ti' ? 'ካልእ' : locale === 'om' ? 'Kan biraa' : 'Others'}</option>}
                   </select>
                   {selectedRegion === 'Others' && (
                     <input
                       type="text"
                       placeholder={locale === 'am' ? 'እባክዎ ክልል ይጥቀሱ...' : 'Specify region...'}
                       value={customRegion}
                       onChange={(e) => setCustomRegion(e.target.value)}
                       className="w-full p-3 mt-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none"
                     />
                   )}
                 </div>

                 <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider ml-1">
                     {locale === 'am' ? 'ከተማ' : locale === 'ti' ? 'ከተማ' : locale === 'om' ? 'Magaalaa' : 'City'}
                   </label>
                   <select
                     value={selectedCity}
                     disabled={!selectedRegion}
                     onChange={(e) => setSelectedCity(e.target.value)}
                     className="w-full p-4 bg-white border border-muted rounded-xl font-bold text-xs disabled:opacity-50 focus:ring-1 focus:ring-primary focus:outline-none"
                   >
                     <option value="">{locale === 'am' ? 'ከተማ ይምረጡ' : locale === 'ti' ? 'ከተማ ይምረጡ' : locale === 'om' ? 'Magaalaa Filadhu' : 'Select City'}</option>
                     {selectedCountry && selectedRegion && selectedRegion !== 'Others' && 
                       (locationData[selectedCountry]?.[selectedRegion] || []).map(city => (
                         <option key={city} value={city}>{getTranslation(city, locale)}</option>
                       ))
                     }
                     {selectedRegion && <option value="Others">{locale === 'am' ? 'ሌላ' : locale === 'ti' ? 'ካልእ' : locale === 'om' ? 'Kan biraa' : 'Others'}</option>}
                   </select>
                   {selectedCity === 'Others' && (
                     <input
                       type="text"
                       placeholder={locale === 'am' ? 'እባክዎ ከተማ ይጥቀሱ...' : 'Specify city...'}
                       value={customCity}
                       onChange={(e) => setCustomCity(e.target.value)}
                       className="w-full p-3 mt-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none"
                     />
                   )}
                 </div>
               </div>
            </div>

            {formData.is_vip_member ? (
                <div className="space-y-4 pt-6 col-span-full border-t-2 border-dashed border-amber-300 bg-amber-50/15 p-6 rounded-[2rem] border border-amber-200/50 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👑</span>
                      <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600">
                        VIP Privacy & Control Dashboard
                      </h4>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-800 text-[9px] font-black uppercase tracking-wider rounded-full border border-amber-300/40">
                      Unified VIP Controls
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                    Exclusive Control Panel for active Beteseb VIP members
                  </p>
                  
                  {/* VIP Exclusive Privacy Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.is_ghost_mode_active}
                        onChange={(e) => setFormData({...formData, is_ghost_mode_active: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Activate Ghost Mode</span>
                        <span className="text-[9px] text-slate-400 font-medium">Blurs your photo (blurRadius=25) and hides full name in feeds</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.hide_online_status}
                        onChange={(e) => setFormData({...formData, hide_online_status: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Hide Online Status</span>
                        <span className="text-[9px] text-slate-400 font-medium">Conceals active indicators and Last Seen information</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.hide_read_receipts}
                        onChange={(e) => setFormData({...formData, hide_read_receipts: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Hide Read Receipts</span>
                        <span className="text-[9px] text-slate-400 font-medium">Prevents typing indicators and read status triggers</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.strict_incognito}
                        onChange={(e) => setFormData({...formData, strict_incognito: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Strict Incognito</span>
                        <span className="text-[9px] text-slate-400 font-medium">Removes your profile from recommendation discovery pools</span>
                      </div>
                    </label>
                  </div>

                  {/* Standard Privacy Controls integrated for VIP */}
                  <div className="border-t border-amber-200/60 pt-4 mt-2">
                    <h5 className="text-[11px] font-black text-amber-800 uppercase tracking-wider mb-3">
                      Standard Match Privacy Settings
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.show_age}
                          onChange={(e) => setFormData({...formData, show_age: e.target.checked})}
                          className="w-5 h-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          {t('showAge')}
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.show_city}
                          onChange={(e) => setFormData({...formData, show_city: e.target.checked})}
                          className="w-5 h-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          {t('showCity')}
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.allow_friend_requests}
                          onChange={(e) => setFormData({...formData, allow_friend_requests: e.target.checked})}
                          className="w-5 h-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          {t('allowFriendRequests')}
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.enable_last_seen}
                          onChange={(e) => setFormData({...formData, enable_last_seen: e.target.checked})}
                          className="w-5 h-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          {locale === 'am' ? 'ባለፉት የመስመር ላይ ሁኔታ አሳይ (Show Last Seen Status)' : 'Show Last Seen Status'}
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.enable_read_receipts}
                          onChange={(e) => setFormData({...formData, enable_read_receipts: e.target.checked})}
                          className="w-5 h-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          {locale === 'am' ? 'የመልዕክት ንባብ ምልክቶች (Enable Read Receipts)' : 'Enable Read Receipts'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Privacy Settings for non-VIP Users (Tier-Gated for Free vs Premium) */
                <div className="space-y-4 pt-4 col-span-full border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      {t('privacySettings')}
                    </h4>
                    {!isPremiumUser && (
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                        <Lock size={10} /> {locale === 'am' ? 'የፕሪሚየም አገልግሎት' : 'Premium Feature'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label 
                      onClick={(e) => {
                        if (!isPremiumUser) {
                          e.preventDefault();
                          setShowUpgradeModal(true);
                        }
                      }}
                      className={`flex items-center gap-3 ${isPremiumUser ? 'cursor-pointer' : 'cursor-pointer group'}`}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.show_age}
                        disabled={!isPremiumUser}
                        onChange={(e) => isPremiumUser && setFormData({...formData, show_age: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-muted text-primary focus:ring-primary/20 accent-primary disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        {t('showAge')}
                        {!isPremiumUser && <Lock size={12} className="text-amber-500 group-hover:scale-110 transition-transform" />}
                      </span>
                    </label>

                    <label 
                      onClick={(e) => {
                        if (!isPremiumUser) {
                          e.preventDefault();
                          setShowUpgradeModal(true);
                        }
                      }}
                      className={`flex items-center gap-3 ${isPremiumUser ? 'cursor-pointer' : 'cursor-pointer group'}`}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.show_city}
                        disabled={!isPremiumUser}
                        onChange={(e) => isPremiumUser && setFormData({...formData, show_city: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-muted text-primary focus:ring-primary/20 accent-primary disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        {t('showCity')}
                        {!isPremiumUser && <Lock size={12} className="text-amber-500 group-hover:scale-110 transition-transform" />}
                      </span>
                    </label>

                    <label 
                      onClick={(e) => {
                        if (!isPremiumUser) {
                          e.preventDefault();
                          setShowUpgradeModal(true);
                        }
                      }}
                      className={`flex items-center gap-3 ${isPremiumUser ? 'cursor-pointer' : 'cursor-pointer group'}`}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.allow_friend_requests}
                        disabled={!isPremiumUser}
                        onChange={(e) => isPremiumUser && setFormData({...formData, allow_friend_requests: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-muted text-primary focus:ring-primary/20 accent-primary disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        {t('allowFriendRequests')}
                        {!isPremiumUser && <Lock size={12} className="text-amber-500 group-hover:scale-110 transition-transform" />}
                      </span>
                    </label>

                    <label 
                      onClick={(e) => {
                        if (!isPremiumUser) {
                          e.preventDefault();
                          setShowUpgradeModal(true);
                        }
                      }}
                      className={`flex items-center gap-3 ${isPremiumUser ? 'cursor-pointer' : 'cursor-pointer group'}`}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.enable_last_seen}
                        disabled={!isPremiumUser}
                        onChange={(e) => isPremiumUser && setFormData({...formData, enable_last_seen: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-muted text-primary focus:ring-primary/20 accent-primary disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        {locale === 'am' ? 'ባለፉት የመስመር ላይ ሁኔታ አሳይ (Show Last Seen Status)' : 'Show Last Seen Status'}
                        {!isPremiumUser && <Lock size={12} className="text-amber-500 group-hover:scale-110 transition-transform" />}
                      </span>
                    </label>

                    <label 
                      onClick={(e) => {
                        if (!isPremiumUser) {
                          e.preventDefault();
                          setShowUpgradeModal(true);
                        }
                      }}
                      className={`flex items-center gap-3 ${isPremiumUser ? 'cursor-pointer' : 'cursor-pointer group'}`}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.enable_read_receipts}
                        disabled={!isPremiumUser}
                        onChange={(e) => isPremiumUser && setFormData({...formData, enable_read_receipts: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-muted text-primary focus:ring-primary/20 accent-primary disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        {locale === 'am' ? 'የመልዕክት ንባብ ምልክቶች (Enable Read Receipts)' : 'Enable Read Receipts'}
                        {!isPremiumUser && <Lock size={12} className="text-amber-500 group-hover:scale-110 transition-transform" />}
                      </span>
                    </label>
                  </div>
                </div>
              )}

            <div className="space-y-4 pt-2 col-span-full">
               <label className="flex items-center gap-3 cursor-pointer">
                 <input 
                   type="checkbox"
                   checked={formData.enable_abushakir}
                   onChange={(e) => setFormData({...formData, enable_abushakir: e.target.checked})}
                   className="w-5 h-5 rounded-lg border-muted text-primary focus:ring-primary/20 accent-primary"
                 />
                 <span className="text-xs font-bold text-slate-600">
                   {t('enableAbushakir')}
                 </span>
               </label>
               <p className="text-[10px] text-gray-400 font-semibold italic pl-8">
                 {t('abushakirHint')}
               </p>
             </div>


              {/* App Lock — strictly optional, stored locally on device */}
              <div className="space-y-4 pt-4 col-span-full border-t border-gray-100">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Lock size={14} className="text-primary" />
                  {locale === 'am' ? 'የአፕ መቆለፊያ (App Lock)' : 'App Lock'}
                </h4>
                <div className="p-5 bg-muted/30 rounded-2xl border border-muted space-y-3">
                  <AppLockToggle locale={locale} />
                  <p className="text-[10px] text-gray-400 font-semibold italic leading-relaxed pl-8">
                    {locale === 'am'
                      ? 'ይህ አማራጭ ሙሉ ለሙሉ በምርጫ ነው። ሲቃናዱ ቢዮሜትሪክ ወይም PIN ይጠቀሙ።'
                      : 'Strictly optional. When enabled, biometric or PIN is required on startup.'}
                  </p>
                </div>
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
             {t('guardianSystem')}
          </h3>
          <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
             {t('guardianSub')}
          </p>
        </div>

        {guardian ? (
          <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
             <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                   <p className="text-xs font-bold text-accent">
                      {t('linkedMediator')}
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
                      {t('mediatorAccessCode')}
                   </p>
                   <p className="text-2xl font-black tracking-widest text-primary mt-1">{guardian.access_code}</p>
                </div>
                <p className="text-[10px] text-gray-400 font-bold max-w-xs leading-relaxed text-center sm:text-left">
                   {t('mediatorCodeHint')}
                </p>
             </div>
          </div>
        ) : (
          <div className="space-y-6">
             <p className="text-xs text-gray-500 leading-relaxed font-bold">
                {t('mediatorInfo')}
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
                 {isLinking ? t('generatingCode') : t('generateMediatorCode')}
             </button>
          </div>
        )}
      </div>
      {/* Vouching & Character References */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-muted shadow-xl space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-black text-accent italic tracking-tighter flex items-center gap-2 justify-center md:justify-start">
             {t('characterReferences')}
          </h3>
          <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
             {t('inviteWitnesses')}
          </p>
        </div>

        <div className="space-y-6">
           <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {t('referencesInfo')}
           </p>

           {vouchRequests.length > 0 && (
             <div className="space-y-3">
               <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">
                 {t('referencesStatus')}
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
                {t('inviteNewWitness')}
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
                 {isSendingVouchInvite ? t('sendingInvitation') : t('sendVouchInvite')}
              </button>
           </div>
        </div>
      </div>

      {/* Wallet & Coin Ledger Section */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-black text-accent italic tracking-tighter flex items-center gap-2">
               <Coins className="text-amber-500 animate-pulse" />
               {t('walletCoinLedger')}
            </h3>
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
              {t('coinBalanceHistory')}
            </p>
          </div>
          <div className="px-5 py-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center">
             <div className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Balance</div>
             <div className="text-2xl font-black text-accent">{profile?.coins || 0} 🪙</div>
          </div>
        </div>

        <div className="space-y-4">
           <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
             {t('transactionHistory')}
           </h4>

           {loadingTx ? (
             <div className="text-center py-6 text-xs text-gray-400 font-bold uppercase">
               Loading transactions...
             </div>
           ) : transactions.length === 0 ? (
             <p className="text-xs text-slate-400 leading-relaxed font-semibold italic text-center py-4 bg-muted/20 rounded-2xl">
               {t('noTransactions')}
             </p>
           ) : (
             <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
               {transactions.map((tx) => {
                 const isPositive = Number(tx.amount) > 0;
                 return (
                   <div key={tx.id} className="p-4 bg-muted/20 border border-muted/50 rounded-2xl flex justify-between items-center text-xs">
                     <div>
                       <p className="font-bold text-accent capitalize">{tx.type.replace('_', ' ')}</p>
                       <p className="text-[10px] text-gray-400">{tx.note || 'No description'}</p>
                       <p className="text-[9px] text-gray-400 mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                     </div>
                     <span className={`text-sm font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                       {isPositive ? '+' : ''}{tx.amount} 🪙
                     </span>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>

      {/* Account Lifecycle & Security Compliance */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-red-100 shadow-xl space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-black text-red-600 italic tracking-tighter flex items-center gap-2 justify-center md:justify-start">
             {t('dangerZone')}
          </h3>
          <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
             {t('unconditionalDeletion')}
          </p>
        </div>
        
        <div className="space-y-6">
           <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {t('deletionWarning')}
           </p>
           
           <button 
             onClick={() => {
               setDeleteErrorMsg('');
               setShowDeleteConfirmModal(true);
             }}
             className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 active:scale-95 transition-all"
           >
              {t('deleteAccountButton')}
           </button>
        </div>
      </div>

      {/* ── Branded Beteseb Account Deletion Confirmation Modal ── */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-[10000] bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 border border-red-100 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 border border-red-200 text-red-500 rounded-[2rem] mx-auto flex items-center justify-center text-3xl shadow-inner">
              <Trash2 size={36} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black italic text-red-600">
                {locale === 'am' ? 'አካውንትዎን ለማስረዝ እርግጠኛ ነዎት?' : 'Confirm Account Deletion'}
              </h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                {locale === 'am'
                  ? 'አካውንትዎን ከሰረዙ በኋላ ሁሉም መረጃዎችዎ፣ ሜሴጆችዎ፣ የቪአይፒ አባልነትዎ እና የክፍያ ታሪክዎ ለዘለቄታው ይጠፋሉ። ይህ ድርጊት ሊመለስ አይችልም።'
                  : 'Deleting your account will permanently wipe all your data, messages, VIP status, and payment logs. This action cannot be undone.'}
              </p>
            </div>

            {deleteErrorMsg && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                {deleteErrorMsg}
              </p>
            )}

            <div className="space-y-3 pt-2">
              <button
                disabled={isDeletingAccount}
                onClick={async () => {
                  setIsDeletingAccount(true);
                  setDeleteErrorMsg('');
                  try {
                    const { error } = await supabase.rpc('delete_own_user_account');
                    if (!error) {
                      await supabase.auth.signOut();
                      window.location.href = '/';
                    } else {
                      setDeleteErrorMsg(error.message || 'Account deletion failed');
                      setIsDeletingAccount(false);
                    }
                  } catch (err: any) {
                    setDeleteErrorMsg(err.message || 'An unexpected error occurred');
                    setIsDeletingAccount(false);
                  }
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  locale === 'am' ? 'አዎ፣ አካውንቴን ሰርዝ' : 'Yes, Delete My Account'
                )}
              </button>

      {/* Upgrade Paywall Modal for Locked Privacy Settings */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-amber-200 text-center space-y-5 relative">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-slate-900 mx-auto shadow-lg shadow-amber-300/30">
              <Lock size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {locale === 'am' ? 'የፕሪሚየም እና ቪአይፒ ግላዊነት አገልግሎት' : 'Premium Privacy Controls'}
              </h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                {locale === 'am'
                  ? 'የዕድሜ፣ የከተማ፣ የባለፉት የመስመር ላይ ሁኔታ እና የመልዕክት ንባብ ምልክቶችን የመቆጣጠር አገልግሎት ለፕሪሚየም እና ቪአይፒ አባላት ብቻ የተፈቀደ ነው። አሁኑኑ አካውንትዎን አፕግሬድ ያድርጉ!'
                  : 'Controlling your age, city, last seen status, and read receipts is exclusive to Premium & VIP members. Upgrade your account today!'}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.location.href = '?tab=payment';
                }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={16} className="fill-slate-950" />
                {locale === 'am' ? 'ወደ ፕሪሚየም/ቪአይፒ አፕግሬድ ያድርጉ' : 'Upgrade to Premium / VIP'}
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                {locale === 'am' ? 'ዝጋ (Close)' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
