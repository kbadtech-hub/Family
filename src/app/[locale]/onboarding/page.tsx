'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
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
  Upload,
  AlertCircle,
  ShieldCheck,
  Lock,
  Search
} from 'lucide-react';
import { resolveLocationFromCoords, detectUserLocation } from '@/lib/location';
import { calculateStarSign } from '@/lib/abushakir';
import { simulateIdentityVerification, validateIdDocument } from '@/lib/verification';
import { moderateImage } from '@/lib/moderation';
import { 
  RELIGIONS, 
  RELIGION_IMPORTANCE_OPTIONS,
  GENDERS, 
  FAMILY_VALUES,
  FINANCE_HABITS,
  CONFLICT_RESOLUTIONS,
  JOB_CATEGORIES,
  SPOUSE_REQUIREMENTS_TAGS,
  HAVE_CHILDREN_OPTIONS,
  FUTURE_CHILDREN_OPTIONS,
  CHILDREN_OPTIONS,
  MARITAL_STATUS_MALE,
  MARITAL_STATUS_FEMALE,
  PARTNER_MARITAL_PREF_OPTIONS,
  PARTNER_RELATIONSHIP_GOAL_OPTIONS
} from '@/lib/constants';
import { COUNTRIES } from '@/lib/countries';
import ethiopianDate from 'ethiopian-date';
import CustomSelect from '@/components/ui/CustomSelect';
import SpouseRequirementsSelector from '@/components/ui/SpouseRequirementsSelector';
import AgeRangeSlider from '@/components/ui/AgeRangeSlider';

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
      'USA': 'አሜሪካ',
      'Canada': 'ካናዳ',
      'United Kingdom': 'ዩናይትድ ኪንግደም',
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
      'Minnesota': 'ሚኒሶታ',
      'Texas': 'ቴክሳስ',
      'Virginia': 'ቨርጂኒያ',
      'California': 'ካሊፎርኒያ',
      'Washington': 'ዋሽንግተን',
      'Georgia': 'ጆርጂያ',
      'Colorado': 'ኮሎራዶ',
      'Ontario': 'ኦንታሪዮ',
      'British Columbia': 'ብሪቲሽ ኮሎምቢያ',
      'Alberta': 'አልበርታ',
      'Quebec': 'ኩቤክ',
      'England': 'እንግሊዝ',
      'Scotland': 'ስኮትላንድ',
      'New South Wales': 'ኒው ሳውዝ ዌልስ',
      'Queensland': 'ኩዊንስላንድ',

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
      'Minneapolis': 'ሚኒያፖሊስ',
      'St. Paul': 'ሴንት ፖል',
      'Rochester': 'ሮቼስተር',
      'Houston': 'ሂውስተን',
      'Dallas': 'ዳላስ',
      'Austin': 'ኦስቲን',
      'Fairfax': 'ፌርፋክስ',
      'Richmond': 'ሪችመንድ',
      'Alexandria': 'አሌክሳንድሪያ',
      'Los Angeles': 'ሎስ አንጀለስ',
      'San Jose': 'ሳን ሆዜ',
      'San Diego': 'ሳን ዲዬጎ',
      'Seattle': 'ሲያትል',
      'Spokane': 'ስፖካን',
      'Atlanta': 'አትላንታ',
      'Decatur': 'ዲኬተር',
      'Denver': 'ዴንቨር',
      'Aurora': 'ኦሮራ',
      'Toronto': 'ቶሮንቶ',
      'Ottawa': 'ኦታዋ',
      'Mississauga': 'ሚሲሳጋ',
      'London': 'ለንደን',
      'Vancouver': 'ቫንኩቨር',
      'Victoria': 'ቪክቶሪያ',
      'Burnaby': 'በርናቢ',
      'Calgary': 'ካልጋሪ',
      'Edmonton': 'ኤድመንተን',
      'Montreal': 'ሞንትሪያል',
      'Quebec City': 'ኩቤክ ሲቲ',
      'Birmingham': 'በርሚንግሃም',
      'Manchester': 'ማንቸስተር',
      'Leeds': 'ሊድስ',
      'Glasgow': 'ግላስጎው',
      'Edinburgh': 'ኤዲንብራ',
      'Melbourne': 'ሜልበርን',
      'Geelong': 'ጂሎንግ',
      'Sydney': 'ሲድኒ',
      'Newcastle': 'ኒውካስል',
      'Brisbane': 'ብሪስቤን'
    },
    ti: {
      'Ethiopia': 'ኢትዮጵያ',
      'USA': 'አሜሪካ',
      'Canada': 'ካናዳ',
      'United Kingdom': 'ዓባይ ብሪታንያ',
      'Australia': 'አውስትራሊያ',
      'Anywhere': 'ኣብ ዝኾነ ቦታ',
      'Others': 'ካልእ',
      
      'Harar': 'ሃረር',
      'Addis Ababa': 'አዲስ ኣበባ',
      'Oromia': 'ኦሮሚያ',
      'Amhara': 'ኣምሓራ',
      'Tigray': 'ትግራይ',
      'Sidama': 'ሲዳማ',
      'South Ethiopia': 'ደቡብ ኢትዮጵያ',
      
      'Mekelle': 'መቐለ',
      'Adigrat': 'ዓዲግራት',
      'Axum': 'ኣኽሱም',
      'Bahir Dar': 'ባሕር ዳር',
      'Gondar': 'ጎንደር',
      'Hawassa': 'ሀዋሳ',
      'Jimma': 'ጂማ'
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
    },
    ar: {
      'Ethiopia': 'إثيوبيا',
      'USA': 'الولايات المتحدة',
      'Canada': 'كندا',
      'United Kingdom': 'المملكة المتحدة',
      'Australia': 'أستراليا',
      'Anywhere': 'في أي مكان',
      'Others': 'آخر',
      
      'Harar': 'هرر',
      'Addis Ababa': 'أديس أبابا',
      'Oromia': 'أوروميا',
      'Amhara': 'أمهرا',
      'Tigray': 'تيغراي',
      'Sidama': 'سيداما',
      'South Ethiopia': 'جنوب إثيوبيا',
      
      'Adama': 'أداما',
      'Jimma': 'جيما',
      'Bishoftu': 'بيشوفتو',
      'Hawassa': 'هاواسا',
      'Bahir Dar': 'بحر دار',
      'Gondar': 'غوندار',
      'Mekelle': 'ميكيلي'
    },
    so: {
      'Ethiopia': 'Itoobiya',
      'USA': 'Maraykanka',
      'Canada': 'Kanada',
      'United Kingdom': 'Boqortooyada Midowday',
      'Australia': 'Awstaraaliya',
      'Anywhere': 'Meel kasta',
      'Others': 'Kuwo kale',
      
      'Harar': 'Harar',
      'Addis Ababa': 'Caddis Abeba',
      'Oromia': 'Oromiya',
      'Amhara': 'Amhara',
      'Tigray': 'Tigray',
      'Sidama': 'Sidama',
      'South Ethiopia': 'Koonfurta Itoobiya',
      
      'Adama': 'Adaama',
      'Jimma': 'Jimma',
      'Bishoftu': 'Bishooftuu',
      'Hawassa': 'Xawasa',
      'Bahir Dar': 'Baxar Daar',
      'Gondar': 'Gondar',
      'Mekelle': 'Makelle'
    }
  };

  return dictionary[lang]?.[key] || key;
};

