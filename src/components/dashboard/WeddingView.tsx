'use client';

import React, { useState } from 'react';
import { Sparkles, Calendar, Badge, Shield, CheckCircle2, Star, Camera, Home, Heart } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  category: 'photo' | 'halls' | 'beauty';
  rating: number;
  priceRange: string;
  location: string;
  imageUrl: string;
}

export default function WeddingView({ locale }: { locale: string }) {
  const [activeCategory, setActiveCategory] = useState<'packages' | 'photo' | 'halls' | 'beauty'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const packages = [
    {
      id: 'bronze',
      name: locale === 'am' ? 'ነሐስ ጥቅል (Bronze Package)' : 'Bronze Package',
      price: locale === 'am' ? '50,000 ETB' : '$1,200',
      description: locale === 'am' ? 'መሰረታዊ የሰርግ ዝግጅት እቅድ' : 'Essential wedding logistics and layout setup.',
      features: [
        locale === 'am' ? 'የ 1 ቀን ማስተባበር' : '1-day onsite coordination',
        locale === 'am' ? 'መሰረታዊ የድምፅና መብራት ዝግጅት' : 'Basic audio & lighting kit',
        locale === 'am' ? 'የ 2 ሰዓት ፎቶግራፍ' : '2 hours of photoshoot sessions',
        locale === 'am' ? 'መደበኛ የመኪና ኪራይ (2 መኪኖች)' : 'Standard car hire (2 cars)'
      ]
    },
    {
      id: 'silver',
      name: locale === 'am' ? 'ብር ጥቅል (Silver Package)' : 'Silver Package',
      price: locale === 'am' ? '120,000 ETB' : '$2,800',
      description: locale === 'am' ? 'ከፍ ያለ ጥራት ያላቸው አገልግሎቶች የታከሉበት' : 'Premium styling, catering, and full day management.',
      features: [
        locale === 'am' ? 'ሙሉ ቀን የሰርግ ማስተባበር' : 'Full day onsite coordination',
        locale === 'am' ? 'የባለሙያ ድምፅ፣ መብራትና መድረክ ዝግጅት' : 'Professional DJ, stage & lighting',
        locale === 'am' ? 'ሙሉ ሰርግ ቪዲዮ እና ፎቶግራፍ' : 'Full wedding photography & video coverage',
        locale === 'am' ? 'ቅንጦት የመኪና ኪራይ (4 መኪኖች)' : 'Luxury car hire (4 cars)',
        locale === 'am' ? 'የሙሽሮች ሜካፕ እና ፀጉር' : 'Bridal hair & makeup setup'
      ]
    },
    {
      id: 'gold',
      name: locale === 'am' ? 'ወርቅ ጥቅል (Gold Package)' : 'Gold Package',
      price: locale === 'am' ? '250,000 ETB' : '$5,500',
      description: locale === 'am' ? 'የቅንጦት እና የተሟላ የሰርግ አገልግሎት' : 'Ultra-luxury experience with custom decors and wali/counselor blessings.',
      features: [
        locale === 'am' ? 'የ 3 ቀናት የተሟላ እቅድ ማስተባበር' : '3-day full wedding planning & coordination',
        locale === 'am' ? 'ከፍተኛ የቅንጦት መድረክ እና ዲዛይን' : 'Elite stage setup with custom floral themes',
        locale === 'am' ? 'የ 3 ኬሜራ ቀረጻ፣ ድሮን እና አልበም' : '3-camera crew, drone coverage & premium album',
        locale === 'am' ? 'የቪአይፒ መኪኖች ኪራይ (ሊሞዚን የታከለበት)' : 'VIP car fleet including Limousine',
        locale === 'am' ? 'የሙሽሮች እና የሚዜዎች ሙሉ ፓኬጅ' : 'Bridal crew makeup & spa treatment',
        locale === 'am' ? 'ነፃ የአንድ ዓመት የትዳር ማማከር አገልግሎት' : 'Complimentary 1-year marital counselor checkins'
      ]
    }
  ];

  const vendors: Vendor[] = [
    {
      id: 'v1',
      name: 'Selam Photo & Video',
      category: 'photo',
      rating: 4.9,
      priceRange: '15,000 - 45,000 ETB',
      location: 'Addis Ababa, Bole',
      imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'v2',
      name: 'Bole Luxury Hall & Catering',
      category: 'halls',
      rating: 4.8,
      priceRange: '80,000 - 200,000 ETB',
      location: 'Addis Ababa, Bole',
      imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'v3',
      name: 'Sheger Attire & Beauty Hub',
      category: 'beauty',
      rating: 4.7,
      priceRange: '10,000 - 30,000 ETB',
      location: 'Addis Ababa, Megenagna',
      imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=400'
    }
  ];

  const handleBookPackage = (pkgName: string) => {
    setSelectedPackage(pkgName);
    alert(locale === 'am' 
      ? `የሰርግ እቅድ አውጪው በተሳካ ሁኔታ ተመርጧል፡ ${pkgName}። ባለሙያዎቻችን በ 24 ሰዓት ውስጥ ያነጋግሩዎታል።`
      : `Successfully requested booking for: ${pkgName}. A platform coordinator will reach out to you within 24 hours.`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header Description */}
      <section className="bg-black text-white p-10 rounded-[3rem] border border-slate-900 text-center space-y-4">
        <Heart className="w-12 h-12 mx-auto text-white animate-pulse" />
        <h2 className="text-3xl font-black italic tracking-tighter">
          {locale === 'am' ? 'የቤተሰብ ሰርግ እቅድ አውጪ' : 'Beteseb Wedding Planner Ecosystem'}
        </h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.25em] max-w-lg mx-auto">
          {locale === 'am' ? 'ከተዛመዱበት ቀን ጀምሮ እስከ ሰርግዎ ድረስ ከጎንዎ ነን' : 'From your perfect match to your dream wedding, we handle everything.'}
        </p>
      </section>

      {/* Navigation tabs */}
      <div className="flex justify-center border-b border-border p-1 bg-slate-50 rounded-2xl w-fit mx-auto">
        <button 
          onClick={() => setActiveCategory('packages')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'packages' ? 'bg-black text-white shadow-sm' : 'text-gray-400'}`}
        >
          {locale === 'am' ? 'የሰርግ ጥቅሎች (Packages)' : 'Wedding Packages'}
        </button>
        <button 
          onClick={() => setActiveCategory('photo')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'photo' ? 'bg-black text-white shadow-sm' : 'text-gray-400'}`}
        >
          {locale === 'am' ? 'ፎቶ እና ቪዲዮ' : 'Photo & Video'}
        </button>
        <button 
          onClick={() => setActiveCategory('halls')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'halls' ? 'bg-black text-white shadow-sm' : 'text-gray-400'}`}
        >
          {locale === 'am' ? 'አዳራሾች እና የምግብ ዝግጅት' : 'Halls & Catering'}
        </button>
        <button 
          onClick={() => setActiveCategory('beauty')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'beauty' ? 'bg-black text-white shadow-sm' : 'text-gray-400'}`}
        >
          {locale === 'am' ? 'ውበት እና አልባሳት' : 'Beauty & Attire'}
        </button>
      </div>

      {/* Main rendering container */}
      {activeCategory === 'packages' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm flex flex-col justify-between hover:shadow-xl transition-shadow">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Plan Option</span>
                  <Shield size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-accent">{pkg.name}</h3>
                  <p className="text-2xl font-black text-primary mt-2">{pkg.price}</p>
                  <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">{pkg.description}</p>
                </div>
                
                <ul className="space-y-3 pt-4 border-t border-border">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 size={14} className="text-slate-900 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => handleBookPackage(pkg.name)}
                className="w-full bg-black text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform mt-8"
              >
                {locale === 'am' ? 'ጥቅሉን ይምረጡ' : 'Book Package'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {vendors.filter(v => v.category === activeCategory).map(v => (
            <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-shadow cursor-pointer">
              <div className="aspect-square relative rounded-[1.5rem] overflow-hidden mb-6 bg-muted">
                <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-accent">{v.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="text-black fill-black" size={14} />
                    <span className="text-xs font-black">{v.rating}</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{v.location}</p>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Cost:</span>
                  <span className="text-xs font-black text-primary">{v.priceRange}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
