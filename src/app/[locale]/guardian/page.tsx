'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  User, 
  Heart, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  MapPin, 
  Award,
  AlertCircle,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Info,
  X
} from 'lucide-react';
import Image from 'next/image';

interface Guardian {
  id: string;
  user_id: string;
  guardian_email: string | null;
  guardian_phone: string | null;
  access_code: string;
  status: 'pending' | 'approved' | 'revoked';
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  gender: string;
  religion: string;
  education: string;
  job: string;
  location: string;
  bio: string;
  interests?: string;
  marital_status: string;
}

export default function GuardianPortal() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Session States
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [candidate, setCandidate] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [endorsements, setEndorsements] = useState<Record<string, any>>({});
  
  // Feedback Forms State
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'endorsed' | 'disapproved'>('endorsed');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Fetch guardian record by access code
      const { data: guardianData, error: guardianError } = await supabase
        .from('guardians')
        .select('*')
        .eq('access_code', accessCode.trim().toUpperCase())
        .maybeSingle();

      if (guardianError || !guardianData) {
        setErrorMsg('የገቡት የሚዜ ማገናኛ ኮድ ትክክል አይደለም። እባክዎ እንደገና ይሞክሩ። (Invalid Access Code)');
        setLoading(false);
        return;
      }

      if (guardianData.status === 'revoked') {
        setErrorMsg('ይህ የሚዜ ማገናኛ ኮድ በተጠቃሚው ተሰርዟል። (This access code has been revoked)');
        setLoading(false);
        return;
      }

      setGuardian(guardianData);
      setSuccessMsg('በተሳካ ሁኔታ ገብተዋል! (Access granted)');

      // 2. Fetch candidate profile
      const { data: candidateData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', guardianData.user_id)
        .single();
      
      if (candidateData) {
        setCandidate(candidateData as Profile);

        // 3. Fetch candidate matched/friend profiles
        const { data: friendships } = await supabase
          .from('friendships')
          .select(`
            *,
            sender:sender_id(*),
            receiver:receiver_id(*)
          `)
          .or(`sender_id.eq.${guardianData.user_id},receiver_id.eq.${guardianData.user_id}`)
          .eq('status', 'accepted');

        if (friendships) {
          const matchedProfiles = friendships.map((f: any) => {
            return f.sender_id === guardianData.user_id ? f.receiver : f.sender;
          });
          setMatches(matchedProfiles as Profile[]);
        }

        // 4. Fetch existing endorsements
        const { data: endorsementData } = await supabase
          .from('guardian_endorsements')
          .select('*')
          .eq('guardian_id', guardianData.id);
        
        if (endorsementData) {
          const map: Record<string, any> = {};
          endorsementData.forEach(item => {
            map[item.match_id] = item;
          });
          setEndorsements(map);
        }
      }

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostEndorsement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardian || !candidate || !activeMatchId) return;

    setSubmittingFeedback(true);
    
    try {
      const payload = {
        guardian_id: guardian.id,
        candidate_id: candidate.id,
        match_id: activeMatchId,
        status: feedbackStatus,
        note: feedbackNote
      };

      const existing = endorsements[activeMatchId];

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('guardian_endorsements')
          .update({
            status: feedbackStatus,
            note: feedbackNote,
            created_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        setEndorsements(prev => ({ ...prev, [activeMatchId]: data }));
      } else {
        // Insert
        const { data, error } = await supabase
          .from('guardian_endorsements')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setEndorsements(prev => ({ ...prev, [activeMatchId]: data }));
      }

      alert('ምክርና ምርቃትዎ በተሳካ ሁኔታ ተቀምጧል! (Guidance saved successfully)');
      setActiveMatchId(null);
      setFeedbackNote('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (!guardian) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-500">
           <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-primary/10">
              <div className="flex flex-col items-center mb-8 text-center">
                 <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary shadow-xl">
                    <ShieldCheck size={36} />
                 </div>
                 <h2 className="text-2xl font-black text-accent tracking-tighter uppercase italic leading-none">
                    የሚዜ ፖርታል <br/> <span className="text-primary not-italic text-lg font-bold">Guardian Portal</span>
                 </h2>
                 <p className="text-gray-400 text-[10px] font-bold mt-2 uppercase tracking-widest leading-relaxed">
                    ለተጋቢው ቤተሰብ ወይም የሚዜ ተኳኋኝነት መከታተያ እና ምርቃት መስጫ መድረክ
                 </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-semibold animate-shake">
                   <AlertCircle size={16} />
                   <p>{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Enter Access Code (የሚዜ ኮድ)</label>
                    <input 
                      type="text"
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="e.g. A9B8C7"
                      className="w-full bg-muted border-none rounded-2xl p-4 text-center text-lg tracking-[0.3em] font-black focus:ring-2 focus:ring-primary/20 transition-all text-accent uppercase"
                    />
                 </div>
                 
                 <button type="submit" disabled={loading} className="w-full btn-primary py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-103 transition-transform">
                    {loading ? <Loader2 className="animate-spin" /> : <ChevronRight size={18} />} 
                    አሁኑኑ ግባ (Login Access)
                 </button>
              </form>

              <div className="mt-8 pt-6 border-t border-muted text-center">
                 <p className="text-[10px] text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">
                    ይህ ፖርታል በኢትዮጵያ ባህል መሰረት ወላጆች ወይም የሚዜዎች የተጋቢዎችን የትዳር ተኳኋኝነት በይፋ የሚከታተሉበትና የሚባርኩበት ነው።
                 </p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-6 md:p-12" dir="ltr">
      <div className="max-w-6xl mx-auto space-y-10">
         
         {/* Top Header Card */}
         <div className="bg-[#0F172A] text-white rounded-[2.5rem] p-8 md:p-10 border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center text-primary shadow-xl">
                  <Award size={32} />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase leading-none">
                     {candidate?.full_name} <span className="text-primary not-italic text-sm font-bold block mt-1">የታማኝነት መከታተያ የሚዜ ፖርታል (Mediator Panel)</span>
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                     Guardian Status: <span className="text-green-500">{guardian.status}</span>
                  </p>
               </div>
            </div>
            <button 
              onClick={() => {
                setGuardian(null);
                setCandidate(null);
                setMatches([]);
                setAccessCode('');
              }}
              className="px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-colors"
            >
               ውጣ (Logout)
            </button>
         </div>

         {/* Matches Shelf Grid */}
         <div className="space-y-6">
            <div>
               <h3 className="text-xl font-black text-accent tracking-tighter uppercase italic flex items-center gap-2">
                  <Heart className="text-primary fill-primary/10" size={20} /> ተኳኋኝ አጋሮች (Candidate Matches)
               </h3>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                  የእርስዎ ተጋቢ የተገናኛቸውን እጩ አጋሮች ዝርዝር እዚህ ይገምግሙና ምክር ወይም ምርቃት ይስጡ
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {matches.length === 0 ? (
                  <div className="col-span-full bg-white p-12 rounded-[2.5rem] border border-muted text-center space-y-4 shadow-sm">
                     <Heart className="text-gray-300 mx-auto" size={48} />
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        እስካሁን ምንም ተቀባይነት ያላቸው ግንኙነቶች የሉም።
                     </p>
                  </div>
               ) : (
                  matches.map((match) => {
                     const endorsement = endorsements[match.id];
                     return (
                        <div key={match.id} className="bg-white rounded-[2.5rem] p-8 border border-muted shadow-lg hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
                           <div className="flex items-center gap-5">
                              <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden border border-primary/20 flex-shrink-0 relative">
                                 {match.avatar_url ? (
                                    <Image src={match.avatar_url} width={64} height={64} className="w-full h-full object-cover" alt={match.full_name} />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center text-primary font-black text-xl bg-primary/5">
                                       {match.full_name.charAt(0)}
                                    </div>
                                 )}
                              </div>
                              <div>
                                 <h4 className="font-black text-sm uppercase text-accent">{match.full_name}</h4>
                                 <div className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest mt-1">
                                    <MapPin size={10} /> {match.location} | {match.religion}
                                 </div>
                              </div>
                           </div>

                           {/* Profile Snippet details */}
                           <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-2xl text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              <div>💼 Job: <span className="text-accent font-black block mt-0.5">{match.job || 'N/A'}</span></div>
                              <div>🎓 Education: <span className="text-accent font-black block mt-0.5">{match.education || 'N/A'}</span></div>
                              <div className="col-span-full border-t border-muted/50 pt-2 mt-1">
                                 💍 Status: <span className="text-accent font-black">{match.marital_status}</span>
                              </div>
                           </div>

                           {match.bio && (
                              <p className="text-xs text-gray-500 italic leading-relaxed">
                                 &quot;{match.bio}&quot;
                              </p>
                           )}

                           {/* Current Endorsement Banner */}
                           {endorsement && (
                              <div className={`p-5 rounded-3xl border flex items-start gap-3 ${endorsement.status === 'endorsed' ? 'bg-green-50/50 border-green-100 text-green-800' : 'bg-red-50/50 border-red-100 text-red-800'}`}>
                                 {endorsement.status === 'endorsed' ? <ThumbsUp size={16} className="mt-0.5 flex-shrink-0" /> : <ThumbsDown size={16} className="mt-0.5 flex-shrink-0" />}
                                 <div>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest">
                                       {endorsement.status === 'endorsed' ? 'እባርካለሁ / የጸደቀ (Endorsed)' : 'እንዲጠነቀቅ እመክራለሁ (Advise Caution)'}
                                    </h5>
                                    <p className="text-xs font-semibold mt-1 italic">« {endorsement.note || 'No notes left.'} »</p>
                                 </div>
                              </div>
                           )}

                           {/* Endorsement Form Action Trigger */}
                           <button 
                             onClick={() => {
                               setActiveMatchId(match.id);
                               if (endorsement) {
                                 setFeedbackStatus(endorsement.status);
                                 setFeedbackNote(endorsement.note || '');
                               } else {
                                 setFeedbackStatus('endorsed');
                                 setFeedbackNote('');
                               }
                             }}
                             className="w-full btn-primary py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5"
                           >
                              ✍️ {endorsement ? 'ምክር/ምርቃት አስተካክል (Modify Blessing)' : 'ምክር ወይም ምርቃት ስጥ (Give Advice)'}
                           </button>
                        </div>
                     );
                  })
               )}
            </div>
         </div>
      </div>

      {/* Give Guidance Overlay Form Modal */}
      {activeMatchId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-primary/10 flex flex-col animate-in zoom-in-95 duration-300">
             
             {/* Header */}
             <div className="p-6 border-b border-muted flex justify-between items-center bg-[#0F172A] text-white">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Award className="text-primary" size={20} />
                   </div>
                   <div>
                      <h3 className="font-black italic uppercase tracking-tight text-sm">
                         ምክርና ምርቃት መስጫ መስኮት
                      </h3>
                      <p className="text-[9px] text-primary font-bold uppercase tracking-widest">
                         Guidance & Blessings
                      </p>
                   </div>
                </div>
                <button onClick={() => setActiveMatchId(null)} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white">
                   <X size={20} />
                </button>
             </div>

             {/* Form body */}
             <form onSubmit={handlePostEndorsement} className="p-6 space-y-6">
                
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">ምርጫዎ (Blessing Type)</label>
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                           type="button"
                           onClick={() => setFeedbackStatus('endorsed')}
                           className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${feedbackStatus === 'endorsed' ? 'border-green-500 bg-green-50 text-green-700 shadow-md' : 'border-muted text-gray-400 hover:border-green-200'}`}
                         >
                            <ThumbsUp size={14} /> እባርካለሁ
                         </button>
                         <button 
                           type="button"
                           onClick={() => setFeedbackStatus('disapproved')}
                           className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${feedbackStatus === 'disapproved' ? 'border-red-500 bg-red-50 text-red-700 shadow-md' : 'border-muted text-gray-400 hover:border-red-200'}`}
                         >
                            <ThumbsDown size={14} /> እመክራለሁ
                         </button>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">ምክር፣ አስተያየት ወይም ምርቃትዎ</label>
                      <textarea 
                        rows={4}
                        required
                        value={feedbackNote}
                        onChange={(e) => setFeedbackNote(e.target.value)}
                        placeholder="ለምሳሌ፡ «አስተማማኝና ትዳር ወዳድ ይመስላሉ፥ እግዚአብሔር/አላህ ይባርካችሁ!»"
                        className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs font-semibold focus:outline-none resize-none"
                      />
                   </div>
                </div>

                <button 
                  disabled={submittingFeedback || !feedbackNote}
                  type="submit"
                  className="w-full btn-primary py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? <Loader2 className="animate-spin text-white" /> : <CheckCircle2 size={14} />} 
                  ምክሩን በደህንነት አስቀምጥ
                </button>
             </form>
           </div>
         </div>
      )}

    </div>
  );
}
