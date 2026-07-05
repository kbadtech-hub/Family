'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Users, Heart, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function CommunityHubPage() {
  const t = useTranslations('CommunityHub');
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-background" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-secondary/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Users size={14} />
            {t('subtitle')}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-accent mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {t('title')}
          </h1>
          
          <p className="max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {t('description')}
          </p>

          <div className="flex flex-wrap justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link href="/signup" className="btn-primary flex items-center gap-3">
              {t('cta')} <ArrowRight size={18} />
            </Link>
            <Link href="/community" className="btn-secondary flex items-center gap-3">
              {locale === 'am' ? 'ወደ ጓዳው ይግቡ' : 'Enter the Hub'}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-premium group hover:border-primary/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Heart size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-accent">
                {locale === 'am' ? 'እውነተኛ ትውውቅ' : 'True Connection'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {locale === 'am' ? 'በባህልና በእሴት የታጀበ፣ በእምነት ላይ የተገነባ የቤተሰብ ትስስር።' : 'Family connections built on trust, supported by culture and values.'}
              </p>
            </div>

            <div className="card-premium group hover:border-primary/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Sparkles size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-accent">
                {locale === 'am' ? 'የልምድ ልውውጥ' : 'Experience Sharing'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {locale === 'am' ? 'ከልምድ ያካበቱትን እውቀት ለሌሎች የሚያካፍሉበት ሰፊ መድረክ።' : 'A platform to share wisdom and knowledge gained from experience.'}
              </p>
            </div>

            <div className="card-premium group hover:border-primary/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-accent">
                {locale === 'am' ? 'ነፃ ውይይት' : 'Free Discussion'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {locale === 'am' ? 'በትዳር እና በልጅ አስተዳደግ ዙሪያ በነፃነት የሚመካከሩበት ጓዳ።' : 'A room to freely discuss marriage and child-rearing.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Section */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-[4rem] overflow-hidden shadow-2xl h-[500px]">
             <Image 
               src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop" 
               alt="Community Hub" 
               fill 
               className="object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-r from-accent/80 to-transparent flex items-center px-12 md:px-24">
                <div className="max-w-xl text-white">
                   <h2 className="text-4xl md:text-5xl font-bold mb-6 italic tracking-tighter">
                     {locale === 'am' ? '"ሰው ለሰው መድኃኒቱ ነው!"' : '"Man is the medicine for man!"'}
                   </h2>
                   <p className="text-xl text-white/80 font-medium leading-relaxed">
                     {locale === 'am' ? 'እዚህ ማንም ለብቻው አይደለም። ሁላችንም ለአንድ ዓላማ ተሰባስበናል — ጠንካራ ቤተሰብን ለመገንባት።' : 'No one is alone here. We are all gathered for one purpose — to build strong families.'}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-accent text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
           <h2 className="text-4xl font-bold mb-8 tracking-tight">{t('cta')}</h2>
           <Link href="/signup" className="btn-primary bg-white text-accent hover:bg-white/90">
             {locale === 'am' ? 'አባል ይሁኑ' : 'Become a Member'}
           </Link>
        </div>
      </section>
    </div>
  );
}
