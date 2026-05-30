'use client';

import React, { useState, useEffect } from 'react';
import ethiopianDate from 'ethiopian-date';

interface EthiopianDatePickerProps {
  initialGregorianDate?: string;
  onChange: (gregorianDateString: string) => void;
  locale?: string;
}

export default function EthiopianDatePicker({ initialGregorianDate, onChange, locale = 'am' }: EthiopianDatePickerProps) {
  const [calendarType, setCalendarType] = useState<'ethiopian' | 'gregorian'>('ethiopian');
  const [ethDay, setEthDay] = useState('');
  const [ethMonth, setEthMonth] = useState('');
  const [ethYear, setEthYear] = useState('');
  const [gregDate, setGregDate] = useState(initialGregorianDate || '');

  const MONTHS_AM = [
    { value: 1, label: 'መስከረም (Meskerem)' },
    { value: 2, label: 'ጥቅምት (Tekemt)' },
    { value: 3, label: 'ህዳር (Hadar)' },
    { value: 4, label: 'ታህሳስ (Tahsas)' },
    { value: 5, label: 'ጥር (Tir)' },
    { value: 6, label: 'የካቲት (Yakatit)' },
    { value: 7, label: 'መጋቢት (Megabit)' },
    { value: 8, label: 'ሚያዝያ (Miyazya)' },
    { value: 9, label: 'ግንቦት (Ginbot)' },
    { value: 10, label: 'ሰኔ (Sene)' },
    { value: 11, label: 'ሐምሌ (Hamle)' },
    { value: 12, label: 'ነሐሴ (Nehase)' },
    { value: 13, label: 'ጳጉሜ (Pagume)' }
  ];

  const MONTHS_EN = [
    { value: 1, label: 'Meskerem' },
    { value: 2, label: 'Tekemt' },
    { value: 3, label: 'Hadar' },
    { value: 4, label: 'Tahsas' },
    { value: 5, label: 'Tir' },
    { value: 6, label: 'Yakatit' },
    { value: 7, label: 'Megabit' },
    { value: 8, label: 'Miyazya' },
    { value: 9, label: 'Ginbot' },
    { value: 10, label: 'Sene' },
    { value: 11, label: 'Hamle' },
    { value: 12, label: 'Nehase' },
    { value: 13, label: 'Pagume' }
  ];

  const months = locale === 'am' ? MONTHS_AM : MONTHS_EN;

  // Initialize from initial Gregorian date if provided
  useEffect(() => {
    if (initialGregorianDate) {
      try {
        const parts = initialGregorianDate.split('-');
        if (parts.length === 3) {
          const gy = parseInt(parts[0]);
          const gm = parseInt(parts[1]);
          const gd = parseInt(parts[2]);
          const [ey, em, ed] = ethiopianDate.toEthiopian(gy, gm, gd);
          setEthYear(ey.toString());
          setEthMonth(em.toString());
          setEthDay(ed.toString());
        }
      } catch (e) {
        console.error("Failed to parse initial date to Ethiopian calendar", e);
      }
    }
  }, [initialGregorianDate]);

  // Convert to Gregorian date when Ethiopian fields change
  useEffect(() => {
    if (calendarType === 'ethiopian' && ethDay && ethMonth && ethYear) {
      try {
        const day = parseInt(ethDay);
        const month = parseInt(ethMonth);
        const year = parseInt(ethYear);
        
        // Pagume validation (13th month can only have 5 or 6 days depending on leap year)
        if (month === 13 && day > 6) return;
        if (month < 13 && day > 30) return;
        if (day < 1 || year < 1900 || year > 2100) return;

        const [gy, gm, gd] = ethiopianDate.toGregorian(year, month, day);
        const formattedDate = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
        setGregDate(formattedDate);
        onChange(formattedDate);
      } catch (e) {
        console.error("Failed to convert Ethiopian date to Gregorian date", e);
      }
    }
  }, [ethDay, ethMonth, ethYear, calendarType, onChange]);

  const handleGregorianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGregDate(value);
    onChange(value);
    
    // Sync Ethiopian calendar inputs
    try {
      const parts = value.split('-');
      if (parts.length === 3) {
        const gy = parseInt(parts[0]);
        const gm = parseInt(parts[1]);
        const gd = parseInt(parts[2]);
        const [ey, em, ed] = ethiopianDate.toEthiopian(gy, gm, gd);
        setEthYear(ey.toString());
        setEthMonth(em.toString());
        setEthDay(ed.toString());
      }
    } catch (e) {
      console.warn("Failed to sync Gregorian change to Ethiopian fields:", e);
    }
  };

  return (
    <div className="space-y-4 p-5 bg-muted/40 rounded-3xl border border-gray-100">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Calendar Calendar</label>
        <div className="flex gap-1.5 p-1 bg-muted rounded-xl w-fit">
          <button 
            type="button" 
            onClick={() => setCalendarType('ethiopian')} 
            className={`px-3.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${calendarType === 'ethiopian' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
          >
            {locale === 'am' ? 'ኢትዮጵያ' : 'Ethiopian'}
          </button>
          <button 
            type="button" 
            onClick={() => setCalendarType('gregorian')} 
            className={`px-3.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${calendarType === 'gregorian' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
          >
            {locale === 'am' ? 'ፈረንጅ' : 'Gregorian'}
          </button>
        </div>
      </div>

      {calendarType === 'ethiopian' ? (
        <div className="grid grid-cols-3 gap-2">
          {/* Day Input */}
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest pl-1">{locale === 'am' ? 'ቀን' : 'Day'}</span>
            <input 
              type="number" 
              placeholder="DD"
              value={ethDay} 
              aria-label="Ethiopian Day"
              min={1}
              max={30}
              onChange={(e) => setEthDay(e.target.value)} 
              className="w-full p-3 bg-white rounded-xl text-center font-bold text-accent border border-gray-100 focus:outline-none focus:ring-1 focus:ring-primary" 
            />
          </div>

          {/* Month Select */}
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest pl-1">{locale === 'am' ? 'ወር' : 'Month'}</span>
            <select 
              value={ethMonth} 
              aria-label="Ethiopian Month"
              onChange={(e) => setEthMonth(e.target.value)} 
              className="w-full p-3 bg-white rounded-xl font-bold text-accent border border-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Month</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Year Input */}
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest pl-1">{locale === 'am' ? 'ዓመት' : 'Year'}</span>
            <input 
              type="number" 
              placeholder="YYYY"
              value={ethYear} 
              aria-label="Ethiopian Year"
              min={1900}
              max={2100}
              onChange={(e) => setEthYear(e.target.value)} 
              className="w-full p-3 bg-white rounded-xl text-center font-bold text-accent border border-gray-100 focus:outline-none focus:ring-1 focus:ring-primary" 
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest pl-1">{locale === 'am' ? 'የልደት ቀን' : 'Gregorian Date'}</span>
          <input 
            type="date" 
            value={gregDate} 
            aria-label="Gregorian Date Input"
            onChange={handleGregorianChange} 
            className="w-full rounded-xl border border-gray-100 p-3 bg-white font-bold text-accent focus:outline-none focus:ring-1 focus:ring-primary" 
          />
        </div>
      )}
    </div>
  );
}
