'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  label,
  className = '',
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect platform (Capacitor Native vs Web)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cap = (window as any).Capacitor;
      setIsNative(!!cap?.isNativePlatform?.());
    }
  }, []);

  // Handle click outside to close dropdown on Web
  useEffect(() => {
    if (isNative) return; // Not needed on mobile since we use bottom sheet modal

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isNative]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (val: any) => {
    onChange(val);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(prev => !prev);
  };

  return (
    <div ref={containerRef} className={`relative w-full text-white ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between p-4 bg-[#1E293B]/60 border rounded-2xl text-left transition-all font-bold text-xs select-none cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'
        } ${
          isOpen ? 'border-[#E2725B] ring-2 ring-[#E2725B]/20' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <span className={selectedOption ? 'text-white' : 'text-white/40'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#E2725B]' : ''}`} 
        />
      </button>

      {/* Web Dropdown Menu */}
      {!isNative && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[999] bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1.5 space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all text-xs font-semibold select-none cursor-pointer ${
                    isSelected 
                      ? 'bg-[#E2725B]/10 text-[#E2725B] font-bold' 
                      : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={14} className="text-[#E2725B]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Custom Modal Bottom Sheet */}
      {isNative && isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-[9999] backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-[#0F172A] border-t border-white/10 rounded-t-[2.5rem] px-6 pb-8 pt-4 max-h-[80vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Visual Drag Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5 shrink-0" />
            
            {/* Sheet Title */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#E2725B]">
                {label || placeholder}
              </h3>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-3 overflow-y-auto flex-1 py-1 max-h-[50vh]">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all active:scale-[0.98] select-none cursor-pointer ${
                      isSelected 
                        ? 'border-[#E2725B] bg-[#E2725B]/10 text-white font-bold' 
                        : 'border-white/5 bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-semibold">{option.label}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#E2725B] flex items-center justify-center text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
