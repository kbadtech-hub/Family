'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 22
  };

  const buttonSizes = {
    sm: 'p-1.5 rounded-xl',
    md: 'p-2 rounded-2xl',
    lg: 'p-3 rounded-2xl'
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={theme === 'dark' ? 'Switch to Light Mode / ወደ ነጭ ሞድ ቀይር' : 'Switch to Dark Mode / ወደ ጥቁር ሞድ ቀይር'}
      title={theme === 'dark' ? 'White Mode / ነጭ ሞድ' : 'Dark Mode / ጥቁር ሞድ'}
      className={`flex items-center justify-center transition-all duration-300 border border-border/80 bg-muted/60 hover:bg-muted text-foreground hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${buttonSizes[size]} ${className}`}
    >
      {theme === 'dark' ? (
        <Sun size={iconSizes[size]} className="text-amber-400 animate-in spin-in-90 duration-300" />
      ) : (
        <Moon size={iconSizes[size]} className="text-slate-700 dark:text-amber-300 animate-in spin-in-90 duration-300" />
      )}
    </button>
  );
}
