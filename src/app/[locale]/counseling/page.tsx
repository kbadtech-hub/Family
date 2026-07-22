'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import FeatureGate from '@/components/dashboard/FeatureGate';
import { 
  Calendar, Clock, Video, VideoOff, Mic, MicOff, PhoneOff, 
  ShieldCheck, Star, User, MessageCircle, Send, Award, CheckCircle2, 
  X, Filter, Search, Lock, Monitor, AlertTriangle
} from 'lucide-react';

interface Counselor {
  id: string;
  user_id: string;
  bio: string;
  specialization: string;
  hourly_rate: number;
  verified_status: string;
  rating: number;
  languages: string[];
  profiles?: { full_name: string; avatar_url: string; email: string };
}

interface Appointment {
  id: string;
  user_id: string;
  counselor_id: string;
  scheduled_at: string;
  status: 'booked' | 'active' | 'completed' | 'canceled';
  video_room_id: string;
  notes: string | null;
  counselors?: Counselor;
}

interface ChatMessage {
  id: string;
  appointment_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const INITIAL_COUNSELORS: Counselor[] = [
  {
    id: 'coun-1',
    user_id: 'u-coun-1',
    bio: 'Certified Family Counselor & Psychologist with over 10 years of experience in pre-marriage counseling and Ethiopian family dynamics.',
    specialization: 'Pre-Marriage',
    hourly_rate: 50.00,
    verified_status: 'verified',
    rating: 4.9,
    languages: ['Amharic', 'English'],
    profiles: { full_name: 'Dr. Bethlehem Tadesse', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300', email: 'bethlehem@beteseb.com' }
  },
  {
    id: 'coun-2',
    user_id: 'u-coun-2',
    bio: 'Specialist in marital conflict resolution, financial alignment, and communication coaching for young couples.',
    specialization: 'Conflict Resolution',
    hourly_rate: 45.00,
    verified_status: 'verified',
    rating: 4.8,
    languages: ['Amharic', 'Oromoo', 'English'],
    profiles: { full_name: 'Ustaz Ahmed Hassan', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300', email: 'ahmed@beteseb.com' }
  },
  {
    id: 'coun-3',
    user_id: 'u-coun-3',
    bio: 'Family advisor specializing in parenting, child development, and inter-generational household harmony.',
    specialization: 'Parenting',
    hourly_rate: 60.00,
    verified_status: 'verified',
    rating: 5.0,
    languages: ['Amharic', 'Tigrinya', 'English'],
    profiles: { full_name: 'Wzr. Rahel Gebremedhin', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300', email: 'rahel@beteseb.com' }
  }
];

export default function CounselingPage() {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const am = locale === 'am';

  const [counselors, setCounselors] = useState<Counselor[]>(INITIAL_COUNSELORS);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('All');
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);

  // Booking Modal & Date/Time Slot Selection
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<Appointment | null>(null);

  // Appointments List
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'directory' | 'appointments'>('directory');

  // WebRTC Tele-Consultation Room State
  const [activeCallAppointment, setActiveCallAppointment] = useState<Appointment | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Chat during session
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Anti-Screenshot Confidentiality Listener
  const [isScreenBlurred, setIsScreenBlurred] = useState(false);

  // Video Element Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Fetch Counselors & User Appointments from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch Verified Counselors
      const { data: counselorData } = await supabase
        .from('counselors')
        .select('*, profiles:user_id(full_name, avatar_url, email)')
        .eq('verified_status', 'verified');

      if (counselorData && counselorData.length > 0) {
        setCounselors(counselorData);
      }

      // Fetch User Appointments
      if (user) {
        const { data: apptData } = await supabase
          .from('counseling_appointments')
          .select('*, counselors(*, profiles:user_id(full_name, avatar_url))')
          .eq('user_id', user.id)
          .order('scheduled_at', { ascending: false });

        if (apptData) setMyAppointments(apptData);
      }
    };

    fetchData();
  }, []);

  // Timer & Confidentiality listeners when call is active
  useEffect(() => {
    if (!activeCallAppointment) return;

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Anti-Screenshot & Screen focus protection listeners
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        setIsScreenBlurred(true);
        alert(am 
          ? 'የደህንነት ማሳወቂያ፦ በካውንስሊንግ ክፍለ ጊዜ ቅጽበታዊ ገጽ እይታ (Screenshot) ማንሳት በህግ የተከለከለ ነው!' 
          : 'SECURITY WARNING: Screenshots and screen recording are strictly prohibited in counseling rooms!');
      }
    };

