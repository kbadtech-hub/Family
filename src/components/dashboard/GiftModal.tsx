'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Gift, 
  Coins, 
  X, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight, 
  Sparkles, 
  Info,
  Lock,
  LockOpen
} from 'lucide-react';
import Image from 'next/image';

interface GiftItem {
  id: string;
  name_en: string;
  name_am: string;
  name_om: string;
  name_ti: string;
  name_so: string;
  name_ar: string;
  image_url: string;
  coin_price: number;
  category?: string;
  unlock_level?: number;
}

interface GiftModalProps {
  recipientId: string;
  recipientName: string;
  locale: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GiftModal({ recipientId, recipientName, locale, onClose, onSuccess }: GiftModalProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'buy_coins'>('gallery');
  const [catalog, setCatalog] = useState<GiftItem[]>([]);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [message, setMessage] = useState('');
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  
  // Phase 4 Gamified Unlock States
  const [interactionScore, setInteractionScore] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cultural' | 'pets' | 'flowers' | 'coupons'>('all');

  // Coin packs to buy
  const coinPacks = [
    { id: 'coins_50', coins: 50, priceEtb: 50, priceUsd: 1.0 },
    { id: 'coins_100', coins: 100, priceEtb: 100, priceUsd: 2.0 },
    { id: 'coins_500', coins: 500, priceEtb: 450, priceUsd: 8.0, discount: '10% OFF' },
    { id: 'coins_1000', coins: 1000, priceEtb: 800, priceUsd: 15.0, discount: '20% OFF' }
  ];

  const [selectedPack, setSelectedPack] = useState<any>(coinPacks[1]);
  const [isMobileNative, setIsMobileNative] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setIsMobileNative(true);
    }
  }, []);

  const getRequiredMessages = (level: number) => {
    if (level === 2) return 5;
    if (level === 3) return 15;
    if (level === 4) return 30;
    return 0;
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        // Fetch coin balance
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('coin_balance')
          .eq('id', user.id)
          .maybeSingle();
        
        if (wallet) {
          setCoinBalance(Number(wallet.coin_balance));
        }

        // Fetch message count interaction score
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`);
        
        if (count !== null) {
          setInteractionScore(count);
        }
      }
    };
    init();

    // Fetch dynamic catalog
    const fetchCatalog = async () => {
      const { data } = await supabase
        .from('gift_catalog')
        .select('*')
        .eq('is_active', true)
        .order('coin_price', { ascending: true });
      
      if (data && data.length > 0) {
        setCatalog(data);
        setSelectedGift(data[0]);
      }
    };
    fetchCatalog();
  }, [recipientId]);

  const getLocalizedName = (item: GiftItem) => {
    switch (locale) {
      case 'am': return item.name_am;
      case 'om': return item.name_om;
      case 'ti': return item.name_ti;
      case 'so': return item.name_so;
      case 'ar': return item.name_ar;
      default: return item.name_en;
    }
  };

  const getLocalizedUrl = (imgName: string) => {
    // Return relative or mock icons based on asset names
    switch (imgName) {
      case 'sini_coffee': return '☕';
      case 'habesha_flower': return '🌹';
      case 'shamma_candle': return '🕯️';
      case 'jebena_pot': return '🏺';
      case 'love_doves': return '🕊️';
      case 'luxury_puppy': return '🐶';
      case 'luxury_kitten': return '🐱';
      case 'boxed_flowers': return '💐';
      case 'cultural_outfit': return '👗';
      case 'silver_bracelet': return '💍';
      case 'date_voucher': return '🎟️';
      case 'luxury_cake': return '🍰';
      case 'movie_ticket': return '🎬';
      case 'dinner_coupon': return '🍽️';
      case 'love_postcard': return '💌';
      case 'chocolate_box': return '🍫';
      case 'coffee_rekebot': return '☕';
      case 'gold_ring': return '💍';
      case 'poetry_book': return '📖';
      default: return '🎁';
    }
  };

  const handleSendGift = async () => {
    if (!userId || !selectedGift) return;
    
    if (coinBalance < selectedGift.coin_price) {
      setErrorMsg(locale === 'am' 
        ? 'በቂ ሳንቲም የሎትም። እባክዎ መጀመሪያ ሳንቲም ይግዙ!' 
        : 'Insufficient coin balance. Please purchase coins first.');
      setActiveTab('buy_coins');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Record Debit Transaction (coin_transactions)
      const { data: tx, error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: -selectedGift.coin_price,
          type: 'gift_send'
        })
        .select()
        .single();

      if (txError) throw txError;

      // 2. Record Gift Event (gifts)
      const { error: giftError } = await supabase
        .from('gifts')
        .insert({
          sender_id: userId,
          receiver_id: recipientId,
          catalog_gift_id: selectedGift.id,
          gift_type: selectedGift.image_url as any, // keep legacy field populated
          amount: selectedGift.coin_price,
          currency: 'COIN',
          message: message,
          status: 'completed'
        });

      if (giftError) throw giftError;

      // 3. Deduct locally
      setCoinBalance(prev => prev - selectedGift.coin_price);
      setSuccessMsg(locale === 'am'
        ? `የተመረጠውን ስጦታ ለ${recipientName} በተሳካ ሁኔታ ልከዋል! 🎉`
        : `Successfully sent the gift to ${recipientName}! 🎉`);
      
      setMessage('');
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCoins = async () => {
    if (!userId) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const price = selectedPack.priceEtb;
      
      if (isMobileNative) {
        // iOS/Android Store-compliant In-App Purchase flow simulation
        setTimeout(async () => {
          const { error: txError } = await supabase
            .from('coin_transactions')
            .insert({
              user_id: userId,
              amount: selectedPack.coins,
              type: 'purchase'
            });

          if (txError) {
            setErrorMsg(txError.message);
            setLoading(false);
            return;
          }

          setCoinBalance(prev => prev + selectedPack.coins);
          alert(locale === 'am' ? 'ሳንቲሞች በተሳካ ሁኔታ ተገዝተዋል!' : 'Coins purchased successfully via native App Store!');
          setActiveTab('gallery');
          setLoading(false);
        }, 1500);
      } else {
        // Web direct checkout integration simulation
        // In real web flow, we call Stripe or Chapa API initialization.
        setTimeout(async () => {
          const { error: txError } = await supabase
            .from('coin_transactions')
            .insert({
              user_id: userId,
              amount: selectedPack.coins,
              type: 'purchase'
            });

          if (txError) {
            setErrorMsg(txError.message);
            setLoading(false);
            return;
          }

          setCoinBalance(prev => prev + selectedPack.coins);
          setSuccessMsg(locale === 'am' ? 'ሳንቲሞች በተሳካ ሁኔታ ተገዝተዋል!' : 'Coins purchased successfully!');
          setActiveTab('gallery');
          setLoading(false);
        }, 1200);
      }

    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-primary/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-muted flex justify-between items-center bg-accent text-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Gift className="text-primary animate-bounce" size={20} />
             </div>
             <div>
                <h3 className="font-black italic uppercase tracking-tight text-sm">
                   {locale === 'am' ? `ለ${recipientName} ስጦታ ይላኩ` : `Send Gift to ${recipientName}`}
                </h3>
                <p className="text-[9px] text-primary font-bold uppercase tracking-widest flex items-center gap-1">
                   <Coins size={12} /> {locale === 'am' ? 'የእርስዎ ቀሪ ሳንቲም፡' : 'Your Balance:'} {coinBalance} {locale === 'am' ? 'ሳንቲሞች' : 'Coins'}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
             <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-muted bg-muted/30">
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-4 font-black uppercase text-[10px] tracking-widest border-b-2 transition-all ${activeTab === 'gallery' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-400'}`}
          >
             🎨 {locale === 'am' ? 'የስጦታዎች ጋለሪ' : 'Gifts Gallery'}
          </button>
          <button 
            onClick={() => setActiveTab('buy_coins')}
            className={`flex-1 py-4 font-black uppercase text-[10px] tracking-widest border-b-2 transition-all ${activeTab === 'buy_coins' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-400'}`}
          >
             🪙 {locale === 'am' ? 'ሳንቲም ግዛ (Buy Coins)' : 'Buy Coins'}
          </button>
        </div>

        {/* Errors & Success Messages */}
        {errorMsg && (
          <div className="m-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
            <AlertCircle size={16} />
            <p>{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="m-4 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-xs font-bold animate-pulse">
            <CheckCircle2 size={16} />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'gallery' ? (
            <>
              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {([
                  { id: 'all', label: locale === 'am' ? 'አጠቃላይ' : 'All' },
                  { id: 'cultural', label: locale === 'am' ? 'ባህል' : 'Cultural' },
                  { id: 'flowers', label: locale === 'am' ? 'አበባ' : 'Flowers' },
                  { id: 'pets', label: locale === 'am' ? 'ቤት እንስሳት' : 'Pets' },
                  { id: 'coupons', label: locale === 'am' ? 'ቫውቸር' : 'Coupons' }
                ] as const).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      selectedCategory === cat.id ? 'bg-primary text-white shadow-md' : 'bg-muted text-gray-500 hover:bg-muted/75'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Gift Grid */}
              <div className="grid grid-cols-2 gap-4">
                 {catalog
                   .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
                   .map((item) => {
                     const isLocked = interactionScore < getRequiredMessages(item.unlock_level || 1);
                     const reqMessages = getRequiredMessages(item.unlock_level || 1);
                     return (
                       <button 
                         key={item.id}
                         disabled={isLocked}
                         onClick={() => setSelectedGift(item)}
                         className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center text-center space-y-3 relative group ${
                           isLocked ? 'opacity-40 bg-muted/20 border-muted cursor-not-allowed' :
                           selectedGift?.id === item.id ? 'border-primary bg-primary/5 shadow-lg scale-102' : 'border-muted hover:border-primary/20 hover:bg-muted/50'
                         }`}
                       >
                         {isLocked ? (
                           <div className="absolute top-3 right-3 p-1 bg-gray-500/10 text-gray-400 rounded-full">
                             <Lock size={12} />
                           </div>
                         ) : selectedGift?.id === item.id ? (
                           <div className="absolute top-3 right-3 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle2 size={14} />
                           </div>
                         ) : null}
                         
                         <span className="text-4xl filter drop-shadow-md group-hover:scale-115 transition-transform duration-500">
                           {getLocalizedUrl(item.image_url)}
                         </span>
                         <div>
                            <p className="text-xs font-black text-accent uppercase">{getLocalizedName(item)}</p>
                            {isLocked ? (
                              <span className="text-[8px] text-red-500 font-bold block mt-1 uppercase tracking-wide">
                                Locked (Need {reqMessages} Msgs)
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1 text-[10px] font-black text-primary uppercase mt-1">
                                <Coins size={12} /> {item.coin_price}
                              </div>
                            )}
                         </div>
                       </button>
                     );
                   })}
              </div>

              {/* Message Input */}
              {selectedGift && (
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                      {locale === 'am' ? 'አጭር መግለጫ መልእክት (አማራጭ)' : 'Attach Message (Optional)'}
                   </label>
                   <textarea
                     rows={3}
                     maxLength={150}
                     value={message}
                     onChange={(e) => setMessage(e.target.value)}
                     placeholder={locale === 'am' ? 'ለምሳሌ፡ «ስለ መልካም ቆይታችን እናመሰግናለን!»' : 'Write your sweet words here...'}
                     className="w-full p-4 bg-muted/50 rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all text-xs font-medium resize-none shadow-inner"
                   />
                   <div className="text-[9px] text-gray-400 text-right font-bold pr-2">
                      {message.length} / 150
                   </div>
                </div>
              )}

              {/* Action Button */}
              <button 
                disabled={loading || !selectedGift}
                onClick={handleSendGift}
                className="w-full btn-primary py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={14} />} 
                {locale === 'am' ? 'ስጦታውን አሁኑኑ ላክ' : 'Send Gift Now'}
              </button>
            </>
          ) : (
            // Buy Coins
            <div className="space-y-6">
               <div className="text-center max-w-sm mx-auto space-y-2">
                  <Coins className="text-primary mx-auto animate-pulse" size={32} />
                  <h4 className="font-black text-accent uppercase italic text-sm">{locale === 'am' ? 'የቤተሰብ ሳንቲሞችን ይግዙ' : 'Top Up Coins Wallet'}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed italic">
                     {locale === 'am'
                       ? 'ሳንቲሞች በቤተሰብ መድረክ ውስጥ ለስጦታዎች መግዣ ብቻ የሚያገለግሉ ሲሆኑ፥ ተመልሰው ወደ እውነተኛ ገንዘብ አይለወጡም።'
                       : 'Coins are spend-only internal tokens used to buy virtual gifts. Coins cannot be cashed out or refunded.'}
                  </p>
               </div>

               {/* Packs list */}
               <div className="grid grid-cols-2 gap-4">
                  {coinPacks.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedPack(pack)}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center text-center space-y-1 relative group ${selectedPack?.id === pack.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-muted hover:border-primary/20'}`}
                    >
                      {pack.discount && (
                        <span className="absolute -top-2.5 px-3 py-1 bg-primary text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-md">
                           {pack.discount}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 font-black text-accent text-lg italic">
                         <Coins size={18} className="text-primary" /> {pack.coins}
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         {locale === 'am' ? `${pack.priceEtb} ብር` : `$${pack.priceUsd}`}
                      </span>
                    </button>
                  ))}
               </div>

               {/* Checkout Compliance instructions */}
               {isMobileNative ? (
                 <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 text-center space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                       {locale === 'am'
                         ? 'ክፍያዎን በአፕል አፕ ስቶር ወይም ጉግል ፕሌይ የውስጥ የክፍያ ሥርዓት በኩል በደህንነት ይፈጽማሉ።'
                         : 'Purchase securely through your Apple App Store or Google Play account.'}
                    </p>
                    
                    <button
                      disabled={loading}
                      onClick={handleBuyCoins}
                      className="w-full btn-primary py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={14} />} 
                      {locale === 'am' ? 'በሱቁ በኩል ይግዙ' : 'Pay Natively'}
                    </button>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {/* Simulated Web checkout for Chapa & Stripe */}
                    <div className="bg-muted p-6 rounded-[2rem] border border-muted text-center space-y-4">
                       <div className="flex items-center justify-center gap-2 text-primary font-bold text-[9px] uppercase tracking-widest">
                          <Info size={12} /> Secure Web Checkout (Stripe & Chapa)
                       </div>
                       
                       <button
                         disabled={loading}
                         onClick={handleBuyCoins}
                         className="w-full btn-primary py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                       >
                         {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={14} />} 
                         {locale === 'am' ? `በ${locale === 'am' ? 'Chapa/Telebirr' : 'Stripe'} ኦንላይን ይክፈሉ` : 'Pay Securely Online'}
                       </button>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
