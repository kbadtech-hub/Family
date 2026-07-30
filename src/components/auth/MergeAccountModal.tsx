'use client';

import React, { useState } from 'react';

interface MergeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedProfileName?: string;
  matchedProfileId?: string;
  currentUserId?: string;
  duplicateType?: 'stage_1_warning' | 'stage_2_block' | 'phone_email_exists';
  onProceedStage2?: (stage2Data: { grandfather_name: string; mother_name: string; city: string }) => void;
  onMergeSuccess?: () => void;
}

export const MergeAccountModal: React.FC<MergeAccountModalProps> = ({
  isOpen,
  onClose,
  matchedProfileName,
  matchedProfileId,
  currentUserId,
  duplicateType,
  onProceedStage2,
  onMergeSuccess,
}) => {
  const [showStage2Form, setShowStage2Form] = useState(false);
  const [grandfatherName, setGrandfatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [city, setCity] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleMergeClick = async () => {
    if (!matchedProfileId || !currentUserId) return;
    setIsMerging(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/merge-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryUserId: matchedProfileId,
          secondaryUserId: currentUserId,
          reason: 'User requested duplicate account merge',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to merge accounts');

      if (onMergeSuccess) onMergeSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'አካውንቶችን ማዋሃድ አልተሳካም።');
    } finally {
      setIsMerging(false);
    }
  };

  const handleStage2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grandfatherName || !motherName || !city) {
      setErrorMessage('እባክዎን ሁሉንም መስኮች ይሙሉ (የአያት ስም፣ የእናት ስም እና ከተማ)።');
      return;
    }
    setErrorMessage('');
    if (onProceedStage2) {
      onProceedStage2({ grandfather_name: grandfatherName, mother_name: motherName, city });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-900/30 overflow-hidden p-6 transition-all">
        
        {/* Header Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
          ተመሳሳይ አካውንት ተገኝቷል (Duplicate Account Warning)
        </h3>

        {errorMessage && (
          <div className="mb-4 p-3 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800">
            {errorMessage}
          </div>
        )}

        {!showStage2Form ? (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
              {matchedProfileName ? (
                <>
                  በሲስተማችን ውስጥ ከ <strong>"{matchedProfileName}"</strong> ጋር ተመሳሳይ የሆኑ የመመዝገቢያ መረጃዎች ተገኝተዋል።
                </>
              ) : (
                'በዚህ ስልክ፣ ኢሜይል ወይም ስም ቀደም ሲል የተከፈተ አካውንት አለ።'
              )}
              <br />
              <span className="text-xs text-gray-500 mt-2 block">
                የዳታ መደጋገም እና የፕሮፋይል መመሳሰል ችግርን ለመከላከል ሁለቱን አካውንቶች ማዋሃድ ይችላሉ።
              </span>
            </p>

            <div className="space-y-3">
              <button
                onClick={handleMergeClick}
                disabled={isMerging}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isMerging ? (
                  <span>እየዋሃደ ነው...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    አካውንቶቹን አዋህድ (Merge Accounts)
                  </>
                )}
              </button>

              <button
                onClick={() => setShowStage2Form(true)}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-all"
              >
                እኔ ሌላ ሰው ነኝ (I am a Different Person)
              </button>

              <button
                onClick={onClose}
                className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-1"
              >
                ሰርዝ (Cancel)
              </button>
            </div>
          </div>
        ) : (
          /* Stage 2 Verification Form */
          <form onSubmit={handleStage2Submit} className="space-y-4 text-left">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-lg text-xs">
              <strong>ደረጃ 2 ማረጋገጫ (Advanced Match):</strong> እባክዎን ማንነትዎን በተሻለ ሁኔታ ለማረጋገጥ የአያት ስም፣ የእናት ስም እና የመኖሪያ ከተማዎን ያስገቡ።
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                የአያት ስም (Grandfather Name)
              </label>
              <input
                type="text"
                value={grandfatherName}
                onChange={(e) => setGrandfatherName(e.target.value)}
                placeholder="ለምሳሌ፡ ተሰማ"
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                የእናት ስም (Mother's Name)
              </label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="ለምሳሌ፡ አልማዝ"
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                የመኖሪያ ከተማ (Residence City)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ለምሳሌ፡ አዲስ አበባ"
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStage2Form(false)}
                className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg"
              >
                ተመለስ
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow"
              >
                አረጋግጥ (Verify)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