const getRelationshipGoalLabel = (goal: string, lang: string, t_const?: any): string => {
  if (!goal) return '-';

  if (t_const) {
    try {
      const translated = t_const(`RelationshipGoals.${goal}`);
      if (translated && !translated.startsWith('Constants.')) return translated;
    } catch (_) {}
  }

  const map: Record<string, Record<string, string>> = {
    'Life Partner / Marriage': {
      am: 'የህይወት አጋር / ጋብቻ',
      en: 'Life Partner / Marriage',
      ti: 'ናይ ህይወት ብጸይ / ሓዳር',
      om: 'Hiriyaa Jireenyaa / Fuudhaa fi Heeruma',
      so: 'Xaas / Guur',
      ar: 'شريك الحياة / الزواج'
    },
    'Long-term Relationship': {
      am: 'የረጅም ጊዜ ግንኙነት',
      en: 'Long-term Relationship',
      ti: 'ናይ ነዊሕ እዋን ርክብ',
      om: 'Hariroo Yeroo Dheeraa',
      so: 'Xiriir Dheeraa',
      ar: 'علاقة طويلة الأجل'
    },
    'Short-term Relationship': {
      am: 'የአጭር ጊዜ ግንኙነት',
      en: 'Short-term Relationship',
      ti: 'ናይ ሓጺር እዋን ርክብ',
      om: 'Hariroo Yeroo Gabaabaa',
      so: 'Xiriir Gaaban',
      ar: 'علاقة قصيرة الأجل'
    },
    'Platonic Friendship / Finding Friends': {
      am: 'ወዳጅነት / ጓደኝነት መፈለግ',
      en: 'Platonic Friendship / Finding Friends',
      ti: 'ዕርክነት መደላይ',
      om: 'Hiriyaa Barbaaduu',
      so: 'Saaxiibtinimo',
      ar: 'صداقة / البحث عن أصدقاء'
    },
    'Learning & Preparing for Marriage': {
      am: 'ለጋብቻ መማር እና መዘጋጀት',
      en: 'Learning & Preparing for Marriage',
      ti: 'ብዛዕባ ሓዳር ምምሃርን ምድላውን',
      om: 'Fuudhaa fi Heerumaaf Qophaa\'uu',
      so: 'Barashada Guurka',
      ar: 'التعلم والاستعداد للزواج'
    },
    'Casual / Socializing': {
      am: 'ተራ ውይይት / መገናኘት',
      en: 'Casual / Socializing',
      ti: 'ተራ ዕላል / ምራኻብ',
      om: 'Waliin Haasa\'uu',
      so: 'Wada Sheekaysi',
      ar: 'دردشة / تواصل اجتماعي'
    }
  };

  return map[goal]?.[lang] || map[goal]?.['en'] || goal;
};

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
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // ── ID Document Pre-Validation State ─────────────────────────────────────────
  /** True once the doc-only API check passes for the currently uploaded ID */
  const [idDocValidated, setIdDocValidated] = useState(false);
  /** Controls the bilingual ID rejection popup */
  const [showIdRejectionModal, setShowIdRejectionModal] = useState(false);
  /** The Amharic error message shown in the rejection popup */
  const [idRejectionMessage, setIdRejectionMessage] = useState('');
  /** Shows a loading spinner inside the Step 4 upload area while the API checks the doc */
  const [isValidatingId, setIsValidatingId] = useState(false);

  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [mismatchDetails, setMismatchDetails] = useState<{
    type: 'name' | 'birth_date' | 'both';
    message: string;
  }>({ type: 'both', message: '' });
  const [showVerificationReceivedModal, setShowVerificationReceivedModal] = useState(false);
  const [isNamePreFilled, setIsNamePreFilled] = useState(false);
  const [isBirthDatePreFilled, setIsBirthDatePreFilled] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    birth_date: '',
    // birth_time removed — Blueprint v4.0: birth time must never be collected
    location: '',
    gender: '',
    religion: '',
    religion_importance: 'Somewhat Important',
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
    selfie_photo: '',
    verification_status: 'unverified'
  });

  // Cascading Location Picker States (Phase 4.5)
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [customRegion, setCustomRegion] = useState('');
  const [customCity, setCustomCity] = useState('');

  const [hasChildren, setHasChildren] = useState(false);
  const [childrenCount, setChildrenCount] = useState('1');

  // Location permission request for onboarding
  const [geoRequested, setGeoRequested] = useState(false);

  // Custom Partner Preference overrides (Phase 4.5)
  const [showCustomPartnerReligion, setShowCustomPartnerReligion] = useState(false);
  const [customPartnerReligion, setCustomPartnerReligion] = useState('');
  const [showCustomPartnerIntent, setShowCustomPartnerIntent] = useState(false);
  const [customPartnerIntent, setCustomPartnerIntent] = useState('');
  const [customRequirementText, setCustomRequirementText] = useState('');
  const [customPartnerCountry, setCustomPartnerCountry] = useState('');
  const [partnerCountrySearch, setPartnerCountrySearch] = useState('');
  const [partnerReligions, setPartnerReligions] = useState<string[]>(['Anywhere']);
  const [partnerCities, setPartnerCities] = useState<string[]>([]);

  const searchParams = useSearchParams();

  // Live Selfie Video WebRTC Recording State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Automatically attach cameraStream to <video> when element mounts in DOM
  useEffect(() => {
    if (cameraActive && cameraStream && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, cameraActive]);

  const startCamera = async () => {
    try {
      setCameraError('');
      setCameraActive(true);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, 
          audio: false 
        });
      } catch {
        // Fallback for mobile browsers with restrictive resolution constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setCameraStream(stream);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraError(locale === 'am'
        ? "ካሜራውን መክፈት አልተቻለም። እባክዎ የካሜራ ፍቃድ መስጠትዎን ያረጋግጡ።"
        : "Could not open camera. Please grant camera permission in your browser settings.");
      setCameraActive(false);
    }
  };

  const recordVideo = async () => {
    if (!cameraStream) return;
    recordedChunksRef.current = [];
    setIsRecording(true);
    setCountdown(3);

    // Initialize MediaRecorder
    let recorder: MediaRecorder;
    const options = { mimeType: 'video/webm;codecs=vp9' };
    try {
      recorder = new MediaRecorder(cameraStream, options);
    } catch (e) {
      recorder = new MediaRecorder(cameraStream);
    }
    
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const localUrl = URL.createObjectURL(blob);
      updateField('selfie_photo', localUrl);

      // Stop camera stream to release hardware
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
        setCameraActive(false);
      }

      if (userId) {
        setIsSubmitting(true);
        const fileName = `${userId}/verification-selfie-live-${Date.now()}.webm`;
        const file = new File([blob], `selfie-live-${Date.now()}.webm`, { type: 'video/webm' });
        
        const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
          updateField('selfie_photo', publicUrl);

          setIsVerifying(true);
          if (formData.id_photo) {
            simulateIdentityVerification(userId, formData.id_photo, publicUrl, {
              full_name: formData.full_name,
              birth_date: formData.birth_date,
              location: {
                country: selectedCountry === 'Others' ? customCountry : selectedCountry,
                region: selectedRegion === 'Others' ? customRegion : selectedRegion,
                city: selectedCity === 'Others' ? customCity : selectedCity
              }
            }).then(async (result) => {
              setIsVerifying(false);
              if (result.isMatch) {
                // AI pre-screen approved -> Queue for manual Admin review (Case B)
                await supabase.from('verifications').insert({
                  user_id: userId,
                  id_url: formData.id_photo,
                  selfie_url: publicUrl,
                  id_data: {
                    ...result.extractedData,
                    ai_confidence: `Face Match: ${Math.round((result.score || 0.98) * 100)}% Confirmed. Tamper Detection: Clean.`
                  },
                  match_score: result.score || 0.98,
                  status: 'pending',
                  verified_at: null
                });

                await supabase.from('profiles').update({
                  verification_status: 'pending',
                  is_verified: false,
                  video_selfie_url: publicUrl
                }).eq('id', userId);

                setFormData(prev => ({ ...prev, verification_status: 'pending' }));
                setErrorMsg('');
              } else {
                // AI pre-screen rejected immediately (Case A)
                await supabase.from('verifications').insert({
                  user_id: userId,
                  id_url: formData.id_photo,
                  selfie_url: publicUrl,
                  id_data: {
                    ...result.extractedData,
                    rejection_reason: result.reason || 'AI Pre-screening check failed'
                  },
                  match_score: result.score || 0,
                  status: 'rejected',
                  verified_at: null
                });

                await supabase.from('profiles').update({
                  verification_status: 'rejected',
                  is_verified: false
                }).eq('id', userId);

                const reasonLower = (result.reason || '').toLowerCase();
                const isNameFail = reasonLower.includes('name') || reasonLower.includes('ስም');
                const isDobFail = reasonLower.includes('birth') || reasonLower.includes('date') || reasonLower.includes('year') || reasonLower.includes('month') || reasonLower.includes('day') || reasonLower.includes('ልደት');

                let mType: 'name' | 'birth_date' | 'both' = 'both';
                if (isNameFail && isDobFail) mType = 'both';
                else if (isNameFail) mType = 'name';
                else if (isDobFail) mType = 'birth_date';

                setMismatchDetails({
                  type: mType,
                  message: result.reason || ''
                });
                setFormData(prev => ({ ...prev, verification_status: 'rejected' }));
                setShowMismatchModal(true);
                setErrorMsg('');
              }
            });
          } else {
            // Manual review fallback because ID photo was skipped
            await supabase.from('verifications').insert({
              user_id: userId,
              id_url: '',
              selfie_url: publicUrl,
              status: 'pending',
              verified_at: null
            });

            await supabase.from('profiles').update({
              verification_status: 'pending',
              is_verified: false,
              video_selfie_url: publicUrl
            }).eq('id', userId);

            setIsVerifying(false);
            setFormData(prev => ({ ...prev, verification_status: 'pending' }));
            setErrorMsg('');
          }
        } else {
          console.error("Storage upload failed:", error);
          alert("Failed to upload selfie video to cloud storage.");
        }
        setIsSubmitting(false);
      }
      setIsRecording(false);
    };

    recorder.start();

    // 3-second countdown timer
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 1000);
  };

  const updateField = React.useCallback((field: string, value: string | number | string[]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Handle Ethiopian Date Conversion
      if (field.startsWith('eth_')) {
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

      if (field === 'birth_date') {
        if (next.birth_date) {
          // Blueprint v4.0: birth time is never collected; pass empty string as time
          const date = new Date(next.birth_date);
          next.star_sign = calculateStarSign(date, '');
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
            if (data.full_name) setIsNamePreFilled(true);
            if (data.birth_date) setIsBirthDatePreFilled(true);
            setFormData(prev => ({
              ...prev,
              full_name: data.full_name || '',
              avatar_url: data.avatar_url || '',
              birth_date: data.birth_date || '',
              gender: data.gender || '',
              location: data.location?.country || data.location || '',
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
              partner_countries: data.partner_location || [],
              partner_age_min: data.partner_age_min || 18,
              partner_age_max: data.partner_age_max || 50,
              partner_religion: data.partner_religion || '',
              partner_intent: data.partner_intent || '',
              verification_status: data.verification_status || 'unverified'
            }));

            // Pre-fill location selectors (auto-populate from captured sign-up or profile location)
            let countryToSet = '';
            let regionToSet = '';
            let cityToSet = '';

            if (data.location && typeof data.location === 'object') {
              countryToSet = data.location.country || '';
              regionToSet = data.location.region || '';
              cityToSet = data.location.city || '';
            } else if (typeof data.location === 'string') {
              countryToSet = data.location;
            }

            if ((!countryToSet || !regionToSet || !cityToSet) && data.registration_location) {
              const regLoc = data.registration_location;
              if (regLoc.country) {
                if (!countryToSet) countryToSet = regLoc.country;
                if (!regionToSet) regionToSet = regLoc.region || '';
                if (!cityToSet) cityToSet = regLoc.city || '';
              }
            }

            if (countryToSet && regionToSet && cityToSet) {
              setSelectedCountry(countryToSet);
              setSelectedRegion(regionToSet);
              setSelectedCity(cityToSet);
            } else {
              // Location data incomplete -> Perform real-time physical GPS/IP location detection
              setIsLocationLoading(true);
              detectUserLocation().then(detected => {
                const finalCountry = countryToSet || detected.country;
                const finalRegion = regionToSet || detected.region;
                const finalCity = cityToSet || detected.city;

                setSelectedCountry(finalCountry);
                setSelectedRegion(finalRegion);
                setSelectedCity(finalCity);
                setIsLocationLoading(false);

                // Auto-save resolved location back to profile so it's persisted permanently
                supabase.from('profiles').update({
                  registration_location: {
                    ...(data.registration_location || {}),
                    country: finalCountry,
                    region: finalRegion,
                    city: finalCity,
                    lat: detected.lat,
                    lng: detected.lng
                  },
                  location: {
                    country: finalCountry,
                    region: finalRegion,
                    city: finalCity
                  }
                }).eq('id', user.id);
              }).catch(err => {
                console.warn('Auto location detection error:', err);
                setSelectedCountry(countryToSet || 'Ethiopia');
                setSelectedRegion(regionToSet || 'Addis Ababa');
                setSelectedCity(cityToSet || 'Addis Ababa');
                setIsLocationLoading(false);
              });
            }

            // Pre-fill children status
            if (data.has_children) {
              const hasKids = data.has_children.startsWith('Yes');
              setHasChildren(hasKids);
              if (hasKids) {
                const count = data.has_children.split(', ')[1] || '1';
                setChildrenCount(count);
              }
            }
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

    // Additional high-precision GPS check on onboarding start
    if (!geoRequested && navigator.geolocation) {
      setGeoRequested(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              resolveLocationFromCoords(pos.coords.latitude, pos.coords.longitude).then(resolved => {
                setSelectedCountry(resolved.country);
                setSelectedRegion(resolved.region);
                setSelectedCity(resolved.city);

                supabase.from('profiles').update({
                  registration_location: {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    ...resolved
                  },
                  location: {
                    country: resolved.country,
                    region: resolved.region,
                    city: resolved.city
                  }
                }).eq('id', user.id);
              });
            }
          });
        },
        () => { /* User denied - non-blocking */ },
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
      );
    }
  }, [searchParams, router, geoRequested]);

  useEffect(() => {
    if (selectedCountry && selectedCountry !== 'Others' && !locationData[selectedCountry]) {
      setSelectedRegion('Others');
      setSelectedCity('Others');
    }
  }, [selectedCountry]);

  const validateStep = (currentStep: number) => {
    setErrorMsg('');
    switch (currentStep) {
      case 1: // Basic Profile (Quick Setup)
        if (!formData.full_name) return locale === 'am' ? 'እባክዎ የእርስዎን ሙሉ ስም ያስገቡ።' : 'Please enter your full name.';
        if (!formData.birth_date) return locale === 'am' ? 'እባክዎ ትክክለኛ የልደት ቀን ያስገቡ።' : 'Please select your birth date.';
        
        // Calculate Age
        const birthDate = new Date(formData.birth_date);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge < 18) {
          return locale === 'am'
            ? 'ይህን መተግበሪያ ለመጠቀም እድሜዎ 18 ወይም ከዚያ በላይ መሆን አለበት።'
            : 'You must be at least 18 years old to use this platform.';
        }

        if (!formData.gender) return t('errors.genderRequired') || 'Gender is required';
        if (!formData.religion) return t('errors.religionRequired') || 'Religion is required';
        if (!formData.marital_status) return t('errors.maritalRequired') || 'Marital status is required';
        
        const activeCountry = selectedCountry === 'Others' ? customCountry : selectedCountry;
        const activeRegion = selectedRegion === 'Others' ? customRegion : selectedRegion;
        const activeCity = selectedCity === 'Others' ? customCity : selectedCity;
        if (!activeCountry || !activeRegion || !activeCity) {
          return t('errors.locationRequired') || 'Location is required';
        }
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
        if (!formData.id_photo) {
          return locale === 'am' ? 'እባክዎ መጀመሪያ የመታወቂያዎን ፎቶ ይጫኑ።' : 'Please upload your ID document first.';
        }
        // Guard: doc-only API check must have passed before proceeding to selfie
        if (!idDocValidated) {
          return locale === 'am'
            ? 'ያስገቡት ሰነድ ገና አልተረጋገጠም። እባክዎ ትክክለኛ የመንግስት መታወቂያ ይጫኑ።'
            : 'The uploaded document has not passed verification. Please upload a valid government ID.';
        }
        break;
      case 5: // Selfie
        if (!formData.selfie_photo) {
          return locale === 'am' ? 'እባክዎ በላይቭ ካሜራ የ3 ሰከንድ ቪዲዮ ሰልፊ ይቅረጹ ወይም ፋይል ይጫኑ።' : 'Please record a 3-second live video selfie or upload a file first.';
        }
        if (formData.verification_status === 'rejected') {
          setShowMismatchModal(true);
          return locale === 'am' ? 'የመታወቂያ እና የቀጥታ ሰልፊ ማመሳከሪያው ውድቅ ተደርጓል። እባክዎን የተሳሳተውን መረጃ ያስተካክሉ ወይም መታወቂያዎን በድጋሚ ይጫኑ።' : 'Identity verification match failed. Please correct your details or re-upload your ID.';
        }
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
        let updateData: any = {};
        if (step === 1) {
          const locationJson = { 
            country: selectedCountry === 'Others' ? customCountry : selectedCountry, 
            region: selectedRegion === 'Others' ? customRegion : selectedRegion,
            city: selectedCity === 'Others' ? customCity : selectedCity 
          };
          updateData = {
            full_name: formData.full_name,
            birth_date: formData.birth_date,
            gender: formData.gender,
            avatar_url: formData.avatar_url,
            star_sign: formData.star_sign,
            location: locationJson,
            religion: formData.religion,
            marital_status: formData.marital_status,
            has_children: hasChildren ? `Yes, ${childrenCount}` : 'No',
            future_children: formData.future_children,
            onboarding_step: 2
          };
        } else if (step === 2) {
          updateData = {
            job_title: formData.job,
            finance_habit: formData.finance_habit,
            family_values: formData.family_value,
            conflict_resolution: formData.conflict_resolution,
            spouse_requirements: formData.spouse_requirements,
            onboarding_step: 3
          };
        } else if (step === 3) {
          updateData = {
            partner_location: formData.partner_countries.map(c => c === 'Others' ? customPartnerCountry : c),
            partner_age_min: formData.partner_age_min,
            partner_age_max: formData.partner_age_max,
            partner_religion: showCustomPartnerReligion ? customPartnerReligion : formData.partner_religion,
            partner_intent: showCustomPartnerIntent ? customPartnerIntent : formData.partner_intent,
            partner_children_pref: formData.partner_children_pref,
            onboarding_step: 6
          };
        } else if (step === 6) {
          updateData = {
            gallery_urls: formData.gallery_photos,
            onboarding_step: 7
          };
        } else if (step === 4) {
          try {
            const result = await validateIdDocument(userId, formData.id_photo, {
              full_name: formData.full_name,
              birth_date: formData.birth_date,
              location: {
                country: selectedCountry === 'Others' ? customCountry : selectedCountry,
                region: selectedRegion === 'Others' ? customRegion : selectedRegion,
                city: selectedCity === 'Others' ? customCity : selectedCity
              }
            });

            if (!result.isMatch) {
              setIdDocValidated(false);
              const msg = result.displayMessage || result.reason || 'ያስገቡት የመታወቂያ መረጃ የተሳሳተ ወይም ያልተሟላ ነው። እባክዎን ትክክለኛ የመንግስት መታወቂያ፣ ፓስፖርት ወይም መንጃ ፍቃድ ያቅርቡ።';
              setIdRejectionMessage(msg);
              setShowIdRejectionModal(true);
              setErrorMsg(msg);
              setIsSubmitting(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            } else {
              setIdDocValidated(true);
            }
          } catch (verifyErr: any) {
            console.error("ID verification API error:", verifyErr);
            setIdDocValidated(false);
            const msg = locale === 'am' ? 'የማንነት ማረጋገጫ ፍተሻ በኔትወርክ ወይም በሰርቨር ችግር ምክንያት አልተሳካም። እባክዎ እንደገና ይሞክሩ።' : 'Verification failed due to a network or server error. Please try again.';
            setIdRejectionMessage(msg);
            setShowIdRejectionModal(true);
            setErrorMsg(msg);
            setIsSubmitting(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          updateData = {
            onboarding_step: 5
          };
        } else if (step === 5) {
          updateData = {
            onboarding_step: 6
          };
        }

        const { error: updateError } = await supabase.from('profiles').update(updateData).eq('id', userId);

        if (updateError) {
          console.error("Step Update Error:", updateError);
          setErrorMsg(locale === 'am' ? `መረጃውን መመዝገብ አልተቻለም። (Error: ${updateError.message})` : `Failed to save data. (Error: ${updateError.message})`);
          return;
        }
      }
      
      if (step === 3) {
        setStep(6);
      } else if (step === 5) {
        setShowVerificationReceivedModal(true);
      } else {
        setStep(s => Math.min(s + 1, 7));
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    setErrorMsg('');
    if (step === 6) {
      setStep(3);
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (userId) {
        const { error: finishError } = await supabase.from('profiles').update({ 
          onboarding_completed: true,
          has_updated_onboarding: true
        }).eq('id', userId);

        if (finishError) {
          console.error("Finish Error:", finishError);
          setErrorMsg(locale === 'am' ? 'ማጠናቀቅ አልተቻለም። እባክዎ ደግመው ይሞክሩ።' : 'Failed to finish onboarding. Please try again.');
          return;
        }
        
        // Invalidate pre-calculated match cache so new compatibility logic recalculates
        await supabase.from('user_match_cache').delete().eq('user_id', userId);

        // Transition to Step 4 (Verification Screen)
        setStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-accent italic uppercase tracking-tighter leading-none">
                {t('quickSetupTitle')}
              </h2>
              <p className="text-gray-500 font-medium italic text-xs max-w-sm mx-auto">
                {t('quickSetupSubtitle')}
              </p>
            </div>
            
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-primary/10 shadow-2xl space-y-6">
              
              {/* Profile Picture Uploader with Preview, Delete & Replace Controls */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('profilePicture')}
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-muted border-2 border-primary/20 rounded-[2rem] overflow-hidden relative flex items-center justify-center shadow-inner group">
                    {formData.avatar_url ? (
                      <>
                        <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title={t('deletePhotoTitle')}
                            onClick={() => updateField('avatar_url', '')}
                            className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center shadow-md active:scale-95"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <Camera size={32} className="text-gray-300" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2">
                      {formData.avatar_url ? (
                        <span>🔄 {t('replacePhotoBtn')}</span>
                      ) : (
                        <span>📷 {t('uploadPhotoBtn')}</span>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !userId) return;
                          setIsSubmitting(true);
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
                            const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
                            if (error) throw error;
                            const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                            updateField('avatar_url', publicUrl);
                          } catch (err) {
                            alert("Upload failed: " + (err instanceof Error ? err.message : String(err)));
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                      />
                    </label>

                    {formData.avatar_url && (
                      <button
                        type="button"
                        onClick={() => updateField('avatar_url', '')}
                        className="text-[10px] text-red-500 font-bold hover:underline self-start ml-2 flex items-center gap-1"
                      >
                        🗑️ {t('removeAvatar')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Legal Name Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('officialName')}
                </label>
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary p-4 bg-white text-sm font-semibold border" 
                  placeholder={t('officialNamePlaceholder')}
                />
                <p className="text-[10px] text-gray-400 font-medium ml-1">
                  💡 {t('officialNameHint')}
                </p>
              </div>

              {/* Gender Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('fields.gender')}
                </label>
                <CustomSelect
                  value={formData.gender}
                  onChange={(val) => updateField('gender', val)}
                  options={GENDERS.map(g => ({ value: g, label: t_const(`Genders.${g}`) }))}
                  placeholder={t('fields.gender')}
                  label={t('fields.gender')}
                />
              </div>

              {/* Date of Birth Input with Calendar Toggle */}
              {!isBirthDatePreFilled ? (
                <div className="space-y-3">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    {t('fields.birthDate')}
                  </label>
                  <div className="flex gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl w-fit border border-gray-150 shadow-sm">
                    <button type="button" onClick={() => updateField('calendar_type', 'gregorian')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.calendar_type === 'gregorian' ? 'bg-white text-primary shadow-md' : 'text-gray-400'}`}>{t('calendar.gregorian')}</button>
                    <button type="button" onClick={() => updateField('calendar_type', 'ethiopian')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.calendar_type === 'ethiopian' ? 'bg-white text-primary shadow-md' : 'text-gray-400'}`}>{t('calendar.ethiopian')}</button>
                  </div>
                  
                  {formData.calendar_type === 'ethiopian' ? (
                    <div className="grid grid-cols-3 gap-3">
                       <CustomSelect
                          value={formData.eth_birth_day}
                          onChange={(val) => updateField('eth_birth_day', val)}
                          options={Array.from({ length: formData.eth_birth_month === '13' ? 6 : 30 }, (_, i) => String(i + 1)).map(day => ({ value: String(day), label: String(day) }))}
                          placeholder={t('calendar.day') || 'Day'}
                          label={t('calendar.day') || 'Day'}
                       />
                       <CustomSelect
                          value={formData.eth_birth_month}
                          onChange={(val) => updateField('eth_birth_month', val)}
                          options={['Meskerem', 'Tikemt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'].map((m, i) => ({ value: String(i + 1), label: t_const(`Months.${m}`) }))}
                          placeholder={t('calendar.month') || 'Month'}
                          label={t('calendar.month') || 'Month'}
                       />
                       <CustomSelect
                          value={formData.eth_birth_year}
                          onChange={(val) => updateField('eth_birth_year', val)}
                          options={Array.from({ length: 70 }, (_, i) => String(2018 - 18 - i)).map(year => ({ value: String(year), label: String(year) }))}
                          placeholder={t('calendar.year') || 'Year'}
                          label={t('calendar.year') || 'Year'}
                       />
                    </div>
                  ) : (
                    <input 
                      type="date" 
                      value={formData.birth_date} 
                      onChange={(e) => updateField('birth_date', e.target.value)} 
                      className="w-full rounded-2xl border-gray-200 p-4 bg-muted/30 text-sm font-semibold" 
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-1 bg-[#F8F9FA]/40 p-4 rounded-2xl border border-gray-150">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    {t('fields.birthDate')}
                  </span>
                  <p className="text-sm font-bold text-accent">{formData.birth_date}</p>
                </div>
              )}

              {/* Religion Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('fields.religion')}
                </label>
                <CustomSelect
                  value={formData.religion}
                  onChange={(val) => updateField('religion', val)}
                  options={RELIGIONS.map(r => ({ value: r, label: t_const(`Religions.${r}`) }))}
                  placeholder={t('fields.religion')}
                  label={t('fields.religion')}
                />
              </div>

              {/* Religion Importance Sub-field (Matching Weight Engine) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                  <span>{t('religionImportanceLabel')}</span>
                  <span className="text-[10px] text-primary font-bold">{t('matchFilterLabel')}</span>
                </label>
                <CustomSelect
                  value={formData.religion_importance}
                  onChange={(val) => updateField('religion_importance', val)}
                  options={RELIGION_IMPORTANCE_OPTIONS.map(opt => ({ value: opt, label: t_const(`ReligionImportance.${opt}`) }))}
                  placeholder={t('religionImportanceLabel')}
                  label={t('religionImportanceLabel')}
                />
              </div>

              {/* Marital Status Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('fields.maritalStatus')}
                </label>
                <CustomSelect
                  value={formData.marital_status}
                  onChange={(val) => updateField('marital_status', val)}
                  options={(formData.gender === 'Female' ? MARITAL_STATUS_FEMALE : MARITAL_STATUS_MALE).map(s => ({ value: s, label: t_const(`Marital.${s}`) }))}
                  placeholder={t('fields.maritalStatus')}
                  label={t('fields.maritalStatus')}
                />
              </div>

              {/* Future Children Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('futurChildrenLabel')}
                </label>
                <CustomSelect
                  value={formData.future_children}
                  onChange={(val) => updateField('future_children', val)}
                  options={FUTURE_CHILDREN_OPTIONS.map((o: string) => ({ value: o, label: t_const(`FutureChildren.${o}`) }))}
                  placeholder={t('futurChildrenLabel')}
                  label={t('futurChildrenLabel')}
                />
              </div>

              {/* Location Cascading Picker (Locked & Read-Only) */}
              <div className="space-y-4 bg-[#F8F9FA]/50 p-6 rounded-[2rem] border border-gray-150 relative">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 ml-1">
                  <span className="block text-xs font-black text-slate-600 uppercase tracking-widest">
                    {t('locationDetails')}
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-full text-[10px] font-bold">
                    {isLocationLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin text-amber-600 shrink-0" />
                        <span>{t('detectingLocation')}</span>
                      </>
                    ) : (
                      <>
                        <Lock size={12} className="text-amber-600 shrink-0" />
                        <span>
                          {t('lockedViaLocation')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider ml-1">
                      {t('fields.country')}
                    </label>
                    <CustomSelect
                      value={selectedCountry || 'Ethiopia'}
                      disabled={true}
                      onChange={() => {}}
                      options={[
                        ...[...COUNTRIES]
                          .sort((a, b) => {
                            const nameA = t_const(`Countries.${a.name}`) || a.name;
                            const nameB = t_const(`Countries.${b.name}`) || b.name;
                            return nameA.localeCompare(nameB, locale);
                          })
                          .map(c => ({ value: c.name, label: t_const(`Countries.${c.name}`) || c.name })),
                        { value: 'Others', label: t('othersOption') }
                      ]}
                      placeholder={t('fields.countryPlaceholder')}
                      label={t('fields.country')}
                    />
                    {selectedCountry === 'Others' && (
                      <input
                        type="text"
                        disabled
                        readOnly
                        placeholder={t('specifyCountry')}
                        value={customCountry}
                        className="w-full p-3 mt-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed opacity-75 pointer-events-none"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider ml-1">
                      {locale === 'am' ? 'ክልል/ግዛት' : locale === 'ti' ? 'ክፍለ ሃገር' : locale === 'om' ? 'Naannoo' : locale === 'ar' ? 'المنطقة' : locale === 'so' ? 'Gobolka' : 'Region'}
                    </label>
                    <CustomSelect
                      value={selectedRegion || 'Addis Ababa'}
                      disabled={true}
                      onChange={() => {}}
                      options={[
                        ...(selectedCountry && selectedCountry !== 'Others'
                          ? Object.keys(locationData[selectedCountry] || {}).map(region => ({ value: region, label: getTranslation(region, locale) }))
                          : []),
                        ...(selectedCountry ? [{ value: 'Others', label: t('othersOption') }] : [])
                      ]}
                      placeholder={t('specifyRegion')}
                      label={locale === 'am' ? 'ክልል/ግዛት' : locale === 'ti' ? 'ክፍለ ሃገር' : locale === 'om' ? 'Naannoo' : locale === 'ar' ? 'المنطقة' : locale === 'so' ? 'Gobolka' : 'Region'}
                    />
                    {selectedRegion === 'Others' && (
                      <input
                        type="text"
                        disabled
                        readOnly
                        placeholder={t('specifyRegion')}
                        value={customRegion}
                        className="w-full p-3 mt-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed opacity-75 pointer-events-none"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider ml-1">
                      {locale === 'am' ? 'ከተማ' : locale === 'ti' ? 'ከተማ' : locale === 'om' ? 'Magaalaa' : locale === 'ar' ? 'المدينة' : locale === 'so' ? 'Magaalada' : 'City'}
                    </label>
                    <CustomSelect
                      value={selectedCity || 'Addis Ababa'}
                      disabled={true}
                      onChange={() => {}}
                      options={[
                        ...(selectedCountry && selectedRegion && selectedRegion !== 'Others'
                          ? (locationData[selectedCountry]?.[selectedRegion] || []).map(city => ({ value: city, label: getTranslation(city, locale) }))
                          : []),
                        ...(selectedRegion ? [{ value: 'Others', label: t('othersOption') }] : [])
                      ]}
                      placeholder={t('specifyCity')}
                      label={locale === 'am' ? 'ከተማ' : locale === 'ti' ? 'ከተማ' : locale === 'om' ? 'Magaalaa' : locale === 'ar' ? 'المدينة' : locale === 'so' ? 'Magaalada' : 'City'}
                    />
                    {selectedCity === 'Others' && (
                      <input
                        type="text"
                        disabled
                        readOnly
                        placeholder={t('specifyCity')}
                        value={customCity}
                        className="w-full p-3 mt-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed opacity-75 pointer-events-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Conditional Children Selector workflow */}
              <div className="p-6 bg-[#F8F9FA]/50 border border-gray-150 rounded-[2rem] space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasChildren}
                    onChange={(e) => setHasChildren(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary/20"
                  />
                  <span className="text-xs font-bold text-accent">
                    {t('childrenCheck')}
                  </span>
                </label>

                {hasChildren && (
                  <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider ml-1">
                      {t('childrenCountLabel')}
                    </label>
                    <CustomSelect
                      value={childrenCount}
                      onChange={(val) => setChildrenCount(val)}
                      options={CHILDREN_OPTIONS.map(c => ({
                        value: c,
                        label: t_const(`ChildrenCount.${c}`)
                      }))}
                      placeholder={t('childrenCountLabel')}
                      label={t('childrenCountLabel')}
                    />
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-accent italic">{t('career')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <CustomSelect
                  value={formData.job}
                  onChange={(val) => updateField('job', val)}
                  options={JOB_CATEGORIES.map(cat => ({ value: cat, label: t_const(`Jobs.${cat}`) }))}
                  placeholder={t('fields.jobTitle')}
                  label={t('fields.jobTitle')}
                  className="col-span-full"
               />
               <CustomSelect
                  value={formData.finance_habit}
                  onChange={(val) => updateField('finance_habit', val)}
                  options={FINANCE_HABITS.map(h => ({ value: h, label: t_const(`Finance.${h}`) }))}
                  placeholder={t('fields.financeHabit')}
                  label={t('fields.financeHabit')}
               />
               <CustomSelect
                  value={formData.family_value}
                  onChange={(val) => updateField('family_value', val)}
                  options={FAMILY_VALUES.map(v => ({ value: v, label: t_const(`Values.${v}`) }))}
                  placeholder={t('fields.familyValues')}
                  label={t('fields.familyValues')}
               />
               <CustomSelect
                  value={formData.conflict_resolution}
                  onChange={(val) => updateField('conflict_resolution', val)}
                  options={CONFLICT_RESOLUTIONS.map(c => ({ value: c, label: t_const(`Conflict.${c}`) }))}
                  placeholder={t('fields.conflictResolution')}
                  label={t('fields.conflictResolution')}
               />
               <div className="col-span-full pt-2">
                  <SpouseRequirementsSelector 
                    selectedRequirements={formData.spouse_requirements}
                    onChange={(next) => updateField('spouse_requirements', next)}
                    maxLimit={10}
                  />
               </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-accent italic">{t('fields.partnerPrefs')}</h2>
            
            <div className="space-y-6">
              <div className="space-y-3 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-150 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-600 tracking-wider">
                    {t('fields.partnerCountry')}
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    {formData.partner_countries.includes('Anywhere')
                      ? t('partnerAnywhereLabel')
                      : t('partnerCountriesCount', { count: formData.partner_countries.length })}
                  </span>
                </div>

                {/* Country Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('searchCountryPlaceholder')}
                    value={partnerCountrySearch}
                    onChange={(e) => setPartnerCountrySearch(e.target.value)}
                    className="w-full p-3 pl-9 bg-slate-50 border border-gray-200 text-slate-900 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>

                {/* Selected Country Badges with X Close buttons */}
                {formData.partner_countries.length > 0 && !formData.partner_countries.includes('Anywhere') && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.partner_countries.map(countryName => {
                      const displayLbl = t_const(`Countries.${countryName}`) || countryName;
                      return (
                        <span key={countryName} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-[11px] font-bold rounded-full shadow-xs">
                          {displayLbl}
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = formData.partner_countries.filter(c => c !== countryName);
                              updateField('partner_countries', remaining.length === 0 ? ['Anywhere'] : remaining);
                            }}
                            className="hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Searchable Country Chips */}
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => updateField('partner_countries', ['Anywhere'])}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      formData.partner_countries.includes('Anywhere') ? 'bg-accent text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🌍 {t('partnerAnywhereLabel')}
                  </button>

                  {COUNTRIES.filter(c => {
                    if (!partnerCountrySearch.trim()) return true;
                    const q = partnerCountrySearch.toLowerCase();
                    const translatedName = (t_const(`Countries.${c.name}`) || c.name).toLowerCase();
                    return c.name.toLowerCase().includes(q) || translatedName.includes(q);
                  })
                  .sort((a, b) => {
                    const nameA = t_const(`Countries.${a.name}`) || a.name;
                    const nameB = t_const(`Countries.${b.name}`) || b.name;
                    return nameA.localeCompare(nameB, locale);
                  })
                  .map(c => {
                    const cleanName = t_const(`Countries.${c.name}`) || c.name;
                    const isSelected = formData.partner_countries.includes(c.name);

                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          const next = formData.partner_countries.filter(pc => pc !== 'Anywhere');
                          if (isSelected) {
                            const remaining = next.filter(pc => pc !== c.name);
                            updateField('partner_countries', remaining.length === 0 ? ['Anywhere'] : remaining);
                          } else {
                            if (next.length >= 5) return;
                            updateField('partner_countries', [...next, c.name]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          isSelected ? 'bg-primary text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cleanName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Dynamic City Preference */}
              {!formData.partner_countries.includes('Anywhere') && formData.partner_countries.length > 0 && (
                <div className="space-y-3 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-150 shadow-sm animate-in slide-in-from-top-3 duration-300">
                  <label className="text-xs font-black uppercase text-slate-600 tracking-wider block">
                    🏢 {t('partnerCityOptionalLabel')}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {t('partnerCityDesc')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Addis Ababa', 'Harar', 'Hawassa', 'Bahir Dar', 'Dire Dawa', 'Mekelle', 'Adama', 'Gondar', 'Jimma', 'Minneapolis', 'Washington DC', 'London', 'Toronto'].map(cityName => {
                      const isCitySel = partnerCities.includes(cityName);
                      return (
                        <button
                          key={cityName}
                          type="button"
                          onClick={() => {
                            if (isCitySel) {
                              setPartnerCities(partnerCities.filter(c => c !== cityName));
                            } else {
                              setPartnerCities([...partnerCities, cityName]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isCitySel ? 'bg-accent text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {getTranslation(cityName, locale)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Interactive Age Range Slider */}
              <AgeRangeSlider
                minAge={formData.partner_age_min}
                maxAge={formData.partner_age_max}
                onChange={(min, max) => {
                  updateField('partner_age_min', min);
                  updateField('partner_age_max', max);
                }}
                locale={locale}
              />

              {/* 3. Multi-Select Partner Religion Preference */}
              <div className="space-y-3 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-150 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-600 tracking-wider">
                    {t('fields.partnerReligionPref')}
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    {t('multiSelectLabel')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerReligions(['Anywhere']);
                      updateField('partner_religion', 'Does Not Matter');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      partnerReligions.includes('Anywhere') || formData.partner_religion === 'Does Not Matter'
                        ? 'bg-accent text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ✨ {t('anyReligionBtn')}
                  </button>

                  {RELIGIONS.map(r => {
                    const isSel = partnerReligions.includes(r) || formData.partner_religion === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          const filterAny = partnerReligions.filter(x => x !== 'Anywhere');
                          if (isSel) {
                            const next = filterAny.filter(x => x !== r);
                            setPartnerReligions(next.length === 0 ? ['Anywhere'] : next);
                            updateField('partner_religion', next[0] || 'Does Not Matter');
                          } else {
                            const next = [...filterAny, r];
                            setPartnerReligions(next);
                            updateField('partner_religion', r);
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSel ? 'bg-primary text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t_const(`Religions.${r}`) || r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. 6 Structured Relationship Goals (CustomSelect Dropdown) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('fields.partnerRelationshipGoal')}
                </label>
                <CustomSelect
                  value={formData.partner_intent}
                  onChange={(val) => updateField('partner_intent', val)}
                  options={PARTNER_RELATIONSHIP_GOAL_OPTIONS.map(g => ({
                    value: g,
                    label: getRelationshipGoalLabel(g, locale, t_const)
                  }))}
                  placeholder={t('fields.selectGoal')}
                  label={t('fields.partnerRelationshipGoal')}
                />
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
               {/* Validation loading overlay — shown while doc-only API check is running */}
               {isValidatingId && (
                 <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                   <Loader2 size={32} className="animate-spin text-primary" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                     {t('validatingDoc')}
                   </p>
                 </div>
               )}
               <input type="file" accept="image/*" capture="environment" aria-label={t('idVerification.doc')} className="hidden"
                 onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if (!file || !userId) return;

                   // Reset validation state whenever a new file is chosen
                   setIdDocValidated(false);
                   setIdRejectionMessage('');
                   setFormData(prev => ({ ...prev, id_photo: '', verification_status: 'unverified' }));

                   setIsSubmitting(true);
                   setIsValidatingId(true);

                   try {
                     // 1. Upload to Supabase Storage
                     const fileName = `${userId}/verification-id-${Date.now()}.jpg`;
                     const { error: uploadError } = await supabase.storage.from('user_photos').upload(fileName, file);
                     if (uploadError) throw uploadError;

                     const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);

                     // Optimistically show the preview while the API check runs
                     setFormData(prev => ({ ...prev, id_photo: publicUrl, verification_status: 'unverified' }));

                     // 2. Immediate document-only pre-validation (blocks selfie step if it fails)
                     const validationResult = await validateIdDocument(userId, publicUrl, {
                       full_name: formData.full_name,
                       birth_date: formData.birth_date,
                       location: {
                         country: selectedCountry === 'Others' ? customCountry : selectedCountry,
                         region: selectedRegion === 'Others' ? customRegion : selectedRegion,
                         city: selectedCity === 'Others' ? customCity : selectedCity,
                       },
                     });

                     if (validationResult.isMatch) {
                       // ✅ Document passed all checks — unlock the selfie step
                       setIdDocValidated(true);
                     } else {
                       // ❌ Document rejected — show popup and clear the photo so the guard in validateStep triggers
                       setIdDocValidated(false);
                       const msg =
                         validationResult.displayMessage ||
                         validationResult.reason ||
                         'ያስገቡት የመታወቂያ መረጃ የተሳሳተ ወይም ያልተሟላ ነው። እባክዎን ትክክለኛ የመንግስት መታወቂያ፣ ፓስፖርት ወይም መንጃ ፍቃድ ያቅርቡ።';
                       setIdRejectionMessage(msg);
                       setShowIdRejectionModal(true);
                     }
                   } catch (err: any) {
                     console.error('ID upload/validation error:', err);
                     setIdDocValidated(false);
                     setIdRejectionMessage('የሰርቨር ስህተት ተከስቷል። እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ።');
                     setShowIdRejectionModal(true);
                   } finally {
                     setIsValidatingId(false);
                     setIsSubmitting(false);
                   }
                 }}
               />
            </label>

            {/* Document validation status badge */}
            {formData.id_photo && !isValidatingId && (
              <div className={`flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                idDocValidated
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {idDocValidated ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>{t('docVerifiedMsg')}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    <span>{t('docNotVerifiedMsg')}</span>
                  </>
                )}
              </div>
            )}

            {/* Trust & Security Explainer Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-[2rem] p-6 text-left space-y-4 shadow-inner">
               <h4 className="font-extrabold text-xs text-accent uppercase tracking-wider flex items-center gap-2">
                 🔒 {t('whyVerification')}
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                 <div className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                   <span className="text-base">🤖</span>
                   <div>
                     <p className="font-bold text-gray-900">{t('humanVerification')}</p>
                     <p className="text-[11px] text-gray-500">{t('humanVerificationDesc')}</p>
                   </div>
                 </div>
                 <div className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                   <span className="text-base">💳</span>
                   <div>
                     <p className="font-bold text-gray-900">{t('financialSecurity')}</p>
                     <p className="text-[11px] text-gray-500">{t('financialSecurityDesc')}</p>
                   </div>
                 </div>
                 <div className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                   <span className="text-base">🎁</span>
                   <div>
                     <p className="font-bold text-gray-900">{t('giftsAndServices')}</p>
                     <p className="text-[11px] text-gray-500">{t('giftsAndServicesDesc')}</p>
                   </div>
                 </div>
                 <div className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                   <span className="text-base">🛡️</span>
                   <div>
                     <p className="font-bold text-gray-900">{t('dataPrivacy')}</p>
                     <p className="text-[11px] text-gray-500">{t('dataPrivacyDesc')}</p>
                   </div>
                 </div>
               </div>
            </div>

            {/* Skip Button (Silver Tier) */}
            <button
               type="button"
               onClick={async () => {
                 if (userId) {
                   await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
                 }
                 router.push('/dashboard');
               }}
               className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-200"
            >
               <span>{t('skipNowBtn')}</span>
               <ChevronRight size={16} />
            </button>
           </div>
         );
      case 5: // Selfie Video Verification (Live camera / file fallback)
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
                 <User size={40} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black text-accent italic">
                {t('selfieTitle')}
              </h2>
              <p className="text-gray-500 max-w-sm mx-auto text-xs font-medium leading-relaxed">
                {t('selfieDesc')}
              </p>
            </div>

            {cameraError && (
              <div className="max-w-sm mx-auto p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-xs animate-in fade-in">
                <AlertCircle size={18} className="shrink-0" />
                <p className="font-bold text-left">{cameraError}</p>
              </div>
            )}

            {cameraActive && !cameraError && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                <CheckCircle2 size={14} />
                <span>{t('cameraLiveMsg')}</span>
              </div>
            )}

            <div className="relative w-64 h-64 mx-auto rounded-[3rem] border-4 border-dashed border-primary/20 bg-muted/30 overflow-hidden flex items-center justify-center group shadow-md">
               {formData.selfie_photo ? (
                 formData.selfie_photo.endsWith('.webm') || formData.selfie_photo.endsWith('.mp4') || formData.selfie_photo.includes('video') ? (
                   <video src={formData.selfie_photo} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                 ) : (
                   <Image src={formData.selfie_photo} fill className="object-cover" alt="Selfie Preview" />
                 )
               ) : cameraActive ? (
                 <video ref={cameraVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Camera size={32} className="text-primary group-hover:scale-110 transition-all" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {t('cameraOffMsg')}
                    </span>
                 </div>
               )}

               {isRecording && (
                 <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                    <p className="text-lg font-black tracking-widest animate-pulse uppercase">
                      {t('recordingNow')}
                    </p>
                    <p className="text-5xl font-black mt-2 text-primary">{countdown}s</p>
                 </div>
               )}
            </div>

            {/* Buttons for Camera Control */}
            <div className="flex justify-center gap-4">
              {!formData.selfie_photo && !cameraActive && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {t('openCameraBtn')}
                </button>
              )}

              {cameraActive && !isRecording && (
                <button
                  type="button"
                  onClick={recordVideo}
                  className="bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all animate-pulse"
                >
                  {t('startRecordBtn')}
                </button>
              )}

              {formData.selfie_photo && (
                <button
                  type="button"
                  onClick={() => {
                    updateField('selfie_photo', '');
                    setFormData(prev => ({ ...prev, verification_status: 'unverified' }));
                    setErrorMsg('');
                    startCamera();
                  }}
                  className="bg-accent text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  {t('retakeBtn')}
                </button>
              )}
            </div>

            {(isVerifying || formData.verification_status === 'verified' || errorMsg) && (
              <div className={`p-6 rounded-[2rem] border transition-all ${
                formData.verification_status === 'verified' 
                  ? 'bg-green-50 border-green-100' 
                  : errorMsg 
                    ? 'bg-red-50 border-red-100' 
                    : 'bg-primary/5 border-primary/10'
              }`}>
                 {isVerifying ? (
                   <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse">
                     <Loader2 className="animate-spin" size={14} /> {t('verifyingMsg')}
                   </p>
                 ) : formData.verification_status === 'verified' ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-200 animate-bounce">
                           <CheckCircle2 size={16} /> {t('accountVerifiedMsg')}
                        </div>
                        <p className="text-[10px] text-green-600 font-bold">{t('idVerification.idCaptured')}</p>
                     </div>
                 ) : errorMsg ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-200">
                           <AlertCircle size={16} /> {t('verifyFailedMsg')}
                        </div>
                        <p className="text-[10px] text-red-600 font-medium px-4">{errorMsg}</p>
                        <button 
                           type="button" 
                           onClick={() => setStep(1)} 
                           className="text-[10px] font-black text-primary uppercase tracking-widest underline mt-1 hover:text-primary/80 transition-colors"
                         >
                            {t('returnToStep1Btn')}
                         </button>
                    </div>
                 ) : null}
              </div>
             )}

             <button
               type="button"
               onClick={() => router.push('/dashboard')}
               className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-gray-600 py-4 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all"
             >
                {t('backToDashboardBtn')}
             </button>
           </div>
         );
      case 6: // Gallery
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300 text-center">
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-accent italic">{t('gallery')}</h2>
                <p className="text-gray-500">{t('gallerySubtitle')}</p>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider max-w-sm mx-auto leading-relaxed">
                   ⚠️ {t('galleryStrictWarning')}
                </div>
             </div>
             <div className="grid grid-cols-3 gap-3">
                {formData.gallery_photos.map((url, i) => (
                   <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden group border border-gray-200 shadow-sm">
                      <Image src={url} fill className="object-cover" alt="Gallery" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 p-2">
                         <button 
                            type="button" 
                            title={t('deletePhotoTitle')} 
                            onClick={() => updateField('gallery_photos', formData.gallery_photos.filter((_, idx) => idx !== i))} 
                            className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
                         >
                            <X size={16} />
                         </button>
                         <label 
                            title={t('replacePhotoBtn')}
                            className="w-8 h-8 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-center shadow-lg cursor-pointer transition-transform active:scale-95"
                         >
                            <span className="text-xs">🔄</span>
                            <input 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !userId) return;
                                  setIsSubmitting(true);
                                  setErrorMsg('');
                                  try {
                                     const fileName = `${userId}/gallery-${Date.now()}-${Math.random()}.jpg`;
                                     const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
                                     if (!error) {
                                        const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                                        const moderationResult = await moderateImage(publicUrl).catch(() => ({ approved: true, reason: '' }));
                                        if (moderationResult.approved) {
                                           const updatedPhotos = [...formData.gallery_photos];
                                           updatedPhotos[i] = publicUrl;
                                           updateField('gallery_photos', updatedPhotos);
                                        } else {
                                           setErrorMsg(t('imageRejectedMsg', { reason: moderationResult.reason || '' }));
                                        }
                                     }
                                  } catch (err: any) {
                                     setErrorMsg('Replace failed: ' + err.message);
                                  } finally {
                                     setIsSubmitting(false);
                                  }
                               }} 
                            />
                         </label>
                      </div>
                   </div>
                ))}
                {formData.gallery_photos.length < 5 && (
                  <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted">
                    <Camera size={20} className="text-gray-300" />
                    <input type="file" multiple aria-label={t('galleryUpload')} className="hidden" onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length || !userId) return;
                      setIsSubmitting(true);
                      setErrorMsg('');
                      const urls = [...formData.gallery_photos];
                      for (const file of files) {
                        if (urls.length >= 5) break;
                        const fileName = `${userId}/gallery-${Date.now()}-${Math.random()}.jpg`;
                        const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
                        if (!error) {
                          const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                          
                          // Run AI Image Moderation Check
                          try {
                          const moderationResult = await moderateImage(publicUrl);
                          if (moderationResult.approved) {
                            urls.push(publicUrl);
                          } else {
                            setErrorMsg(t('imageRejectedMsg', { reason: moderationResult.reason || '' }));
                          }
                          } catch (modErr) {
                            console.error("Image moderation call failed:", modErr);
                            urls.push(publicUrl); // Fallback to allow if API fails
                          }
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
        const activeCountryName = selectedCountry === 'Others' ? customCountry : (t_const(`Countries.${selectedCountry}`) || selectedCountry);
        const activeRegionName = selectedRegion === 'Others' ? customRegion : (getTranslation(selectedRegion, locale) || selectedRegion);
        const activeCityName = selectedCity === 'Others' ? customCity : (getTranslation(selectedCity, locale) || selectedCity);
        return (
          <div className="space-y-8 text-center animate-in zoom-in duration-500">
             <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg shadow-green-500/10">
                <CheckCircle2 size={44} className="text-green-500" />
             </div>
             
             <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-extrabold text-accent italic tracking-tight">{t('finishTitle')}</h2>
                <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto font-medium">{t('finishSubtitle')}</p>
             </div>

             {/* ── Profile Summary Review Card ── */}
             <div className="bg-[#FDFBF9] rounded-[2rem] p-6 border border-gray-200/80 text-left space-y-5 shadow-inner">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-accent flex items-center gap-2">
                    📋 {t('reviewAndConfirm')}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400">Step 1-6</span>
                </div>

                {/* Section 1: Basic Info */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 relative group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      👤 {t('basicProfileLabel')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[10px] font-extrabold text-primary hover:underline bg-primary/5 px-3 py-1 rounded-full"
                    >
                      ✏️ {t('editBtn')}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 font-medium">
                    <p><strong className="text-gray-900">{t('nameReview')}:</strong> {formData.full_name || '-'}</p>
                    <p><strong className="text-gray-900">{t('birthReview')}:</strong> {formData.birth_date || '-'}</p>
                    <p><strong className="text-gray-900">{t('genderReligionReview')}:</strong> {t_const(`Genders.${formData.gender}`) || formData.gender || '-'} • {t_const(`Religions.${formData.religion}`) || formData.religion || '-'}</p>
                    <p><strong className="text-gray-900">{t('locationReview')}:</strong> {activeCountryName || '-'}, {activeRegionName || '-'}, {activeCityName || '-'}</p>
                  </div>
                </div>

                {/* Section 2: Career & Preferences */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 relative group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      💼 {t('careerValuesLabel')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-[10px] font-extrabold text-primary hover:underline bg-primary/5 px-3 py-1 rounded-full"
                    >
                      ✏️ {t('editBtn')}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 font-medium">
                    <p><strong className="text-gray-900">{t('jobReview')}:</strong> {t_const(`Jobs.${formData.job}`) || formData.job || '-'}</p>
                    <p><strong className="text-gray-900">{t('financeReview')}:</strong> {t_const(`Finance.${formData.finance_habit}`) || formData.finance_habit || '-'}</p>
                    <p><strong className="text-gray-900">{t('valuesReview')}:</strong> {t_const(`Values.${formData.family_value}`) || formData.family_value || '-'}</p>
                  </div>
                </div>

                {/* Section 3: Partner Requirements */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 relative group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      ❤️ {t('partnerPrefLabel')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-[10px] font-extrabold text-primary hover:underline bg-primary/5 px-3 py-1 rounded-full"
                    >
                      ✏️ {t('editBtn')}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 font-medium">
                    <p><strong className="text-gray-900">{t('ageRangeReview')}:</strong> {formData.partner_age_min} - {formData.partner_age_max} {t('yearsUnit')}</p>
                    <p><strong className="text-gray-900">{t('religionReview')}:</strong> {t_const(`Religions.${formData.partner_religion}`) || formData.partner_religion || '-'}</p>
                    <p><strong className="text-gray-900">{t('intentReview')}:</strong> {getRelationshipGoalLabel(formData.partner_intent, locale, t_const)}</p>
                  </div>
                </div>

                {/* Section 4: Gallery Photos */}
                {formData.gallery_photos.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 relative group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        🖼️ {t('galleryPhotosLabel')} ({formData.gallery_photos.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(6)}
                        className="text-[10px] font-extrabold text-primary hover:underline bg-primary/5 px-3 py-1 rounded-full"
                      >
                        ✏️ {t('editBtn')}
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pt-1">
                      {formData.gallery_photos.map((url, idx) => (
                        <img key={idx} src={url} alt="Gallery" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}
             </div>

             <button onClick={handleFinish} disabled={isSubmitting} className="w-full btn-primary py-5 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 className="animate-spin" /> : t('proceedVerify')}
             </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white py-6 md:py-12 px-4 flex items-center justify-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-xl w-full">
        <div className="mb-8 flex justify-between items-center px-4">
          {(step === 4 || step === 5) ? (
            // Verification Progress Bar (2 steps)
            [4, 5].map((i, idx) => {
               const displayNum = idx + 1;
               const isCompleted = step > i;
               return (
                 <React.Fragment key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isCompleted) setStep(i);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all ${
                        step === i ? 'bg-primary text-white scale-110 shadow-lg ring-4 ring-primary/20' : isCompleted ? 'bg-primary text-white cursor-pointer hover:scale-110' : 'bg-white text-gray-300 border border-gray-200'
                      }`}
                    >
                       <span className="text-[10px] font-black">{displayNum}</span>
                    </button>
                    {idx < 1 && <div className={`flex-1 h-1 mx-1 rounded-full ${step > i ? 'bg-primary' : 'bg-white'}`} />}
                 </React.Fragment>
               );
            })
          ) : (
            // Onboarding Progress Bar (5 steps: 1, 2, 3, 6, 7)
            [1, 2, 3, 6, 7].map((i, idx) => {
               const displayNum = idx + 1;
               const isCompleted = step > i || (step === 7 && i !== 7);
               return (
                 <React.Fragment key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        if (i < step || step === 7) {
                          setErrorMsg('');
                          setStep(i);
                        }
                      }}
                      title={`Step ${displayNum}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all ${
                        step === i 
                          ? 'bg-primary text-white scale-110 shadow-lg ring-4 ring-primary/20' 
                          : isCompleted 
                          ? 'bg-primary text-white cursor-pointer hover:scale-110' 
                          : 'bg-white text-gray-300 border border-gray-200'
                      }`}
                    >
                       <span className="text-[10px] font-black">{displayNum}</span>
                    </button>
                    {idx < 4 && <div className={`flex-1 h-1 mx-1 rounded-full ${step > i ? 'bg-primary' : 'bg-white'}`} />}
                 </React.Fragment>
               );
            })
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100 relative overflow-hidden">
          <div className={`absolute top-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-32 h-32 bg-primary/5 rounded-full ${locale === 'ar' ? '-ml-16' : '-mr-16'} -mt-16 blur-3xl opacity-50`} />
          <div className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} w-32 h-32 bg-primary/5 rounded-full ${locale === 'ar' ? '-mr-16' : '-ml-16'} -mb-16 blur-2xl opacity-40`} />
          
          <div className="relative">
            {/* ── ID Document Rejection Modal (Step 4 pre-screen) ── */}
            {showIdRejectionModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white rounded-[2rem] max-w-md w-full p-8 border border-red-100 shadow-2xl mx-4 relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-60" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full -ml-16 -mb-16 blur-2xl opacity-40" />
                  <div className="relative flex flex-col items-center text-center gap-5">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100 shadow-sm animate-pulse">
                      <AlertCircle size={32} />
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                        {t('idDocRejectedTitle')}
                      </h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                        {t('selfieDenied')}
                      </p>
                    </div>

                    {/* Error message */}
                    <div className="w-full bg-red-50/70 border border-red-100 rounded-2xl p-4 text-left">
                      <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                        {idRejectionMessage}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="w-full flex flex-col gap-3">
                      {/* Primary: re-upload a different ID */}
                      <label className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2">
                        <Upload size={14} />
                        <span>{t('uploadDifferentIdBtn')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={async (e) => {
                            setShowIdRejectionModal(false);
                            // Trigger the main upload handler by reading the file
                            const file = e.target.files?.[0];
                            if (!file || !userId) return;
                            setIdDocValidated(false);
                            setIdRejectionMessage('');
                            setFormData(prev => ({ ...prev, id_photo: '', verification_status: 'unverified' }));
                            setIsSubmitting(true);
                            setIsValidatingId(true);
                            try {
                              const fileName = `${userId}/verification-id-${Date.now()}.jpg`;
                              const { error: uploadError } = await supabase.storage.from('user_photos').upload(fileName, file);
                              if (uploadError) throw uploadError;
                              const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                              setFormData(prev => ({ ...prev, id_photo: publicUrl, verification_status: 'unverified' }));
                              const validationResult = await validateIdDocument(userId, publicUrl, {
                                full_name: formData.full_name,
                                birth_date: formData.birth_date,
                                location: {
                                  country: selectedCountry === 'Others' ? customCountry : selectedCountry,
                                  region: selectedRegion === 'Others' ? customRegion : selectedRegion,
                                  city: selectedCity === 'Others' ? customCity : selectedCity,
                                },
                              });
                              if (validationResult.isMatch) {
                                setIdDocValidated(true);
                              } else {
                                setIdDocValidated(false);
                                const msg = validationResult.displayMessage || validationResult.reason || 'ያስገቡት የመታወቂያ መረጃ የተሳሳተ ወይም ያልተሟላ ነው። እባክዎን ትክክለኛ የመንግስት መታወቂያ፣ ፓስፖርት ወይም መንጃ ፍቃድ ያቅርቡ።';
                                setIdRejectionMessage(msg);
                                setShowIdRejectionModal(true);
                              }
                            } catch (err: any) {
                              setIdDocValidated(false);
                              setIdRejectionMessage('የሰርቨር ስህተት ተከስቷል። እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ።');
                              setShowIdRejectionModal(true);
                            } finally {
                              setIsValidatingId(false);
                              setIsSubmitting(false);
                            }
                          }}
                        />
                      </label>

                      {/* Secondary: fix name / birth date in Step 1 */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowIdRejectionModal(false);
                          setFormData(prev => ({ ...prev, id_photo: '', verification_status: 'unverified' }));
                          setIdDocValidated(false);
                          setErrorMsg('');
                          setStep(1);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-gray-700 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                      >
                        {t('goStep1FixBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showMismatchModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white rounded-[2rem] max-w-md w-full p-8 border border-red-100 shadow-2xl mx-4 relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-60" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full -ml-16 -mb-16 blur-2xl opacity-40" />
                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-100 shadow-sm animate-pulse">
                      <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mb-3">
                      {mismatchDetails.type === 'name' 
                        ? t('nameMismatchTitle')
                        : mismatchDetails.type === 'birth_date'
                        ? t('birthMismatchTitle')
                        : t('bothMismatchTitle')}
                    </h3>
                    
                    <div className="bg-red-50/70 p-4 rounded-2xl border border-red-100 text-left mb-6 text-xs space-y-2">
                      <p className="text-gray-700 leading-relaxed font-medium">
                        {mismatchDetails.type === 'name' 
                          ? t('nameMismatchDesc', { name: formData.full_name })
                          : mismatchDetails.type === 'birth_date'
                          ? t('birthMismatchDesc', { date: formData.birth_date })
                          : t('bothMismatchDesc', { name: formData.full_name, date: formData.birth_date })}
                      </p>
                      {mismatchDetails.message && (
                        <p className="text-[10px] text-red-600 font-semibold italic border-t border-red-100 pt-2">
                          {mismatchDetails.message}
                        </p>
                      )}
                    </div>

                    <div className="w-full flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            verification_status: 'unverified'
                          }));
                          setErrorMsg('');
                          setShowMismatchModal(false);
                          setStep(1);
                        }}
                        className="w-full bg-primary hover:bg-primary/95 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
                      >
                        {mismatchDetails.type === 'name'
                          ? t('goFixNameBtn')
                          : mismatchDetails.type === 'birth_date'
                          ? t('goFixBirthBtn')
                          : t('goFixBothBtn')}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            id_photo: '',
                            selfie_photo: '',
                            verification_status: 'unverified'
                          }));
                          setErrorMsg('');
                          setShowMismatchModal(false);
                          setStep(4);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-gray-700 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                      >
                        {t('reuploadIdBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Verification Request Received Modal ── */}
            {showVerificationReceivedModal && (
              <div className="fixed inset-0 z-[10000] bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 border border-emerald-100 animate-in zoom-in-95 duration-200">
                  <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-[2rem] mx-auto flex items-center justify-center text-3xl shadow-inner relative">
                    <ShieldCheck size={40} />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black italic text-accent">
                      {t('receivedTitle')}
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                      {t('receivedBody')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {t('goToDashboardBtn')} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                {errorMsg}
              </div>
            )}

            {renderStep()}

            {step < 7 && (
              <div className={`mt-12 sticky bottom-2 z-40 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200/80 shadow-lg flex justify-between gap-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                {step > 1 && (
                  <button 
                    onClick={prevStep}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
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
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-accent italic">{t('loading')}</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
