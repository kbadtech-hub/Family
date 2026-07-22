'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { COIN_PACKAGES } from '@/lib/coins';
import { 
  Gift, 
  Coins, 
  Truck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  Phone,
  MessageSquare,
  User,
  Calendar,
  X
} from 'lucide-react';
import Image from 'next/image';
import LocationGate from '@/components/dashboard/LocationGate';
import SystemAlertModal from '@/components/ui/SystemAlertModal';
import { generateChapaTxRef } from '@/lib/subscription';

interface GiftRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  catalog_gift_id: string;
  gift_type: string;
  amount: number;
  message: string | null;
  delivery_address: string | null;
  delivery_phone: string | null;
  delivery_status: 'none' | 'requested' | 'processing' | 'delivered' | 'failed';
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
  receiver?: {
    full_name: string;
    avatar_url: string | null;
  };
  gift_catalog?: {
    name_en: string;
    name_am: string;
    image_url: string;
  };
}

export default function GiftsView({ locale }: { locale: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'received' | 'sent' | 'topup'>('received');
  const [receivedGifts, setReceivedGifts] = useState<GiftRecord[]>([]);
  const [sentGifts, setSentGifts] = useState<GiftRecord[]>([]);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [isEthiopiaVerified, setIsEthiopiaVerified] = useState(false);

  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type: 'error' | 'success' | 'info' | 'warning'; title?: string }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showAlert = (message: string, type: 'error' | 'success' | 'info' | 'warning' = 'info', title?: string) => {
    setAlertModal({ isOpen: true, message, type, title });
  };
  
  // Delivery Modal State
  const [deliveryGift, setDeliveryGift] = useState<GiftRecord | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState('');

  // Phase 4 Custom Claim States
  const [clothingSize, setClothingSize] = useState('Medium');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Topup State
  const [loadingTopup, setLoadingTopup] = useState(false);
  const [coinPacks, setCoinPacks] = useState<any[]>(COIN_PACKAGES);
  const [selectedPack, setSelectedPack] = useState<any>(COIN_PACKAGES[2]);
  const [isMobileNative, setIsMobileNative] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setIsMobileNative(true);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Fetch profile
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) {
      setProfile(profileData);
    }

    // Fetch coin packages from settings
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('coin_packages')
        .limit(1)
        .single();
      
      if (settings && settings.coin_packages && Array.isArray(settings.coin_packages)) {
        setCoinPacks(settings.coin_packages);
        setSelectedPack(settings.coin_packages[1] || settings.coin_packages[0]);
      } else {
        setSelectedPack(coinPacks[1]);
      }
    } catch (e) {
      setSelectedPack(coinPacks[1]);
    }

    // 1. Fetch wallet balance
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('coin_balance')
      .eq('id', user.id)
      .maybeSingle();
    
    if (wallet) {
      setCoinBalance(Number(wallet.coin_balance));
    }

    // 2. Fetch Received Gifts
    const { data: received } = await supabase
      .from('gifts')
      .select(`
        *,
        sender:sender_id(full_name, avatar_url),
        gift_catalog:catalog_gift_id(name_en, name_am, image_url)
      `)
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    if (received) {
      setReceivedGifts(received as any[]);
    }

    // 3. Fetch Sent Gifts
    const { data: sent } = await supabase
      .from('gifts')
      .select(`
        *,
        receiver:receiver_id(full_name, avatar_url),
        gift_catalog:catalog_gift_id(name_en, name_am, image_url)
      `)
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (sent) {
      setSentGifts(sent as any[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryGift || !deliveryAddress || !deliveryPhone) return;

    setDeliveryLoading(true);
    setDeliveryError('');
    setDeliverySuccess('');

    try {
      const details = {
        clothing_size: clothingSize,
        delivery_date: deliveryDate,
        special_instructions: specialInstructions
      };

      const { error } = await supabase
        .from('gifts')
        .update({
          delivery_address: deliveryAddress,
          delivery_phone: deliveryPhone,
          delivery_status: 'requested',
          delivery_details: details,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryGift.id);

      if (error) throw error;

      // Queue vendor dispatch SMS notification
      await supabase
        .from('sms_queue')
        .insert({
          recipient_phone: '+251911000000', // Mock Vendor dispatch phone
          message_content: `ORDER DISPATCH: Gift "${deliveryGift.gift_catalog?.name_en || 'Item'}" requested for delivery to: ${deliveryAddress}. Phone: ${deliveryPhone}. Size: ${clothingSize || 'N/A'}. Date: ${deliveryDate || 'N/A'}. Details: ${specialInstructions || 'None'}.`
        });

      setDeliverySuccess(locale === 'am' 
        ? 'የአካል አቅርቦት ጥያቄዎ በተሳካ ሁኔታ ቀርቧል! በአስተዳዳሪው ጸድቆ በቅርቡ ይደርሶታል።' 
        : 'Physical delivery requested successfully! Admins will process it shortly.');
      
      // Update local state
      setReceivedGifts(prev => prev.map(g => g.id === deliveryGift.id ? {
        ...g,
        delivery_address: deliveryAddress,
        delivery_phone: deliveryPhone,
        delivery_status: 'requested'
      } : g));

      setTimeout(() => {
        setDeliveryGift(null);
        setDeliveryAddress('');
        setDeliveryPhone('');
        setDeliverySuccess('');
      }, 2000);

    } catch (err: any) {
      setDeliveryError(err.message);
    } finally {
      setDeliveryLoading(false);
    }
  };

  const topupCoins = async () => {
    if (!userId || !selectedPack) return;
    setLoadingTopup(true);

    try {
      // Use the IP-verified result from LocationGate (user must pass it before reaching this button)
      const isEthiopia = isEthiopiaVerified;
      const currency = isEthiopia ? 'ETB' : 'USD';
      const packPrice = currency === 'ETB' ? selectedPack.priceEtb : selectedPack.priceUsd;

      const txRef = generateChapaTxRef(userId, selectedPack.id);
      const response = await fetch('/api/payments/chapa/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: packPrice,
          currency: currency,
          email: profile?.email || '',
          first_name: (profile?.full_name || 'Beteseb User').split(' ')[0] || 'Beteseb',
          last_name: (profile?.full_name || 'Beteseb User').split(' ')[1] || 'User',
          tx_ref: txRef,
          callback_url: window.location.origin + '/api/payments/chapa/webhook',
          return_url: window.location.origin + `/${locale}/dashboard?tab=gifts&tx_ref=${txRef}`
        })
      });

      const data = await response.json();
      if (data.status === 'success' && data.data?.checkout_url) {
        window.location.href = data.data.checkout_url;
        return;
      }

      const errStr = typeof data.message === 'string' ? data.message : (data.message ? JSON.stringify(data.message) : 'Chapa initialization failed');
      throw new Error(errStr);
    } catch (err: any) {
      const rawMsg = err?.message || err;
      const displayMsg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
      showAlert(displayMsg, 'error', locale === 'am' ? 'የኮይን መግዣ ችግር ተፈጥሯል' : 'Coin Purchase Error');
    } finally {
      setLoadingTopup(false);
    }
  };

  const getGiftIcon = (imgUrl: string) => {
    switch (imgUrl) {
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

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <span className="px-3 py-1 bg-yellow-50 text-yellow-600 border border-yellow-100 text-[9px] font-black rounded-full uppercase flex items-center gap-1">
            <Clock size={10} /> {locale === 'am' ? 'በሂደት ላይ' : 'Requested'}
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black rounded-full uppercase flex items-center gap-1 animate-pulse">
            <Truck size={10} /> {locale === 'am' ? 'በማጓጓዝ ላይ' : 'Shipping'}
          </span>
        );
      case 'delivered':
        return (
          <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 text-[9px] font-black rounded-full uppercase flex items-center gap-1">
            <CheckCircle2 size={10} /> {locale === 'am' ? 'ደርሷል' : 'Delivered'}
          </span>
        );
      case 'failed':
        return (
          <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 text-[9px] font-black rounded-full uppercase flex items-center gap-1">
            <AlertCircle size={10} /> {locale === 'am' ? 'ያልተሳካ' : 'Failed'}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
           {locale === 'am' ? 'መረጃዎችን እያዘጋጀን ነው...' : 'Loading Gifting Suite...'}
        </p>
      </div>
    );
  }

  const coinInstructions = {
    am: {
      desc: 'ይህን ሳንቲም (Coins) ለመግዛት፣ እባክዎ በስልክዎ ወይም በኮምፒተርዎ ብሮውዘር ወደ ዌብሳይታችን በመሄድ ክፍያ ይፈጽሙ፦',
      footer: 'ክፍያውን እንደፈጸሙ ሳንቲሞቹ በራስ-ሰር ወደ አካውንትዎ ይገባሉ።'
    },
    om: {
      desc: 'Saantima (Coins) kana bituuf, maaloo bilbila ykn kompiutara keessaniin weebsaayitii keenya (beteseb1.online) daawwachuun kafaltii raawwadhaa:',
      footer: 'Kafaltii raawwattanii yeroo xumurtan saantimichi ofumaan herrega keessanitti dabalama.'
    },
    ti: {
      desc: 'እዚ ሳንቲም (Coins) ንምዕዳግ፡ በጃኹም ብስልኪ ወይ ብኮምፒተርኩም ብሮውዘር ናብ ወብሳይትና (beteseb1.online) ብምኻድ ክፍሊት ይፈጽሙ፡',
      footer: 'ክፍሊት ከምዝፈጸምኩም ሳንቲም ብባዕሉ ናብ አካውንትኩም ክኣቱ እዩ።'
    },
    so: {
      desc: 'Si aad u iibsato shilimaantan (Coins), fadlan ka booqo websaydkayaga (beteseb1.online) taleefankaaga ama kombuyuutarkaaga si aad lacag bixinta u dhamaystirto:',
      footer: 'Markaad lacag bixinta dhamaystirto, shilimaantu si toos ah ayay kuugu shubmi doonaan.'
    },
    ar: {
      desc: 'لشراء هذه العملات (Coins)، يرجى زيارة موقعنا الإلكتروني (beteseb1.online) على متصفح الهاتف أو الكمبيوتر لإتمام عملية الدفع:',
      footer: 'بمجرد إتمام الدفع، ستضاف العملات إلى حسابك تلقائياً.'
    },
    en: {
      desc: 'To purchase these coins, please visit our website (beteseb1.online) on your phone or computer browser to make a secure payment:',
      footer: 'Your coins will be automatically credited to your account once the payment is completed.'
    }
  };

  const currentCoinText = coinInstructions[locale as keyof typeof coinInstructions] || coinInstructions.en;
  // Currency is ALWAYS derived from the IP-based LocationGate result — never from profile.location
  // The coin packs section is gated behind the LocationGate, so prices are never shown prematurely.
  const isEthiopia = isLocationVerified ? isEthiopiaVerified : false;

  return (
    <div className="space-y-10">
      
      {/* Wallet Card */}
      <div className="bg-[#0F172A] text-white rounded-[2.5rem] p-8 md:p-10 border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
         <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
         <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center text-primary shadow-xl">
               <Coins size={32} className="animate-pulse" />
            </div>
            <div>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  {locale === 'am' ? 'የኮይን ሂሳብ ቀሪ' : 'Beteseb Coin Balance'}
               </p>
               <h2 className="text-4xl font-black text-white italic mt-1 tracking-tight">
                  {coinBalance} <span className="text-xs text-primary font-bold uppercase not-italic tracking-widest">{locale === 'am' ? 'ሳንቲሞች' : 'Coins'}</span>
               </h2>
            </div>
         </div>
         <button 
           onClick={() => setActiveSubTab('topup')}
           className="btn-primary py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] relative z-10 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
         >
           🪙 {locale === 'am' ? 'ሳንቲም ግዛ' : 'Top Up Wallet'}
         </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-3xl p-1.5 border border-muted shadow-sm max-w-md">
         <button 
           onClick={() => setActiveSubTab('received')}
           className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeSubTab === 'received' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-accent'}`}
         >
            📥 {locale === 'am' ? 'የደረሱኝ ስጦታዎች' : 'Received'}
         </button>
         <button 
           onClick={() => setActiveSubTab('sent')}
           className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeSubTab === 'sent' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-accent'}`}
         >
            📤 {locale === 'am' ? 'የላክኳቸው' : 'Sent'}
         </button>
         <button 
           onClick={() => setActiveSubTab('topup')}
           className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeSubTab === 'topup' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-accent'}`}
         >
            🪙 {locale === 'am' ? 'የሳንቲም ጥቅሎች' : 'Packs'}
         </button>
      </div>

      {/* Tab Panels */}
      {activeSubTab === 'received' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {receivedGifts.length === 0 ? (
               <div className="col-span-full bg-white p-12 rounded-[2.5rem] border border-muted text-center space-y-4">
                  <Gift className="text-gray-300 mx-auto" size={48} />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                     {locale === 'am' ? 'ምንም የደረሶት ስጦታ የለም።' : 'No received gifts yet.'}
                  </p>
               </div>
            ) : (
               receivedGifts.map((gift) => (
                 <div key={gift.id} className="bg-white rounded-[2.5rem] p-6 border border-muted shadow-lg hover:shadow-xl transition-all flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start gap-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                             {getGiftIcon(gift.gift_catalog?.image_url || gift.gift_type)}
                          </div>
                          <div>
                             <h4 className="text-xs font-black text-accent uppercase">
                                {locale === 'am' ? gift.gift_catalog?.name_am : gift.gift_catalog?.name_en}
                             </h4>
                             <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                                <User size={10} /> {gift.sender?.full_name}
                             </p>
                          </div>
                       </div>
                       
                       <div className="text-right text-[8px] text-gray-400 font-bold uppercase flex items-center gap-1">
                          <Calendar size={10} /> {new Date(gift.created_at).toLocaleDateString()}
                       </div>
                    </div>

                    {gift.message && (
                       <div className="p-4 bg-muted/30 rounded-2xl border border-muted text-[11px] font-medium text-gray-600 flex items-start gap-2 italic">
                          <MessageSquare size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                          <p>« {gift.message} »</p>
                       </div>
                    )}

                    {/* Delivery Status & Action */}
                    <div className="pt-4 border-t border-muted/50 flex justify-between items-center flex-wrap gap-3">
                       {gift.delivery_status !== 'none' ? (
                          <>
                             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Delivery Status:</span>
                             {getDeliveryStatusBadge(gift.delivery_status)}
                          </>
                       ) : (
                          <>
                             <p className="text-[10px] text-gray-400 font-bold max-w-[200px] leading-relaxed">
                                {locale === 'am' 
                                  ? 'ይህንን ስጦታ በአካል ቤተሰብ ዲሊቨሪ በኩል ማስረከብ ይፈልጋሉ?' 
                                  : 'Request real physical delivery of this gift straight to your address?'}
                             </p>
                             <button
                               onClick={() => setDeliveryGift(gift)}
                               className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                             >
                                <Truck size={12} /> {locale === 'am' ? 'አካል አቅርቦት' : 'Request Delivery'}
                             </button>
                          </>
                       )}
                    </div>
                 </div>
               ))
            )}
         </div>
      )}

      {activeSubTab === 'sent' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sentGifts.length === 0 ? (
               <div className="col-span-full bg-white p-12 rounded-[2.5rem] border border-muted text-center space-y-4">
                  <Gift className="text-gray-300 mx-auto" size={48} />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                     {locale === 'am' ? 'ምንም የላኩት ስጦታ የለም።' : 'No sent gifts yet.'}
                  </p>
               </div>
            ) : (
               sentGifts.map((gift) => (
                 <div key={gift.id} className="bg-white rounded-[2.5rem] p-6 border border-muted shadow-lg hover:shadow-xl transition-all flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start gap-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                             {getGiftIcon(gift.gift_catalog?.image_url || gift.gift_type)}
                          </div>
                          <div>
                             <h4 className="text-xs font-black text-accent uppercase">
                                {locale === 'am' ? gift.gift_catalog?.name_am : gift.gift_catalog?.name_en}
                             </h4>
                             <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                                <User size={10} /> To: {gift.receiver?.full_name}
                             </p>
                          </div>
                       </div>
                       
                       <div className="text-right text-[8px] text-gray-400 font-bold uppercase flex items-center gap-1">
                          <Calendar size={10} /> {new Date(gift.created_at).toLocaleDateString()}
                       </div>
                    </div>

                    {gift.message && (
                       <div className="p-4 bg-muted/30 rounded-2xl border border-muted text-[11px] font-medium text-gray-600 flex items-start gap-2 italic">
                          <MessageSquare size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                          <p>« {gift.message} »</p>
                       </div>
                    )}

                    {/* Delivery Status */}
                    {gift.delivery_status !== 'none' && (
                       <div className="pt-4 border-t border-muted/50 flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Delivery Status:</span>
                          {getDeliveryStatusBadge(gift.delivery_status)}
                       </div>
                    )}
                 </div>
               ))
            )}
         </div>
      )}

      {activeSubTab === 'topup' && (
         !isLocationVerified ? (
           <div className="py-6">
             <LocationGate
               locale={locale}
               onVerified={(isEth) => {
                 setIsEthiopiaVerified(isEth);
                 setIsLocationVerified(true);
               }}
             />
           </div>
         ) : (
           <div className="bg-white rounded-[2.5rem] p-8 border border-muted shadow-xl max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-md mx-auto space-y-2">
               <Coins className="text-primary mx-auto animate-bounce animate-duration-1000" size={36} />
               <h3 className="font-black text-accent uppercase italic text-lg tracking-tight">{locale === 'am' ? 'የሳንቲም ጥቅል መምረጫ' : 'Select Coin Package'}</h3>
               <p className="text-xs text-gray-400 leading-relaxed italic font-medium">
                  {locale === 'am'
                    ? 'ሳንቲሞች በቤተሰብ መድረክ ውስጥ ለስጦታዎች መግዣ ብቻ የሚያገለግሉ ሲሆኑ፥ ተመልሰው ወደ እውነተኛ ገንዘብ አይለወጡም።'
                    : 'Coins are spend-only internal tokens used to buy virtual gifts. Coins cannot be cashed out or refunded.'}
               </p>
            </div>

            {/* Packs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {coinPacks.map((pack) => (
                 <button
                   key={pack.id}
                   onClick={() => setSelectedPack(pack)}
                   className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center text-center space-y-2 relative group ${selectedPack?.id === pack.id ? 'border-primary bg-primary/5 shadow-lg scale-102' : 'border-muted hover:border-primary/20'}`}
                 >
                   {pack.discount && (
                     <span className="absolute -top-3 px-3 py-1 bg-primary text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-md">
                        {pack.discount}
                     </span>
                   )}
                   <div className="flex items-center gap-1.5 font-black text-accent text-xl italic">
                      <Coins size={20} className="text-primary" /> {pack.coins}
                   </div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {isEthiopia ? `${pack.priceEtb} ብር` : `$${pack.priceUsd}`}
                   </span>
                 </button>
               ))}
            </div>

            {/* Checkout Options */}
            {isMobileNative ? (
               <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/20 space-y-6 text-center animate-in fade-in zoom-in duration-300">
                 <div className="space-y-2">
                   <h4 className="text-xs font-black text-primary uppercase tracking-widest">
                     {locale === 'am' ? 'የተመረጠው የሳንቲም ጥቅል' : 'Selected Coin Pack'}
                   </h4>
                   <p className="text-2xl font-black text-accent italic uppercase tracking-tighter">
                     {selectedPack ? `${selectedPack.coins} Coins` : ''}
                   </p>
                 </div>

                 <div className="p-6 bg-white rounded-3xl border border-gray-150 shadow-inner flex flex-col items-center justify-center gap-4">
                   <span className="text-xs font-bold text-gray-500 leading-relaxed text-center">
                     {currentCoinText.desc}
                   </span>
                   <div className="w-full p-4 bg-[#F8FAFC] border border-border rounded-2xl select-all font-black text-primary text-sm tracking-wider text-center cursor-pointer active:scale-95 transition-all">
                     beteseb1.online
                   </div>
                   <span className="text-[10px] text-gray-400 font-bold uppercase italic text-center">
                     {currentCoinText.footer}
                   </span>
                 </div>

                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <CheckCircle2 size={14} className="text-primary" />
                    {locale === 'am' ? 'አስተማማኝ የደህንነት ስርዓት' : 'Secure Verification System'}
                  </p>
               </div>
            ) : (
              <div className="bg-muted p-6 rounded-[2rem] border border-muted text-center space-y-4">
                 <div className="flex items-center justify-center gap-2 text-primary font-bold text-[9px] uppercase tracking-widest">
                    <MapPin size={12} /> Secure Web Checkout (Stripe & Chapa)
                 </div>
                 <button
                   disabled={loadingTopup}
                   onClick={topupCoins}
                   className="w-full btn-primary py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                 >
                   {loadingTopup ? <Loader2 className="animate-spin text-white" /> : <ArrowUpRight size={14} />} 
                   {locale === 'am' ? 'በኦንላይን በደህንነት ይክፈሉ' : 'Pay Securely Online'}
                 </button>
              </div>
            )}
         </div>
         )
       )}

      {/* Delivery Request Modal Overlay */}
      {deliveryGift && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-primary/10 flex flex-col animate-in zoom-in-95 duration-300">
             
             {/* Header */}
             <div className="p-6 border-b border-muted flex justify-between items-center bg-accent text-white">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Truck className="text-primary animate-pulse" size={20} />
                   </div>
                   <div>
                      <h3 className="font-black italic uppercase tracking-tight text-sm">
                         {locale === 'am' ? 'የአካል ማድረሻ አድራሻ ማስገቢያ' : 'Request Physical Delivery'}
                      </h3>
                      <p className="text-[9px] text-primary font-bold uppercase tracking-widest">
                         {locale === 'am' ? 'ለአበባ እና ተዛማጅ ስጦታዎች ማቅረቢያ' : 'For Real Gift Items'}
                      </p>
                   </div>
                </div>
                <button onClick={() => setDeliveryGift(null)} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white">
                   <X size={20} />
                </button>
             </div>

             {/* Modal Content */}
             <form onSubmit={handleRequestDelivery} className="p-6 space-y-6">
                
                {deliveryError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                    <AlertCircle size={16} />
                    <p>{deliveryError}</p>
                  </div>
                )}
                {deliverySuccess && (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-xs font-bold animate-pulse">
                    <CheckCircle2 size={16} />
                    <p>{deliverySuccess}</p>
                  </div>
                )}

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                         <MapPin size={12} className="text-primary" /> {locale === 'am' ? 'የማድረሻ ሙሉ አድራሻ (ከተማ፣ ሰፈር)' : 'Complete Shipping Address'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder={locale === 'am' ? 'ለምሳሌ፡ አዲስ አበባ፣ ቦሌ ክፍለ ከተማ፣ ወረዳ 3፣ የቤት ቁጥር 123' : 'e.g. Addis Ababa, Bole Subcity, Woreda 03, House 123'}
                        className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs font-medium focus:outline-none"
                      />
                   </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                          <Phone size={12} className="text-primary" /> {locale === 'am' ? 'የተቀባይ ስልክ ቁጥር' : 'Contact Phone Number'}
                       </label>
                       <input 
                         type="tel" 
                         required
                         value={deliveryPhone}
                         onChange={(e) => setDeliveryPhone(e.target.value)}
                         placeholder="0911223344"
                         className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs font-medium focus:outline-none"
                       />
                    </div>

                    {/* Category-specific Custom Fields (Phase 4) */}
                    {deliveryGift.gift_catalog?.image_url === 'cultural_outfit' && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">
                          {locale === 'am' ? 'የልብስ መጠን (Size)' : 'Select Clothing Size'}
                        </label>
                        <select 
                          value={clothingSize}
                          onChange={(e) => setClothingSize(e.target.value)}
                          className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs font-medium focus:outline-none"
                        >
                          <option value="Small">Small (S)</option>
                          <option value="Medium">Medium (M)</option>
                          <option value="Large">Large (L)</option>
                          <option value="XL">Extra Large (XL)</option>
                        </select>
                      </div>
                    )}

                    {(deliveryGift.gift_catalog?.image_url === 'love_doves' || 
                      deliveryGift.gift_catalog?.image_url === 'luxury_puppy' || 
                      deliveryGift.gift_catalog?.image_url === 'luxury_kitten') && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">
                            {locale === 'am' ? 'የቤት እንስሳው እንዲመጣ የሚፈልጉበት ቀን' : 'Preferred Delivery Date (Pets)'}
                          </label>
                          <input 
                            type="date"
                            required
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs font-medium focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">
                            {locale === 'am' ? 'ልዩ የእንክብካቤ ማሳሰቢያ' : 'Special Delivery / Care Instructions'}
                          </label>
                          <input 
                            type="text"
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder={locale === 'am' ? 'ለምሳሌ፡ የትኛው ክትባት እንደተሰጠው ማረጋገጫ ይምጣ' : 'e.g. Please bring vaccination certificate.'}
                            className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs font-medium focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {deliveryGift.gift_catalog?.image_url === 'date_voucher' && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">
                          {locale === 'am' ? 'ዲጂታል ቫውቸሩ እንዲላክበት የሚመርጡት ዘዴ (ኢሜይል/ስልክ)' : 'Preferred Voucher Delivery Contact'}
                        </label>
                        <input 
                          type="text"
                          required
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                          placeholder="e.g. send to my email: test@gmail.com"
                          className="w-full bg-muted/30 border border-muted rounded-xl p-4 text-xs font-medium focus:outline-none"
                        />
                      </div>
                    )}
                 </div>

                <button 
                  disabled={deliveryLoading || !deliveryAddress || !deliveryPhone}
                  type="submit"
                  className="w-full btn-primary py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  {deliveryLoading ? <Loader2 className="animate-spin text-white" /> : <Truck size={14} />} 
                  {locale === 'am' ? 'ጥያቄውን አሁኑኑ ላክ' : 'Submit Delivery Request'}
                </button>
             </form>
           </div>
         </div>
      )}

      <SystemAlertModal 
        isOpen={alertModal.isOpen} 
        message={alertModal.message} 
        type={alertModal.type} 
        title={alertModal.title} 
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
}

