'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { ShieldCheck, UploadCloud, CheckCircle2, AlertCircle, Camera, Loader2, Sparkles } from 'lucide-react';

interface VerificationGateProps {
  userId: string;
  onVerified: () => void;
}

export default function VerificationGate({ userId, onVerified }: VerificationGateProps) {
  const t = useTranslations('Onboarding.idVerification'); // Reusing onboarding translations
  const [status, setStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
  const [docType, setDocType] = useState<'id' | 'passport' | 'dl'>('id');
  const [idUrl, setIdUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const fetchVerificationStatus = React.useCallback(async () => {
    const { data } = await supabase
      .from('verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setStatus(data.status);
      setIdUrl(data.id_url);
      setSelfieUrl(data.selfie_url);
      if (data.status === 'verified') {
        onVerified();
      }
    }
  }, [userId, onVerified]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  const handleUpload = async (file: File, type: 'id' | 'selfie') => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${type}-${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verifications')
        .getPublicUrl(filePath);

      if (type === 'id') setIdUrl(publicUrl);
      else setSelfieUrl(publicUrl);
    } catch (error: unknown) {
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!idUrl || !selfieUrl) return;

    const { error } = await supabase.from('verifications').upsert({
      user_id: userId,
      doc_type: docType,
      id_url: idUrl,
      selfie_url: selfieUrl,
      status: 'pending'
    });

    if (!error) {
      setStatus('pending');
    } else {
      alert('Submit failed: ' + error.message);
    }
  };


  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-8 bg-white rounded-[3rem] shadow-xl border border-primary/10">
        <div className="relative">
          <Loader2 size={80} className="text-primary animate-spin" />
          <Sparkles className="absolute -top-2 -right-2 text-primary animate-pulse" size={24} />
        </div>
        <h2 className="text-4xl font-black text-accent italic">Verification Pending</h2>
        <p className="text-gray-500 max-w-md">
          Our team is currently reviewing your documents to ensure a safe community. You will be notified once your profile is verified.
        </p>
        <button 
           onClick={() => onVerified()} 
           className="px-8 py-3 bg-muted text-accent font-bold rounded-2xl hover:bg-muted/80 transition-all"
        >
           Continue to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="bg-white rounded-[3rem] shadow-2xl p-12 md:p-16 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative space-y-12">
          <header className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto shadow-inner">
               <ShieldCheck size={40} />
            </div>
            <h2 className="text-4xl font-black text-accent italic tracking-tight">Identity Verification Required</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              To keep our community safe and verified, we require a quick scan of your ID and a matching selfie before you can start matching with others.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ID Component */}
            <div 
              onClick={() => idInputRef.current?.click()}
              className={`relative group cursor-pointer border-2 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center gap-4 transition-all duration-500 ${idUrl ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-muted'}`}
            >
              <input type="file" ref={idInputRef} aria-label="Upload ID document" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'id')} />
              {idUrl ? (
                <>
                  <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="font-bold text-accent">{t('idCaptured')}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <UploadCloud size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-accent">{t('doc')}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">{t('idType')}</p>
                  </div>
                </>
              )}
            </div>

            {/* Selfie Component */}
            <div 
              onClick={() => selfieInputRef.current?.click()}
              className={`relative group cursor-pointer border-2 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center gap-4 transition-all duration-500 ${selfieUrl ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-muted'}`}
            >
              <input type="file" ref={selfieInputRef} aria-label="Upload selfie" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'selfie')} />
              {selfieUrl ? (
                <>
                  <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="font-bold text-accent">{t('selfieCaptured')}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <Camera size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-accent">{t('takeSelfie')}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">{t('livePhoto')}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            disabled={!idUrl || !selfieUrl || isUploading}
            onClick={handleSubmit}
            className="w-full bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100"
          >
            {isUploading ? t('nav.processing') : t('submitAI')}
          </button>

          {status === 'rejected' && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600">
              <AlertCircle size={24} />
              <p className="text-sm font-bold">{t('rejected')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
