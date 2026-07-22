'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocale } from 'next-intl';
import {
  ShieldCheck,
  Users,
  Calendar,
  Clock,
  Star,
  ChevronRight,
  CheckCircle2,
  Video,
  MessageCircle,
  Send,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  X,
  Sparkles,
  Search,
  Filter,
  Languages,
} from 'lucide-react';
import FeatureGate from '@/components/dashboard/FeatureGate';

/* ─── Static counselor data ─────────────────────────────────── */
const STATIC_COUNSELORS = [
  {
    id: 'cn1',
    name: 'Dr. Selamawit Tadesse',
    name_am: 'ዶ/ር ሰላማዊት ታደሰ',
    bio: 'Licensed family therapist with 12 years of experience in pre-marital counseling and conflict resolution for Ethiopian couples.',
    bio_am: 'ለ12 ዓመታት ልምድ ያላት ፈቃድ ያለው የቤተሰብ ሕክምና ባለሙያ። ቅድመ-ጋብቻ ምክር እና የኢትዮጵያ ጥንዶች ግጭት ፈቺ።',
    specialization: 'Pre-Marriage',
    specialization_am: 'ቅድመ-ጋብቻ',
    hourly_rate: 800,
    hourly_rate_usd: 15,
    rating: 4.9,
    languages: ['Amharic', 'English'],
    available_slots: ['Mon 10:00 AM', 'Wed 2:00 PM', 'Fri 11:00 AM'],
  },
  {
    id: 'cn2',
    name: 'Ato Girma Bekele (MA)',
    name_am: 'አቶ ጊርማ በቀለ (ማ.አ)',
    bio: 'Certified couples counselor and family finance advisor. Specializes in communication patterns and financial harmony for newlyweds.',
    bio_am: 'ብቁ የጥንዶች አማካሪ እና የቤተሰብ ፋይናንስ አማካሪ። ለአዲስ ጥንዶች ግንኙነት እና ፋይናንሻዊ ስምምነት ባለሙያ።',
    specialization: 'Finance',
    specialization_am: 'ፋይናንስ',
    hourly_rate: 600,
    hourly_rate_usd: 12,
    rating: 4.7,
    languages: ['Amharic', 'English', 'Oromo'],
    available_slots: ['Tue 9:00 AM', 'Thu 3:00 PM', 'Sat 10:00 AM'],
  },
  {
    id: 'cn3',
    name: 'Dr. Hiwot Mengistu',
    name_am: 'ዶ/ር ሕይወት መንግስቱ',
    bio: 'Child and family psychologist with deep expertise in parenting frameworks rooted in Ethiopian cultural values and modern science.',
    bio_am: 'የህፃናት እና ቤተሰብ ሳይኮሎጂስት። ዘመናዊ ሳይንስ እና የኢትዮጵያ ባህላዊ እሴቶች ላይ የተመሠረተ የወላጅነት ዘዴ ባለሙያ።',
    specialization: 'Parenting',
    specialization_am: 'ወላጅነት',
    hourly_rate: 700,
    hourly_rate_usd: 14,
    rating: 4.8,
    languages: ['Amharic', 'English'],
    available_slots: ['Mon 3:00 PM', 'Wed 9:00 AM', 'Fri 4:00 PM'],
  },
  {
    id: 'cn4',
    name: 'Ato Yohannes Alemu (MSc)',
    name_am: 'አቶ ዮሐንስ አለሙ (ሳ.ሊ)',
    bio: 'Conflict resolution expert and marriage coach. Former social worker with 8 years helping couples navigate difficult transitions.',
    bio_am: 'የግጭት ፈቺ ባለሙያ እና የጋብቻ አሰልጣኝ። ጥንዶች ከ8 ዓመት በላይ ችግሮችን እንዲሻገሩ ያግዛ የነበረ ቀድሞ የማህበራዊ ሰራተኛ።',
    specialization: 'Conflict Resolution',
    specialization_am: 'ግጭት ፍቺ',
    hourly_rate: 650,
    hourly_rate_usd: 13,
    rating: 4.6,
    languages: ['Amharic', 'Tigrinya', 'English'],
    available_slots: ['Tue 11:00 AM', 'Thu 5:00 PM', 'Sat 2:00 PM'],
  },
];

