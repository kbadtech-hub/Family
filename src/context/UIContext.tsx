'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SystemAlertModal from '@/components/ui/SystemAlertModal';
import ToastContainer, { ToastItem } from '@/components/ui/ToastContainer';

type Language = 'en' | 'am' | 'om' | 'ti';

interface ModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info' | 'confirm' | 'prompt';
  defaultValue?: string;
  placeholder?: string;
  actionText?: string;
  cancelText?: string;
  resolve?: (value: any) => void;
}

interface UIContextType {
  currentLang: Language;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  showAlert: (message: string, title?: string, type?: 'success' | 'error' | 'warning' | 'info') => Promise<void>;
  showConfirm: (message: string, title?: string, type?: 'warning' | 'confirm') => Promise<boolean>;
  showPrompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setLanguage] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    message: ''
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showAlert = useCallback((message: string, title?: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): Promise<void> => {
    return new Promise<void>((resolve) => {
      setModalState({
        isOpen: true,
        message,
        title,
        type,
        resolve: () => resolve()
      });
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string, type: 'warning' | 'confirm' = 'confirm'): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        message,
        title,
        type: 'confirm',
        resolve: (res: boolean) => resolve(!!res)
      });
    });
  }, []);

  const showPrompt = useCallback((message: string, defaultValue = '', title?: string): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      setModalState({
        isOpen: true,
        message,
        title,
        defaultValue,
        type: 'prompt',
        resolve: (res: string | null) => resolve(res)
      });
    });
  }, []);

  const handleCloseModal = (result?: any) => {
    if (modalState.resolve) {
      modalState.resolve(result);
    }
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Monkey-patch window.alert, window.confirm, window.prompt to replace browser native popups
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.alert = (msg?: any) => {
      const text = typeof msg === 'object' && msg !== null ? (msg.message || JSON.stringify(msg)) : String(msg ?? '');
      showAlert(text, 'የቤተሰብ መልእክት (Beteseb Notice)', 'info');
    };

    window.confirm = (msg?: string) => {
      const text = String(msg ?? '');
      showConfirm(text, 'ማረጋገጫ (Confirmation)');
      return false; // Non-blocking fallback for native sync callers, while custom UI opens
    };

    window.prompt = (msg?: string, defaultVal?: string) => {
      const text = String(msg ?? '');
      showPrompt(text, defaultVal || '', 'መረጃ ያስገቡ (Input Required)');
      return null;
    };
  }, [showAlert, showConfirm, showPrompt]);

  return (
    <UIContext.Provider value={{
      currentLang,
      setLanguage,
      isDarkMode,
      toggleTheme,
      showAlert,
      showConfirm,
      showPrompt,
      showToast
    }}>
      {children}
      <SystemAlertModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        defaultValue={modalState.defaultValue}
        placeholder={modalState.placeholder}
        actionText={modalState.actionText}
        cancelText={modalState.cancelText}
        onClose={handleCloseModal}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
