'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLocale } from 'next-intl';
import { CheckCircle2, ShieldCheck, Heart, Users, Sparkles, Send } from 'lucide-react';
import Image from 'next/image';

function VouchContent() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const vouchId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [vouchRecord, setVouchRecord] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [witnessStatement, setWitnessStatement] = useState('');
  const [knowDuration, setKnowDuration] = useState(1);
  const [relationship, setRelationship] = useState('friend');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchVouchDetails = async () => {
      if (!vouchId) {
        setErrorMsg('Invalid reference invitation link (የምስክርነት ማገናኛው በትክክል አልተጫነም)');
        setLoading(false);
        return;
      }

      try {
        const { data: record, error: recError } = await supabase
          .from('vouch_records')
          .select('*')
          .eq('id', vouchId)
          .single();

        if (recError || !record) {
          setErrorMsg('Vouch request not found (የምስክርነት ጥያቄው አልተገኘም)');
          setLoading(false);
          return;
        }

        setVouchRecord(record);
        setKnowDuration(record.know_duration_years);
        setRelationship(record.relationship);

        // Fetch candidate details
        const { data: profile, error: profError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, preferred_language')
          .eq('id', record.user_id)
          .single();

        if (!profError && profile) {
          setCandidateProfile(profile);
        }
      } catch (err: any) {
        setErrorMsg('Error loading vouch record: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchDetails();
  }, [vouchId]);

  const handleSubmitVouch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!witnessStatement) {
      alert('Please enter your witness statement.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('vouch_records')
        .update({
          vouch_status: 'approved',
          witness_statement: witnessStatement,
          know_duration_years: knowDuration,
          relationship: relationship
        })
        .eq('id', vouchId);

      if (error) throw error;
      setCompleted(true);
    } catch (err: any) {
      alert('Failed to submit vouch: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-10 rounded-[3rem] border border-red-100 shadow-2xl space-y-4">
          <p className="text-red-500 font-bold text-lg">{errorMsg}</p>
          <a href="/" className="btn-primary inline-block px-8 py-3 rounded-full text-xs">Return Home</a>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-12 rounded-[3.5rem] border border-muted shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter text-accent italic">Thank You! / እናመሰግናለን!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your character witness statement has been successfully registered. You have helped build trust and safety in the Beteseb marriage community.
          </p>
          <p className="text-xs text-primary font-bold uppercase tracking-widest">
            🛡️ Verified Witness Submission
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 py-20">
      <div className="max-w-lg w-full bg-white p-10 md:p-12 rounded-[3.5rem] border border-muted shadow-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            <ShieldCheck size={14} /> Trust & Safety Reference
          </div>
          <h2 className="text-3xl font-black text-accent italic tracking-tighter">Character Witness</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You have been invited to vouch for the marriage readiness, character, and intent of the candidate below.
          </p>
        </div>

        {/* Candidate Profile Details */}
        <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary border border-primary overflow-hidden shrink-0">
            {candidateProfile?.avatar_url ? (
              <Image src={candidateProfile.avatar_url} width={64} height={64} className="w-full h-full object-cover" alt="Candidate" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
                {candidateProfile?.full_name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block">Candidate Name</span>
            <h3 className="text-lg font-bold text-accent">{candidateProfile?.full_name || 'Anonymous User'}</h3>
            <span className="text-[10px] text-primary font-semibold flex items-center gap-1 mt-0.5">
              <Sparkles size={12} /> Beteseb Matrimonial Member
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitVouch} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Relationship</span>
              <select 
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
              >
                <option value="friend">Friend / ጓደኛ</option>
                <option value="clergy">Spiritual Leader / የሃይማኖት አባት</option>
                <option value="family_elder">Family Elder / የቤተሰብ ሽማግሌ</option>
                <option value="colleague">Colleague / የስራ ባልደረባ</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Years Known</span>
              <input 
                type="number" 
                min={1}
                value={knowDuration}
                onChange={(e) => setKnowDuration(parseInt(e.target.value) || 1)}
                className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Witness Statement / ምስክርነት</span>
            <textarea 
              rows={4}
              required
              placeholder="e.g. I vouch that Kidus is a serious and responsible candidate seeking a genuine marriage partner in accordance with traditional values..."
              value={witnessStatement}
              onChange={(e) => setWitnessStatement(e.target.value)}
              className="w-full bg-muted/30 border border-muted rounded-[1.5rem] p-4 text-xs focus:outline-none resize-none"
            />
          </label>

          <button 
            type="submit"
            disabled={submitting || !witnessStatement}
            className="w-full btn-primary py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={16} /> {submitting ? 'SUBMITTING STATEMENT...' : 'Submit Character Witness Statement'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VouchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VouchContent />
    </Suspense>
  );
}
