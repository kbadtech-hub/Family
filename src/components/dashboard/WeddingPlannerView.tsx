'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocale } from 'next-intl';
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
  const [selectedHall, setSelectedHall] = useState<string>('hall-basic');
  const [selectedPhoto, setSelectedPhoto] = useState<string>('photo-basic');
  const [selectedBeauty, setSelectedBeauty] = useState<string>('beauty-basic');
  const [weddingDate, setWeddingDate] = useState('');
  const [estimatedGuests, setEstimatedGuests] = useState(150);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, []);

  const hallPrice = HALLS_PACKAGES.find(p => p.id === selectedHall)?.[currency === 'USD' ? 'priceUsd' : 'priceEtb'] || 0;
  const photoPrice = PHOTO_PACKAGES.find(p => p.id === selectedPhoto)?.[currency === 'USD' ? 'priceUsd' : 'priceEtb'] || 0;
  const beautyPrice = BEAUTY_PACKAGES.find(p => p.id === selectedBeauty)?.[currency === 'USD' ? 'priceUsd' : 'priceEtb'] || 0;
  const totalPrice = hallPrice + photoPrice + beautyPrice;

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!weddingDate) {
      alert(locale === 'am' ? 'እባክዎ የታሰበውን የሰርግ ቀን ያስገቡ።' : 'Please select a wedding date.');
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
        scheduled_time: '10:00 AM',
        status: 'pending',
        payment_status: 'free_inquiry',
        payment_method: 'inquiry',
        amount_paid: 0,
        currency: currency,
        notes: JSON.stringify(selectedDetails)
      });

      if (error) throw error;
      alert(locale === 'am' 
        ? 'የሰርግ እቅድ ጥያቄዎ በተሳካ ሁኔታ ተልኳል! አማካሪዎቻችን በቅርቡ ያነጋግሩዎታል።' 
        : 'Your wedding planning inquiry has been submitted! Our planners will contact you shortly.');
      
      setNotes('');
      setWeddingDate('');
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
              {locale === 'am' ? 'የሰርግ ዝግጅት እቅድ አውጪ' : 'Royal Wedding Planner'}
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic leading-tight tracking-[calc(-0.04em)]">
              {locale === 'am' ? 'ውብ ህልምዎን \n እውን እናድርግ።' : 'Design Your \n Royal Tomorrow.'}
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-md mx-auto md:mx-0">
              {locale === 'am'
                ? 'ምርጥ የሰርግ አዳራሾችን፣ የምግብ ዝግጅቶችን፣ አልባሳትን እና የፎቶ ባለሙያዎችን በአንድ ላይ ያቅዱ።'
                : 'Curate your perfect wedding with verified premium halls, gourmet traditional catering, designer attire, and cinema experts.'}
            </p>
          </div>
          
          <div className="w-full md:w-auto grid grid-cols-2 gap-4">
             {[
               { icon: UtensilsCrossed, label: locale === 'am' ? 'የምግብ ዝግጅት' : 'Gourmet Buffet' },
               { icon: Camera, label: locale === 'am' ? 'ፎቶ እና ቪዲዮ' : 'Cinema & Photos' },
               { icon: Crown, label: locale === 'am' ? 'ዲዛይነር ልብስ' : 'Royal Attire' },
               { icon: Heart, label: locale === 'am' ? 'ውብ ትዝታ' : 'Perfect Memories' }
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
                {locale === 'am' ? 'አዳራሽ እና ምግብ' : 'Halls & Catering'}
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
                <h4 className="font-bold text-sm text-accent pr-6">{locale === 'am' ? pkg.nameAm : pkg.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                  {currency === 'USD' ? '$' : 'Br'} {currency === 'USD' ? pkg.priceUsd.toLocaleString() : pkg.priceEtb.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-3 leading-relaxed">
                  {locale === 'am' ? pkg.descriptionAm : pkg.description}
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
                {locale === 'am' ? 'ፎቶ እና ቪዲዮ' : 'Photo & Cinema'}
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
                <h4 className="font-bold text-sm text-accent pr-6">{locale === 'am' ? pkg.nameAm : pkg.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                  {currency === 'USD' ? '$' : 'Br'} {currency === 'USD' ? pkg.priceUsd.toLocaleString() : pkg.priceEtb.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-3 leading-relaxed">
                  {locale === 'am' ? pkg.descriptionAm : pkg.description}
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
                {locale === 'am' ? 'ውበት እና አልባሳት' : 'Beauty & Attire'}
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
                <h4 className="font-bold text-sm text-accent pr-6">{locale === 'am' ? pkg.nameAm : pkg.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                  {currency === 'USD' ? '$' : 'Br'} {currency === 'USD' ? pkg.priceUsd.toLocaleString() : pkg.priceEtb.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-3 leading-relaxed">
                  {locale === 'am' ? pkg.descriptionAm : pkg.description}
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
            <Calculator size={14} /> {locale === 'am' ? 'የዋጋ ስሌት ማጠቃለያ' : 'Cost Estimation summary'}
          </div>
          
          <div className="space-y-3 border-b border-border pb-6 text-xs font-semibold text-gray-600">
            <div className="flex justify-between">
              <span>{locale === 'am' ? 'አዳራሽ እና ምግብ' : 'Venue & Food'}</span>
              <span className="text-accent">{currency === 'USD' ? '$' : 'Br'} {hallPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{locale === 'am' ? 'ፎቶ እና ቪዲዮ' : 'Photos & Video'}</span>
              <span className="text-accent">{currency === 'USD' ? '$' : 'Br'} {photoPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{locale === 'am' ? 'ውበት እና አልባሳት' : 'Beauty & Clothes'}</span>
              <span className="text-accent">{currency === 'USD' ? '$' : 'Br'} {beautyPrice.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-black text-xs text-gray-400 uppercase tracking-widest">{locale === 'am' ? 'ጠቅላላ ዋጋ (ግምት)' : 'Total Estimate'}</span>
            <span className="text-2xl font-black text-primary">
              {currency === 'USD' ? '$' : 'Br'} {totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="bg-white p-10 md:p-12 rounded-[3rem] border border-muted lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-2xl font-black text-accent italic tracking-tighter">{locale === 'am' ? 'የሰርግ አማካሪ ያግኙ' : 'Inquire / Book Consultation'}</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Free consultation inquiry with our wedding designers</p>
          </div>
          
          <form onSubmit={handleInquirySubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Proposed Wedding Date</span>
                <input 
                  type="date" 
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Estimated Guest Count</span>
                <input 
                  type="number" 
                  min={50}
                  max={2000}
                  value={estimatedGuests}
                  onChange={(e) => setEstimatedGuests(parseInt(e.target.value))}
                  className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Special requests / custom notes</span>
              <textarea 
                rows={3}
                placeholder={locale === 'am' ? 'እባክዎ የተለየ ፍላጎት ካለዎት እዚህ ይግለጹ...' : 'Write custom requirements here...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 font-medium"
              />
            </label>

            <button 
              type="submit"
              disabled={isSubmitting || !weddingDate}
              className="w-full btn-primary py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? 'SENDING INQUIRY...' : (
                <>
                  {locale === 'am' ? 'ጥያቄ ላክ' : 'Send Planner Inquiry'} 
                  <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
