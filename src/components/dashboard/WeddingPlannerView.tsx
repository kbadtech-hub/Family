'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocale, useTranslations } from 'next-intl';
import { 
  Heart, 
  Sparkles, 
  Camera, 
  UtensilsCrossed, 
  Crown, 
  ChevronRight, 
  Calculator, 
  Check, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface PlannerPackage {
  id: string;
  name: string;
  nameAm: string;
  priceEtb: number;
  priceUsd: number;
  description: string;
  descriptionAm: string;
}

const HALLS_PACKAGES: PlannerPackage[] = [
  {
    id: 'hall-basic',
    name: 'Habesha Traditional Celebration',
    nameAm: 'ባህላዊ የሰርግ አዳራሽ',
    priceEtb: 150000,
    priceUsd: 3000,
    description: 'Traditional hall venue decorated in Habesha theme, buffet and soft drinks for 150 guests.',
    descriptionAm: 'ለ150 እንግዶች ባህላዊ የሀበሻ ጌጣጌጥ፣ ቡፌ እና ለስላሳ መጠጦችን ያካተተ አዳራሽ።'
  },
  {
    id: 'hall-premium',
    name: 'Royal Grand Ballroom',
    nameAm: 'ሮያል ግራንድ አዳራሽ (ቅንጡ)',
    priceEtb: 500000,
    priceUsd: 10000,
    description: 'Luxury ballroom, professional gourmet catering, premium decor, sound/lighting, and capacity for 300+ guests.',
    descriptionAm: 'ምርጥ የጌጣጌጥ ዲዛይን፣ የድምፅና መብራት ዝግጅት፣ እና ምርጥ የምግብ አቅርቦት ለ300+ እንግዶች።'
  }
];

const PHOTO_PACKAGES: PlannerPackage[] = [
  {
    id: 'photo-basic',
    name: 'Classic Memories',
    nameAm: 'ክላሲክ የፎቶ ዝግጅት',
    priceEtb: 30000,
    priceUsd: 600,
    description: '1 Photographer + 1 Videographer, coverage of church/nikah and reception, digital delivery.',
    descriptionAm: '1 ፎቶግራፍ አንሺ እና 1 ቪዲዮ ቀራጭ፣ የሃይማኖት ስነስርዓት እና የደግስ ሽፋን፣ በዲጂታል የሚላክ።'
  },
  {
    id: 'photo-premium',
    name: 'Cinematic Royal Gold',
    nameAm: 'ሮያል ሲኒማቲክ (ወርቅ)',
    priceEtb: 100000,
    priceUsd: 2000,
    description: '3 Cameras, drone coverage, 4K cinema trailer, luxury printed leather album, and pre-wedding photo shoot.',
    descriptionAm: '3 የፊልም ካሜራዎች፣ የድሮን ቀረጻ፣ 4K አጭር ፊልም፣ እና ከሰርግ በፊት የፎቶ ቀረጻ (Pre-wedding)።'
  }
];

const BEAUTY_PACKAGES: PlannerPackage[] = [
  {
    id: 'beauty-basic',
    name: 'Habesha Traditional Attire & Styling',
    nameAm: 'ባህላዊ ስታይሊንግ እና አልባሳት',
    priceEtb: 25000,
    priceUsd: 500,
    description: 'Bridal makeup and hair, couple traditional handwoven Habesha Kemis & Kuta outfits (rental).',
    descriptionAm: 'ለሙሽሮች ሜካፕና የፀጉር ስታይል፣ ባህላዊ በእጅ የተሸመኑ የሀበሻ ልብሶች (በኪራይ)።'
  },
  {
    id: 'beauty-premium',
    name: 'Imperial Royal Styling',
    nameAm: 'ሮያል ስታይሊንግ እና የዲዛይነር ልብስ',
    priceEtb: 80000,
    priceUsd: 1600,
    description: 'VIP bridal styling party, custom designer couple attire to keep, and bridesmaid styling packages.',
    descriptionAm: 'የሙሽሪት እና ሚዜዎች ሙሉ ውበት ዝግጅት፣ እና ለሙሽሮች የሚሰጥ ልዩ የዲዛይነር ሰርግ ልብስ።'
  }
];

export default function WeddingPlannerView({ currency = 'ETB' }: { currency?: 'ETB' | 'USD' }) {
  const locale = useLocale();
  const t = useTranslations('Dashboard.planner');

  const getPkgName = (pkgId: string, defaultName: string) => {
    try {
      return t(`packages.${pkgId}.name`);
    } catch (e) {
      return defaultName;
    }
  };

  const getPkgDesc = (pkgId: string, defaultDesc: string) => {
    try {
      return t(`packages.${pkgId}.desc`);
    } catch (e) {
      return defaultDesc;
    }
  };
  const [selectedHall, setSelectedHall] = useState<string>('hall-basic');
  const [selectedPhoto, setSelectedPhoto] = useState<string>('photo-basic');
  const [selectedBeauty, setSelectedBeauty] = useState<string>('beauty-basic');
  const [weddingDate, setWeddingDate] = useState('');
  const [estimatedGuests, setEstimatedGuests] = useState(150);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [vendors, setVendors] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [loadingExtra, setLoadingExtra] = useState(true);

  const loadExtraData = async (uid: string) => {
    try {
      // 1. Fetch wedding vendors from DB or set fallbacks
      const { data: vendorData } = await supabase
        .from('wedding_vendors')
        .select('*')
        .order('name', { ascending: true });
      
      if (vendorData && vendorData.length > 0) {
        setVendors(vendorData);
      } else {
        setVendors([
          { id: 'v1', name: 'Sheraton Addis Grand Ballroom', category: 'Venue', rating: 4.9, location: 'Addis Ababa', contact: '+251115171717' },
          { id: 'v2', name: 'Skyline Hotel Event Hall', category: 'Venue', rating: 4.8, location: 'Addis Ababa', contact: '+251116676000' },
          { id: 'v3', name: 'Simien Studio Cinema', category: 'Photography', rating: 4.9, location: 'Addis Ababa & Gondar', contact: '+251911223344' },
          { id: 'v4', name: 'Habesha Bridal Decor & Flowers', category: 'Decor', rating: 4.7, location: 'Addis Ababa', contact: '+251922334455' },
          { id: 'v5', name: 'Lucy Traditional Bridal Salon', category: 'Styling', rating: 4.8, location: 'Addis Ababa', contact: '+251933445566' }
        ]);
      }

      // 2. Fetch existing planner bookings
      const { data: bookingData } = await supabase
        .from('counselor_bookings')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      
      if (bookingData) {
        setBookings(bookingData);
      }
    } catch (err) {
      console.error('Error loading extra wedding planner data:', err);
    } finally {
      setLoadingExtra(false);
    }
  };

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadExtraData(user.id);
      }
    }
    getUser();
  }, []);

  const hallPrice = HALLS_PACKAGES.find(p => p.id === selectedHall)?.[currency === 'USD' ? 'priceUsd' : 'priceEtb'] || 0;
  const photoPrice = PHOTO_PACKAGES.find(p => p.id === selectedPhoto)?.[currency === 'USD' ? 'priceUsd' : 'priceEtb'] || 0;
  const beautyPrice = BEAUTY_PACKAGES.find(p => p.id === selectedBeauty)?.[currency === 'USD' ? 'priceUsd' : 'priceEtb'] || 0;
  const totalPrice = hallPrice + photoPrice + beautyPrice;

  const getGoogleCalendarLink = (booking: any) => {
    const title = encodeURIComponent("Beteseb Wedding Planning Consultation");
    const details = encodeURIComponent(`Consultation with ${booking.expert_name}. Topic: ${booking.topic}`);
    const location = encodeURIComponent("Beteseb App Video Consultation");
    const dateStr = booking.scheduled_date || "2026-07-20";
    const datePart = dateStr.replace(/-/g, "");
    
    let timeStr = booking.scheduled_time || "10:00 AM";
    let hour = 10;
    let minute = 0;
    
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      hour = parseInt(timeMatch[1]);
      minute = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
    }
    
    const hh = hour.toString().padStart(2, "0");
    const mm = minute.toString().padStart(2, "0");
    const endH = (hour + 1) % 24;
    const eh = endH.toString().padStart(2, "0");
    
    const dates = `${datePart}T${hh}${mm}00/${datePart}T${eh}${mm}00`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!weddingDate) {
      alert(t('selectDateAlert'));
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDetails = {
        hall: selectedHall,
        photoVideo: selectedPhoto,
        beautyAttire: selectedBeauty,
        guests: estimatedGuests,
        notes: notes,
        totalCostEstimate: totalPrice,
        currency
      };

      const { error } = await supabase.from('counselor_bookings').insert({
        user_id: userId,
        expert_name: 'Beteseb Royal Wedding Planner',
        topic: 'Wedding Planning Inquiry',
        scheduled_date: weddingDate,
        scheduled_time: selectedSlot,
        status: 'pending',
        payment_status: 'free_inquiry',
        payment_method: 'inquiry',
        amount_paid: 0,
        currency: currency,
        notes: JSON.stringify(selectedDetails)
      });

      if (error) throw error;
      alert(t('successAlert'));
      
      setNotes('');
      setWeddingDate('');
      loadExtraData(userId);
    } catch (err: any) {
      alert('Inquiry failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      {/* Premium Banner */}
      <div className="bg-[#0F172A] rounded-[3.5rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/15 rounded-full -ml-32 -mb-32 blur-[60px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.25em]">
              <Crown size={14} className="text-primary fill-primary/10" /> 
              {t('title')}
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic leading-tight tracking-[calc(-0.04em)]">
              {t('subtitle')}
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-md mx-auto md:mx-0">
              {t('introText')}
            </p>
          </div>
          
          <div className="w-full md:w-auto grid grid-cols-2 gap-4">
             {[
               { icon: UtensilsCrossed, label: t('gourmetBuffet') },
               { icon: Camera, label: t('cinemaPhotos') },
               { icon: Crown, label: t('royalAttire') },
               { icon: Heart, label: t('perfectMemories') }
             ].map((item, i) => (
                <div key={i} className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-3 text-center">
                   <item.icon className="text-primary" size={24} />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/50">{item.label}</span>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Package Curators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Halls & Catering */}
        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-muted shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl">
              <UtensilsCrossed size={24} />
            </div>
            <div>
              <h3 className="font-black text-accent italic uppercase tracking-tighter text-lg">
                {t('hallCatering')}
              </h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Category Package</p>
            </div>
          </div>
          <div className="space-y-4 pt-4">
            {HALLS_PACKAGES.map(pkg => (
              <label 
                key={pkg.id} 
                className={`block p-5 rounded-[2rem] border transition-all cursor-pointer relative ${
                  selectedHall === pkg.id ? 'bg-primary/5 border-primary/45 ring-1 ring-primary/20' : 'bg-muted/10 border-muted hover:bg-muted/30'
                }`}
              >
                <input 
                  type="radio" 
                  name="hall" 
                  value={pkg.id} 
                  checked={selectedHall === pkg.id}
                  onChange={() => setSelectedHall(pkg.id)}
                  className="absolute top-5 right-5 accent-primary" 
                />
                <h4 className="font-bold text-sm text-accent pr-6">{getPkgName(pkg.id, pkg.name)}</h4>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                  {currency === 'USD' ? '$' : 'Br'} {currency === 'USD' ? pkg.priceUsd.toLocaleString() : pkg.priceEtb.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-3 leading-relaxed">
                  {getPkgDesc(pkg.id, pkg.description)}
                </p>
              </label>
            ))}
          </div>
        </div>

        {/* Photo & Video */}
        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-muted shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl">
              <Camera size={24} />
            </div>
            <div>
              <h3 className="font-black text-accent italic uppercase tracking-tighter text-lg">
                {t('photoCinema')}
              </h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Camera Package</p>
            </div>
          </div>
          <div className="space-y-4 pt-4">
            {PHOTO_PACKAGES.map(pkg => (
              <label 
                key={pkg.id} 
                className={`block p-5 rounded-[2rem] border transition-all cursor-pointer relative ${
                  selectedPhoto === pkg.id ? 'bg-primary/5 border-primary/45 ring-1 ring-primary/20' : 'bg-muted/10 border-muted hover:bg-muted/30'
                }`}
              >
                <input 
                  type="radio" 
                  name="photo" 
                  value={pkg.id} 
                  checked={selectedPhoto === pkg.id}
                  onChange={() => setSelectedPhoto(pkg.id)}
                  className="absolute top-5 right-5 accent-primary" 
                />
                <h4 className="font-bold text-sm text-accent pr-6">{getPkgName(pkg.id, pkg.name)}</h4>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                  {currency === 'USD' ? '$' : 'Br'} {currency === 'USD' ? pkg.priceUsd.toLocaleString() : pkg.priceEtb.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-3 leading-relaxed">
                  {getPkgDesc(pkg.id, pkg.description)}
                </p>
              </label>
            ))}
          </div>
        </div>

        {/* Beauty & Attire */}
        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-muted shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl">
              <Crown size={24} />
            </div>
            <div>
              <h3 className="font-black text-accent italic uppercase tracking-tighter text-lg">
                {t('beautyAttire')}
              </h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Styling Package</p>
            </div>
          </div>
          <div className="space-y-4 pt-4">
            {BEAUTY_PACKAGES.map(pkg => (
              <label 
                key={pkg.id} 
                className={`block p-5 rounded-[2rem] border transition-all cursor-pointer relative ${
                  selectedBeauty === pkg.id ? 'bg-primary/5 border-primary/45 ring-1 ring-primary/20' : 'bg-muted/10 border-muted hover:bg-muted/30'
                }`}
              >
                <input 
                  type="radio" 
                  name="beauty" 
                  value={pkg.id} 
                  checked={selectedBeauty === pkg.id}
                  onChange={() => setSelectedBeauty(pkg.id)}
                  className="absolute top-5 right-5 accent-primary" 
                />
                <h4 className="font-bold text-sm text-accent pr-6">{getPkgName(pkg.id, pkg.name)}</h4>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                  {currency === 'USD' ? '$' : 'Br'} {currency === 'USD' ? pkg.priceUsd.toLocaleString() : pkg.priceEtb.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-3 leading-relaxed">
                  {getPkgDesc(pkg.id, pkg.description)}
                </p>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* Estimator Display and Inquire Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Dynamic Cost Estimator summary */}
        <div className="bg-[#FAF8F5] p-10 rounded-[3rem] border border-border/80 lg:col-span-1 space-y-6">
          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-wider">
            <Calculator size={14} /> {t('costEstimation')}
          </div>
          
          <div className="space-y-3 border-b border-border pb-6 text-xs font-semibold text-gray-600">
            <div className="flex justify-between">
              <span>{t('venueFood')}</span>
              <span className="text-accent">{currency === 'USD' ? '$' : 'Br'} {hallPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('verifiedVendorsSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-[2rem] p-6 border border-muted shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div>
                <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary mb-2">
                  {vendor.category}
                </span>
                <h4 className="font-black text-sm text-accent">{vendor.name}</h4>
                <p className="text-gray-400 text-[10px] font-semibold mt-1">📍 {vendor.location}</p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-muted/50 text-[10px] font-bold text-gray-500">
                <span>📞 {vendor.contact}</span>
                <span className="text-yellow-600">★ {vendor.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Existing Bookings & Counselor Inquiries Section (Step 5) */}
      <div className="space-y-6 pt-6">
        <div>
          <h3 className="text-xl font-black text-accent tracking-tighter uppercase italic flex items-center gap-2">
            <Calendar className="text-primary fill-primary/10" size={20} />
            {t('bookings')}
          </h3>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            {t('bookingsSubtitle')}
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-muted p-8 shadow-sm">
          {bookings.length === 0 ? (
            <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-wider py-6">
              {t('noBookings')}
            </p>
          ) : (
            <div className="divide-y divide-muted/50">
              {bookings.map((booking) => {
                let details: any = {};
                try {
                  details = JSON.parse(booking.notes || '{}');
                } catch (e) {}

                return (
                  <div key={booking.id} className="py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-accent">{booking.expert_name}</h4>
                      <p className="text-[10px] text-gray-400 font-medium">
                        📅 {booking.scheduled_date} | ⏰ {booking.scheduled_time}
                      </p>
                      {details.guests && (
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Guests: {details.guests} | Venue: {details.hall} | Estimate: {currency === 'USD' ? '$' : 'Br'} {details.totalCostEstimate?.toLocaleString()}
                        </p>
                      )}
                    </div>
                     <div className="flex items-center gap-3">
                       {booking.status === 'approved' && (
                         <a 
                           href={getGoogleCalendarLink(booking)}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-black rounded-lg border border-primary/20 uppercase tracking-widest decoration-transparent transition-all"
                         >
                           🗓️ Sync Calendar
                         </a>
                       )}
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                         booking.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                         booking.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                         'bg-amber-50 text-amber-700 border border-amber-200'
                       }`}>
                         {booking.status}
                       </span>
                     </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
