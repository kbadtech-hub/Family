'use client';

import React from 'react';

interface AgeRangeSliderProps {
  minAge: number;
  maxAge: number;
  minLimit?: number;
  maxLimit?: number;
  onChange: (min: number, max: number) => void;
  locale?: string;
}

export default function AgeRangeSlider({
  minAge,
  maxAge,
  minLimit = 18,
  maxLimit = 70,
  onChange,
  locale = 'am'
}: AgeRangeSliderProps) {
  // Ensure boundaries
  const currentMin = Math.max(minLimit, Math.min(minAge || 18, maxLimit - 1));
  const currentMax = Math.min(maxLimit, Math.max(maxAge || 50, currentMin + 1));

  const minPercent = ((currentMin - minLimit) / (maxLimit - minLimit)) * 100;
  const maxPercent = ((currentMax - minLimit) / (maxLimit - minLimit)) * 100;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), currentMax - 1);
    onChange(val, currentMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), currentMin + 1);
    onChange(currentMin, val);
  };

  return (
    <div className="space-y-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-150 shadow-sm">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase text-slate-600 tracking-wider">
          {locale === 'am' ? 'የእድሜ ክልል (ከ - እስከ)' : locale === 'om' ? 'Umuri (Dhihoo - Fago)' : locale === 'ti' ? 'እድመ (ካብ - ክሳብ)' : 'Age Range Preference'}
        </label>
        <span className="px-3 py-1 bg-primary/10 text-primary font-black text-xs rounded-full border border-primary/20">
          {currentMin} - {currentMax >= maxLimit ? `${maxLimit}+` : currentMax} {locale === 'am' ? 'አመት' : 'yrs'}
        </span>
      </div>

      {/* Dual Slider Container */}
      <div className="relative w-full pt-4 pb-2">
        {/* Track Background */}
        <div className="h-2 w-full bg-slate-100 rounded-full relative">
          {/* Active Highlight Track */}
          <div
            className="absolute h-2 bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-75"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />
        </div>

        {/* Min Thumb Input */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={currentMin}
          onChange={handleMinChange}
          className="absolute top-3 w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125 z-20"
        />

        {/* Max Thumb Input */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={currentMax}
          onChange={handleMaxChange}
          className="absolute top-3 w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125 z-30"
        />
      </div>

      {/* Quick Select Preset Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
        {[
          { label: '18 - 25', min: 18, max: 25 },
          { label: '21 - 30', min: 21, max: 30 },
          { label: '25 - 35', min: 25, max: 35 },
          { label: '30 - 45', min: 30, max: 45 },
          { label: '18 - 60+', min: 18, max: 70 }
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.min, preset.max)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
              currentMin === preset.min && currentMax === preset.max
                ? 'bg-accent text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
