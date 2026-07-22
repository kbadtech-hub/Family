'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Calendar, 
  Clock, 
  CreditCard, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X
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

export default function WorkshopsView({ currency, userTier }: { currency: 'ETB' | 'USD'; userTier?: string }) {
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [expertName, setExpertName] = useState('Ato Abebe');
  const [bookingTopic, setBookingTopic] = useState<'Pre-Marriage' | 'Finance' | 'Conflict Resolution' | 'General'>('Pre-Marriage');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Phase 4 Monetization & Platform Compliance State
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'coins' | 'chapa' | 'stripe'>('coins');

  const [dbLessons, setDbLessons] = useState<any[]>([]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getSession();

    const checkPlatform = () => {
      const ua = navigator.userAgent.toLowerCase();
      const isCordova = !!(window as any).cordova;
      const isCapacitor = !!(window as any).Capacitor;
      const isReactNative = !!(window as any).ReactNativeWebView;
      const isPlatformMobileParam = window.location.search.includes('platform=mobile');
      const isAndroidApp = ua.includes('beteseb-android') || ua.includes('wv') || ua.includes('webview');
      setIsMobileApp(isCordova || isCapacitor || isReactNative || isPlatformMobileParam || isAndroidApp);
    };
    checkPlatform();

    const fetchLessons = async () => {
      const { data } = await supabase.from('lessons').select('*').order('created_at', { ascending: false });
      if (data) setDbLessons(data);
    };
    fetchLessons();
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userTier === 'bronze' || userTier === 'silver') {
      alert('Bronze or Silver Tier members are blocked from booking counselor sessions. Please complete verification first!');
      return;
    }
    if (!userId) {
      alert('You must be logged in to book counselor services.');
      return;
    }
    if (!bookingDate) {
      alert('Please select a date.');
      return;
    }
    setIsSubmitting(true);
    try {
      let finalPaymentStatus = 'pending';
      let finalAmount = 15;
      let finalCurrency = 'USD';

      if (paymentMethod === 'coins') {
        // Fetch coin balance from user_wallets (Blueprint v4.0)
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('coin_balance')
          .eq('id', userId)
          .single();
          
        const balance = Number(wallet?.coin_balance || 0);
        if (balance < 50) {
          alert("Insufficient coins! You need 50 coins to book this counseling session. Please top up on the web.");
          setIsSubmitting(false);
          return;
        }

        // Deduct 50 coins from user's coin_transactions
        const { error: ledgerError } = await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: -50,
          type: 'coin_transfer',
          note: 'counselor_booking'
        });
        if (ledgerError) throw ledgerError;
        
        finalPaymentStatus = 'paid';
        finalAmount = 50;
      } else if (paymentMethod === 'chapa') {
        // Simulate Chapa checkout success
        finalPaymentStatus = 'paid';
        finalAmount = 600;
        finalCurrency = 'ETB';
      } else {
        // Simulate Stripe checkout success
        finalPaymentStatus = 'paid';
        finalAmount = 15;
        finalCurrency = 'USD';
      }

      const { error } = await supabase.from('counselor_bookings').insert({
        user_id: userId,
        expert_name: expertName,
        topic: bookingTopic,
        scheduled_date: bookingDate,
        scheduled_time: bookingTime,
        status: 'pending',
        payment_status: finalPaymentStatus,
        payment_method: paymentMethod,
        amount_paid: finalAmount,
        currency: finalCurrency
      });

      if (error) throw error;
      alert('Your booking request has been submitted successfully! Check back later for approval status.');
      setShowBookingModal(false);
    } catch (err: any) {
      alert('Booking failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {dbLessons.length > 0 ? (
               dbLessons.map((lesson) => {
                  const instructor = lesson.category === 'Relationship' ? 'Ato Abebe & W/ro Selam' : lesson.category === 'Finance' ? 'Dr. Girma Bekele' : 'Senior Family Advisor';
                  const price_etb = lesson.is_premium_only ? 1500 : 0;
                  const price_usd = lesson.is_premium_only ? 50 : 0;
                  return (
                     <div key={lesson.id} className="bg-white p-10 rounded-[3rem] border border-muted shadow-sm hover:shadow-xl transition-all group hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-6">
                           <div className="p-4 bg-primary/5 rounded-2xl">
                              <Calendar size={32} className="text-primary" />
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Tuition Fees</p>
                              <p className="text-2xl font-black text-accent">{currency === 'USD' ? '$' : 'Br'} {currency === 'USD' ? price_usd : price_etb}</p>
                           </div>
                        </div>
                        
                        <h4 className="text-2xl font-bold text-accent mb-2 group-hover:text-primary transition-colors">{lesson.title}</h4>
                        <p className="text-gray-500 text-sm mb-6 uppercase font-bold tracking-widest flex items-center gap-2">
                           <Users size={16} className="text-primary" /> {instructor}
                        </p>
                        
                        <div className="flex items-center gap-6 mb-8 py-4 border-y border-muted text-gray-400 text-xs font-medium">
                           <div className="flex items-center gap-2"><Calendar size={16} /> Weekly Session</div>
                           <div className="flex items-center gap-2"><Clock size={16} /> 2:00 PM EAT</div>
                        </div>
                        
                        <button className="w-full btn-primary py-4 rounded-[1.5rem] flex items-center justify-center gap-3 text-xs tracking-widest group/btn">
                           <CreditCard size={18} /> {lesson.is_premium_only ? 'ENROLL NOW' : 'ACCESS FOR FREE'} <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                        </button>
                     </div>
                  );
               })
            ) : (
               UPCOMING_WORKSHOPS.map((workshop) => (
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
               ))
            )}
         </div>
      </section>

      {/* Counseling Section */}
      <section className="bg-white rounded-[3rem] p-12 md:p-20 border border-muted text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary" />
         <h3 className="text-2xl font-black text-accent uppercase tracking-tighter mb-4 italic italic">1-on-1 Counseling</h3>
         <p className="text-gray-500 leading-relaxed mb-8">
            Prefer a private session? Speak directly with our senior family advisors for personalized guidance on your journey to marriage.
         </p>
         <button 
           onClick={() => {
             if (userTier === 'bronze' || userTier === 'silver') {
               alert('Bronze or Silver Tier members are blocked from booking counselor sessions. Please complete verification first!');
               return;
             }
             setShowBookingModal(true);
           }}
           className="px-12 py-5 bg-accent text-white rounded-full font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-primary transition-colors shadow-xl shadow-accent/20"
         >
            Book a Provider
         </button>
      </section>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] border border-muted p-10 md:p-12 relative shadow-2xl space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => setShowBookingModal(false)}
              className="absolute top-8 right-8 p-3 bg-muted/30 hover:bg-muted rounded-full transition-all text-gray-500"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                <Sparkles size={14} /> Counselor Marketplace
              </div>
              <h3 className="text-3xl font-black text-accent italic tracking-tighter">Book Consultation</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">Select your preferred advisor, counseling topic, date and slot.</p>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-6">
              <label className="block">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Choose Expert</span>
                <select 
                  value={expertName} 
                  onChange={(e) => setExpertName(e.target.value)}
                  className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                >
                  <option value="Ato Abebe">Ato Abebe (Pre-Marriage Specialist)</option>
                  <option value="W/ro Selam">W/ro Selam (Family Conflict Advisor)</option>
                  <option value="Dr. Girma Bekele">Dr. Girma Bekele (Household Financial Planner)</option>
                </select>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Topic</span>
                  <select 
                    value={bookingTopic} 
                    onChange={(e) => setBookingTopic(e.target.value as any)}
                    className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                  >
                    <option value="Pre-Marriage">Pre-Marriage Guidance</option>
                    <option value="Finance">Family Finance Planning</option>
                    <option value="Conflict Resolution">Conflict Resolution</option>
                    <option value="General">General Consultation</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Time Slot</span>
                  <select 
                    value={bookingTime} 
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                  >
                    <option value="10:00 AM - 11:00 AM">10:00 AM EAT</option>
                    <option value="11:30 AM - 12:30 PM">11:30 AM EAT</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM EAT</option>
                    <option value="04:00 PM - 05:00 PM">04:00 PM EAT</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Scheduled Date</span>
                <input 
                  type="date" 
                  required
                  value={bookingDate} 
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
                />
              </label>

              {isMobileApp ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block">Payment Method</span>
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-accent">Coins (የቤተሰብ ሳንቲም)</span>
                    <span className="font-black text-primary">50 COINS</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
                    ℹ️ Card and mobile banking payments are only available on our web portal at <strong>beteseb1.online</strong>. Purchase or top up coins on the web to book via the mobile app.
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Payment Method</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('coins')}
                      className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                        paymentMethod === 'coins' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-muted text-gray-500'
                      }`}
                    >
                      Coins (50)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('chapa')}
                      className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                        paymentMethod === 'chapa' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-muted text-gray-500'
                      }`}
                    >
                      Chapa (600 ETB)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                        paymentMethod === 'stripe' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-muted text-gray-500'
                      }`}
                    >
                      Card ($15 USD)
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting || !bookingDate}
                className="w-full btn-primary py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
              >
                {isSubmitting ? 'BOOKING APPOINTMENT...' : 'Request Booking Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
