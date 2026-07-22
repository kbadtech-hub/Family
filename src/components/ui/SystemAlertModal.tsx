'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Sparkles, X, HelpCircle } from 'lucide-react';

export interface SystemAlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info' | 'confirm' | 'prompt';
  defaultValue?: string;
  placeholder?: string;
  onClose: (result?: any) => void;
  actionText?: string;
  cancelText?: string;
}

export default function SystemAlertModal({
  isOpen,
  title,
  message,
  type = 'info',
  defaultValue = '',
  placeholder = '',
  onClose,
  actionText,
  cancelText
}: SystemAlertModalProps) {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    setInputValue(defaultValue || '');
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const isConfirm = type === 'confirm';
  const isPrompt = type === 'prompt';

  const handleConfirm = () => {
    if (isPrompt) {
      onClose(inputValue);
    } else if (isConfirm) {
      onClose(true);
    } else {
      onClose(true);
    }
  };

  const handleCancel = () => {
    if (isPrompt) {
      onClose(null);
    } else if (isConfirm) {
      onClose(false);
    } else {
      onClose(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
            <XCircle size={32} />
          </div>
        );
      case 'success':
        return (
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={32} />
          </div>
        );
      case 'warning':
      case 'confirm':
        return (
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle size={32} />
          </div>
        );
      case 'prompt':
        return (
          <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-sm">
            <HelpCircle size={32} />
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm">
            <Sparkles size={32} />
          </div>
        );
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'error':
        return 'ስህተት ተፈጥሯል (Error)';
      case 'success':
        return 'ተሳክቷል (Success)';
      case 'warning':
        return 'ማስጠንቀቂያ (Warning)';
      case 'confirm':
        return 'ማረጋገጫ (Confirmation)';
      case 'prompt':
        return 'መረጃ ያስገቡ (Input Required)';
      default:
        return 'የቤተሰብ መልእክት (Beteseb Notice)';
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 border-2 border-primary/30 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 text-center space-y-6 relative animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleCancel}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {getIcon()}

        <div className="space-y-2">
          <h3 className="text-xl font-black tracking-tight">
            {title || getDefaultTitle()}
          </h3>
          <p className="text-sm font-medium text-gray-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {isPrompt && (
          <div className="pt-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') handleCancel();
              }}
              placeholder={placeholder || 'አንድ ነገር ይጻፉ...'}
              autoFocus
              className="w-full px-5 py-3.5 rounded-2xl border-2 border-primary/30 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary font-medium text-sm transition-all"
            />
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-3">
          {(isConfirm || isPrompt) && (
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              {cancelText || 'ሰርዝ (Cancel)'}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 ${
              type === 'error' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary hover:opacity-95'
            } text-white py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer`}
          >
            <ShieldCheck size={16} />
            {actionText || (isConfirm ? 'አረጋግጥ (Confirm)' : 'እሺ (OK)')}
          </button>
        </div>
      </div>
    </div>
  );
}
