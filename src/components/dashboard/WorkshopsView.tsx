'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CreditCard, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface Workshop {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  price_etb: number;
  price_usd: number;
  description: string;
}

const UPCOMING_WORKSHOPS: Workshop[] = [
  {
    id: '1',
    title: 'Marriage Foundations: The First Year',
    instructor: 'Ato Abebe & W/ro Selam',
    date: 'April 20, 2026',
    time: '2:00 PM - 4:15 PM EAT',
    price_etb: 1500,
    price_usd: 50,
    description: 'Learn the core cultural and psychological foundations for a successful Ethiopian marriage.'
  },
  {
    id: '2',
    title: 'Financial Harmony for Families',
    instructor: 'Dr. Girma Bekele',
    date: 'May 5, 2026',
    time: '10:00 AM - 12:00 PM EAT',
    price_etb: 1200,
    price_usd: 40,
    description: 'Balancing tradition and modern finance in the household.'
  }
];

export default function WorkshopsView({ currency }: { currency: 'ETB' | 'USD' }) {
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Hero Section */}
      <div className="bg-accent rounded-[3.5rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[80px]" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full -ml-32 -mb-32 blur-[60px]" />
         
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                  <Sparkles size={14} /> Professional Counseling
               </div>
               <h2 className="text-4xl md:text-6xl font-black italic mb-6 leading-tight tracking-[calc(-0.04em)]">
                  Elevate Your <br/> Family Wisdom.
               </h2>
               <p className="text-white/60 text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
                  Join expert-led workshops designed to strengthen the bond of the Beteseb community through traditional wisdom and modern insight.
               </p>
            </div>
            
            <div className="w-full md:w-auto grid grid-cols-2 gap-4">
               {[
                 { icon: Users, label: 'Expert Mentors' },
                 { icon: ShieldCheck, label: 'Certified' },
                 { icon: Calendar, label: 'Weekly Sessions' },
                 { icon: CheckCircle2, label: 'Interactive' }
               ].map((item, i) => (
                  <div key={i} className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-3">
                     <item.icon className="text-primary" size={24} />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{item.label}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Workshop List */}
      <section>
         <h3 className="text-3xl font-black text-accent mb-8 uppercase italic tracking-tighter">Upcoming Classes</h3>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {UPCOMING_WORKSHOPS.map((workshop) => (
               <div key={workshop.id} className="bg-white p-10 rounded-[3rem] border border-muted shadow-sm hover:shadow-xl transition-all group hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-4 bg-primary/5 rounded-2xl">
                        <Calendar size={32} className="text-primary" />
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Tuition Fees</p>
                        <p className="text-2xl font-black text-accent">{currency === 'USD' ? '$' : 'Br'} {currency === 'USD' ? workshop.price_usd : workshop.price_etb}</p>
                     </div>
                  </div>
                  
                  <h4 className="text-2xl font-bold text-accent mb-2 group-hover:text-primary transition-colors">{workshop.title}</h4>
                  <p className="text-gray-500 text-sm mb-6 uppercase font-bold tracking-widest flex items-center gap-2">
                     <Users size={16} className="text-primary" /> {workshop.instructor}
                  </p>
                  
                  <div className="flex items-center gap-6 mb-8 py-4 border-y border-muted text-gray-400 text-xs font-medium">
                     <div className="flex items-center gap-2"><Calendar size={16} /> {workshop.date}</div>
                     <div className="flex items-center gap-2"><Clock size={16} /> {workshop.time}</div>
                  </div>
                  
                  <button className="w-full btn-primary py-4 rounded-[1.5rem] flex items-center justify-center gap-3 text-xs tracking-widest group/btn">
                     <CreditCard size={18} /> ENROLL NOW <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                  </button>
               </div>
            ))}
         </div>
      </section>

      {/* Counseling Section */}
      <section className="bg-white rounded-[3rem] p-12 md:p-20 border border-muted text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary" />
         <h3 className="text-2xl font-black text-accent uppercase tracking-tighter mb-4 italic italic">1-on-1 Counseling</h3>
         <p className="text-gray-500 leading-relaxed mb-8">
            Prefer a private session? Speak directly with our senior family advisors for personalized guidance on your journey to marriage.
         </p>
         <button className="px-12 py-5 bg-accent text-white rounded-full font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-primary transition-colors shadow-xl shadow-accent/20">
            Book a Provider
         </button>
      </section>
    </div>
  );
}
