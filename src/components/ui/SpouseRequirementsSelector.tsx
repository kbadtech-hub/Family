'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  ShieldCheck, 
  Heart, 
  Briefcase, 
  Smile, 
  Sparkles, 
  Compass, 
  Check, 
  AlertCircle, 
  LayoutGrid, 
  Layers
} from 'lucide-react';
import { MARRIAGE_CRITERIA_CATEGORIES } from '@/lib/constants';

interface SpouseRequirementsSelectorProps {
  selectedRequirements: string[];
  onChange: (requirements: string[]) => void;
  maxLimit?: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Smile: <Smile className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />
};

export default function SpouseRequirementsSelector({
  selectedRequirements = [],
  onChange,
  maxLimit = 10
}: SpouseRequirementsSelectorProps) {
  const t = useTranslations('Onboarding');
  const t_const = useTranslations('Constants');
  const locale = useLocale();

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [showLimitAlert, setShowLimitAlert] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const selectedCount = selectedRequirements.length;
  const isMaxReached = selectedCount >= maxLimit;

  // Localized string helper fallback
  const getCategoryTitle = (catId: string) => {
    try {
      const translated = t_const(`CriteriaCategories.${catId}`);
      if (translated && !translated.startsWith('Constants.')) return translated;
    } catch (_) {}

    // Fallbacks
    const fallbackTitles: Record<string, Record<string, string>> = {
      all: { am: 'ሁሉም ምድቦች', en: 'All Categories', om: 'Gosa Hunda', ti: 'ኩሎም ምድባት', ar: 'جميع الفئات', so: 'Dhammaan Qeexitaannada' },
      core_values: { am: 'እምነት እና መሠረታዊ እሴቶች', en: 'Core Values & Faith', om: 'Amantaa fi Safuu', ti: 'እምነትን መሠረታዊ እሴታትን', ar: 'الإيمان والقيم الأساسية', so: 'Iimaanka & Qiyamka Buuxa' },
      family_future: { am: 'ቤተሰብ እና የነገ ህይወት', en: 'Family & Future', om: 'Maatii fi Gara Fuulduraa', ti: 'ቤተሰብን ናይ ፅባሕ ህይወትን', ar: 'العائلة والمستقبل', so: 'Qoyska & Mustaqbalka' },
      career_finances: { am: 'ስራ እና ፋይናንስ', en: 'Career & Finances', om: 'Hojii fi Faayinaansii', ti: 'ስራሕን ፋይናንስን', ar: 'العمل والمالية', so: 'Shaqada & Maaliyadda' },
      personality_eq: { am: 'ስብዕና እና ባህሪ', en: 'Personality & Emotional Intelligence', om: 'Amala fi Sammuu', ti: 'ባህርይን ስብእናን', ar: 'الشخصية والذكاء العاطفي', so: 'Sifada & Bisaylka Niyada' },
      lifestyle_habits: { am: 'የአኗኗር ዘይቤ እና ልማዶች', en: 'Lifestyle & Habits', om: 'Akkaataa Jireenyaa', ti: 'ኣተሓሳስባን ልምድን', ar: 'نمط الحياة والعادات', so: 'Hab-nololeedka & Caadooyinka' },
      interests_leisure: { am: 'ፍላጎት እና መዝናኛ', en: 'Interests & Leisure', om: 'Bashannana fi Fedhii', ti: 'ተገዳስነትን መዘናግዕን', ar: 'الاهتمامات والترفيه', so: 'Danta & Madadaalada' }
    };

    return fallbackTitles[catId]?.[locale] || fallbackTitles[catId]?.['en'] || catId;
  };

  const getTagLabel = (tagId: string) => {
    try {
      const translated = t_const(`Requirements.${tagId}`);
      if (translated && !translated.startsWith('Constants.')) return translated;
    } catch (_) {}
    return tagId;
  };

  const handleTagToggle = (tagId: string) => {
    const isAlreadySelected = selectedRequirements.includes(tagId);

    if (isAlreadySelected) {
      // Remove tag
      onChange(selectedRequirements.filter(t => t !== tagId));
      setShowLimitAlert(false);
    } else {
      // Add tag if under limit
      if (selectedCount < maxLimit) {
        onChange([...selectedRequirements, tagId]);
        setShowLimitAlert(false);
      } else {
        // Limit reached: trigger shake & alert
        setIsShaking(true);
        setShowLimitAlert(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  };

  // Categories to display
  const displayedCategories = activeCategoryId === 'all'
    ? MARRIAGE_CRITERIA_CATEGORIES
    : MARRIAGE_CRITERIA_CATEGORIES.filter(cat => cat.id === activeCategoryId);

  return (
    <div className="w-full space-y-5 select-none">
      {/* Header Row: Section Title + Counter Badge */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-150 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <span>{t('fields.spouseRequirements') || (locale === 'am' ? 'የትዳር አጋር መስፈርቶች' : 'Spouse Requirements')}</span>
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            {locale === 'am'
              ? `ከ 6ቱ ምድቦች እስከ ${maxLimit} ዋና ዋና መስፈርቶችን ይምረጡ`
              : `Select up to ${maxLimit} key criteria from the 6 categories`}
          </p>
        </div>

        {/* Dynamic Selection Counter Pill */}
        <div 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black tracking-wider transition-all duration-300 shrink-0 ${
            isShaking ? 'animate-bounce border-red-500 bg-red-50 text-red-600' : ''
          } ${
            isMaxReached 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 shadow-sm' 
              : 'bg-primary/10 border-primary/20 text-primary'
          }`}
        >
          {isMaxReached ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
              <span>{selectedCount}/{maxLimit} {locale === 'am' ? 'ተሞልቷል' : 'Full'}</span>
            </>
          ) : (
            <span>{selectedCount}/{maxLimit} {locale === 'am' ? 'ተመርጠዋል' : 'Selected'}</span>
          )}
        </div>
      </div>

      {/* Toast Alert for Max Limit reached */}
      {showLimitAlert && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-2xl p-3 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {locale === 'am' 
                ? `ከፍተኛው ${maxLimit} መስፈርቶች ደርሰዋል! አዲስ ለመምረጥ አስቀድመው አንዱን ያስወግዱ።`
                : `Maximum ${maxLimit} criteria reached! Deselect one to add a new choice.`}
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setShowLimitAlert(false)}
            className="text-amber-700 font-bold hover:text-amber-900 text-xs px-2 py-0.5 rounded-lg hover:bg-amber-500/20"
          >
            ✕
          </button>
        </div>
      )}

      {/* Horizontal Category Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        {/* All Categories Pill */}
        <button
          type="button"
          onClick={() => setActiveCategoryId('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            activeCategoryId === 'all'
              ? 'bg-accent text-white border-accent shadow-md scale-102'
              : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>{getCategoryTitle('all')}</span>
        </button>

        {/* Individual Category Pills */}
        {MARRIAGE_CRITERIA_CATEGORIES.map(cat => {
          const isActive = activeCategoryId === cat.id;
          const selectedInCat = cat.tags.filter(t => selectedRequirements.includes(t)).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryId(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-102'
                  : 'bg-white text-slate-700 border-gray-200 hover:bg-slate-50'
              }`}
            >
              {CATEGORY_ICONS[cat.icon] || <Layers className="w-3.5 h-3.5" />}
              <span>{getCategoryTitle(cat.id)}</span>
              {selectedInCat > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                  isActive ? 'bg-white text-primary' : 'bg-primary text-white'
                }`}>
                  {selectedInCat}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category Chips Container Grid */}
      <div className="space-y-4 pt-1">
        {displayedCategories.map(cat => {
          const categoryTitle = getCategoryTitle(cat.id);

          return (
            <div 
              key={cat.id} 
              className="bg-white border border-gray-150 rounded-2xl p-4 space-y-3 shadow-xs hover:border-primary/20 transition-colors"
            >
              {/* Category Sub-Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <span className="p-1 rounded-lg bg-primary/10 text-primary">
                    {CATEGORY_ICONS[cat.icon]}
                  </span>
                  <span>{categoryTitle}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                  {cat.tags.filter(t => selectedRequirements.includes(t)).length}/{cat.tags.length}
                </span>
              </div>

              {/* Tag Chips Flex Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {cat.tags.map(tagId => {
                  const isSelected = selectedRequirements.includes(tagId);
                  const isDisabled = isMaxReached && !isSelected;
                  const tagLabel = getTagLabel(tagId);

                  return (
                    <button
                      key={tagId}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleTagToggle(tagId)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 select-none ${
                        isSelected
                          ? 'bg-primary text-white shadow-sm shadow-primary/20 scale-[1.02] border border-primary'
                          : isDisabled
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                          : 'bg-slate-50 text-slate-700 hover:bg-primary/10 hover:text-primary border border-slate-200/80 active:scale-95'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white shrink-0" />}
                      <span>{tagLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
