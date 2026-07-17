'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Fingerprint, KeyRound, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { isBiometricsAvailable, authenticateBiometrics } from '@/lib/biometrics';

const STORAGE_KEY = 'beteseb_app_lock_enabled';
const PIN_STORAGE_KEY = 'beteseb_app_lock_pin';
const LOCK_TIMESTAMP_KEY = 'beteseb_app_lock_ts';
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity before re-locking

export function isAppLockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setAppLockEnabled(value: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
}

export function getStoredPin(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PIN_STORAGE_KEY);
}

export function setStoredPin(pin: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PIN_STORAGE_KEY, pin);
}

export function clearStoredPin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PIN_STORAGE_KEY);
}

/**
 * AppLockGate — wraps the entire app.
 * If App Lock is enabled and the session has expired (or is fresh),
 * it shows a PIN / biometric lock screen before rendering children.
 */
export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  const unlock = useCallback(() => {
    localStorage.setItem(LOCK_TIMESTAMP_KEY, Date.now().toString());
    setLocked(false);
    setPin('');
    setError('');
  }, []);

  // Check on mount if the lock should activate
  useEffect(() => {
    const check = async () => {
      if (!isAppLockEnabled()) {
        setChecking(false);
        return;
      }

      // Determine if session has timed out
      const lastTs = localStorage.getItem(LOCK_TIMESTAMP_KEY);
      const expired = !lastTs || (Date.now() - parseInt(lastTs, 10)) > LOCK_TIMEOUT_MS;

      if (expired) {
        // Try biometrics first
        const bioOk = await isBiometricsAvailable();
        setBiometricAvailable(bioOk);

        if (bioOk) {
          try {
            const success = await authenticateBiometrics('Unlock Beteseb');
            if (success) {
              unlock();
              setChecking(false);
              return;
            }
          } catch (_) {
            // Fall through to PIN
          }
        }

        setLocked(true);
      }

      setChecking(false);
    };

    check();
  }, [unlock]);

  // Re-lock after LOCK_TIMEOUT_MS of inactivity (background / hidden)
  useEffect(() => {
    if (!isAppLockEnabled()) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.setItem(LOCK_TIMESTAMP_KEY, (Date.now() - LOCK_TIMEOUT_MS - 1).toString());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredPin();
    if (!stored) {
      // No PIN set yet — this is the first-time setup. Store and unlock.
      setStoredPin(pin);
      unlock();
      return;
    }
    if (pin === stored) {
      unlock();
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  const handleBiometricRetry = async () => {
    setError('');
    try {
      const success = await authenticateBiometrics('Unlock Beteseb');
      if (success) unlock();
      else setError('Biometric authentication failed. Please use your PIN.');
    } catch (_) {
      setError('Biometric authentication failed. Please use your PIN.');
    }
  };

  // Don't block SSR / initial check
  if (checking) return <>{children}</>;
  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[999] bg-[#0F172A] flex flex-col items-center justify-center p-8 text-white">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0%,_transparent_50%)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--primary)_0%,_transparent_40%)] opacity-10" />

      <div className="relative z-10 w-full max-w-sm space-y-8 text-center animate-in zoom-in-95 duration-500">
        {/* Logo / Icon */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-primary/20 border border-primary/30 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20">
            <Lock size={36} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">
              Beteseb<span className="text-primary"> Locked</span>
            </h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
              ቤተሰብ ተቆልፏል / Enter your PIN to continue
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2 justify-center">
            <X size={14} /> {error}
          </div>
        )}

        {/* Biometric button (if available) */}
        {biometricAvailable && (
          <button
            onClick={handleBiometricRetry}
            className="w-full py-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-2xl text-primary font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Fingerprint size={18} /> Use Biometrics (Face ID / Fingerprint)
          </button>
        )}

        {/* PIN entry */}
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              {getStoredPin() ? 'Enter PIN' : 'Set a new PIN (first time)'}
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                required
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-12 text-center text-xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/40 text-white placeholder:text-white/20"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            <ShieldCheck size={18} />
            {getStoredPin() ? 'Unlock Beteseb' : 'Set PIN & Unlock'}
          </button>
        </form>

        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest leading-relaxed px-4">
          App Lock is strictly optional. You can disable it in Profile → Settings.
        </p>
      </div>
    </div>
  );
}
