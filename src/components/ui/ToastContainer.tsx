'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[999999] flex flex-col gap-3 max-w-sm w-full pointer-events-none p-2">
      {toasts.map((t) => {
        const getStyles = () => {
          switch (t.type) {
            case 'success':
              return {
                bg: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100',
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              };
            case 'error':
              return {
                bg: 'bg-rose-900/90 border-rose-500/50 text-rose-100',
                icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              };
            case 'warning':
              return {
                bg: 'bg-amber-900/90 border-amber-500/50 text-amber-100',
                icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              };
            default:
              return {
                bg: 'bg-slate-900/90 border-primary/50 text-slate-100',
                icon: <Info className="w-5 h-5 text-primary shrink-0" />
              };
          }
        };

        const { bg, icon } = getStyles();

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-in slide-in-from-top-5 ${bg}`}
          >
            {icon}
            <div className="flex-1 text-xs font-semibold leading-relaxed break-words">
              {t.message}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-white/70 hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