const SPECIALIZATIONS = ['All', 'Pre-Marriage', 'Finance', 'Conflict Resolution', 'Parenting', 'General'];

const SPEC_COLORS: Record<string, string> = {
  'Pre-Marriage': 'bg-rose-50 text-rose-700 border-rose-200',
  'Finance': 'bg-amber-50 text-amber-700 border-amber-200',
  'Conflict Resolution': 'bg-blue-50 text-blue-700 border-blue-200',
  'Parenting': 'bg-green-50 text-green-700 border-green-200',
  'General': 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function CounselingDashboardView() {
  const locale = useLocale();
  const t = (am: string, en: string) => (locale === 'am' || locale === 'ti' || locale === 'om') ? am : en;

  const [counselors, setCounselors] = useState(STATIC_COUNSELORS);
  const [filterSpec, setFilterSpec] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedCounselor, setSelectedCounselor] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Video call state
  const [inSession, setInSession] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<{ from: string; text: string }[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (inSession) {
      interval = setInterval(() => setSessionTimer(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [inSession]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const filtered = counselors.filter(c => {
    const matchSpec = filterSpec === 'All' || c.specialization === filterSpec;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.specialization.toLowerCase().includes(search.toLowerCase());
    return matchSpec && matchSearch;
  });

  const handleBook = async () => {
    if (!selectedCounselor || !selectedSlot) return;
    setIsSubmitting(true);
    try {
      await supabase.from('counselor_bookings').insert({
        user_id: userId,
        expert_name: selectedCounselor.name,
        topic: selectedCounselor.specialization,
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: selectedSlot,
        status: 'pending',
        payment_status: 'pending',
        notes: bookingNotes || null,
      });
      setBookingSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ──── In-Session Video Room ────────────────────────────────────── */
  if (inSession && selectedCounselor) {
    return (
      <FeatureGate featureKey="counseling" featureTitle={t('ካውንስሊንግ ሴሽን', 'Counseling Sessions')} locale={locale}>
        <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-300">
          <div className="bg-[#0F172A] rounded-[3.5rem] overflow-hidden shadow-2xl relative">
            {/* Video area */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-primary/20 mx-auto flex items-center justify-center text-white text-4xl font-black">
                    {selectedCounselor.name.charAt(0)}
                  </div>
                  <p className="text-white font-black">{t(selectedCounselor.name_am, selectedCounselor.name)}</p>
                  <p className="text-white/40 text-xs uppercase tracking-widest">{t('ቪዲዮ ሴሽን ላይ', 'Session Active')}</p>
                </div>
              </div>
              {/* Timer */}
              <div className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-black flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {formatTime(sessionTimer)}
              </div>
              {/* Self-cam PiP */}
              <div className="absolute bottom-6 right-6 w-32 h-24 bg-gray-800 rounded-2xl border-2 border-white/20 flex items-center justify-center text-white/30 text-xs">
                {camOn ? t('ካሜራ ኦን', 'Camera On') : <VideoOff size={20} />}
              </div>
            </div>

            {/* Controls */}
            <div className="p-8 flex items-center justify-center gap-6">
              <button onClick={() => setMicOn(!micOn)} className={`p-4 rounded-full transition-all ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
                {micOn ? <Mic size={22} /> : <MicOff size={22} />}
              </button>
              <button onClick={() => setCamOn(!camOn)} className={`p-4 rounded-full transition-all ${camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
                {camOn ? <Video size={22} /> : <VideoOff size={22} />}
              </button>
              <button onClick={() => { setInSession(false); setSessionTimer(0); }} className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all">
                <Phone size={22} className="rotate-[135deg]" />
              </button>
            </div>

            {/* Chat */}
            <div className="border-t border-white/5 p-8 space-y-4">
              <h4 className="text-white/40 text-[10px] uppercase tracking-widest font-black">
                {t('የሴሽን ቻት', 'Session Chat')}
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {chatHistory.map((m, i) => (
                  <div key={i} className={`text-sm px-4 py-2 rounded-2xl w-fit max-w-xs ${m.from === 'me' ? 'bg-primary text-white ml-auto' : 'bg-white/10 text-white'}`}>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  placeholder={t('መልዕክት ላክ...', 'Send message...')}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={() => { if (chatMsg.trim()) { setChatHistory(h => [...h, { from: 'me', text: chatMsg }]); setChatMsg(''); } }}
                  className="p-3 bg-primary rounded-2xl text-white hover:bg-primary/90 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </FeatureGate>
    );
  }

  /* ──── Booking Modal ─────────────────────────────────────────────── */
  if (selectedCounselor) {
    return (
      <FeatureGate featureKey="counseling" featureTitle={t('ካውንስሊንግ ሴሽን', 'Counseling Sessions')} locale={locale}>
        <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">
          {/* Back */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setSelectedCounselor(null); setBookingSuccess(false); setSelectedSlot(''); setBookingNotes(''); }}
              className="p-3 rounded-2xl bg-white border border-border hover:bg-muted/40 transition-all text-gray-500 hover:text-primary"
            >
              <ChevronRight size={18} className="rotate-180" />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('ካውንስሊንግ ሴሽን', 'Counseling Sessions')}</p>
              <h2 className="text-xl font-black text-accent tracking-tight">{t(selectedCounselor.name_am, selectedCounselor.name)}</h2>
            </div>
          </div>

          {bookingSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-[3rem] p-12 text-center space-y-6">
              <div className="text-5xl">✅</div>
              <h3 className="text-2xl font-black text-green-700">{t('ቦታ ተያዘ!', 'Booking Confirmed!')}</h3>
              <p className="text-green-600">{t('ጥያቄዎ ተልኳል። አማካሪው ሲቀበሉ ያሳውቅዎታል።', 'Your request has been sent. Your counselor will confirm shortly.')}</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setInSession(true)} className="btn-primary px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Video size={16} /> {t('ቪዲዮ ሴሽን ጀምር', 'Start Video Session')}
                </button>
                <button onClick={() => { setSelectedCounselor(null); setBookingSuccess(false); }} className="px-8 py-3 border-2 border-border rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted transition-all">
                  {t('ተመለስ', 'Back')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Counselor Info Card */}
              <div className="bg-white rounded-[2.5rem] border border-border shadow-sm p-8 space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-3xl font-black text-primary mx-auto">
                  {selectedCounselor.name.charAt(0)}
                </div>
                <div className="text-center space-y-2">
                  <h4 className="font-black text-accent">{t(selectedCounselor.name_am, selectedCounselor.name)}</h4>
                  <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${SPEC_COLORS[selectedCounselor.specialization] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {t(selectedCounselor.specialization_am, selectedCounselor.specialization)}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.floor(selectedCounselor.rating) ? 'currentColor' : 'none'} />
                  ))}
                  <span className="text-xs font-black text-gray-500 ml-2">{selectedCounselor.rating}</span>
                </div>
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Languages size={14} className="text-primary" />
                    {selectedCounselor.languages.join(', ')}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black text-gray-700">
                    <span>Br {selectedCounselor.hourly_rate} / {t('ሰዓት', 'hr')}</span>
                    <span className="text-gray-400">· ${selectedCounselor.hourly_rate_usd}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{t(selectedCounselor.bio_am, selectedCounselor.bio)}</p>
              </div>

              {/* Booking Form */}
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border shadow-sm p-8 space-y-8">
                <h3 className="text-lg font-black text-accent">{t('ቀጠሮ ያስይዙ', 'Book Appointment')}</h3>

                {/* Slot picker */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{t('ክፍት ሰዓቶች', 'Available Slots')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedCounselor.available_slots.map((slot: string) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-4 rounded-2xl border text-sm font-black transition-all ${selectedSlot === slot ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/40 text-gray-600'}`}
                      >
                        <Calendar size={14} className="mx-auto mb-1" />
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{t('ማስታወሻ (አማራጭ)', 'Notes (optional)')}</p>
                  <textarea
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    rows={3}
                    placeholder={t('ዓላማ ወይም ጥያቄ ይጻፉ...', 'Describe your goal or question...')}
                    className="w-full px-5 py-4 rounded-2xl border border-border text-sm text-gray-600 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                {/* Book button */}
                <button
                  onClick={handleBook}
                  disabled={!selectedSlot || isSubmitting}
                  className="w-full btn-primary py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">{t('በመልካ ላይ...', 'Booking...')}</span>
                  ) : (
                    <><CheckCircle2 size={16} /> {t('ቀጠሮ ያስይዙ', 'Confirm Booking')}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </FeatureGate>
    );
  }

  /* ──── Counselor Directory ─────────────────────────────────────── */
  return (
    <FeatureGate featureKey="counseling" featureTitle={t('ካውንስሊንግ ሴሽን', 'Counseling Sessions')} locale={locale}>
      <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-300">

        {/* Hero — same pattern as WorkshopsView */}
        <div className="bg-accent rounded-[3.5rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full -ml-32 -mb-32 blur-[60px]" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <ShieldCheck size={14} /> {t('ካውንስሊንግ ሴሽን', 'Counseling Sessions')}
              </div>
              <h2 className="text-4xl md:text-6xl font-black italic mb-6 leading-tight tracking-[calc(-0.04em)]">
                {t('የሙያ ባለሙያ', 'Expert')} <br />
                {t('ምክር ያግኙ።', 'Guidance.')}
              </h2>
              <p className="text-white/60 text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
                {t(
                  'ብቁ የጋብቻ አማካሪዎቻችን ጋር ቀጠሮ ይያዙ። ሁሉም ሴሽኖች ሚስጥራዊ ናቸው።',
                  'Book private sessions with our certified marriage counselors. All sessions are confidential.'
                )}
              </p>
            </div>
            <div className="w-full md:w-auto grid grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, label: t('ብቁ', 'Certified') },
                { icon: Video, label: t('ቪዲዮ ሴሽን', 'Video Sessions') },
                { icon: MessageCircle, label: t('ሚስጥራዊ', 'Confidential') },
                { icon: CheckCircle2, label: t('ፈጣን ቦታ', 'Quick Booking') },
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-3">
                  <item.icon className="text-primary" size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('አማካሪ ፈልግ...', 'Search counselors...')}
              className="w-full pl-10 pr-5 py-3.5 rounded-2xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {SPECIALIZATIONS.map(s => (
              <button
                key={s}
                onClick={() => setFilterSpec(s)}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterSpec === s ? 'bg-primary text-white border-primary' : 'border-border text-gray-500 hover:border-primary/40'}`}
              >
                {s === 'All' ? t('ሁሉም', 'All') : s}
              </button>
            ))}
          </div>
        </div>

        {/* Counselor Cards */}
        <section>
          <h3 className="text-3xl font-black text-accent mb-8 uppercase italic tracking-tighter">
            {t('የተረጋገጡ አማካሪዎች', 'Certified Counselors')}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filtered.map(counselor => (
              <div
                key={counselor.id}
                onClick={() => setSelectedCounselor(counselor)}
                className="bg-white p-10 rounded-[3rem] border border-muted shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-2xl font-black text-primary">
                    {counselor.name.charAt(0)}
                  </div>
                  <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${SPEC_COLORS[counselor.specialization] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {t(counselor.specialization_am, counselor.specialization)}
                  </span>
                </div>

                <h4 className="text-xl font-black text-accent italic tracking-tight mb-2">
                  {t(counselor.name_am, counselor.name)}
                </h4>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.floor(counselor.rating) ? 'currentColor' : 'none'} />
                  ))}
                  <span className="text-xs font-black text-gray-500 ml-2">{counselor.rating}</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-2">
                  {t(counselor.bio_am, counselor.bio)}
                </p>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-gray-500 flex items-center gap-1">
                      <Languages size={12} /> {counselor.languages.join(', ')}
                    </p>
                    <p className="text-xs font-black text-primary">Br {counselor.hourly_rate} / {t('ሰዓት', 'hr')}</p>
                  </div>
                  <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                    {t('ቀጠሮ ያስይዙ', 'Book Session')} <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </FeatureGate>
  );
}
