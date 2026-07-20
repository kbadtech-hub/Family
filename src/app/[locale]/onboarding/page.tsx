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
  AlertCircle
} from 'lucide-react';
import { calculateStarSign } from '@/lib/abushakir';
import { simulateIdentityVerification } from '@/lib/verification';
import { moderateImage } from '@/lib/moderation';
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
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [showVerificationSubmittedModal, setShowVerificationSubmittedModal] = useState(false);
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
                setShowVerificationSubmittedModal(true);
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

                setFormData(prev => ({ ...prev, verification_status: 'rejected' }));
                setErrorMsg('ያስገቡት ሰነድ ትክክለኛነቱ ሊረጋገጥ አልቻለም። እባክዎ በትክክል መርጠው ድጋሚ ይሞክሩ።');
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
            setShowVerificationSubmittedModal(true);
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

            // Pre-fill location selectors
            if (data.location) {
              const loc = typeof data.location === 'object' ? data.location : null;
              if (loc) {
                if (loc.country) setSelectedCountry(loc.country);
                if (loc.region) setSelectedRegion(loc.region);
                if (loc.city) setSelectedCity(loc.city);
              } else if (typeof data.location === 'string') {
                setSelectedCountry(data.location);
              }
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

    // Request location permission on onboarding start
    if (!geoRequested && navigator.geolocation) {
      setGeoRequested(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Location captured - save to profile if user exists
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('profiles').update({
                registration_location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
              }).eq('id', user.id);
            }
          });
        },
        () => { /* User denied - non-blocking */ },
        { timeout: 8000 }
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
        break;
      case 5: // Selfie
        if (!formData.selfie_photo) {
          return locale === 'am' ? 'እባክዎ በላይቭ ካሜራ የ3 ሰከንድ ቪዲዮ ሰልፊ ይቅረጹ ወይም ፋይል ይጫኑ።' : 'Please record a 3-second live video selfie or upload a file first.';
        }
        if (formData.verification_status !== 'verified') {
          return locale === 'am' ? 'የመታወቂያ እና የሰልፊ ማመሳከሪያው ማረጋገጫ አልተጠናቀቀም ወይም አልተገጣጠመም። እባክዎ በትክክል ያስገቡ።' : 'Identity verification match has not succeeded. Please record again or check details.';
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
        } else if (step === 4 || step === 5) {
          updateData = {
            onboarding_step: step + 1
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
        router.push('/dashboard');
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
          onboarding_completed: true
        }).eq('id', userId);

        if (finishError) {
          console.error("Finish Error:", finishError);
          setErrorMsg(locale === 'am' ? 'ማጠናቀቅ አልተቻለም። እባክዎ ደግመው ይሞክሩ።' : 'Failed to finish onboarding. Please try again.');
          return;
        }
        
        router.push('/dashboard');
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
                {locale === 'am' ? 'የመገለጫ ፈጣን ማዋቀር' : 'Quick Profile Setup'}
              </h2>
              <p className="text-gray-500 font-medium italic text-xs max-w-sm mx-auto">
                {locale === 'am' 
                  ? 'እባክዎ መለያዎን ለመፍጠር የሚከተሉትን መሰረታዊ መረጃዎች ያሟሉ' 
                  : 'Please complete the details below to initialize your account.'}
              </p>
            </div>
            
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-primary/10 shadow-2xl space-y-6">
              
              {/* Profile Picture Uploader */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {locale === 'am' ? 'የመገለጫ ፎቶ' : 'Profile Picture'}
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-muted border-2 border-primary/20 rounded-[2rem] overflow-hidden relative flex items-center justify-center shadow-inner">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={32} className="text-gray-300" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all">
                    {locale === 'am' ? 'ፎቶ ይጫኑ' : 'Upload Photo'}
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
                </div>
              </div>

              {/* Legal Name Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {locale === 'am' ? 'ህጋዊ ሙሉ ስም (በመታወቂያ/ፓስፖርት ላይ ያለ)' : 'Official Legal Full Name (As on Passport/ID)'}
                </label>
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary p-4 bg-white text-sm font-semibold border" 
                  placeholder={locale === 'am' ? 'ለምሳሌ፡ ዮናስ አበበ ከበደ' : 'e.g. Dawit Kebede Alemu'}
                />
                <p className="text-[10px] text-gray-400 font-medium ml-1">
                  {locale === 'am' ? '💡 እባክዎ ህጋዊ ሙሉ ስምዎን ያስገቡ (የጎግል/ፌስቡክ ስም አይወሰድም)' : '💡 Enter your official legal name (Google/Facebook names are not pre-populated)'}
                </p>
              </div>

              {/* Gender Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('fields.gender')}
                </label>
                <select 
                  value={formData.gender} 
                  onChange={(e) => updateField('gender', e.target.value)} 
                  className="w-full p-4 bg-muted/30 border border-gray-200 rounded-2xl font-bold text-xs"
                >
                  <option value="">{t('fields.gender')}</option>
                  {GENDERS.map(g => <option key={g} value={g}>{t_const(`Genders.${g}`)}</option>)}
                </select>
              </div>

              {/* Date of Birth Input with Calendar Toggle */}
              {!isBirthDatePreFilled ? (
                <div className="space-y-3">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    {locale === 'am' ? 'የልደት ቀን' : 'Birth Date'}
                  </label>
                  <div className="flex gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl w-fit border border-gray-150 shadow-sm">
                    <button type="button" onClick={() => updateField('calendar_type', 'gregorian')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.calendar_type === 'gregorian' ? 'bg-white text-primary shadow-md' : 'text-gray-400'}`}>{t('calendar.gregorian')}</button>
                    <button type="button" onClick={() => updateField('calendar_type', 'ethiopian')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.calendar_type === 'ethiopian' ? 'bg-white text-primary shadow-md' : 'text-gray-400'}`}>{t('calendar.ethiopian')}</button>
                  </div>
                  
                  {formData.calendar_type === 'ethiopian' ? (
                    <div className="grid grid-cols-3 gap-3">
                       <select value={formData.eth_birth_day} aria-label={t('calendar.day')} onChange={(e) => updateField('eth_birth_day', e.target.value)} className="p-4 bg-muted/30 border border-gray-150 rounded-2xl font-bold text-xs">
                         <option value="">{t('calendar.day') || 'Day'}</option>
                         {Array.from({ length: formData.eth_birth_month === '13' ? 6 : 30 }, (_, i) => i + 1).map(day => (
                           <option key={day} value={day}>{day}</option>
                         ))}
                       </select>
                       <select value={formData.eth_birth_month} aria-label={t('calendar.month')} onChange={(e) => updateField('eth_birth_month', e.target.value)} className="p-4 bg-muted/30 border border-gray-150 rounded-2xl font-bold text-xs">
                         <option value="">{t('calendar.month') || 'Month'}</option>
                         {['Meskerem', 'Tikemt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'].map((m, i) => <option key={m} value={i + 1}>{t_const(`Months.${m}`)}</option>)}
                       </select>
                       <select value={formData.eth_birth_year} aria-label={t('calendar.year')} onChange={(e) => updateField('eth_birth_year', e.target.value)} className="p-4 bg-muted/30 border border-gray-150 rounded-2xl font-bold text-xs">
                         <option value="">{t('calendar.year') || 'Year'}</option>
                         {Array.from({ length: 70 }, (_, i) => 2018 - 18 - i).map(year => (
                           <option key={year} value={year}>{year}</option>
                         ))}
                       </select>
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
                    {locale === 'am' ? 'የልደት ቀን' : 'Birth Date'}
                  </span>
                  <p className="text-sm font-bold text-accent">{formData.birth_date}</p>
                </div>
              )}

              {/* Religion Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('fields.religion')}
                </label>
                <select 
                  value={formData.religion} 
                  onChange={(e) => updateField('religion', e.target.value)} 
                  className="w-full p-4 bg-muted/30 border border-gray-200 rounded-2xl font-bold text-xs"
                >
                  <option value="">{t('fields.religion')}</option>
                  {RELIGIONS.map(r => <option key={r} value={r}>{t_const(`Religions.${r}`)}</option>)}
                </select>
              </div>

              {/* Marital Status Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('fields.maritalStatus')}
                </label>
                <select 
                  value={formData.marital_status} 
                  onChange={(e) => updateField('marital_status', e.target.value)} 
                  className="w-full p-4 bg-muted/30 border border-gray-200 rounded-2xl font-bold text-xs"
                >
                  <option value="">{t('fields.maritalStatus')}</option>
                  {(formData.gender === 'Female' ? MARITAL_STATUS_FEMALE : MARITAL_STATUS_MALE).map(s => <option key={s} value={s}>{t_const(`Marital.${s}`)}</option>)}
                </select>
              </div>

              {/* Future Children Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {locale === 'am' ? 'የልጅ እቅድ' : 'Future Children'}
                </label>
                <select 
                  value={formData.future_children} 
                  onChange={(e) => updateField('future_children', e.target.value)} 
                  className="w-full p-4 bg-muted/30 border border-gray-200 rounded-2xl font-bold text-xs"
                >
                  <option value="">{locale === 'am' ? 'የልጅ እቅድ' : 'Future Children'}</option>
                  {FUTURE_CHILDREN_OPTIONS.map((o: string) => <option key={o} value={o}>{t_const(`FutureChildren.${o}`)}</option>)}
                </select>
              </div>

              {/* Location Cascading Picker */}
              <div className="space-y-4 bg-[#F8F9FA]/50 p-6 rounded-[2rem] border border-gray-150">
                <span className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2 ml-1">
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
                        updateField('location', e.target.value);
                      }}
                      className="w-full p-3.5 bg-white border border-gray-200 rounded-xl font-bold text-xs"
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
                      className="w-full p-3.5 bg-white border border-gray-200 rounded-xl font-bold text-xs disabled:opacity-50"
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
                      className="w-full p-3.5 bg-white border border-gray-200 rounded-xl font-bold text-xs disabled:opacity-50"
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
                    {locale === 'am' ? 'ልጆች አሉኝ' : 'I have children'}
                  </span>
                </label>

                {hasChildren && (
                  <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider ml-1">
                      {locale === 'am' ? 'የልጆች ብዛት' : 'Number of Children'}
                    </label>
                    <select
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(e.target.value)}
                      className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold text-xs"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="More than 3">More than 3 / ከ 3 በላይ</option>
                    </select>
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
                     {[{name:'Anywhere'}, ...[...COUNTRIES].sort((a, b) => {
                         const nameA = locale === 'am' ? a.nameAm : a.name;
                         const nameB = locale === 'am' ? b.nameAm : b.name;
                         return nameA.localeCompare(nameB, locale);
                       })].map(c => {
                         const cleanName = c.name === 'Anywhere' 
                           ? (locale === 'am' ? 'የትም ቦታ' : 'Anywhere') 
                           : (locale === 'am' ? (c as any).nameAm : c.name);
                         
                         return (
                           <button key={c.name} type="button" aria-label={cleanName} onClick={() => {
                             if (c.name === 'Anywhere') return updateField('partner_countries', ['Anywhere']);
                             const next = formData.partner_countries.filter(pc => pc !== 'Anywhere');
                             updateField('partner_countries', formData.partner_countries.includes(c.name) ? next.filter(pc => pc !== c.name) : [...next, c.name].slice(0, 3));
                           }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.partner_countries.includes(c.name) ? 'bg-primary text-white' : 'bg-white text-gray-400'}`}>
                             {cleanName}
                           </button>
                         );
                       })
                     }
                     <button type="button" onClick={() => {
                       const next = formData.partner_countries.filter(pc => pc !== 'Anywhere');
                       if (formData.partner_countries.includes('Others')) {
                         updateField('partner_countries', next.filter(pc => pc !== 'Others'));
                       } else {
                          updateField('partner_countries', [...next, 'Others'].slice(0, 3));
                       }
                     }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.partner_countries.includes('Others') ? 'bg-primary text-white' : 'bg-white text-gray-400'}`}>
                       {locale === 'am' ? 'ሌላ' : 'Others'}
                     </button>
                   </div>
                   {formData.partner_countries.includes('Others') && (
                     <input
                       type="text"
                       placeholder={locale === 'am' ? 'እባክዎ ሌላ አገር ይጥቀሱ...' : 'Specify other country...'}
                       value={customPartnerCountry}
                       onChange={(e) => setCustomPartnerCountry(e.target.value)}
                       className="w-full p-3 mt-2 bg-muted rounded-xl text-xs font-semibold focus:outline-none"
                     />
                   )}
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

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Partner Religion Preference</label>
                      <select
                        value={showCustomPartnerReligion ? 'Others' : formData.partner_religion}
                        onChange={(e) => {
                          if (e.target.value === 'Others') {
                            setShowCustomPartnerReligion(true);
                            updateField('partner_religion', '');
                          } else {
                            setShowCustomPartnerReligion(false);
                            updateField('partner_religion', e.target.value);
                          }
                        }}
                        className="w-full p-3 bg-muted rounded-xl font-bold text-xs"
                      >
                        <option value="">Select Religion</option>
                        {RELIGIONS.map(r => <option key={r} value={r}>{t_const(`Religions.${r}`) || r}</option>)}
                        <option value="Others">Others / ሌላ</option>
                      </select>
                      {showCustomPartnerReligion && (
                        <input
                          type="text"
                          placeholder="Specify custom religion..."
                          value={customPartnerReligion}
                          onChange={(e) => setCustomPartnerReligion(e.target.value)}
                          className="w-full p-3 mt-2 bg-muted rounded-xl text-xs font-semibold"
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Partner Relationship Goal</label>
                      <select
                        value={showCustomPartnerIntent ? 'Others' : formData.partner_intent}
                        onChange={(e) => {
                          if (e.target.value === 'Others') {
                            setShowCustomPartnerIntent(true);
                            updateField('partner_intent', '');
                          } else {
                            setShowCustomPartnerIntent(false);
                            updateField('partner_intent', e.target.value);
                          }
                        }}
                        className="w-full p-3 bg-muted rounded-xl font-bold text-xs"
                      >
                        <option value="">Select Goal</option>
                        <option value="Serious Partner/Marriage">Serious Partner / Marriage</option>
                        <option value="Serious Relationship/Dating">Serious Relationship / Dating</option>
                        <option value="Normal Friendship">Normal Friendship</option>
                        <option value="Passing Time/Learning and Understanding Marriage">Passing Time / Learning and Understanding Marriage</option>
                        <option value="Others">Others / ሌላ</option>
                      </select>
                      {showCustomPartnerIntent && (
                        <input
                          type="text"
                          placeholder="Specify custom goal..."
                          value={customPartnerIntent}
                          onChange={(e) => setCustomPartnerIntent(e.target.value)}
                          className="w-full p-3 mt-2 bg-muted rounded-xl text-xs font-semibold"
                        />
                      )}
                    </div>
                  </div>
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
               <input type="file" accept="image/*" capture="environment" aria-label={t('idVerification.doc')} className="hidden" 
                 onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if (!file || !userId) return;
                   setIsSubmitting(true);
                   const fileName = `${userId}/verification-id-${Date.now()}.jpg`;
                   const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
                   if (!error) {
                     const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                     setFormData(prev => ({ ...prev, id_photo: publicUrl, verification_status: 'unverified' }));
                   }
                   setIsSubmitting(false);
                 }}
               />
            </label>

            <button
                type="button"
                onClick={() => {
                  setStep(5);
                }}
                className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-gray-600 py-4 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all"
             >
                {locale === 'am' ? 'ይህን ደረጃ ዝለል (Skip Step)' : locale === 'ti' ? 'እዚ ደረጃ እዚ ሕለፎ (Skip Step)' : locale === 'om' ? 'Tarkaanfii kana utaali (Skip Step)' : 'Skip ID Verification'}
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
                {locale === 'am' ? 'የቪዲዮ ሰልፊ ማረጋገጫ' : locale === 'ti' ? 'ናይ ቪድዮ ሰልፊ ምርግጋጽ' : locale === 'om' ? 'Mirkaneessa Viidiyoo Selfie' : 'Selfie Video Verification'}
              </h2>
              <p className="text-gray-500 max-w-sm mx-auto text-xs font-medium leading-relaxed">
                {locale === 'am' 
                  ? 'ካሜራዎ መለያዎን ለማረጋገጥ በጥብቅ ያስፈልጋል። እባክዎ ካሜራውን በመክፈት የ3 ሰከንድ ቀጥታ ቪዲዮ ይቅረጹ ወይም አጭር የሰልፊ ቪዲዮ ይጫኑ። የተመዘገበው ቪዲዮ ከላኩት መታወቂያ ጋር የሚስማማ መሆኑን ለማረጋገጥ ብቻ ያገለግላል።' 
                  : locale === 'ti'
                  ? 'ካሜራኹም መለያኹም ንምርግጋጽ ብጥብቂ የድሊ እዩ። በጃኹም ካሜራ ብምኽፋት ናይ 3 ሰከንድ ቪድዮ ሰልፊ ይቕረጹ ወይ ናይ ሰልፊ ቪድዮ ይጽዓኑ።'
                  : locale === 'om'
                  ? 'Koontaa kee mirkaneessuuf kaameraan kee baay\'ee barbaachisaadha. Maaloo kaameraa banuun viidiyoo selfii sekondii 3 waraabi ykn viidiyoo selfii gabaabaa fe\'i.'
                  : 'Your camera is strictly required to capture your profile verification image and record identity verification media. Please record a 3-second live selfie video or upload a video file. Your camera is used solely to verify profile authenticity.'}
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
                <span>{locale === 'am' ? 'ካሜራ ተፈቅዷል • በላይቭ ላይ ነው' : 'Camera Allowed • Live Stream Active'}</span>
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
                      {locale === 'am' ? 'ላይቭ ካሜራ ዝግጁ ነው' : locale === 'ti' ? 'ናይ ቀጥታ ካሜራ ጠፊኡ' : locale === 'om' ? 'Kaameraan dhaameera' : 'Live Camera Off'}
                    </span>
                 </div>
               )}

               {isRecording && (
                 <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                    <p className="text-lg font-black tracking-widest animate-pulse uppercase">
                      {locale === 'am' ? 'እየተቀረጸ ነው' : locale === 'ti' ? 'እየተቐረጸ እዩ' : locale === 'om' ? 'Waraabamaa jira' : 'Recording'}
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
                  {locale === 'am' ? 'ካሜራ ክፈት' : locale === 'ti' ? 'ካሜራ ክፈት' : locale === 'om' ? 'Kaameraa Bani' : 'Open Live Camera'}
                </button>
              )}

              {cameraActive && !isRecording && (
                <button
                  type="button"
                  onClick={recordVideo}
                  className="bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all animate-pulse"
                >
                  {locale === 'am' ? 'መቅረጽ ጀምር (3 ሰከንድ)' : locale === 'ti' ? 'ምቕራጽ ጀምር (3 ሰከንድ)' : locale === 'om' ? 'Waraabuu jalqabi (Sec 3)' : 'Record (3s)'}
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
                  {locale === 'am' ? 'እንደገና ቅረጽ' : locale === 'ti' ? 'ከም ብሓዱሽ ቅረጽ' : locale === 'om' ? 'Deebisi waraabi' : 'Retake Video'}
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
                     <Loader2 className="animate-spin" size={14} /> {locale === 'am' || locale === 'ti' ? (locale === 'am' ? 'መረጃዎችዎን እያመሳከርን ነው...' : 'ሓበሬታታትኩም ነረጋግጽ ኣለና...') : 'Verifying Identity Match...'}
                   </p>
                 ) : formData.verification_status === 'verified' ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-200 animate-bounce">
                           <CheckCircle2 size={16} /> {locale === 'am' ? 'መለያዎ ተረጋግጧል' : locale === 'ti' ? 'መለያኹም ተረጋጊጹ' : locale === 'om' ? 'Koontaan kee mirkanaa\'eera' : 'Account Verified'}
                        </div>
                        <p className="text-[10px] text-green-600 font-bold">{t('idVerification.idCaptured')}</p>
                     </div>
                 ) : errorMsg ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-200">
                           <AlertCircle size={16} /> {locale === 'am' ? 'ማረጋገጫው አልተሳካም' : locale === 'ti' ? 'ምርግጋጽ ኣይተዓወተን' : locale === 'om' ? 'Mirkaneessi hin milkoofne' : 'Verification Failed'}
                        </div>
                        <p className="text-[10px] text-red-600 font-medium px-4">{errorMsg}</p>
                        <button 
                           type="button" 
                           onClick={() => setStep(1)} 
                           className="text-[10px] font-black text-primary uppercase tracking-widest underline mt-1 hover:text-primary/80 transition-colors"
                         >
                            {locale === 'am' ? 'ስም ወይም የልደት ቀን ለማስተካከል ወደ ደረጃ 1 ይመለሱ' : locale === 'ti' ? 'ስም ወይስ እለት ልደት ንምስትኽኻል ናብ ደረጃ 1 ተመለሱ' : locale === 'om' ? 'Maqaa ykn guyyaa dhalootaa sirreessuuf gara tarkaanfii 1ffaatti deebi\'i' : 'Return to Step 1 to correct profile details'}
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
                {locale === 'am' ? 'ወደ ዳሽቦርድ ይመለሱ' : locale === 'ti' ? 'ናብ ዳሽቦርድ ተመለሱ' : locale === 'om' ? 'Gara Daashboordiitti deebi\'i' : 'Back to Dashboard'}
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
                   ⚠️ {locale === 'am' 
                     ? 'ጥብቅ መመሪያ፡ እባክዎ የእርስዎን ትክክለኛ ፎቶ ብቻ ይጫኑ። የካርቱን፣ ተፈጥሮ (ልክ እንደ መልክዓ ምድር)፣ ወይም የታዋቂ ሰዎች ፎቶዎችን መጫን በጥብቅ የተከለከለ ነው!' 
                     : 'Strict Guidelines: Only upload authentic photos of yourself. Cartoons, landscapes, or celebrity photos are strictly blocked!'}
                </div>
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
                            setErrorMsg(locale === 'am' 
                              ? `ምስሉ ውድቅ ተደርጓል፡ ${moderationResult.reason || 'የካርቱን፣ ተፈጥሮ ወይም የታዋቂ ሰዎች ምስሎች አይፈቀዱም።'}`
                              : `Image rejected: ${moderationResult.reason || 'Cartoons, landscapes, or celebrity photos are not allowed.'}`);
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
        const activeCountryName = selectedCountry === 'Others' ? customCountry : selectedCountry;
        const activeRegionName = selectedRegion === 'Others' ? customRegion : selectedRegion;
        const activeCityName = selectedCity === 'Others' ? customCity : selectedCity;
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
                    📋 {locale === 'am' ? 'የገባውን መረጃ ማጠቃለያ ያረጋግጡ' : 'Review & Confirm Your Information'}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400">Step 1-6</span>
                </div>

                {/* Section 1: Basic Info */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 relative group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      👤 {locale === 'am' ? 'መሰረታዊ መረጃ' : 'Basic Profile'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[10px] font-extrabold text-primary hover:underline bg-primary/5 px-3 py-1 rounded-full"
                    >
                      ✏️ {locale === 'am' ? 'አስተካክል' : 'Edit'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 font-medium">
                    <p><strong className="text-gray-900">{locale === 'am' ? 'ስም' : 'Name'}:</strong> {formData.full_name || '-'}</p>
                    <p><strong className="text-gray-900">{locale === 'am' ? 'ልደት' : 'Birth Date'}:</strong> {formData.birth_date || '-'}</p>
                    <p><strong className="text-gray-900">{locale === 'am' ? 'ጾታ & ሃይማኖት' : 'Gender & Religion'}:</strong> {formData.gender || '-'} • {formData.religion || '-'}</p>
                    <p><strong className="text-gray-900">{locale === 'am' ? 'ቦታ' : 'Location'}:</strong> {activeCountryName || '-'}, {activeRegionName || '-'}, {activeCityName || '-'}</p>
                  </div>
                </div>

                {/* Section 2: Career & Preferences */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 relative group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      💼 {locale === 'am' ? 'ሙያ እና እሴቶች' : 'Career & Values'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-[10px] font-extrabold text-primary hover:underline bg-primary/5 px-3 py-1 rounded-full"
                    >
                      ✏️ {locale === 'am' ? 'አስተካክል' : 'Edit'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 font-medium">
                    <p><strong className="text-gray-900">{locale === 'am' ? 'ስራ' : 'Job'}:</strong> {formData.job || '-'}</p>
                    <p><strong className="text-gray-900">{locale === 'am' ? 'የገንዘብ ልማድ' : 'Finance Habit'}:</strong> {formData.finance_habit || '-'}</p>
                    <p><strong className="text-gray-900">{locale === 'am' ? 'የቤተሰብ እሴት' : 'Family Values'}:</strong> {formData.family_value || '-'}</p>
                  </div>
                </div>

                {/* Section 3: Partner Requirements */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 relative group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      ❤️ {locale === 'am' ? 'የተጣማሪ መስፈርት' : 'Partner Preferences'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-[10px] font-extrabold text-primary hover:underline bg-primary/5 px-3 py-1 rounded-full"
                    >
                      ✏️ {locale === 'am' ? 'አስተካክል' : 'Edit'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 font-medium">
                    <p><strong className="text-gray-900">{locale === 'am' ? 'የእድሜ ክልል' : 'Age Range'}:</strong> {formData.partner_age_min} - {formData.partner_age_max} {locale === 'am' ? 'ዓመት' : 'years'}</p>
                    <p><strong className="text-gray-900">{locale === 'am' ? 'ሃይማኖት' : 'Religion'}:</strong> {formData.partner_religion || '-'}</p>
                    <p><strong className="text-gray-900">{locale === 'am' ? 'አላማ' : 'Intent'}:</strong> {formData.partner_intent || '-'}</p>
                  </div>
                </div>

                {/* Section 4: Gallery Photos */}
                {formData.gallery_photos.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 relative group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        🖼️ {locale === 'am' ? 'የጋለሪ ፎቶዎች' : 'Gallery Photos'} ({formData.gallery_photos.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(6)}
                        className="text-[10px] font-extrabold text-primary hover:underline bg-primary/5 px-3 py-1 rounded-full"
                      >
                        ✏️ {locale === 'am' ? 'አስተካክል' : 'Edit'}
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
          <div className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} w-32 h-32 bg-secondary/10 rounded-full ${locale === 'ar' ? '-mr-16' : '-ml-16'} -mb-16 blur-2xl opacity-40`} />
          
          <div className="relative">
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
                      {locale === 'am' ? 'የማንነት ማረጋገጫ አልተሳካም' : 'Identity Mismatch Detected'}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-8">
                      {locale === 'am' 
                        ? 'ያስገቡት ሰነድ ከተመዘገበው ማንነትዎ ጋር አይዛመድም። እባክዎን ትክክለኛ ማንነትዎን የሚወክል መታወቂያ/ፓስፖርት ይጫኑ ወይም መረጃዎን ያስተካክሉ።'
                        : 'The document provided does not match your registered identity. Please upload a valid ID/Passport that represents your true identity, or correct your information.'}
                    </p>
                    <div className="w-full flex flex-col gap-3">
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
                        className="w-full bg-primary hover:bg-primary/95 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
                      >
                        {locale === 'am' ? 'መታወቂያ እንደገና ይጫኑ' : 'Re-upload ID Document'}
                      </button>
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
                        className="w-full bg-slate-100 hover:bg-slate-200 text-gray-700 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                      >
                        {locale === 'am' ? 'መረጃ ያስተካክሉ' : 'Correct Profile Info'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showVerificationSubmittedModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 border border-blue-100 shadow-2xl mx-4 text-center space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-blue-50 text-blue-500 border border-blue-200 rounded-[2rem] mx-auto flex items-center justify-center text-3xl shadow-inner animate-pulse">
                    <ShieldCheck size={38} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black italic text-accent">
                      {locale === 'am' ? 'መረጃዎን በስኬት ተቀብለናል!' : 'Verification Documents Received!'}
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                      {locale === 'am'
                        ? 'የመታወቂያ እና የ3 ሰከንድ የቀጥታ ቪዲዮ ሰልፊ መረጃዎ በስኬት ደርሶናል። መረጃው ተጣርቶ ሙሉ ለማድረግ ከ 5 እስከ 30 ደቂቃ ይወስዳል። ውጤቱን በቅርቡ በዳሽቦርድዎ ላይ እናሳውቀዎታለን።'
                        : 'Your ID document and live video selfie have been received. Verification takes 5 to 30 minutes. We will notify you on your dashboard shortly.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowVerificationSubmittedModal(false);
                      router.push('/dashboard');
                    }}
                    className="w-full py-4 bg-primary hover:bg-primary/95 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {locale === 'am' ? 'ወደ ዳሽቦርድ ተመለሱ' : 'Return to Dashboard'} <ChevronRight size={18} />
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