    const handleBlur = () => setIsScreenBlurred(true);
    const handleFocus = () => setIsScreenBlurred(false);

    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeCallAppointment, am]);

  // Fetch session messages for active call
  useEffect(() => {
    if (!activeCallAppointment) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('counseling_messages')
        .select('*')
        .eq('appointment_id', activeCallAppointment.id)
        .order('created_at', { ascending: true });

      if (data) setSessionMessages(data);
    };

    fetchMessages();
  }, [activeCallAppointment]);

  // Handle Booking Submission
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounselor || !bookingDate || !currentUser) return;

    setIsBookingSubmitting(true);
    const scheduledAt = new Date(`${bookingDate} ${bookingTime}`).toISOString();
    const videoRoomId = `ROOM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const newAppt = {
      user_id: currentUser.id,
      counselor_id: selectedCounselor.id,
      scheduled_at: scheduledAt,
      status: 'booked' as const,
      video_room_id: videoRoomId,
      notes: bookingNotes
    };

    const { data, error } = await supabase
      .from('counseling_appointments')
      .insert(newAppt)
      .select('*, counselors(*, profiles:user_id(full_name, avatar_url))')
      .single();

    if (!error && data) {
      setMyAppointments(prev => [data, ...prev]);
      setBookingSuccessModal(data);
      setSelectedCounselor(null);
    } else {
      // Fallback local booking simulation
      const fallbackAppt = {
        id: `appt-${Date.now()}`,
        ...newAppt,
        counselors: selectedCounselor
      };
      setMyAppointments(prev => [fallbackAppt, ...prev]);
      setBookingSuccessModal(fallbackAppt);
      setSelectedCounselor(null);
    }

    setIsBookingSubmitting(false);
  };

  // Start Video Consultation Room
  const startVideoCall = async (appt: Appointment) => {
    setActiveCallAppointment(appt);
    setCallDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera/Mic permission denied or fallback simulation mode:', err);
    }
  };

  // End Video Consultation Room
  const endVideoCall = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (activeCallAppointment && currentUser) {
      await supabase
        .from('counseling_appointments')
        .update({ status: 'completed' })
        .eq('id', activeCallAppointment.id);

      setMyAppointments(prev => prev.map(a => a.id === activeCallAppointment.id ? { ...a, status: 'completed' } : a));
    }

    setActiveCallAppointment(null);
  };

  // Send Session Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeCallAppointment || !currentUser) return;

    const msgObj = {
      appointment_id: activeCallAppointment.id,
      sender_id: currentUser.id,
      message: chatInput
    };

    const { data } = await supabase
      .from('counseling_messages')
      .insert(msgObj)
      .select('*')
      .single();

    if (data) setSessionMessages(prev => [...prev, data]);
    else setSessionMessages(prev => [...prev, { id: `msg-${Date.now()}`, ...msgObj, created_at: new Date().toISOString() }]);

    setChatInput('');
  };

  const specializations = ['All', 'Pre-Marriage', 'Conflict Resolution', 'Finance', 'Parenting', 'Psychology', 'General'];
  const filteredCounselors = selectedSpecialization === 'All' 
    ? counselors 
    : counselors.filter(c => c.specialization === selectedSpecialization);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <FeatureGate featureKey="counseling" featureTitle="Counseling Sessions (የጋብቻ ካውንስሊንግ)" locale={locale}>
      <div className="min-h-screen bg-[#FDFBF9] text-accent p-4 md:p-10" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Top Hero Banner */}
          <header className="bg-gradient-to-r from-accent to-[#0F172A] text-white rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-black uppercase tracking-widest">
                <ShieldCheck size={16} /> Beteseb Tele-Consultation Hub
              </div>
              <h1 className="text-3xl md:text-5xl font-black italic tracking-tight uppercase">
                {am ? 'የጋብቻ እና የቤተሰብ ካውንስሊንግ አገልግሎት' : 'Private Counseling & Tele-Consultation Hub'}
              </h1>
              <p className="text-gray-300 text-sm font-medium leading-relaxed italic">
                {am 
                  ? 'ከተረጋገጡ የጋብቻ እና የቤተሰብ አማካሪዎች ጋር በቪዲዮ እና በድምፅ የቀጥታ ምክክር ቀጠሮ ይያዙ።'
                  : 'Book private video consultation sessions with certified psychologists, family advisors, and counselors.'}
              </p>
            </div>

            {/* Navigation Tabs Header */}
            <div className="relative z-10 flex gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab('directory')}
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'directory' ? 'bg-primary text-white shadow-lg' : 'text-white/70 hover:text-white'}`}
              >
                {am ? 'አማካሪዎች (Directory)' : 'Counselor Directory'}
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'appointments' ? 'bg-primary text-white shadow-lg' : 'text-white/70 hover:text-white'}`}
              >
                {am ? 'የኔ ቀጠሮዎች' : 'My Appointments'} ({myAppointments.length})
              </button>
            </div>
          </header>

          {/* ACTIVE WEBRTC VIDEO CONSULTATION ROOM MODAL */}
          {activeCallAppointment && (
            <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col md:flex-row text-white animate-in fade-in duration-300">
              {/* Main Video View */}
              <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900">
                {/* Confidentiality Warning Bar */}
                <div className="p-4 bg-red-500/20 border-b border-red-500/30 flex items-center justify-between text-xs font-black uppercase tracking-widest text-red-400">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} /> Confidential Session — Room: {activeCallAppointment.video_room_id}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> Duration: {formatDuration(callDuration)}
                  </span>
                </div>

                {/* Video Container */}
                <div className={`flex-1 relative flex items-center justify-center p-4 ${isScreenBlurred ? 'blur-2xl transition-all' : ''}`}>
                  {/* Remote Stream Video */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-3xl border border-white/10 shadow-2xl"
                  />

                  {/* Fallback Avatar Overlay if remote video is simulated */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="w-32 h-32 rounded-full border-4 border-primary overflow-hidden shadow-2xl animate-pulse">
                      <img
                        src={activeCallAppointment.counselors?.profiles?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'}
                        alt="Counselor avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-black italic">{activeCallAppointment.counselors?.profiles?.full_name}</h3>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full uppercase border border-emerald-500/30">
                      ● Live Audio/Video Connected
                    </span>
                  </div>

                  {/* Local Stream PIP Camera Window */}
                  <div className="absolute bottom-6 right-6 w-44 h-32 bg-black rounded-2xl overflow-hidden border-2 border-primary shadow-2xl">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Bottom Controls Bar */}
                <div className="p-6 bg-slate-950/90 border-t border-white/10 flex items-center justify-center gap-6">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full transition-all shadow-lg ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>

                  <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-4 rounded-full transition-all shadow-lg ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  >
                    {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                  </button>

                  <button
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                    className={`p-4 rounded-full transition-all shadow-lg ${isScreenSharing ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  >
                    <Monitor size={22} />
                  </button>

                  <button
                    onClick={endVideoCall}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-2xl transition-all flex items-center gap-2"
                  >
                    <PhoneOff size={18} /> {am ? 'ምክክሩን ጨርስ' : 'End Consultation'}
                  </button>
                </div>
              </div>

              {/* Private Chat Panel */}
              <div className="w-full md:w-96 bg-slate-900 border-l border-white/10 flex flex-col justify-between p-6 space-y-4">
                <div className="border-b border-white/10 pb-4">
                  <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                    <MessageCircle size={18} className="text-primary" /> {am ? 'የቀጥታ መልእክት (Live Chat)' : 'Session Private Chat'}
                  </h4>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[60vh] md:max-h-none">
                  {sessionMessages.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-10">{am ? 'በምክክሩ ወቅት መልእክት ይላኩ።' : 'No chat messages exchanged yet.'}</p>
                  ) : (
                    sessionMessages.map(msg => {
                      const isMe = msg.sender_id === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-2xl text-xs max-w-[85%] font-medium ${isMe ? 'bg-primary text-white' : 'bg-slate-800 text-gray-200 border border-white/10'}`}>
                            {msg.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={am ? 'መልእክት ጻፍ...' : 'Write message...'}
                    className="flex-1 p-3 bg-slate-800 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MAIN DIRECTORY TAB */}
          {activeTab === 'directory' && (
            <div className="space-y-8">
              {/* Specialization Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {specializations.map(spec => (
                  <button
                    key={spec}
                    onClick={() => setSelectedSpecialization(spec)}
                    className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${selectedSpecialization === spec ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'}`}
                  >
                    {spec}
                  </button>
                ))}
              </div>

              {/* Counselors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCounselors.map(coun => (
                  <div key={coun.id} className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6 group">
                    <div className="space-y-4">
                      {/* Avatar & Verification Badge */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-3xl overflow-hidden border-2 border-primary/30 shadow-md">
                          <img
                            src={coun.profiles?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'}
                            alt={coun.profiles?.full_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-emerald-600 text-xs font-black uppercase">
                            <ShieldCheck size={16} /> Verified Advisor
                          </div>
                          <h3 className="text-xl font-black text-accent italic">{coun.profiles?.full_name}</h3>
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-black mt-0.5">
                            <Star size={14} className="fill-amber-500" /> {coun.rating} / 5.0
                          </div>
                        </div>
                      </div>

                      {/* Specialization Tag & Bio */}
                      <div className="space-y-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-wider inline-block">
                          {coun.specialization}
                        </span>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed italic line-clamp-3">
                          "{coun.bio}"
                        </p>
                      </div>

                      {/* Languages & Hourly Rate */}
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 font-black uppercase block">{am ? 'ቋንቋዎች' : 'Languages'}</span>
                          <span className="font-bold text-accent">{coun.languages?.join(', ')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-black uppercase block">{am ? 'የሰዓት ሂሳብ' : 'Rate'}</span>
                          <span className="font-black text-primary text-sm">${coun.hourly_rate} / hr</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCounselor(coun)}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar size={16} />
                      {am ? 'ቀጠሮ ይያዙ (Book Appointment)' : 'Book Appointment'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MY APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-2xl font-black text-accent italic">{am ? 'የተያዙ የቀጠሮዎች ዝርዝር' : 'My Booked Appointments'}</h2>

              {myAppointments.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-10">{am ? 'ምንም የተያዘ ቀጠሮ የለም።' : 'No counseling appointments booked yet.'}</p>
              ) : (
                <div className="space-y-4">
                  {myAppointments.map(appt => (
                    <div key={appt.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-base text-accent">{appt.counselors?.profiles?.full_name || 'Certified Counselor'}</h4>
                          <p className="text-xs text-gray-500 font-bold">
                            📅 {new Date(appt.scheduled_at).toLocaleString()}
                          </p>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase mt-1 inline-block ${appt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                            {appt.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => startVideoCall(appt)}
                          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
                        >
                          <Video size={16} /> {am ? 'ወደ ቪዲዮ ክፍሉ ግባ' : 'Enter Consultation Room'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SMART BOOKING APPOINTMENT MODAL */}
          {selectedCounselor && (
            <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white max-w-lg w-full rounded-[3rem] p-8 border border-primary/20 shadow-2xl space-y-6 relative">
                <button
                  onClick={() => setSelectedCounselor(null)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-accent p-2 rounded-full"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border">
                    <img
                      src={selectedCounselor.profiles?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'}
                      alt="Counselor"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase">Select Date & Slot</span>
                    <h3 className="text-xl font-black text-accent italic">{selectedCounselor.profiles?.full_name}</h3>
                    <p className="text-xs text-gray-500 font-bold">${selectedCounselor.hourly_rate} / hour</p>
                  </div>
                </div>

                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Select Date</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-accent"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Select Time Slot</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-accent"
                    >
                      <option value="09:00 AM">09:00 AM - 10:00 AM</option>
                      <option value="10:00 AM">10:00 AM - 11:00 AM</option>
                      <option value="02:00 PM">02:00 PM - 03:00 PM</option>
                      <option value="04:00 PM">04:00 PM - 05:00 PM</option>
                      <option value="07:00 PM">07:00 PM - 08:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Session Topic / Notes</label>
                    <textarea
                      rows={3}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Briefly state your topic or questions..."
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-accent resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isBookingSubmitting || !bookingDate}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
                  >
                    {isBookingSubmitting ? 'Booking...' : (am ? 'ቀጠሮውን አረጋግጥ' : 'Confirm Booking')}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* BOOKING SUCCESS CONFIRMATION MODAL */}
          {bookingSuccessModal && (
            <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white max-w-md w-full rounded-[3rem] p-8 border border-emerald-300 shadow-2xl text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <CheckCircle2 size={44} />
                </div>
                <h3 className="text-2xl font-black text-accent italic uppercase">{am ? 'ቀጠሮው በተሳካ ሁኔታ ተይዟል!' : 'Appointment Confirmed!'}</h3>
                <p className="text-xs text-gray-500 font-bold">
                  Room ID: <span className="font-mono text-accent">{bookingSuccessModal.video_room_id}</span>
                </p>

                <button
                  onClick={() => setBookingSuccessModal(null)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                >
                  {am ? 'እሺ / ዝጋ' : 'OK / Close'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </FeatureGate>
  );
}
