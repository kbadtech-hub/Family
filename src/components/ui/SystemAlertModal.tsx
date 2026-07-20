'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Sparkles, X } from 'lucide-react';

export interface SystemAlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  onClose: () => void;
  actionText?: string;
}

export default function SystemAlertModal({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
  actionText
}: SystemAlertModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <XCircle size={32} />
          </div>
        );
      case 'success':
        return (
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={32} />
          </div>
        );
      case 'warning':
        return (
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle size={32} />
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm">
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
      default:
        return 'የቤተሰብ መልእክት (Beteseb Notice)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white text-[#0F172A] border-2 border-primary/20 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 text-center space-y-6 relative animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {getIcon()}

        <div className="space-y-2">
          <h3 className="text-xl font-black text-[#0F172A] tracking-tight">
            {title || getDefaultTitle()}
          </h3>
          <p className="text-sm font-medium text-gray-600 leading-relaxed break-words">
            {message}
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full bg-primary text-white py-4 px-8 rounded-full font-bold text-xs uppercase tracking-widest hover:shadow-xl hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck size={16} />
            {actionText || 'እሺ (OK)'}
          </button>
        </div>
      </div>
    </div>
  );
}
