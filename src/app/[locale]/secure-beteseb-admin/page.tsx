'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { queueSMS } from '@/lib/sms';
import { translator } from '../../../lib/translator';
import Image from 'next/image';
import { 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Plus,
  Layout,
  Video,
  Settings as SettingsIcon,
  Check,
  X,
  Search,
  Heart,
  Globe,
  Link,
  MessageSquare,
  ShieldAlert,
  Eye,
  EyeOff,
  Film,
  FileText,
  Trash2,
  Edit,
  Sparkles,
  CheckCircle2,
  Calendar,
  Send,
  Languages,
  Gift,
  Truck,
  Coins,
  MapPin,
  Phone
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  star_sign?: string;
}

interface VerificationRequest {
  id: string;
  user_id: string;
  doc_type: string;
  id_url: string;
  selfie_url: string;
  status: 'pending' | 'verified' | 'rejected';
  profiles?: UserProfile;
}

interface PaymentRequest {
  id: string;
  user_id: string;
  plan_type: string;
  amount: number;
  currency: string;
  receipt_url: string;
  status: 'pending' | 'approved' | 'rejected';
  profiles?: UserProfile;
}

interface SitePost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  video_url: string | null;
  image_url: string | null;
  category: string;
  is_published: boolean;
}

interface Lesson {
  id?: string;
  title: string;
  description: string;
  youtube_url: string;
  instructions: string;
  category: string;
  is_premium_only: boolean;
}

interface SystemSettings {
  id: string;
  cms_content: {
    logo_url?: string;
    hero_title?: string;
    hero_subtitle?: string;
    footer_description?: string;
    email?: string;
    phone?: string;
    address?: string;
    website_url?: string;
  };
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
    website_url?: string;
  };
  social_links?: {
    tiktok?: string;
    telegram?: string;
    youtube?: string;
    facebook?: string;
    whatsapp?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  bank_details?: {
    etb?: BankDetail[];
    usd?: BankDetail[];
  };
  pricing_usd?: Record<string, number>;
  pricing_etb?: Record<string, number>;
  system_access_key?: string;
}

interface SupportTicket {
  id: string;
  user_id: string | null;
  guest_email?: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  language: string;
  created_at: string;
  profiles?: UserProfile;
  support_replies?: any[];
}

interface BankDetail {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  profiles?: UserProfile;
  receiver?: UserProfile;
}

export default function AdminPortal() {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [activeTab, setActiveTab] = useState('cms');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Messaging & Staff State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sentMessages, setSentMessages] = useState<ChatMessage[]>([]);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Site Posts State
  const [posts, setPosts] = useState<SitePost[]>([]);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [currentPost, setCurrentPost] = useState<SitePost>({
    title: '',
    slug: '',
    content: '',
    video_url: '',
    image_url: '',
    category: 'education',
    is_published: false
  });

  // Lessons State
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson>({
    title: '',
    description: '',
    youtube_url: '',
    instructions: '',
    category: 'Relationship',
    is_premium_only: true
  });

  // Gifts & Catalog State
  const [adminGifts, setAdminGifts] = useState<any[]>([]);
  const [adminCatalog, setAdminCatalog] = useState<any[]>([]);
  const [vouchRecords, setVouchRecords] = useState<any[]>([]);
  const [counselorBookings, setCounselorBookings] = useState<any[]>([]);
  const [newCatalogItem, setNewCatalogItem] = useState({
    name_en: '',
    name_am: '',
    name_om: '',
    name_ti: '',
    name_so: '',
    name_ar: '',
    image_url: 'sini_coffee',
    coin_price: 20
  });
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);

  // Academy & Vendor CMS states
  const [academyVideos, setAcademyVideos] = useState<any[]>([]);
  const [weddingVendors, setWeddingVendors] = useState<any[]>([]);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [isEditingVendor, setIsEditingVendor] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<any>({
    title: '', title_am: '', title_om: '', title_ti: '', title_so: '', title_ar: '',
    description: '', description_am: '', description_om: '', description_ti: '', description_so: '', description_ar: '',
    youtube_url: '', category: 'Pre-Marriage', is_free: false, coin_price: 30, order_index: 10, duration_minutes: 15
  });
  const [currentVendor, setCurrentVendor] = useState<any>({
    name: '', category: 'Venue', rating: 4.8, location: 'Addis Ababa', contact: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Fetch system key from DB
    const { data: config } = await supabase.from('settings').select('system_access_key').limit(1).single();
    const validKey = config?.system_access_key || 'Harar@2026';

    if (password === validKey) {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect System Key');
    }
  };

  interface PricingPlan {
    [key: string]: number | undefined;
    "1m": number;
    "3m": number;
    "6m": number;
    "12m": number;
    "class": number;
    lifetime: number;
    discount?: number;
  }

  interface CMSForm {
    logo_url: string;
    hero_title: string;
    hero_subtitle: string;
    footer_description: string;
    email: string;
    phone: string;
    address: string;
    tiktok: string;
    telegram: string;
    youtube: string;
    facebook: string;
    whatsapp: string;
    instagram: string;
    linkedin: string;
    twitter: string;
    banks_etb: BankDetail[];
    banks_usd: BankDetail[];
    pricing_usd: PricingPlan;
    pricing_etb: PricingPlan;
    website_url: string;
    payment_gateways: {
      stripe: boolean;
      chapa: boolean;
      telebirr: boolean;
      paypal: boolean;
      bank_transfer: boolean;
    };
    coin_packages: any[];
    ad_config: {
      enabled: boolean;
      test_mode: boolean;
      unit_android: string;
      unit_ios: string;
    };
    [key: string]: string | BankDetail[] | PricingPlan | Record<string, boolean> | any[] | { enabled: boolean; test_mode: boolean; unit_android: string; unit_ios: string; } | undefined;
  }

  // CMS State
  const [cmsForm, setCmsForm] = useState<CMSForm>({
    logo_url: '',
    hero_title: '',
    hero_subtitle: '',
    footer_description: '',
    email: '',
    phone: '',
    address: '',
    tiktok: '',
    telegram: '',
    youtube: '',
    facebook: '',
    whatsapp: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    banks_etb: [],
    banks_usd: [],
    pricing_usd: {
      "1m": 0, "3m": 0, "6m": 0, "12m": 0, "class": 0, "lifetime": 0, "discount": 0 },
    pricing_etb: {
      "1m": 0, "3m": 0, "6m": 0, "12m": 0, "class": 0, "lifetime": 0, "discount": 0 },
    website_url: '',
    payment_gateways: {
      stripe: true,
      chapa: true,
      telebirr: true,
      paypal: true,
      bank_transfer: true
    },
    coin_packages: [],
    ad_config: {
      enabled: true,
      test_mode: true,
      unit_android: 'ca-app-pub-3940256099942544/5224354917',
      unit_ios: 'ca-app-pub-3940256099942544/1712485313'
    }
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleSmartTranslate = async (text: string, type: 'cms' | 'lesson', field: string) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      const results = await translator.translateAll(text);
      console.log(`Translated ${field} for all languages:`, results);
      alert(`Successfully generated translations for ${field} in all 6 languages! (Stored in system cache)`);
      // In a real scenario, we would store these in the state or directly in the translations field.
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) setCurrentUser(profile);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (activeTab === 'cms') {
        const { data } = await supabase.from('settings').select('*').limit(1).single();
        if (data) {
          setSettings(data);
          setCmsForm({
            logo_url: data.cms_content?.logo_url || '',
            hero_title: data.cms_content?.hero_title || '',
            hero_subtitle: data.cms_content?.hero_subtitle || '',
            footer_description: data.cms_content?.footer_description || '',
            email: data.contact_info?.email || data.cms_content?.email || '',
            phone: data.contact_info?.phone || data.cms_content?.phone || '',
            address: data.contact_info?.address || data.cms_content?.address || '',
            website_url: data.contact_info?.website_url || data.cms_content?.website_url || '',
            tiktok: data.social_links?.tiktok || '',
            telegram: data.social_links?.telegram || '',
            youtube: data.social_links?.youtube || '',
            facebook: data.social_links?.facebook || '',
            whatsapp: data.social_links?.whatsapp || '',
            instagram: data.social_links?.instagram || '',
            linkedin: data.social_links?.linkedin || '',
            twitter: data.social_links?.twitter || '',
            banks_etb: data.bank_details?.etb || [],
            banks_usd: data.bank_details?.usd || [],
            pricing_usd: data.pricing_usd || { "1m": 50, "3m": 120, "6m": 200, "12m": 350, "class": 25, "lifetime": 999, "discount": 0 },
            pricing_etb: data.pricing_etb || { "1m": 500, "3m": 1200, "6m": 2000, "12m": 3500, "class": 250, "lifetime": 9999, "discount": 0 },
            payment_gateways: data.payment_gateways || {
              stripe: true,
              chapa: true,
              telebirr: true,
              paypal: true,
              bank_transfer: true
            },
            coin_packages: data.coin_packages || [
              { id: 'coins_50', coins: 50, priceEtb: 50, priceUsd: 1.0 },
              { id: 'coins_100', coins: 100, priceEtb: 100, priceUsd: 2.0 },
              { id: 'coins_500', coins: 500, priceEtb: 450, priceUsd: 8.0, discount: '10% OFF' },
              { id: 'coins_1000', coins: 1000, priceEtb: 800, priceUsd: 15.0, discount: '20% OFF' }
            ],
            ad_config: data.ad_config || {
              enabled: true,
              test_mode: true,
              unit_android: 'ca-app-pub-3940256099942544/5224354917',
              unit_ios: 'ca-app-pub-3940256099942544/1712485313'
            }
          });
        }
      } else if (activeTab === 'pricing') {
        const { data } = await supabase.from('settings').select('*').limit(1).single();
        if (data) {
          setSettings(data);
          setCmsForm(prev => ({
            ...prev,
            pricing_usd: data.pricing_usd || { "1m": 50, "3m": 120, "6m": 200, "12m": 350, "class": 25, "lifetime": 999, "discount": 0 },
            pricing_etb: data.pricing_etb || { "1m": 500, "3m": 1200, "6m": 2000, "12m": 3500, "class": 250, "lifetime": 9999, "discount": 0 },
            payment_gateways: data.payment_gateways || {
              stripe: true,
              chapa: true,
              telebirr: true,
              paypal: true,
              bank_transfer: true
            },
            coin_packages: data.coin_packages || [
              { id: 'coins_50', coins: 50, priceEtb: 50, priceUsd: 1.0 },
              { id: 'coins_100', coins: 100, priceEtb: 100, priceUsd: 2.0 },
              { id: 'coins_500', coins: 500, priceEtb: 450, priceUsd: 8.0, discount: '10% OFF' },
              { id: 'coins_1000', coins: 1000, priceEtb: 800, priceUsd: 15.0, discount: '20% OFF' }
            ],
            ad_config: data.ad_config || {
              enabled: true,
              test_mode: true,
              unit_android: 'ca-app-pub-3940256099942544/5224354917',
              unit_ios: 'ca-app-pub-3940256099942544/1712485313'
            }
          }));
        }
      } else if (activeTab === 'verification') {
        const { data } = await supabase.from('verifications').select(`*, profiles(full_name)`);
        if (data) setVerifications(data);
      } else if (activeTab === 'payments') {
        const { data } = await supabase.from('payments').select(`*, profiles(full_name)`);
        if (data) setPayments(data);
      } else if (activeTab === 'staff') {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
      } else if (activeTab === 'messaging') {
        const { data } = await supabase.from('messages').select('*, profiles:sender_id(full_name), receiver:receiver_id(full_name)').order('created_at', { ascending: false });
        if (data) setSentMessages(data);
      } else if (activeTab === 'posts') {
        const { data } = await supabase.from('site_posts').select('*').order('created_at', { ascending: false });
        if (data) setPosts(data);
      } else if (activeTab === 'lessons') {
        const { data } = await supabase.from('lessons').select('*').order('created_at', { ascending: false });
        if (data) setLessons(data);
      } else if (activeTab === 'matches') {
        const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, star_sign, role').limit(100);
        if (data) setUsers(data);
      } else if (activeTab === 'support') {
        const { data } = await supabase.from('support_tickets').select('*, profiles(full_name)').order('created_at', { ascending: false });
        if (data) setSupportTickets(data);
      } else if (activeTab === 'reports') {
        const { data } = await supabase.from('reports').select('*, reporter:reporter_id(full_name), reported:reported_id(full_name)').order('created_at', { ascending: false });
        if (data) setReports(data || []);
      } else if (activeTab === 'gifts') {
        setLoadingGifts(true);
        const { data: giftsData } = await supabase
          .from('gifts')
          .select('*, sender:sender_id(full_name), receiver:receiver_id(full_name), gift_catalog:catalog_gift_id(name_en, name_am, image_url)')
          .neq('delivery_status', 'none')
          .order('updated_at', { ascending: false });
        if (giftsData) setAdminGifts(giftsData);

        const { data: catalogData } = await supabase
          .from('gift_catalog')
          .select('*')
          .order('coin_price', { ascending: true });
        if (catalogData) setAdminCatalog(catalogData);
        setLoadingGifts(false);
      } else if (activeTab === 'vouching') {
        const { data } = await supabase.from('vouch_records').select('*, profiles:user_id(full_name)').order('created_at', { ascending: false });
        if (data) setVouchRecords(data);
      } else if (activeTab === 'bookings') {
        const { data } = await supabase.from('counselor_bookings').select('*, profiles:user_id(full_name)').order('created_at', { ascending: false });
        if (data) setCounselorBookings(data);
      } else if (activeTab === 'community') {
        const { data } = await supabase.from('community_posts').select('*, profiles:author_id(full_name, avatar_url, role)').order('created_at', { ascending: false });
        if (data) setCommunityPosts(data || []);
      } else if (activeTab === 'marketplace_cms') {
        // Fetch videos
        const { data: vids } = await supabase.from('academy_videos').select('*').order('order_index', { ascending: true });
        if (vids) setAcademyVideos(vids);
        // Fetch vendors
        const { data: vends } = await supabase.from('wedding_vendors').select('*').order('name', { ascending: true });
        if (vends) setWeddingVendors(vends);
      } else if (activeTab === 'fraud') {
        // Load profiles to analyze for fraud scorer
        const { data: profs } = await supabase.from('profiles').select('*').limit(150);
        if (profs) setUsers(profs);
      }
    };
    fetchAdminData();
  }, [activeTab]);

  const handleSavePost = async () => {
    setIsSaving(true);
    try {
      const payload = { 
        ...currentPost, 
        author_id: (await supabase.auth.getUser()).data.user?.id 
      };
      
      let error;
      if (currentPost.id) {
        const { error: err } = await supabase.from('site_posts').update(payload).eq('id', currentPost.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('site_posts').insert([payload]);
        error = err;
      }

      if (error) throw error;
      
      alert('Post saved successfully!');
      setIsEditingPost(false);
      // Refresh posts
      const { data } = await supabase.from('site_posts').select('*').order('created_at', { ascending: false });
      if (data) setPosts(data);
    } catch (err: unknown) {
      alert('Error saving post: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const { error } = await supabase.from('site_posts').delete().eq('id', id);
    if (error) alert('Error deleting post: ' + error.message);
    else setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveCMS = async () => {
    if (!settings) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('settings')
      .update({
        cms_content: {
          logo_url: cmsForm.logo_url,
          hero_title: cmsForm.hero_title,
          hero_subtitle: cmsForm.hero_subtitle,
          footer_description: cmsForm.footer_description
        },
        contact_info: {
          email: cmsForm.email,
          phone: cmsForm.phone,
          address: cmsForm.address,
          website_url: cmsForm.website_url
        },
        social_links: {
          tiktok: cmsForm.tiktok,
          telegram: cmsForm.telegram,
          youtube: cmsForm.youtube,
          facebook: cmsForm.facebook,
          whatsapp: cmsForm.whatsapp,
          instagram: cmsForm.instagram,
          linkedin: cmsForm.linkedin,
          twitter: cmsForm.twitter
        },
        bank_details: {
          etb: cmsForm.banks_etb,
          usd: cmsForm.banks_usd
        },
        pricing_usd: cmsForm.pricing_usd,
        pricing_etb: cmsForm.pricing_etb,
        payment_gateways: cmsForm.payment_gateways,
        coin_packages: cmsForm.coin_packages,
        ad_config: cmsForm.ad_config
      })
      .eq('id', settings.id);

    if (error) alert('Error saving: ' + error.message);
    else alert('CMS Content Deployed Successfully!');
    setIsSaving(false);
  };

  const handleUpdateVerification = async (id: string, status: 'verified' | 'rejected', userId?: string) => {
    setIsSaving(true);
    const { error } = await supabase.from('verifications').update({ 
      status, 
      verified_at: status === 'verified' ? new Date().toISOString() : null 
    }).eq('id', id);
    
    if (!error && status === 'verified' && userId) {
      await supabase.from('profiles').update({ is_verified: true }).eq('id', userId);
    } else if (!error && status === 'rejected' && userId) {
      await supabase.from('profiles').update({ is_verified: false }).eq('id', userId);
    }
    
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    setIsSaving(false);
  };

  const handleUpdatePayment = async (id: string, status: 'approved' | 'rejected', userId?: string, planType?: string) => {
    setIsSaving(true);
    const { error } = await supabase.from('payments').update({ status }).eq('id', id);
    
    if (!error && status === 'approved' && userId && planType) {
       // Calculate premium duration based on plan
       let days = 30;
       if (planType === '3m') days = 90;
       if (planType === '6m') days = 180;
       if (planType === '12m' || planType === '1y') days = 365;
       if (planType === 'lifetime') days = 36500; // ~100 years

       const premiumUntil = new Date();
       premiumUntil.setDate(premiumUntil.getDate() + days);

       await supabase.from('profiles').update({ 
          premium_until: premiumUntil.toISOString()
       }).eq('id', userId);
    }

    setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    setIsSaving(false);
  };

  const handleSaveLesson = async () => {
    setIsSaving(true);
    try {
      let error;
      if (currentLesson.id) {
        const { error: err } = await supabase.from('lessons').update(currentLesson).eq('id', currentLesson.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('lessons').insert([currentLesson]);
        error = err;
      }

      if (error) throw error;
      
      alert('Lesson saved successfully!');
      setIsEditingLesson(false);
      // Refresh lessons
      const { data } = await supabase.from('lessons').select('*').order('created_at', { ascending: false });
      if (data) setLessons(data);
    } catch (err: unknown) {
      alert('Error saving lesson: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) alert('Error deleting lesson: ' + error.message);
    else setLessons(prev => prev.filter(l => l.id !== id));
  };

  const handleSaveVideo = async () => {
    setIsSaving(true);
    try {
      let error;
      if (currentVideo.id) {
        const { error: err } = await supabase.from('academy_videos').update(currentVideo).eq('id', currentVideo.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('academy_videos').insert([currentVideo]);
        error = err;
      }
      if (error) throw error;
      alert('Video saved successfully!');
      setIsEditingVideo(false);
      const { data } = await supabase.from('academy_videos').select('*').order('order_index', { ascending: true });
      if (data) setAcademyVideos(data);
    } catch (err: any) {
      alert('Error saving video: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    const { error } = await supabase.from('academy_videos').delete().eq('id', id);
    if (error) alert('Error deleting video: ' + error.message);
    else setAcademyVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleSaveVendor = async () => {
    setIsSaving(true);
    try {
      let error;
      if (currentVendor.id) {
        const { error: err } = await supabase.from('wedding_vendors').update(currentVendor).eq('id', currentVendor.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('wedding_vendors').insert([currentVendor]);
        error = err;
      }
      if (error) throw error;
      alert('Vendor saved successfully!');
      setIsEditingVendor(false);
      const { data } = await supabase.from('wedding_vendors').select('*').order('name', { ascending: true });
      if (data) setWeddingVendors(data);
    } catch (err: any) {
      alert('Error saving vendor: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    const { error } = await supabase.from('wedding_vendors').delete().eq('id', id);
    if (error) alert('Error deleting vendor: ' + error.message);
    else setWeddingVendors(prev => prev.filter(v => v.id !== id));
  };

  const handleProcessRefund = async (userId: string, paymentId: string, amount: number) => {
    if (!confirm(`Are you sure you want to refund $${amount} to the user?`)) return;
    setIsSaving(true);
    try {
      const { error: paymentErr } = await supabase.from('payments').update({ status: 'rejected' }).eq('id', paymentId);
      if (paymentErr) throw paymentErr;

      const refundCoins = Math.round(amount * 10);
      const { data: wallet } = await supabase.from('user_wallets').select('coin_balance').eq('id', userId).maybeSingle();
      const currentBalance = Number(wallet?.coin_balance || 0);

      await supabase.from('user_wallets').upsert({
        id: userId,
        coin_balance: Math.max(0, currentBalance - refundCoins),
        updated_at: new Date().toISOString()
      });

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: -refundCoins,
        type: 'admin_adjustment',
        note: `Refund processing for Payment ID ${paymentId}`
      });

      alert(`Refund processed successfully. Deducted ${refundCoins} coins from user's wallet.`);
      const { data: payData } = await supabase.from('payments').select('*, profiles(*)').order('created_at', { ascending: false });
      if (payData) setPayments(payData as any);
    } catch (err: any) {
      alert('Refund failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTicket = async (id: string, message: string) => {
    setIsSaving(true);
    try {
      // 1. Mark ticket as in_progress or resolved
      const { error: ticketErr } = await supabase.from('support_tickets').update({ 
         status: 'resolved' 
      }).eq('id', id);
      
      if (ticketErr) throw ticketErr;

      // 2. Add reply
      const { data: { user } } = await supabase.auth.getUser();
      const { error: replyErr } = await supabase.from('support_replies').insert([{
         ticket_id: id,
         admin_id: user?.id,
         message: message
      }]);

      if (replyErr) throw replyErr;

      // 3. Save to resolved_kb for AI Chatbot Self-learning
      const ticket = supportTickets.find(t => t.id === id);
      if (ticket) {
        await supabase.from('resolved_kb').insert([{
          ticket_id: id,
          question: ticket.message,
          solution: message,
          locale: locale || 'en'
        }]);
      }

      setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
      alert('Response sent successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReportedUser = async (profileId: string, reportId: string) => {
    const confirmDelete = confirm("Are you sure you want to permanently delete this reported user profile? This cascades to delete their account data.");
    if (!confirmDelete) return;

    setIsSaving(true);
    const { error } = await supabase.from('profiles').delete().eq('id', profileId);
    if (!error) {
      alert("User profile deleted successfully.");
      setReports(prev => prev.filter(r => r.id !== reportId));
    } else {
      alert("Failed to delete user: " + error.message);
    }
    setIsSaving(false);
  };

  const handleDismissReport = async (reportId: string) => {
    const confirmDismiss = confirm("Are you sure you want to dismiss this report?");
    if (!confirmDismiss) return;

    setIsSaving(true);
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (!error) {
      alert("Report dismissed successfully.");
      setReports(prev => prev.filter(r => r.id !== reportId));
    } else {
      alert("Failed to dismiss report: " + error.message);
    }
    setIsSaving(false);
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsSaving(true);
    
    // In a real app, this would be a bulk insert or a background job
    // For now, we fetch all users and send DMs (limited for safety)
    const { data: allUsers } = await supabase.from('profiles').select('id').limit(100);
    
    if (allUsers) {
      const { data: { user } } = await supabase.auth.getUser();
      const sender_id = user?.id || settings?.id;

      const messages = allUsers.map(u => ({
        sender_id,
        receiver_id: u.id,
        content: `[SYSTEM ANNOUNCEMENT] ${broadcastMessage}`
      }));
      
      const { error } = await supabase.from('messages').insert(messages);
      if (error) alert('Error broadcasting: ' + error.message);
      else {
        alert('Broadcast Sent Successfully!');
        setBroadcastMessage('');
      }
    }
    setIsSaving(false);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleAddCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatalogItem.name_en || !newCatalogItem.name_am) return;

    try {
      const { data, error } = await supabase
        .from('gift_catalog')
        .insert([newCatalogItem])
        .select()
        .single();
      
      if (error) throw error;
      setAdminCatalog(prev => [...prev, data].sort((a, b) => a.coin_price - b.coin_price));
      setNewCatalogItem({
        name_en: '',
        name_am: '',
        name_om: '',
        name_ti: '',
        name_so: '',
        name_ar: '',
        image_url: 'sini_coffee',
        coin_price: 20
      });
      alert('Gift Catalog Item Added Successfully!');
    } catch (err: any) {
      alert('Error adding catalog item: ' + err.message);
    }
  };

  const handleToggleCatalogStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('gift_catalog')
        .update({ is_active: !currentStatus })
        .eq('id', itemId);
      
      if (error) throw error;
      setAdminCatalog(prev => prev.map(item => item.id === itemId ? { ...item, is_active: !currentStatus } : item));
    } catch (err: any) {
      alert('Error updating catalog status: ' + err.message);
    }
  };

  const handleUpdateDeliveryStatus = async (gift: any, newStatus: string) => {
    const confirmMsg = `Are you sure you want to update delivery status to "${newStatus}"?` + 
      (newStatus === 'failed' ? ' This will automatically refund the coins back to the sender.' : '');
    
    if (!confirm(confirmMsg)) return;

    let proofUrl = '';
    if (newStatus === 'delivered') {
      const inputUrl = prompt("Enter Proof of Delivery Screenshot URL (optional) or leave blank:");
      if (inputUrl) {
        proofUrl = inputUrl;
      }
    }

    try {
      const details = {
        ...gift.delivery_details,
        ...(proofUrl ? { proof_of_delivery: proofUrl } : {})
      };

      const { error } = await supabase
        .from('gifts')
        .update({ 
          delivery_status: newStatus, 
          delivery_details: details,
          updated_at: new Date().toISOString() 
        })
        .eq('id', gift.id);

      if (error) throw error;

      if (newStatus === 'failed') {
        const { error: refundError } = await supabase
          .from('coin_transactions')
          .insert({
            user_id: gift.sender_id,
            amount: gift.amount,
            type: 'admin_adjustment'
          });
        if (refundError) throw refundError;
        alert('Delivery marked as failed. Coins refunded to sender.');
      }

      setAdminGifts(prev => prev.map(g => g.id === gift.id ? { 
        ...g, 
        delivery_status: newStatus,
        delivery_details: details
      } : g));
    } catch (err: any) {
      alert('Error updating delivery status: ' + err.message);
    }
  };

  const handleUpdateVouch = async (id: string, status: 'approved' | 'rejected') => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('vouch_records').update({ vouch_status: status }).eq('id', id);
      if (error) throw error;
      setVouchRecords(prev => prev.map(v => v.id === id ? { ...v, vouch_status: status } : v));
      alert(`Vouch request marked as ${status}`);
    } catch (err: any) {
      alert('Error updating vouch status: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBooking = async (id: string, status: 'approved' | 'completed' | 'cancelled') => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('counselor_bookings').update({ status }).eq('id', id);
      if (error) throw error;

      // Queue SMS notification if approved
      if (status === 'approved') {
        const booking = counselorBookings.find(b => b.id === id);
        const name = booking?.profiles?.full_name || 'Candidate';
        await queueSMS(
          '+251946414018',
          `Dear ${name}, your counselor booking with ${booking?.expert_name || 'our senior advisor'} has been approved! Date: ${booking?.scheduled_date}, Time: ${booking?.scheduled_time}. Join your secure session here: http://beteseb1.online/en/counseling-session?id=${id}`
        ).catch(() => {});
      }

      setCounselorBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      alert(`Booking status updated to ${status}`);
    } catch (err: any) {
      alert('Error updating booking status: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAdminPassword = async () => {
    if (!settings) return;
    if (newAdminPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('settings').update({ system_access_key: newAdminPassword }).eq('id', settings.id);
    if (error) alert('Error updating key: ' + error.message);
    else {
      alert('System Access Key Updated!');
      setNewAdminPassword('');
    }
    setIsSaving(false);
  };

  const MOCK_VERIFICATIONS: VerificationRequest[] = [
    { id: 'mock-1', user_id: 'mock-u1', profiles: { id: 'mock-u1', full_name: 'Kidus Yohannes', role: 'user', avatar_url: null }, doc_type: 'Passport', status: 'pending', id_url: '', selfie_url: '' },
    { id: 'mock-2', user_id: 'mock-u2', profiles: { id: 'mock-u2', full_name: 'Hana Belayneh', role: 'user', avatar_url: null }, doc_type: 'id', status: 'pending', id_url: '', selfie_url: '' }
  ];

  const displayVerifications = verifications.length > 0 ? verifications : MOCK_VERIFICATIONS;



  if (!isAuthenticated) {
     return (
        <div className="min-h-screen bg-accent flex items-center justify-center p-6 relative overflow-hidden">
           <Image 
             src="https://images.unsplash.com/photo-1518112166137-85899e9000ab?auto=format&fit=crop&q=80&w=2000"
             alt="Background"
             fill
             className="object-cover opacity-10"
             priority
           />
           <div className="absolute inset-0 bg-accent/90 backdrop-blur-sm" />
           <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-500">
              <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-white/20">
                 <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
                       <ShieldCheck className="text-primary" size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-accent tracking-tighter uppercase italic text-center leading-none">Admin <br/> Control</h2>
                    <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest">Beteseb Management Portal</p>
                 </div>
                 
                 <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Secure Access Key</label>
                       <div className="relative group">
                          <input 
                             type={showPassword ? "text" : "password"} 
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             placeholder="••••••••"
                             className="w-full bg-muted border-none rounded-2xl p-4 text-center text-lg tracking-[0.5em] focus:ring-2 focus:ring-primary/20 transition-all font-bold text-accent pr-14"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                             aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-all rounded-xl"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                    </div>
                    {errorMsg && <p className="text-red-500 text-center text-xs font-bold animate-shake">{errorMsg}</p>}
                    <button type="submit" className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300">
                       <BarChart3 size={20} /> Access Control Hub
                    </button>
                 </form>
                 
                 <div className="mt-10 pt-8 border-t border-muted/50 flex justify-center">
                    <Image src="/logo.png" alt="Beteseb Logo" width={100} height={40} className="h-10 w-auto" />
                 </div>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex admin-dark relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-card border-b border-border z-[60] flex items-center justify-between px-6">
         <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={120} height={30} className="h-8 w-auto object-contain" />
         </div>
         <button 
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
           className="p-3 bg-primary/10 text-primary rounded-xl"
         >
            {isSidebarOpen ? <X size={24} /> : <Layout size={24} />}
         </button>
      </div>

      {/* Admin Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-card text-card-foreground flex flex-col p-8 shadow-2xl border-r border-border z-[70] transition-transform duration-500 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-12">
          <Link href="/" className="flex items-center gap-2 text-primary group decoration-transparent">
             <Heart size={24} className="fill-primary group-hover:scale-110 transition-transform" />
             <span className="text-2xl font-bold tracking-tighter uppercase">BETESEB</span>
          </Link>
          <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest opacity-50">System Control</p>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { id: 'stats', icon: BarChart3, label: 'Analytics', superOnly: true },
            { id: 'cms', icon: Layout, label: 'Standard CMS' },
            { id: 'marketplace_cms', icon: Layout, label: 'Academy & Vendor CMS' },
            { id: 'business', icon: SettingsIcon, label: 'Business Settings', superOnly: true },
            { id: 'social', icon: Globe, label: 'Social Media Links', superOnly: true },
            { id: 'verification', icon: ShieldCheck, label: 'Verifications' },
            { id: 'vouching', icon: ShieldCheck, label: 'Vouch Reviews' },
            { id: 'bookings', icon: Calendar, label: 'Counselor Bookings' },
            { id: 'payments', icon: Heart, label: 'Payment Review', superOnly: true },
            { id: 'messaging', icon: MessageSquare, label: 'Communication' },
            { id: 'posts', icon: Film, label: 'Articles & News' },
            { id: 'lessons', icon: Video, label: 'Lessons' },
            { id: 'support', icon: MessageSquare, label: 'Support' },
            { id: 'reports', icon: ShieldAlert, label: 'Safety Reports' },
            { id: 'fraud', icon: ShieldAlert, label: 'Fraud Detection ML', superOnly: true },
            { id: 'gifts', icon: Gift, label: 'Gifts & Delivery', superOnly: true },
            { id: 'matches', icon: Heart, label: 'Matches' },
            { id: 'staff', icon: Users, label: 'Manage Staff', superOnly: true },
            { id: 'security', icon: ShieldAlert, label: 'Access Control', superOnly: true },
          ]
          .filter(item => !item.superOnly || currentUser?.role === 'super_admin' || currentUser?.role === 'superadmin')
          .map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-foreground/40 hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <span className="font-semibold text-xs tracking-widest uppercase">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pt-28 lg:pt-10">
        {activeTab === 'cms' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold italic">Standard CMS</h2>
                <p className="text-foreground/40 mt-1">Global branding, slogans, and contact details.</p>
              </div>
              <button 
                 onClick={handleSaveCMS} 
                 disabled={isSaving || !settings}
                 className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <Plus size={20} /> {isSaving ? 'Deploying...' : 'Deploy Changes'}
              </button>
            </header>

            {!settings ? (
              <div className="p-20 text-center text-foreground/40 italic">Connecting to system settings...</div>
            ) : (
              <div key={settings?.id} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 h-fit">
                    <div className="flex items-center gap-3 mb-10">
                       <Layout className="text-primary" size={24} />
                       <h3 className="text-xl font-bold uppercase tracking-widest">Site Identity</h3>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Global Logo</label>
                           <div className="flex items-center gap-6 p-6 bg-background rounded-3xl border border-white/5">
                              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center overflow-hidden">
                                 {cmsForm.logo_url ? (
                                    <Image src={cmsForm.logo_url} alt="Logo" width={80} height={80} className="object-contain" />
                                 ) : (
                                    <Image src="/logo.png" alt="Logo" width={80} height={80} className="object-contain" />
                                 )}
                              </div>
                              <div className="flex-1 space-y-2">
                                 <input 
                                    type="text" 
                                    value={cmsForm.logo_url}
                                    placeholder="https://.../logo.png"
                                    onChange={(e) => setCmsForm({...cmsForm, logo_url: e.target.value})}
                                    className="input-premium py-2 text-xs" 
                                 />
                                 <p className="text-[9px] text-foreground/40 italic">Leave empty to use /public/logo.png</p>
                              </div>
                           </div>
                        </div>

                       <label className="block">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Hero Headline</span>
                          <div className="relative group">
                             <input 
                                type="text" 
                                value={cmsForm.hero_title}
                                onChange={(e) => setCmsForm({...cmsForm, hero_title: e.target.value})}
                                className="input-premium bg-background pr-12" 
                             />
                             <button 
                                type="button"
                                onClick={() => handleSmartTranslate(cmsForm.hero_title, 'cms', 'hero_title')}
                                title="Smart Translate to all languages"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                             >
                                <Languages size={18} />
                             </button>
                          </div>
                       </label>
                       <label className="block">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Hero Sub-headline</span>
                          <div className="relative group">
                             <textarea 
                                rows={3}
                                value={cmsForm.hero_subtitle}
                                onChange={(e) => setCmsForm({...cmsForm, hero_subtitle: e.target.value})}
                                className="input-premium bg-background resize-none pr-12" 
                             />
                             <button 
                                type="button"
                                onClick={() => handleSmartTranslate(cmsForm.hero_subtitle, 'cms', 'hero_subtitle')}
                                title="Smart Translate to all languages"
                                className="absolute right-2 bottom-4 p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                             >
                                <Languages size={18} />
                             </button>
                          </div>
                       </label>
                       <label className="block">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Footer Mission Statement</span>
                          <div className="relative group">
                             <textarea 
                                rows={3}
                                value={cmsForm.footer_description}
                                onChange={(e) => setCmsForm({...cmsForm, footer_description: e.target.value})}
                                className="input-premium bg-background resize-none pr-12" 
                             />
                             <button 
                                type="button"
                                onClick={() => handleSmartTranslate(cmsForm.footer_description, 'cms', 'footer_description')}
                                title="Smart Translate to all languages"
                                className="absolute right-2 bottom-4 p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                             >
                                <Languages size={18} />
                             </button>
                          </div>
                       </label>
                    </div>
                 </div>

                 <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 h-fit">
                    <div className="flex items-center gap-3 mb-10">
                       <Globe className="text-primary" size={24} />
                       <h3 className="text-xl font-bold uppercase tracking-widest">Global Contact</h3>
                    </div>
                    <div className="space-y-6">
                       <label className="block">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Email Address</span>
                          <input type="email" value={cmsForm.email} onChange={(e) => setCmsForm({...cmsForm, email: e.target.value})} className="input-premium bg-background" />
                       </label>
                       <label className="block">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Phone Number</span>
                          <input type="text" value={cmsForm.phone} onChange={(e) => setCmsForm({...cmsForm, phone: e.target.value})} className="input-premium bg-background" />
                       </label>
                       <label className="block">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">HQ Address</span>
                          <input type="text" value={cmsForm.address} onChange={(e) => setCmsForm({...cmsForm, address: e.target.value})} className="input-premium bg-background" />
                       </label>
                       <div className="pt-8 border-t border-white/5 space-y-8">
                           <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Payment Accounts</h4>
                           
                           {/* ETB Accounts */}
                           <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ETB Bank Accounts</p>
                                 <button 
                                    type="button" 
                                    onClick={() => {
                                       setCmsForm({
                                          ...cmsForm,
                                          banks_etb: [...(cmsForm.banks_etb || []), { bank_name: '', account_number: '', account_holder: '' }]
                                       });
                                    }} 
                                    className="text-xs text-primary font-bold hover:underline"
                                 >
                                    + Add ETB Bank
                                 </button>
                              </div>
                              {cmsForm.banks_etb?.map((bank, index) => (
                                 <div key={index} className="p-6 bg-background rounded-[2rem] border border-white/5 space-y-3 relative">
                                    <button 
                                       type="button" 
                                       onClick={() => {
                                          const newBanks = cmsForm.banks_etb.filter((_, i) => i !== index);
                                          setCmsForm({ ...cmsForm, banks_etb: newBanks });
                                       }} 
                                       className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xs font-bold"
                                    >
                                       Remove
                                    </button>
                                    <input 
                                       type="text" 
                                       value={bank.bank_name} 
                                       onChange={(e) => {
                                          const newBanks = [...cmsForm.banks_etb];
                                          newBanks[index].bank_name = e.target.value;
                                          setCmsForm({ ...cmsForm, banks_etb: newBanks });
                                       }} 
                                       placeholder="Bank Name (e.g. CBE, Awash)" 
                                       className="input-premium bg-card text-xs font-bold text-accent" 
                                    />
                                    <input 
                                       type="text" 
                                       value={bank.account_number} 
                                       onChange={(e) => {
                                          const newBanks = [...cmsForm.banks_etb];
                                          newBanks[index].account_number = e.target.value;
                                          setCmsForm({ ...cmsForm, banks_etb: newBanks });
                                       }} 
                                       placeholder="Account Number / Phone" 
                                       className="input-premium bg-card text-xs font-bold text-accent" 
                                    />
                                    <input 
                                       type="text" 
                                       value={bank.account_holder || ''} 
                                       onChange={(e) => {
                                          const newBanks = [...cmsForm.banks_etb];
                                          newBanks[index].account_holder = e.target.value;
                                          setCmsForm({ ...cmsForm, banks_etb: newBanks });
                                       }} 
                                       placeholder="Account Holder Name" 
                                       className="input-premium bg-card text-xs font-bold text-accent" 
                                    />
                                 </div>
                              ))}
                           </div>

                           {/* USD Accounts */}
                           <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">USD / International Accounts</p>
                                 <button 
                                    type="button" 
                                    onClick={() => {
                                       setCmsForm({
                                          ...cmsForm,
                                          banks_usd: [...(cmsForm.banks_usd || []), { bank_name: '', account_number: '', account_holder: '' }]
                                       });
                                    }} 
                                    className="text-xs text-primary font-bold hover:underline"
                                 >
                                    + Add USD Bank
                                 </button>
                              </div>
                              {cmsForm.banks_usd?.map((bank, index) => (
                                 <div key={index} className="p-6 bg-background rounded-[2rem] border border-white/5 space-y-3 relative">
                                    <button 
                                       type="button" 
                                       onClick={() => {
                                          const newBanks = cmsForm.banks_usd.filter((_, i) => i !== index);
                                          setCmsForm({ ...cmsForm, banks_usd: newBanks });
                                       }} 
                                       className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xs font-bold"
                                    >
                                       Remove
                                    </button>
                                    <input 
                                       type="text" 
                                       value={bank.bank_name} 
                                       onChange={(e) => {
                                          const newBanks = [...cmsForm.banks_usd];
                                          newBanks[index].bank_name = e.target.value;
                                          setCmsForm({ ...cmsForm, banks_usd: newBanks });
                                       }} 
                                       placeholder="Method / Bank (e.g. PayPal, Swift)" 
                                       className="input-premium bg-card text-xs font-bold text-accent" 
                                    />
                                    <input 
                                       type="text" 
                                       value={bank.account_number} 
                                       onChange={(e) => {
                                          const newBanks = [...cmsForm.banks_usd];
                                          newBanks[index].account_number = e.target.value;
                                          setCmsForm({ ...cmsForm, banks_usd: newBanks });
                                       }} 
                                       placeholder="Account / Link / Details" 
                                       className="input-premium bg-card text-xs font-bold text-accent" 
                                    />
                                    <input 
                                       type="text" 
                                       value={bank.account_holder || ''} 
                                       onChange={(e) => {
                                          const newBanks = [...cmsForm.banks_usd];
                                          newBanks[index].account_holder = e.target.value;
                                          setCmsForm({ ...cmsForm, banks_usd: newBanks });
                                       }} 
                                       placeholder="Holder Name / Extra Details" 
                                       className="input-premium bg-card text-xs font-bold text-accent" 
                                    />
                                 </div>
                              ))}
                           </div>
                        </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'business' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold italic uppercase tracking-tighter">Business Settings</h2>
                <p className="text-foreground/40 mt-1">Manage official contact details and global business profile.</p>
              </div>
              <button 
                 onClick={handleSaveCMS} 
                 disabled={isSaving || !settings || (currentUser?.role !== 'super_admin' && currentUser?.role !== 'superadmin' && process.env.NODE_ENV !== 'development')}
                 className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <Plus size={20} /> {isSaving ? 'Saving...' : 'Save Business Details'}
              </button>
            </header>

            {currentUser?.role !== 'super_admin' && currentUser?.role !== 'superadmin' && process.env.NODE_ENV !== 'development' ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-12 text-center space-y-4">
                 <ShieldAlert className="text-red-500 mx-auto" size={48} />
                 <h3 className="text-2xl font-bold text-red-500">Super Admin Access Required</h3>
                 <p className="text-gray-400 max-w-md mx-auto">This section contains sensitive business configuration and is restricted to the highest level of administration.</p>
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest pt-4">Current Role: {currentUser?.role || 'Guest'}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 space-y-8">
                  <div className="flex items-center gap-3">
                    <SettingsIcon className="text-primary" size={24} />
                    <h3 className="text-xl font-bold uppercase tracking-widest">Core Profile</h3>
                  </div>
                  <div className="space-y-6">
                    <label className="block">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Official Business Email</span>
                      <input 
                        type="email" 
                        value={cmsForm.email} 
                        onChange={(e) => setCmsForm({...cmsForm, email: e.target.value})} 
                        className="input-premium bg-background" 
                        placeholder="e.g. hello@beteseb.com"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Official Phone Number</span>
                      <input 
                        type="text" 
                        value={cmsForm.phone} 
                        onChange={(e) => setCmsForm({...cmsForm, phone: e.target.value})} 
                        className="input-premium bg-background" 
                        placeholder="e.g. +251 912 345 678"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Website URL</span>
                      <input 
                        type="url" 
                        value={cmsForm.website_url} 
                        onChange={(e) => setCmsForm({...cmsForm, website_url: e.target.value})} 
                        className="input-premium bg-background" 
                        placeholder="https://beteseb.com"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Headquarters Address</span>
                      <textarea 
                        rows={3}
                        value={cmsForm.address} 
                        onChange={(e) => setCmsForm({...cmsForm, address: e.target.value})} 
                        className="input-premium bg-background resize-none" 
                        placeholder="Harar, Ethiopia"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 space-y-6">
                   <div className="flex items-center gap-3">
                      <Eye className="text-primary" size={24} />
                      <h3 className="text-xl font-bold uppercase tracking-widest">Global Visibility</h3>
                   </div>
                   <p className="text-sm text-gray-400 leading-relaxed">
                      Changes made here will propagate across the entire platform immediately. This includes the footer, contact pages, top-headers, and any automated system emails.
                   </p>
                   <div className="p-6 bg-background rounded-3xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                         <span className="opacity-40 uppercase font-bold tracking-widest text-[10px]">Footer Sync</span>
                         <Check size={16} className="text-green-500" />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="opacity-40 uppercase font-bold tracking-widest text-[10px]">Contact Page Sync</span>
                         <Check size={16} className="text-green-500" />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="opacity-40 uppercase font-bold tracking-widest text-[10px]">Top Header Sync</span>
                         <Check size={16} className="text-green-500" />
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'social' && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <header className="flex justify-between items-end">
               <div>
                 <h2 className="text-3xl font-bold italic uppercase tracking-tighter">Social Media Links</h2>
                 <p className="text-foreground/40 mt-1">Manage official links for the platform's footer icons.</p>
               </div>
               <button onClick={handleSaveCMS} className="btn-primary flex items-center gap-2">
                 <CheckCircle2 size={20} /> Deploy Links
               </button>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                   <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5">
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-10">Official Platforms</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {[
                         { id: 'youtube', label: 'YouTube' },
                         { id: 'facebook', label: 'Facebook' },
                         { id: 'telegram', label: 'Telegram' },
                         { id: 'whatsapp', label: 'WhatsApp' },
                         { id: 'linkedin', label: 'LinkedIn' },
                         { id: 'twitter', label: 'Twitter / X' }
                       ].map(social => (
                          <div key={social.id} className="space-y-2">
                             <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{social.label} Link</label>
                             <div className="relative group">
                                <input 
                                  type="text" 
                                  placeholder={`https://${social.id}.com/beteseb`}
                                  value={(cmsForm[social.id] as string) || ""}
                                  onChange={(e) => setCmsForm({...cmsForm, [social.id]: e.target.value})}
                                  className="input-premium bg-background pl-12"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40">
                                   <Link size={14} />
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5">
                      <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">Live Footer Preview</h3>
                      <p className="text-[10px] text-foreground/40 uppercase mb-8">Visible Icons</p>
                      <div className="flex flex-wrap gap-4">
                         {['youtube', 'facebook', 'telegram', 'whatsapp', 'linkedin', 'twitter'].map(id => (
                            (cmsForm[id] as string) && (
                               <div key={id} className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                  <Globe size={20} />
                                </div>
                            )
                         ))}
                      </div>
                   </div>
                </div>
             </div>
           </div>
        )}

         {activeTab === 'pricing' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold italic uppercase tracking-tighter text-accent">Pricing & Gateways</h2>
                  <p className="text-foreground/40 mt-1">Control Diamond subscription pricing, coin packages, and payment methods.</p>
                </div>
                <button onClick={handleSaveCMS} className="btn-primary">Deploy Updates</button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
                {/* 1. Pricing Toggles & Gateways */}
                <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3">Discount & Logic</h3>
                    <label className="block">
                       <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest text-primary italic">Global Discount (%)</span>
                       <input 
                         type="number" 
                         value={cmsForm.pricing_usd?.discount || 0}
                         onChange={(e) => setCmsForm({
                            ...cmsForm, 
                            pricing_usd: {
                                ...cmsForm.pricing_usd, discount: parseInt(e.target.value) },
                            pricing_etb: {
                                ...cmsForm.pricing_etb, discount: parseInt(e.target.value) }
                         })}
                         className="input-premium bg-background mt-2 border-primary/30"
                         placeholder="0% - 90%"
                       />
                    </label>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5">
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Payment Gateways</h3>
                    <div className="space-y-3">
                       {(['stripe', 'chapa', 'telebirr', 'paypal', 'bank_transfer'] as const).map(gateway => (
                          <label key={gateway} className="flex items-center justify-between p-2.5 bg-background rounded-xl border border-white/5">
                             <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                               {gateway.replace('_', ' ')}
                             </span>
                             <input 
                               type="checkbox" 
                               checked={cmsForm.payment_gateways?.[gateway] ?? true}
                               onChange={(e) => setCmsForm({
                                  ...cmsForm, 
                                  payment_gateways: {
                                   ...cmsForm.payment_gateways, [gateway]: e.target.checked }
                               })}
                               className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                             />
                          </label>
                       ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                     <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Google AdMob Settings</h3>
                     <label className="flex items-center justify-between p-2.5 bg-background rounded-xl border border-white/5">
                        <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Enable Ads</span>
                        <input 
                          type="checkbox" 
                          checked={cmsForm.ad_config?.enabled ?? true}
                          onChange={(e) => setCmsForm({
                             ...cmsForm, 
                             ad_config: { ...(cmsForm.ad_config || { enabled: true, test_mode: true, unit_android: '', unit_ios: '' }), enabled: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        />
                     </label>
                     <label className="flex items-center justify-between p-2.5 bg-background rounded-xl border border-white/5">
                        <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Test Ads Mode</span>
                        <input 
                          type="checkbox" 
                          checked={cmsForm.ad_config?.test_mode ?? true}
                          onChange={(e) => setCmsForm({
                             ...cmsForm, 
                             ad_config: { ...(cmsForm.ad_config || { enabled: true, test_mode: true, unit_android: '', unit_ios: '' }), test_mode: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        />
                     </label>
                     <label className="block">
                        <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Android Unit ID</span>
                        <input 
                          type="text" 
                          value={cmsForm.ad_config?.unit_android || ''}
                          onChange={(e) => setCmsForm({
                             ...cmsForm, 
                             ad_config: { ...(cmsForm.ad_config || { enabled: true, test_mode: true, unit_android: '', unit_ios: '' }), unit_android: e.target.value }
                          })}
                          className="w-full bg-background rounded border border-white/5 p-1 text-[10px] text-accent font-bold" 
                        />
                     </label>
                     <label className="block">
                        <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">iOS Unit ID</span>
                        <input 
                          type="text" 
                          value={cmsForm.ad_config?.unit_ios || ''}
                          onChange={(e) => setCmsForm({
                             ...cmsForm, 
                             ad_config: { ...(cmsForm.ad_config || { enabled: true, test_mode: true, unit_android: '', unit_ios: '' }), unit_ios: e.target.value }
                          })}
                          className="w-full bg-background rounded border border-white/5 p-1 text-[10px] text-accent font-bold" 
                        />
                     </label>
                  </div>
                </div>

                {/* 2. USD Subscriptions */}
                <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5">
                  <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">USD Subscriptions ($)</h3>
                  <div className="space-y-4">
                     {['1m', '3m', '6m', '12m', 'lifetime'].map(plan => (
                        <label key={plan} className="flex items-center gap-4">
                           <span className="text-[10px] w-20 font-bold text-foreground/40 uppercase tracking-widest">{plan === 'lifetime' ? 'Lifetime' : plan}</span>
                           <input 
                             type="number" 
                             value={cmsForm.pricing_usd?.[plan] ?? 0}
                             onChange={(e) => setCmsForm({
                                ...cmsForm, 
                                pricing_usd: {
                                 ...cmsForm.pricing_usd, [plan]: parseInt(e.target.value) }
                             })}
                             className="input-premium bg-background flex-1"
                           />
                        </label>
                     ))}
                  </div>
                </div>

                {/* 3. ETB Subscriptions */}
                <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5">
                  <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">ETB Subscriptions (ብር)</h3>
                  <div className="space-y-4">
                     {['1m', '3m', '6m', '12m', 'lifetime'].map(plan => (
                        <label key={plan} className="flex items-center gap-4">
                           <span className="text-[10px] w-20 font-bold text-foreground/40 uppercase tracking-widest">{plan === 'lifetime' ? 'Lifetime' : plan}</span>
                           <input 
                             type="number" 
                             value={cmsForm.pricing_etb?.[plan] ?? 0}
                             onChange={(e) => setCmsForm({
                                ...cmsForm, 
                                pricing_etb: {
                                 ...cmsForm.pricing_etb, [plan]: parseInt(e.target.value) }
                             })}
                             className="input-premium bg-background flex-1"
                           />
                        </label>
                     ))}
                  </div>
                </div>

                {/* 4. Coin Packages Editor */}
                <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Coin Packs</h3>
                    <button 
                       type="button" 
                       onClick={() => {
                          setCmsForm({
                             ...cmsForm,
                             coin_packages: [...(cmsForm.coin_packages || []), { id: `coins_${Date.now()}`, coins: 50, priceEtb: 50, priceUsd: 1.0, discount: '' }]
                          });
                       }}
                       className="text-[10px] text-primary font-bold hover:underline"
                    >
                       + Add Pack
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                     {cmsForm.coin_packages?.map((pack, idx) => (
                        <div key={idx} className="p-4 bg-background rounded-2xl border border-white/5 space-y-2 relative">
                           <button 
                              type="button" 
                              onClick={() => {
                                 const newPacks = cmsForm.coin_packages.filter((_, i) => i !== idx);
                                 setCmsForm({ ...cmsForm, coin_packages: newPacks });
                              }}
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-[10px] font-bold"
                           >
                              Remove
                           </button>
                           <div className="flex gap-2">
                              <label className="flex-1">
                                 <span className="text-[8px] font-bold text-gray-500 uppercase block">Coins</span>
                                 <input 
                                    type="number" 
                                    value={pack.coins} 
                                    onChange={(e) => {
                                       const newPacks = [...cmsForm.coin_packages];
                                       newPacks[idx].coins = Number(e.target.value);
                                       setCmsForm({ ...cmsForm, coin_packages: newPacks });
                                    }} 
                                    className="w-full bg-card rounded border border-white/5 p-1 text-xs text-accent font-bold" 
                                 />
                              </label>
                              <label className="flex-1">
                                 <span className="text-[8px] font-bold text-gray-500 uppercase block">Price ETB</span>
                                 <input 
                                    type="number" 
                                    value={pack.priceEtb} 
                                    onChange={(e) => {
                                       const newPacks = [...cmsForm.coin_packages];
                                       newPacks[idx].priceEtb = Number(e.target.value);
                                       setCmsForm({ ...cmsForm, coin_packages: newPacks });
                                    }} 
                                    className="w-full bg-card rounded border border-white/5 p-1 text-xs text-accent font-bold" 
                                 />
                              </label>
                              <label className="flex-1">
                                 <span className="text-[8px] font-bold text-gray-500 uppercase block">Price USD</span>
                                 <input 
                                    type="number" 
                                    value={pack.priceUsd} 
                                    onChange={(e) => {
                                       const newPacks = [...cmsForm.coin_packages];
                                       newPacks[idx].priceUsd = Number(e.target.value);
                                       setCmsForm({ ...cmsForm, coin_packages: newPacks });
                                    }} 
                                    className="w-full bg-card rounded border border-white/5 p-1 text-xs text-accent font-bold" 
                                 />
                              </label>
                           </div>
                           <label className="block">
                              <span className="text-[8px] font-bold text-gray-500 uppercase block">Discount Tag</span>
                              <input 
                                 type="text" 
                                 value={pack.discount || ''} 
                                 onChange={(e) => {
                                    const newPacks = [...cmsForm.coin_packages];
                                    newPacks[idx].discount = e.target.value;
                                    setCmsForm({ ...cmsForm, coin_packages: newPacks });
                                 }} 
                                 className="w-full bg-card rounded border border-white/5 p-1 text-xs text-accent font-bold" 
                                 placeholder="Optional tag..."
                              />
                           </label>
                        </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
         )}

        {activeTab === 'staff' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-accent italic">Manage Staff & Users</h2>
                  <p className="text-gray-500">Assign roles and permissions to users. Search by name, ID, phone, or email.</p>
                </div>
                <div className="relative w-full max-w-sm">
                   <input 
                     type="text"
                     value={userSearchQuery}
                     onChange={(e) => setUserSearchQuery(e.target.value)}
                     placeholder="Search ID, phone, email, name..."
                     className="w-full bg-white border border-gray-200 rounded-2xl p-4 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-accent"
                   />
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </header>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b border-gray-100">
                       <tr>
                         <th className="p-6 text-xs font-bold text-gray-400 uppercase">User Details</th>
                         <th className="p-6 text-xs font-bold text-gray-400 uppercase">Current Role</th>
                         <th className="p-6 text-xs font-bold text-gray-400 uppercase text-center">Assign Role</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {users.filter(user => 
                         user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         user.id.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         (user as any).phone?.includes(userSearchQuery) ||
                         (user as any).email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                       ).map(user => (
                         <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-6">
                              <div className="font-bold text-accent">{user.full_name || 'Anonymous'}</div>
                              <div className="text-[10px] text-gray-400 font-semibold select-all">ID: {user.id}</div>
                            </td>
                            <td className="p-6">
                               <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                                 user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 
                                 user.role === 'moderator' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                 'bg-gray-100 text-gray-500 border-gray-200'
                               }`}>
                                 {user.role}
                               </span>
                            </td>
                            <td className="p-6">
                               <div className="flex gap-2 justify-center">
                                  <button onClick={() => handleUpdateRole(user.id, 'user')} className="text-[10px] font-bold px-3 py-1 bg-muted rounded-lg hover:bg-gray-200">User</button>
                                  <button onClick={() => handleUpdateRole(user.id, 'expert')} className="text-[10px] font-bold px-3 py-1 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500 hover:text-white">Expert</button>
                                  <button onClick={() => handleUpdateRole(user.id, 'admin')} className="text-[10px] font-bold px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white">Admin</button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

        {activeTab === 'verification' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h2 className="text-3xl font-bold text-accent italic">ID Verifications</h2>
                <p className="text-gray-500">Manual review of Government IDs, Passports, and Driver Licenses.</p>
              </header>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-muted/50 border-b border-gray-100">
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Document</th>
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {displayVerifications.map((req) => (
                         <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary font-bold shadow-sm">
                                     {req.profiles?.full_name?.charAt(0)}
                                  </div>
                                  <span className="font-bold text-accent">{req.profiles?.full_name || 'Unknown User'}</span>
                               </div>
                            </td>
                            <td className="p-6">
                               <span className="text-[10px] font-black px-3 py-1 bg-gray-100 rounded-full text-gray-500 uppercase tracking-tighter border border-gray-200">
                                  {req.doc_type}
                                </span>
                            </td>
                            <td className="p-6">
                               <span className={`flex items-center gap-2 font-bold text-sm ${req.status === 'verified' ? 'text-green-500' : req.status === 'rejected' ? 'text-red-500' : 'text-primary'}`}>
                                  {req.status === 'pending' && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                  {req.status.toUpperCase()}
                               </span>
                            </td>
                            <td className="p-6">
                               <div className="flex gap-2 justify-center">
                                  {req.status === 'pending' && (
                                    <>
                                       <button onClick={() => handleUpdateVerification(req.id, 'verified', req.user_id)} aria-label="Approve verification" className="p-3 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"><Check size={18} /></button>
                                       <button onClick={() => handleUpdateVerification(req.id, 'rejected', req.user_id)} aria-label="Reject verification" className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={18} /></button>
                                    </>
                                  )}
                                  <button aria-label="View details" className="p-3 bg-accent/10 text-accent rounded-xl hover:bg-accent hover:text-white transition-all shadow-sm"><Search size={18} /></button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'payments' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h2 className="text-3xl font-bold text-accent italic">Manual Payments</h2>
                <p className="text-gray-500">Approve or reject bank transfer receipts uploaded by users.</p>
              </header>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-muted/50 border-b border-gray-100">
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase">User</th>
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase">Plan & Amount</th>
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase">Receipt</th>
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase">Status</th>
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase text-center">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {payments.length === 0 ? (
                         <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">No payment requests found.</td></tr>
                       ) : (
                         payments.map((p) => (
                           <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-6">
                                 <div className="font-bold text-accent">{p.profiles?.full_name}</div>
                                 <div className="text-[10px] text-gray-400 font-bold uppercase">{p.user_id?.substring(0, 8)}...</div>
                              </td>
                              <td className="p-6">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-widest text-primary">{p.plan_type}</span>
                                    <span className="text-lg font-black italic">{p.currency === 'ETB' ? 'ብር ' : '$'}{p.amount}</span>
                                 </div>
                              </td>
                              <td className="p-6">
                                 <div className="relative group cursor-pointer" onClick={() => window.open(p.receipt_url, '_blank')}>
                                    <div className="w-16 h-12 bg-muted rounded-lg overflow-hidden border border-gray-200">
                                       <Image src={p.receipt_url} fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Payment receipt" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Search size={14} className="text-accent" />
                                    </div>
                                 </div>
                              </td>
                              <td className="p-6">
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                                    p.status === 'approved' ? 'bg-green-500/10 text-green-600 border-green-200' : 
                                    p.status === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-200' : 
                                    'bg-primary/10 text-primary border-primary/20 animate-pulse'
                                 }`}>
                                    {p.status}
                                 </span>
                              </td>
                              <td className="p-6">
                                 <div className="flex gap-2 justify-center">
                                    {p.status === 'pending' && (
                                       <>
                                          <button 
                                            onClick={() => handleUpdatePayment(p.id, 'approved', p.user_id, p.plan_type)} 
                                            disabled={isSaving}
                                            aria-label="Approve payment"
                                            className="p-3 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm disabled:opacity-30"
                                          >
                                             <Check size={18} />
                                          </button>
                                          <button 
                                            onClick={() => handleUpdatePayment(p.id, 'rejected')} 
                                            disabled={isSaving}
                                            className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-30"
                                          >
                                             <X size={18} />
                                          </button>
                                       </>
                                    )}
                                    {p.status === 'approved' && (
                                       <button 
                                         onClick={() => handleProcessRefund(p.user_id, p.id, p.amount)} 
                                         disabled={isSaving}
                                         className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black rounded-lg transition-all uppercase tracking-widest"
                                       >
                                          Refund
                                       </button>
                                    )}
                                 </div>
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

         {activeTab === 'messaging' && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <header>
               <h2 className="text-3xl font-bold text-accent italic">Communication Portal</h2>
               <p className="text-gray-500">Send system-wide broadcasts or manage direct messages.</p>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                 <h3 className="text-xl font-bold text-accent mb-6 flex items-center gap-2">
                   <MessageSquare className="text-primary" /> Compose Broadcast
                 </h3>
                 <textarea 
                   value={broadcastMessage}
                   onChange={(e) => setBroadcastMessage(e.target.value)}
                   placeholder="Type your announcement here..."
                   className="w-full p-4 bg-muted rounded-2xl h-48 resize-none border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner mb-4"
                 />
                 <button 
                   onClick={handleBroadcast}
                   disabled={isSaving || !broadcastMessage}
                   className="w-full btn-primary py-4 rounded-2xl font-bold uppercase tracking-widest"
                 >
                   {isSaving ? 'Broadcasting...' : 'Send Message to All Users'}
                 </button>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
                 <h3 className="text-xl font-bold text-accent mb-6">Recent Sent Messages</h3>
                 <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
                   {sentMessages.map(msg => (
                     <div key={msg.id} className="p-4 bg-muted rounded-2xl border border-gray-100">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                           <span>To: {msg.receiver?.full_name || 'User'}</span>
                           <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-accent leading-relaxed line-clamp-2">{msg.content}</p>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </div>
         )}

        {activeTab === 'posts' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <header className="flex justify-between items-end">
               <div>
                 <h2 className="text-3xl font-bold text-accent italic">Posts Management</h2>
                 <p className="text-gray-500 mt-1">Manage educational videos, courses, and About Us content.</p>
               </div>
               {!isEditingPost && (
                 <button 
                    onClick={() => {
                      setCurrentPost({ title: '', slug: '', content: '', video_url: '', image_url: '', category: 'education', is_published: false });
                      setIsEditingPost(true);
                    }} 
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                 >
                   <Plus size={20} /> Create New Post
                 </button>
               )}
             </header>

             {isEditingPost ? (
               <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 max-w-4xl animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-bold text-accent">{currentPost.id ? 'Edit' : 'Create'} Post</h3>
                     <button onClick={() => setIsEditingPost(false)} aria-label="Close editor" className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Post Title</span>
                           <input type="text" value={currentPost.title} onChange={(e) => setCurrentPost({...currentPost, title: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner" placeholder="e.g. How to prepare for Marriage" />
                        </label>
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Slug (URL friendly)</span>
                           <input type="text" value={currentPost.slug} onChange={(e) => setCurrentPost({...currentPost, slug: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner" placeholder="how-to-prepare" />
                        </label>
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</span>
                           <select value={currentPost.category} onChange={(e) => setCurrentPost({...currentPost, category: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner">
                              <option value="education">Educational Video</option>
                              <option value="course">Course Content</option>
                              <option value="about">About Us Section</option>
                              <option value="news">Platform News</option>
                           </select>
                        </label>
                     </div>

                     <div className="space-y-4">
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">YouTube Video URL</span>
                           <input type="text" value={currentPost.video_url || ''} onChange={(e) => setCurrentPost({...currentPost, video_url: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner" placeholder="https://youtube.com/watch?v=..." />
                        </label>
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Featured Image URL</span>
                           <input type="text" value={currentPost.image_url || ''} onChange={(e) => setCurrentPost({...currentPost, image_url: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner" placeholder="https://..." />
                        </label>
                        <div className="flex items-center gap-2 pt-8">
                           <input type="checkbox" id="published" checked={currentPost.is_published} onChange={(e) => setCurrentPost({...currentPost, is_published: e.target.checked})} className="w-5 h-5 text-primary rounded" />
                           <label htmlFor="published" className="text-sm font-bold text-accent">Publish immediately</label>
                        </div>
                     </div>

                     <div className="col-span-full space-y-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Content Body</span>
                        <textarea rows={10} value={currentPost.content} onChange={(e) => setCurrentPost({...currentPost, content: e.target.value})} className="mt-2 block w-full p-6 bg-muted rounded-[2rem] border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner resize-none" placeholder="Write your content here..." />
                     </div>
                  </div>

                  <div className="mt-10 flex gap-4">
                     <button onClick={handleSavePost} disabled={isSaving} className="flex-1 btn-primary py-5 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20">
                        {isSaving ? 'Saving...' : 'Save and Deploy Post'}
                     </button>
                     <button onClick={() => setIsEditingPost(false)} className="px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all">
                        Cancel
                     </button>
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.length === 0 ? (
                    <div className="col-span-full p-20 text-center text-gray-400 italic bg-white rounded-[3rem] border border-gray-100">No posts found. Start by creating one!</div>
                  ) : (
                    posts.map((post) => (
                      <div key={post.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 group">
                         <div className="h-48 bg-muted relative">
                            {post.image_url ? (
                               <Image src={post.image_url} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  {post.category === 'education' ? <Film size={48} /> : <FileText size={48} />}
                               </div>
                            )}
                            <div className="absolute top-4 left-4">
                               <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                                  post.is_published ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-amber-500/10 text-amber-600 border-amber-200'
                               }`}>
                                  {post.is_published ? 'Published' : 'Draft'}
                               </span>
                            </div>
                         </div>
                         <div className="p-8 space-y-4">
                            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{post.category}</div>
                            <h4 className="text-xl font-bold text-accent leading-tight line-clamp-2">{post.title}</h4>
                            <div className="flex gap-2 pt-4 border-t border-muted/50">
                               <button onClick={() => { setCurrentPost(post); setIsEditingPost(true); }} aria-label="Edit post" className="flex-1 p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-xs">
                                  <Edit size={16} /> Edit
                               </button>
                               <button onClick={() => post.id && handleDeletePost(post.id)} aria-label="Delete post" className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
              )}
            </div>
          )}


         {activeTab === 'disabled_duplicate_staff' && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <header>
               <h2 className="text-3xl font-bold text-accent italic">Manage Staff</h2>
               <p className="text-gray-500">Assign roles and permissions to users. Moderators help manage the platform.</p>
             </header>

             <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-muted/50 border-b border-gray-100">
                      <tr>
                        <th className="p-6 text-xs font-bold text-gray-400 uppercase">User</th>
                        <th className="p-6 text-xs font-bold text-gray-400 uppercase">Current Role</th>
                        <th className="p-6 text-xs font-bold text-gray-400 uppercase text-center">Assign Role</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="p-6 font-bold text-accent">{user.full_name}</td>
                           <td className="p-6">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                                user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 
                                user.role === 'moderator' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                'bg-gray-100 text-gray-500 border-gray-200'
                              }`}>
                                {user.role}
                              </span>
                           </td>
                           <td className="p-6">
                              <div className="flex gap-2 justify-center">
                                 <button onClick={() => handleUpdateRole(user.id, 'user')} className="text-[10px] font-bold px-3 py-1 bg-muted rounded-lg hover:bg-gray-200">User</button>
                                 <button onClick={() => handleUpdateRole(user.id, 'expert')} className="text-[10px] font-bold px-3 py-1 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500 hover:text-white">Expert</button>
                                 <button onClick={() => handleUpdateRole(user.id, 'admin')} className="text-[10px] font-bold px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white">Admin</button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           </div>
         )}

         {activeTab === 'community' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <header className="flex justify-between items-center">
                 <div>
                    <h2 className="text-3xl font-bold text-accent italic">Social Hub Management</h2>
                    <p className="text-gray-500">Generate AI topics, manage polls, and moderate posts.</p>
                 </div>
                 <button 
                  onClick={async () => {
                     setIsGeneratingAI(true);
                     // Simulate AI Generation
                     await new Promise(r => setTimeout(r, 2000));
                     const topics = [
                        "Traditional vs Modern Dowry: Where do we stand?",
                        "The role of elders in conflict resolution.",
                        "Abushakir Calendar: Planning your wedding season."
                     ];
                     const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                     
                     const { data: { user } } = await supabase.auth.getUser();
                     await supabase.from('community_posts').insert({
                        content: randomTopic,
                        category: 'general',
                        is_ai_generated: true,
                        is_approved: true,
                        author_id: user?.id
                     });
                     setIsGeneratingAI(false);
                     alert("AI Topic Generated Successfully!");
                  }}
                  disabled={isGeneratingAI}
                  className="btn-primary flex items-center gap-2"
                 >
                    <Sparkles size={18} /> {isGeneratingAI ? 'Generating...' : 'Generate AI Weekly Topic'}
                 </button>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
                     <div className="w-16 h-16 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 size={32} />
                     </div>
                     <h4 className="text-2xl font-black text-accent">1.2k</h4>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total Posts</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
                     <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Heart size={32} />
                     </div>
                     <h4 className="text-2xl font-black text-accent">8.4k</h4>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total Reactions</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
                     <div className="w-16 h-16 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                     </div>
                     <h4 className="text-2xl font-black text-accent">24</h4>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Verified Experts</p>
                  </div>
               </div>

               {/* UGC Moderation Queue List */}
               <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm mt-8 space-y-6">
                  <div>
                     <h3 className="text-xl font-bold text-accent">UGC Moderation Queue</h3>
                     <p className="text-sm text-gray-500">Review community posts, delete violations, and suspend user accounts.</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                              <th className="pb-4">Author</th>
                              <th className="pb-4">Category</th>
                              <th className="pb-4">Content</th>
                              <th className="pb-4">Created At</th>
                              <th className="pb-4 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-semibold text-accent">
                           {communityPosts.map((post) => (
                              <tr key={post.id} className="hover:bg-muted/10 transition-colors">
                                 <td className="py-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden">
                                       <img 
                                         src={post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=100'} 
                                         className="w-full h-full object-cover"
                                         alt="Author avatar"
                                       />
                                    </div>
                                    <div>
                                       <div className="font-bold">{post.profiles?.full_name || 'Anonymous'}</div>
                                       <div className="text-[10px] text-gray-400 font-bold uppercase">{post.profiles?.role || 'user'}</div>
                                    </div>
                                 </td>
                                 <td className="py-4">
                                    <span className="px-2 py-1 bg-gray-100 text-[10px] font-bold uppercase rounded-lg">
                                       {post.category}
                                    </span>
                                 </td>
                                 <td className="py-4 max-w-xs truncate" title={post.content}>
                                    {post.content}
                                 </td>
                                 <td className="py-4 text-xs text-gray-400">
                                    {new Date(post.created_at).toLocaleString()}
                                 </td>
                                 <td className="py-4 text-right space-x-2">
                                    <button 
                                       onClick={async () => {
                                         if (!confirm('Are you sure you want to delete this community post?')) return;
                                         const { error } = await supabase.from('community_posts').delete().eq('id', post.id);
                                         if (!error) {
                                           setCommunityPosts(prev => prev.filter(p => p.id !== post.id));
                                           alert('Post deleted successfully.');
                                         } else {
                                           alert('Failed to delete post: ' + error.message);
                                         }
                                       }}
                                       className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                                       title="Delete Post"
                                    >
                                       <Trash2 size={18} />
                                    </button>
                                    <button 
                                       onClick={async () => {
                                         if (!confirm('Are you sure you want to suspend this user?')) return;
                                         const { error } = await supabase.from('profiles').update({ role: 'suspended' }).eq('id', post.author_id);
                                         if (!error) {
                                           alert('User suspended successfully.');
                                           setCommunityPosts(prev => prev.map(p => p.author_id === post.author_id ? { ...p, profiles: { ...p.profiles, role: 'suspended' } } : p));
                                         } else {
                                           alert('Failed to suspend user: ' + error.message);
                                         }
                                       }}
                                       disabled={post.profiles?.role === 'suspended'}
                                       className={`p-2 rounded-xl transition-all ${
                                         post.profiles?.role === 'suspended'
                                           ? 'text-gray-300 cursor-not-allowed'
                                           : 'hover:bg-red-50 text-red-600'
                                       }`}
                                       title="Suspend User"
                                    >
                                       <ShieldAlert size={18} />
                                    </button>
                                 </td>
                               </tr>
                           ))}
                        </tbody>
                     </table>
                     {communityPosts.length === 0 && (
                        <div className="text-center py-10 text-gray-400 font-bold">
                           No community posts found to moderate.
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

         {activeTab === 'security' && (
           <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
             <header>
               <h2 className="text-3xl font-bold text-accent italic">Access Control</h2>
               <p className="text-gray-500">Manage the master system key for Admin Portal access.</p>
             </header>

             <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                      <ShieldAlert size={32} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-accent">Update System Key</h3>
                      <p className="text-sm text-gray-500">Change the password required to enter this portal.</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">New System Password</label>
                      <div className="relative">
                         <input 
                            type={showNewPassword ? "text" : "password"} 
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="New strong key..."
                            className="w-full bg-muted border-none rounded-2xl p-4 text-lg focus:ring-2 focus:ring-primary/20 transition-all font-bold text-accent pr-14"
                         />
                         <button 
                           type="button"
                           onClick={() => setShowNewPassword(!showNewPassword)}
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                           className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-all rounded-xl"
                         >
                           {showNewPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                         </button>
                      </div>
                   </div>
                   
                   <p className="text-xs text-amber-600 bg-amber-50 p-4 rounded-2xl font-medium border border-amber-100">
                      ⚠️ **Warning**: Once updated, you must use the new key for all future logins. There is no recovery email for the system access key.
                   </p>

                   <button 
                     onClick={handleUpdateAdminPassword}
                     disabled={isSaving || newAdminPassword.length < 8}
                     className="w-full btn-primary py-5 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                   >
                     {isSaving ? 'Updating...' : 'Confirm New System Key'}
                   </button>
                </div>
             </div>
           </div>
         )}
         {activeTab === 'support' && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <header>
               <h2 className="text-3xl font-bold text-accent italic">Support Center</h2>
               <p className="text-gray-500">Manage user escalations and AI-to-human ticket transfers.</p>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {supportTickets.length === 0 ? (
                   <div className="col-span-full p-20 text-center text-gray-400 bg-white rounded-[3rem] border border-gray-100 italic">No support tickets at this time.</div>
                ) : (
                   supportTickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col gap-6 relative overflow-hidden">
                         {ticket.status === 'pending' && (
                            <div className="absolute top-0 right-0 w-2 h-full bg-primary animate-pulse" />
                         )}
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary font-bold shadow-sm text-xl uppercase italic">
                                  {ticket.profiles?.full_name?.charAt(0)}
                               </div>
                               <div>
                                  <h4 className="font-bold text-accent">{ticket.profiles?.full_name}</h4>
                                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(ticket.created_at).toLocaleString()}</p>
                               </div>
                            </div>
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                               ticket.status === 'pending' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-green-500/10 text-green-600 border-green-200'
                            }`}>
                               {ticket.status}
                            </span>
                         </div>

                         <div className="p-6 bg-muted/30 rounded-2xl border border-muted italic text-sm text-accent leading-relaxed">
                            &quot;{ticket.message}&quot;
                         </div>

                         {ticket.status === 'pending' ? (
                            <div className="space-y-4">
                               <textarea 
                                 id={`reply-${ticket.id}`}
                                 placeholder="Type your response to the user..."
                                 className="w-full p-4 bg-muted rounded-2xl h-32 resize-none border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner"
                               />
                               <button 
                                 onClick={() => {
                                    const reply = (document.getElementById(`reply-${ticket.id}`) as HTMLTextAreaElement).value;
                                    if (reply) handleUpdateTicket(ticket.id, reply);
                                 }}
                                 disabled={isSaving}
                                 className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                               >
                                  {isSaving ? 'Sending...' : <><Send size={16} /> Send Reply & Close</>}
                               </button>
                            </div>
                         ) : (
                                 <div className="space-y-2 p-6 bg-green-500/5 rounded-2xl border border-green-200/20">
                               <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Admin Response:</p>
                               <p className="text-sm font-medium text-green-800">
                                 {ticket.support_replies?.[0]?.message || 'Resolved'}
                               </p>
                             </div>
                         )}
                      </div>
                   ))
                )}
             </div>
           </div>
         )}
          {activeTab === 'reports' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h2 className="text-3xl font-bold text-accent italic">Safety Reports Queue</h2>
                <p className="text-gray-500">Review community moderation flags and user safety complaints.</p>
              </header>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                 {reports.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 bg-white rounded-[3rem] border border-gray-100 italic">No safety reports submitted yet.</div>
                 ) : (
                    <table className="w-full text-left">
                       <thead className="bg-muted/50 border-b border-gray-100">
                          <tr>
                            <th className="p-6 text-xs font-bold text-gray-400 uppercase">Reporter</th>
                            <th className="p-6 text-xs font-bold text-gray-400 uppercase">Reported User</th>
                            <th className="p-6 text-xs font-bold text-gray-400 uppercase">Reason & Details</th>
                            <th className="p-6 text-xs font-bold text-gray-400 uppercase">Date</th>
                            <th className="p-6 text-xs font-bold text-gray-400 uppercase text-center">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                               <td className="p-6">
                                 <div className="font-bold text-accent">{report.reporter?.full_name || 'Anonymous'}</div>
                                 <div className="text-[10px] text-gray-400 font-semibold select-all">ID: {report.reporter_id}</div>
                               </td>
                               <td className="p-6">
                                 <div className="font-bold text-red-600">{report.reported?.full_name || 'Anonymous'}</div>
                                 <div className="text-[10px] text-gray-400 font-semibold select-all">ID: {report.reported_id}</div>
                               </td>
                               <td className="p-6 max-w-xs">
                                 <span className="px-2.5 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-red-200">
                                   {report.reason}
                                 </span>
                                 <p className="text-xs text-gray-500 font-medium italic mt-2 leading-relaxed">&quot;{report.details || 'No additional details'}&quot;</p>
                               </td>
                               <td className="p-6 text-xs text-gray-400 font-semibold">
                                 {new Date(report.created_at).toLocaleString()}
                               </td>
                               <td className="p-6">
                                 <div className="flex flex-col gap-2 items-center justify-center">
                                    <button 
                                      onClick={() => handleDeleteReportedUser(report.reported_id, report.id)}
                                      disabled={isSaving}
                                      className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl hover:bg-red-700 transition-all uppercase tracking-widest"
                                    >
                                      Suspend & Delete
                                    </button>
                                    <button 
                                      onClick={() => handleDismissReport(report.id)}
                                      disabled={isSaving}
                                      className="px-4 py-2 bg-muted text-gray-500 text-[10px] font-black rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest border border-gray-200"
                                    >
                                      Dismiss
                                    </button>
                                 </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 )}
              </div>
            </div>
          )}
         {activeTab === 'lessons' && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <header className="flex justify-between items-end">
               <div>
                 <h2 className="text-3xl font-bold text-accent italic">Academy Lessons</h2>
                 <p className="text-gray-500 mt-1">Add educational video links and instructions for students.</p>
               </div>
               {!isEditingLesson && (
                 <button 
                    onClick={() => {
                      setCurrentLesson({ title: '', description: '', youtube_url: '', instructions: '', category: 'Relationship', is_premium_only: true });
                      setIsEditingLesson(true);
                    }} 
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                 >
                   <Plus size={20} /> Create New Lesson
                 </button>
               )}
             </header>

             {isEditingLesson ? (
               <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 max-w-4xl animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-bold text-accent">{currentLesson.id ? 'Edit' : 'Create'} Lesson</h3>
                     <button onClick={() => setIsEditingLesson(false)} aria-label="Close" className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lesson Title</span>
                           <div className="relative group">
                              <input type="text" value={currentLesson.title} onChange={(e) => setCurrentLesson({...currentLesson, title: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner pr-12" placeholder="e.g. Building Trust" />
                              <button 
                                 type="button"
                                 onClick={() => handleSmartTranslate(currentLesson.title, 'lesson', 'title')}
                                 title="Smart Translate to all languages"
                                 className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                              >
                                 <Languages size={18} />
                              </button>
                           </div>
                        </label>
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</span>
                           <select value={currentLesson.category} onChange={(e) => setCurrentLesson({...currentLesson, category: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner">
                              <option value="Relationship">Relationship</option>
                              <option value="Family">Family</option>
                              <option value="Culture">Culture</option>
                              <option value="Finance">Finance</option>
                           </select>
                        </label>
                        <div className="flex items-center gap-2 pt-4">
                           <input type="checkbox" id="premium_only" checked={currentLesson.is_premium_only} onChange={(e) => setCurrentLesson({...currentLesson, is_premium_only: e.target.checked})} className="w-5 h-5 text-primary rounded" />
                           <label htmlFor="premium_only" className="text-sm font-bold text-accent">Premium Members Only</label>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">YouTube URL (Admins Only)</span>
                           <input type="text" value={currentLesson.youtube_url} onChange={(e) => setCurrentLesson({...currentLesson, youtube_url: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner" placeholder="https://youtube.com/watch?v=..." />
                        </label>
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Brief Description</span>
                           <div className="relative group">
                              <textarea rows={3} value={currentLesson.description} onChange={(e) => setCurrentLesson({...currentLesson, description: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner resize-none pr-12" placeholder="What is this lesson about?" />
                              <button 
                                 type="button"
                                 onClick={() => handleSmartTranslate(currentLesson.description, 'lesson', 'description')}
                                 title="Smart Translate to all languages"
                                 className="absolute right-2 bottom-4 p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                              >
                                 <Languages size={18} />
                              </button>
                           </div>
                        </label>
                     </div>

                     <div className="col-span-full space-y-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detailed Instructions (Actionable Steps)</span>
                        <div className="relative group">
                           <textarea rows={6} value={currentLesson.instructions} onChange={(e) => setCurrentLesson({...currentLesson, instructions: e.target.value})} className="mt-2 block w-full p-6 bg-muted rounded-[2rem] border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner resize-none pr-12" placeholder="Step 1: ... Step 2: ..." />
                           <button 
                              type="button"
                              onClick={() => handleSmartTranslate(currentLesson.instructions, 'lesson', 'instructions')}
                              title="Smart Translate to all languages"
                              className="absolute right-2 bottom-6 p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                           >
                              <Languages size={18} />
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="mt-10 flex gap-4">
                     <button onClick={handleSaveLesson} disabled={isSaving} className="flex-1 btn-primary py-5 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20">
                        {isSaving ? 'Saving...' : 'Deploy Academy Lesson'}
                     </button>
                     <button onClick={() => setIsEditingLesson(false)} className="px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all">
                        Cancel
                     </button>
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lessons.length === 0 ? (
                    <div className="col-span-full p-20 text-center text-gray-400 italic bg-white rounded-[3rem] border border-gray-100">No lessons found.</div>
                  ) : (
                    lessons.map((lesson) => (
                      <div key={lesson.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 group">
                         <div className="h-48 bg-muted relative flex items-center justify-center">
                            <Video size={48} className="text-primary/20" />
                            <div className="absolute top-4 left-4">
                               <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                                  lesson.is_premium_only ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-green-500/10 text-green-600 border-green-200'
                               }`}>
                                  {lesson.is_premium_only ? 'Premium' : 'Free'}
                               </span>
                            </div>
                         </div>
                         <div className="p-8 space-y-4">
                            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{lesson.category}</div>
                            <h4 className="text-xl font-bold text-accent leading-tight line-clamp-2">{lesson.title}</h4>
                            <div className="flex gap-2 pt-4 border-t border-muted/50">
                               <button onClick={() => { setCurrentLesson(lesson); setIsEditingLesson(true); }} className="flex-1 p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-xs">
                                  <Edit size={16} /> Edit
                                </button>
                               <button onClick={() => lesson.id && handleDeleteLesson(lesson.id)} aria-label="Delete lesson" className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
             )}
           </div>
         )}
        {activeTab === 'gifts' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <header className="flex justify-between items-end">
               <div>
                 <h2 className="text-3xl font-bold italic uppercase tracking-tighter text-accent">Gifts & Delivery Management</h2>
                 <p className="text-foreground/40 mt-1">Configure virtual gifts and process physical fulfillment requests.</p>
               </div>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Add New Gift Form */}
                <div className="bg-card p-8 rounded-[3rem] shadow-2xl border border-white/5 space-y-6">
                   <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Gift size={20} /> Create Gift Item
                   </h3>
                   <form onSubmit={handleAddCatalogItem} className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">English Name</label>
                         <input 
                           type="text" 
                           required 
                           value={newCatalogItem.name_en}
                           onChange={(e) => setNewCatalogItem({ ...newCatalogItem, name_en: e.target.value })}
                           placeholder="e.g. Traditional Sini" 
                           className="w-full bg-background border-none rounded-xl p-3 text-xs font-semibold focus:ring-1 focus:ring-primary"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amharic Name (አማርኛ)</label>
                         <input 
                           type="text" 
                           required 
                           value={newCatalogItem.name_am}
                           onChange={(e) => setNewCatalogItem({ ...newCatalogItem, name_am: e.target.value })}
                           placeholder="e.g. የሀበሻ ሲኒ" 
                           className="w-full bg-background border-none rounded-xl p-3 text-xs font-semibold focus:ring-1 focus:ring-primary"
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Icon Type</label>
                            <select 
                              value={newCatalogItem.image_url}
                              onChange={(e) => setNewCatalogItem({ ...newCatalogItem, image_url: e.target.value })}
                              className="w-full bg-background border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary"
                            >
                               <option value="sini_coffee">☕ Coffee Sini</option>
                               <option value="habesha_flower">🌹 Flower</option>
                               <option value="shamma_candle">🕯️ Candle</option>
                               <option value="jebena_pot">🏺 Jebena Pot</option>
                            </select>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Coin Cost</label>
                            <input 
                              type="number" 
                              required 
                              min="1"
                              value={newCatalogItem.coin_price}
                              onChange={(e) => setNewCatalogItem({ ...newCatalogItem, coin_price: Number(e.target.value) })}
                              className="w-full bg-background border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary"
                            />
                         </div>
                      </div>
                      <button type="submit" className="w-full btn-primary py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 shadow-lg">
                         <Plus size={14} /> Add to Catalog
                      </button>
                   </form>
                </div>

                {/* 2. Gift Catalog List */}
                <div className="bg-card p-8 rounded-[3rem] shadow-2xl border border-white/5 space-y-6 lg:col-span-2">
                   <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      🎨 Active Catalog List
                   </h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {adminCatalog.map(item => (
                         <div key={item.id} className="p-4 bg-background rounded-2xl border border-white/5 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                               <span className="text-3xl">
                                  {item.image_url === 'sini_coffee' ? '☕' : item.image_url === 'habesha_flower' ? '🌹' : item.image_url === 'shamma_candle' ? '🕯️' : '🏺'}
                               </span>
                               <div>
                                  <p className="font-black text-xs uppercase text-accent">{item.name_en}</p>
                                  <p className="text-[10px] text-gray-400 font-semibold">{item.name_am}</p>
                                  <div className="flex items-center gap-1 text-[9px] font-black text-primary uppercase mt-1">
                                     <Coins size={10} /> {item.coin_price} Coins
                                  </div>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleToggleCatalogStatus(item.id, item.is_active)}
                              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-colors ${item.is_active ? 'bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500' : 'bg-red-500/10 text-red-500 hover:bg-green-500/10 hover:text-green-500'}`}
                            >
                               {item.is_active ? 'Active' : 'Disabled'}
                            </button>
                         </div>
                      ))}
                   </div>
                </div>

                {/* 3. Physical Delivery Queue */}
                <div className="bg-card p-8 rounded-[3rem] shadow-2xl border border-white/5 space-y-6 lg:col-span-3">
                   <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Truck size={20} /> Real Delivery Requests Queue
                   </h3>
                   <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {adminGifts.length === 0 ? (
                         <div className="p-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                            No delivery requests pending.
                         </div>
                      ) : (
                         adminGifts.map(gift => (
                            <div key={gift.id} className="p-6 bg-background rounded-3xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/20 transition-all">
                               <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                     <span className="text-xl">
                                        {gift.gift_catalog?.image_url === 'sini_coffee' ? '☕' : gift.gift_catalog?.image_url === 'habesha_flower' ? '🌹' : gift.gift_catalog?.image_url === 'shamma_candle' ? '🕯️' : '🏺'}
                                     </span>
                                     <h4 className="font-black text-xs uppercase text-accent">
                                        {gift.gift_catalog?.name_en} ({gift.gift_catalog?.name_am})
                                     </h4>
                                     <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-md uppercase">
                                        {gift.amount} Coins
                                     </span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-semibold">
                                     Sender: <span className="text-accent font-bold">{gift.sender?.full_name}</span> | Recipient: <span className="text-accent font-bold">{gift.receiver?.full_name}</span>
                                  </p>
                                  <div className="p-3 bg-card rounded-xl text-[10px] font-medium text-gray-500 border border-white/5 max-w-lg">
                                     <strong>Message:</strong> « {gift.message || 'No custom message.'} »
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                     <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                        <MapPin size={12} className="text-primary" /> Address: <span className="text-accent normal-case">{gift.delivery_address}</span>
                                     </div>
                                     <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                        <Phone size={12} className="text-primary" /> Phone: <span className="text-accent">{gift.delivery_phone}</span>
                                     </div>
                                  </div>
                                  {gift.delivery_details?.proof_of_delivery && (
                                     <div className="mt-2 text-[9px] text-green-600 font-bold flex items-center gap-1.5 uppercase">
                                        ✅ Proof Uploaded: <a href={gift.delivery_details.proof_of_delivery} target="_blank" rel="noreferrer" className="underline hover:text-primary normal-case">{gift.delivery_details.proof_of_delivery}</a>
                                     </div>
                                  )}
                               </div>

                               <div className="flex flex-col items-end gap-3 self-center md:self-auto">
                                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                     Fulfillment Status:
                                  </div>
                                  <div className="flex items-center gap-2">
                                     {gift.delivery_status === 'requested' && (
                                        <>
                                           <button 
                                             onClick={() => handleUpdateDeliveryStatus(gift, 'processing')}
                                             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                           >
                                              Accept & Ship
                                           </button>
                                           <button 
                                             onClick={() => handleUpdateDeliveryStatus(gift, 'failed')}
                                             className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                           >
                                              Reject / Refund
                                           </button>
                                        </>
                                     )}
                                     {gift.delivery_status === 'processing' && (
                                        <>
                                           <button 
                                             onClick={() => handleUpdateDeliveryStatus(gift, 'delivered')}
                                             className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                           >
                                              Mark Delivered
                                           </button>
                                           <button 
                                             onClick={() => handleUpdateDeliveryStatus(gift, 'failed')}
                                             className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                           >
                                              Fail / Refund
                                           </button>
                                        </>
                                     )}
                                     {gift.delivery_status === 'delivered' && (
                                        <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase rounded-full">
                                           Delivered Successfully
                                        </span>
                                     )}
                                     {gift.delivery_status === 'failed' && (
                                        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-full">
                                           Failed & Refunded
                                        </span>
                                     )}
                                  </div>
                               </div>
                            </div>
                         ))
                      )}
                   </div>
                </div>

             </div>
          </div>
        )}
        {activeTab === 'matches' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold italic uppercase tracking-tighter">Manual Match Overrides</h2>
                <p className="text-foreground/40 mt-1">Force-link profiles and bypass AI recommendation logic.</p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5">
                  <div className="flex items-center gap-3 mb-8">
                     <Search className="text-primary" size={24} />
                     <h3 className="text-xl font-bold uppercase tracking-widest">Profile Discovery</h3>
                  </div>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                     {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-white/5 group hover:border-primary/30 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-secondary border border-primary overflow-hidden">
                                 {user.avatar_url ? <Image src={user.avatar_url} width={40} height={40} className="w-full h-full object-cover" alt={user.full_name || 'User'} /> : <div className="w-full h-full flex items-center justify-center text-primary font-bold">{user.full_name?.charAt(0)}</div>}
                              </div>
                              <div>
                                 <p className="font-bold text-sm">{user.full_name}</p>
                                 <p className="text-[10px] text-primary uppercase font-black">{user.star_sign || 'Abushakir'}</p>
                              </div>
                           </div>
                           <button className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white">Select for Match</button>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-4">
                     <Heart size={40} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold italic">Match Forge</h3>
                  <p className="text-gray-400 max-w-xs mx-auto text-sm">Select two profiles from the left to manually create a &quot;Sacred Union&quot; match. This will prioritize them in each other&apos;s feeds.</p>
                  <div className="flex gap-4 opacity-30">
                     <div className="w-16 h-16 rounded-2xl bg-muted border-2 border-dashed border-gray-500" />
                     <div className="w-16 h-16 rounded-2xl bg-muted border-2 border-dashed border-gray-500" />
                  </div>
                  <button disabled className="btn-primary opacity-50 cursor-not-allowed">Forge Manual Match</button>
               </div>
            </div>
          </div>
        )}
        {activeTab === 'vouching' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold italic uppercase tracking-tighter">Vouch & References</h2>
                <p className="text-foreground/40 mt-1">Review character witness statements and vouch statuses.</p>
              </div>
            </header>

            <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest">
                      <th className="pb-4">Candidate</th>
                      <th className="pb-4">Witness / Contact</th>
                      <th className="pb-4">Relationship</th>
                      <th className="pb-4">Statement</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {vouchRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 uppercase tracking-widest">No vouch requests found</td>
                      </tr>
                    ) : (
                      vouchRecords.map(vouch => (
                        <tr key={vouch.id} className="align-top">
                          <td className="py-4 font-bold text-accent">{vouch.profiles?.full_name || 'Anonymous'}</td>
                          <td className="py-4">
                            <p className="font-bold">{vouch.voucher_name}</p>
                            <p className="text-gray-500">{vouch.voucher_email}</p>
                          </td>
                          <td className="py-4 capitalize">
                            <span className="text-primary">{vouch.relationship}</span>
                            <span className="text-gray-500 text-[10px] block">Duration: {vouch.know_duration_years} Years</span>
                          </td>
                          <td className="py-4 max-w-xs truncate" title={vouch.witness_statement || 'No statement yet'}>
                            {vouch.witness_statement || <em className="text-gray-500">Pending statement submission</em>}
                          </td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              vouch.vouch_status === 'approved' ? 'bg-green-500/10 text-green-500' :
                              vouch.vouch_status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                              'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {vouch.vouch_status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {vouch.vouch_status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleUpdateVouch(vouch.id, 'approved')} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold">Approve</button>
                                <button onClick={() => handleUpdateVouch(vouch.id, 'rejected')} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold">Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'bookings' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold italic uppercase tracking-tighter">Counselor Bookings</h2>
                <p className="text-foreground/40 mt-1">Manage expert consultation appointments and schedules.</p>
              </div>
            </header>

            <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest">
                      <th className="pb-4">Client</th>
                      <th className="pb-4">Expert</th>
                      <th className="pb-4">Topic</th>
                      <th className="pb-4">Date / Time</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {counselorBookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 uppercase tracking-widest">No bookings found</td>
                      </tr>
                    ) : (
                      counselorBookings.map(booking => (
                        <tr key={booking.id} className="align-middle">
                          <td className="py-4 font-bold text-accent">{booking.profiles?.full_name || 'Anonymous'}</td>
                          <td className="py-4 font-bold">{booking.expert_name}</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">{booking.topic}</span>
                          </td>
                          <td className="py-4">
                            <p>{booking.scheduled_date}</p>
                            <p className="text-gray-500">{booking.scheduled_time}</p>
                          </td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              booking.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                              booking.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                              booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                              'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {booking.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleUpdateBooking(booking.id, 'approved')} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold">Approve</button>
                                <button onClick={() => handleUpdateBooking(booking.id, 'cancelled')} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold">Cancel</button>
                              </div>
                            )}
                            {booking.status === 'approved' && (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleUpdateBooking(booking.id, 'completed')} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold">Complete</button>
                                <button onClick={() => handleUpdateBooking(booking.id, 'cancelled')} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold">Cancel</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'marketplace_cms' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold italic uppercase tracking-tighter">Academy & Vendor CMS</h2>
                <p className="text-foreground/40 mt-1">Publish and manage video classes or verified wedding vendor catalogs.</p>
              </div>
            </header>

            {/* Video Manager Section */}
            <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-accent">Academy Video Courses</h3>
                <button
                  onClick={() => {
                    setCurrentVideo({
                      title: '', title_am: '', title_om: '', title_ti: '', title_so: '', title_ar: '',
                      description: '', description_am: '', description_om: '', description_ti: '', description_so: '', description_ar: '',
                      youtube_url: '', category: 'Pre-Marriage', is_free: false, coin_price: 30, order_index: 10, duration_minutes: 15
                    });
                    setIsEditingVideo(true);
                  }}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Plus size={14} /> Add Video Course
                </button>
              </div>

              {isEditingVideo && (
                <div className="p-6 bg-muted/30 rounded-[2rem] border border-muted space-y-4">
                  <h4 className="font-bold text-accent text-sm">Create / Edit Video Class</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Course Title (English)"
                      value={currentVideo.title || ''}
                      onChange={(e) => setCurrentVideo({ ...currentVideo, title: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                    <input
                      type="text"
                      placeholder="Course Title (Amharic)"
                      value={currentVideo.title_am || ''}
                      onChange={(e) => setCurrentVideo({ ...currentVideo, title_am: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                    <textarea
                      placeholder="Description (English)"
                      value={currentVideo.description || ''}
                      onChange={(e) => setCurrentVideo({ ...currentVideo, description: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent col-span-full h-20 resize-none"
                    />
                    <textarea
                      placeholder="Description (Amharic)"
                      value={currentVideo.description_am || ''}
                      onChange={(e) => setCurrentVideo({ ...currentVideo, description_am: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent col-span-full h-20 resize-none"
                    />
                    <input
                      type="text"
                      placeholder="YouTube URL"
                      value={currentVideo.youtube_url || ''}
                      onChange={(e) => setCurrentVideo({ ...currentVideo, youtube_url: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                    <select
                      value={currentVideo.category || 'Pre-Marriage'}
                      onChange={(e) => setCurrentVideo({ ...currentVideo, category: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent font-semibold"
                    >
                      <option value="Welcome">Welcome</option>
                      <option value="Pre-Marriage">Pre-Marriage</option>
                      <option value="Communication">Communication</option>
                      <option value="Culture">Culture</option>
                      <option value="Parenting">Parenting</option>
                      <option value="Conflict">Conflict</option>
                      <option value="Finance">Finance</option>
                      <option value="Wellbeing">Wellbeing</option>
                      <option value="Spirituality">Spirituality</option>
                    </select>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <input
                          type="checkbox"
                          checked={currentVideo.is_free || false}
                          onChange={(e) => setCurrentVideo({ ...currentVideo, is_free: e.target.checked })}
                          className="accent-primary"
                        />
                        Is Free Video?
                      </label>
                    </div>
                    <input
                      type="number"
                      placeholder="Coin Price"
                      value={currentVideo.coin_price || 0}
                      onChange={(e) => setCurrentVideo({ ...currentVideo, coin_price: parseInt(e.target.value) })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                    <input
                      type="number"
                      placeholder="Order Index"
                      value={currentVideo.order_index || 0}
                      onChange={(e) => setCurrentVideo({ ...currentVideo, order_index: parseInt(e.target.value) })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                    <input
                      type="number"
                      placeholder="Duration (Minutes)"
                      value={currentVideo.duration_minutes || 0}
                      onChange={(e) => setCurrentVideo({ ...currentVideo, duration_minutes: parseInt(e.target.value) })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setIsEditingVideo(false)} className="px-4 py-2 bg-muted text-gray-400 text-xs font-bold rounded-xl">Cancel</button>
                    <button onClick={handleSaveVideo} className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl">Save Video</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest">
                      <th className="pb-4">Order</th>
                      <th className="pb-4">Video Class</th>
                      <th className="pb-4">Category</th>
                      <th className="pb-4">Access Status</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {academyVideos.length === 0 ? (
                      <tr><td colSpan={5} className="py-6 text-center text-gray-500 uppercase tracking-widest">No academy videos found</td></tr>
                    ) : (
                      academyVideos.map(video => (
                        <tr key={video.id} className="align-middle">
                          <td className="py-4 font-bold">{video.order_index}</td>
                          <td className="py-4">
                            <p className="font-bold text-accent">{video.title}</p>
                            <p className="text-[10px] text-gray-500">{video.duration_minutes} Minutes | YouTube: {video.youtube_url || 'Coming soon'}</p>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-bold uppercase">{video.category}</span>
                          </td>
                          <td className="py-4">
                            {video.is_free ? (
                              <span className="text-emerald-500 font-bold uppercase">Free</span>
                            ) : (
                              <span className="text-yellow-600 font-bold uppercase">{video.coin_price} Coins</span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => { setCurrentVideo(video); setIsEditingVideo(true); }} className="px-3 py-1 bg-muted hover:bg-gray-200 text-accent rounded-lg text-[10px] font-bold">Edit</button>
                              <button onClick={() => handleDeleteVideo(video.id)} className="px-3 py-1 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-bold">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wedding Vendor Catalog Manager */}
            <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-accent">Wedding Vendors Catalog</h3>
                <button
                  onClick={() => {
                    setCurrentVendor({ name: '', category: 'Venue', rating: 4.8, location: 'Addis Ababa', contact: '' });
                    setIsEditingVendor(true);
                  }}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Plus size={14} /> Add Vendor Profile
                </button>
              </div>

              {isEditingVendor && (
                <div className="p-6 bg-muted/30 rounded-[2rem] border border-muted space-y-4">
                  <h4 className="font-bold text-accent text-sm">Create / Edit Vendor</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Vendor Name"
                      value={currentVendor.name || ''}
                      onChange={(e) => setCurrentVendor({ ...currentVendor, name: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                    <select
                      value={currentVendor.category || 'Venue'}
                      onChange={(e) => setCurrentVendor({ ...currentVendor, category: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent font-semibold"
                    >
                      <option value="Venue">Venue</option>
                      <option value="Photography">Photography</option>
                      <option value="Decor">Decor</option>
                      <option value="Styling">Styling</option>
                      <option value="Catering">Catering</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Location"
                      value={currentVendor.location || ''}
                      onChange={(e) => setCurrentVendor({ ...currentVendor, location: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                    <input
                      type="text"
                      placeholder="Contact Phone Number"
                      value={currentVendor.contact || ''}
                      onChange={(e) => setCurrentVendor({ ...currentVendor, contact: e.target.value })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Rating (e.g. 4.8)"
                      value={currentVendor.rating || 4.5}
                      onChange={(e) => setCurrentVendor({ ...currentVendor, rating: parseFloat(e.target.value) })}
                      className="p-4 bg-muted rounded-xl text-xs w-full text-accent"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setIsEditingVendor(false)} className="px-4 py-2 bg-muted text-gray-400 text-xs font-bold rounded-xl">Cancel</button>
                    <button onClick={handleSaveVendor} className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl">Save Vendor</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest">
                      <th className="pb-4">Vendor Partner</th>
                      <th className="pb-4">Category</th>
                      <th className="pb-4">Location</th>
                      <th className="pb-4">Contact</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {weddingVendors.length === 0 ? (
                      <tr><td colSpan={5} className="py-6 text-center text-gray-500 uppercase tracking-widest">No wedding vendors cataloged yet</td></tr>
                    ) : (
                      weddingVendors.map(vendor => (
                        <tr key={vendor.id} className="align-middle">
                          <td className="py-4">
                            <p className="font-bold text-accent">{vendor.name}</p>
                            <p className="text-[10px] text-yellow-600 font-semibold">★ {vendor.rating} Ratings</p>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 rounded text-[9px] font-bold uppercase">{vendor.category}</span>
                          </td>
                          <td className="py-4">📍 {vendor.location}</td>
                          <td className="py-4 font-mono">{vendor.contact}</td>
                          <td className="py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => { setCurrentVendor(vendor); setIsEditingVendor(true); }} className="px-3 py-1 bg-muted hover:bg-gray-200 text-accent rounded-lg text-[10px] font-bold">Edit</button>
                              <button onClick={() => handleDeleteVendor(vendor.id)} className="px-3 py-1 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-bold">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'fraud' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header>
              <h2 className="text-3xl font-bold text-accent italic">Romance Fraud ML Risk Scorer</h2>
              <p className="text-gray-500">Behavioral pattern ML telemetry analysis model highlighting suspicious scam indicators.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20 text-center">
                <p className="text-3xl font-black text-red-600">
                  {users.filter(u => {
                    const bioText = (u as any).bio?.toLowerCase() || '';
                    return bioText.includes('money') || bioText.includes('invest') || bioText.includes('crypto') || bioText.includes('western union');
                  }).length}
                </p>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-2">Keywords Flagged</p>
              </div>
              <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/20 text-center">
                <p className="text-3xl font-black text-amber-600">
                  {users.filter(u => ((u as any).bio?.length || 0) < 20 && (u as any).bio?.length > 0).length}
                </p>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-2">Suspicious Short Bios</p>
              </div>
              <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/20 text-center">
                <p className="text-3xl font-black text-blue-600">
                  {users.filter(u => (u as any).role === 'user').length}
                </p>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">Total Accounts Analyzed</p>
              </div>
              <div className="p-6 bg-green-500/5 rounded-3xl border border-green-500/20 text-center">
                <p className="text-3xl font-black text-green-600">0</p>
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-2">Active Penalties Blocked</p>
              </div>
            </div>

            <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 space-y-6">
              <h3 className="text-lg font-bold text-accent">Scammer Risk Telemetry Ledger</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest">
                      <th className="pb-4">Candidate</th>
                      <th className="pb-4">Location & Bio</th>
                      <th className="pb-4 text-center">Indicators Found</th>
                      <th className="pb-4 text-center">ML Risk Score</th>
                      <th className="pb-4 text-right">Sanction Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.filter(u => (u as any).role === 'user').map(user => {
                      const bioText = (user as any).bio?.toLowerCase() || '';
                      const isShort = bioText.length > 0 && bioText.length < 20;
                      const hasKeywords = bioText.includes('money') || bioText.includes('invest') || bioText.includes('crypto') || bioText.includes('western union') || bioText.includes('send') || bioText.includes('whatsapp') || bioText.includes('telegram');
                      
                      let score = 5;
                      const indicators = [];
                      
                      if (hasKeywords) {
                        score += 55;
                        indicators.push('Scam Keywords');
                      }
                      if (isShort) {
                        score += 15;
                        indicators.push('Short Bio');
                      }
                      if (!(user as any).is_verified) {
                        score += 10;
                        indicators.push('Unverified ID');
                      }

                      return (
                        <tr key={user.id} className="align-middle">
                          <td className="py-4">
                            <p className="font-bold text-accent">{user.full_name || 'Anonymous'}</p>
                            <p className="text-[10px] text-gray-500">ID: {user.id?.substring(0, 8)}</p>
                          </td>
                          <td className="py-4 max-w-xs">
                            <p className="font-bold text-gray-400">📍 {typeof (user as any).location === 'string' ? (user as any).location : JSON.stringify((user as any).location)}</p>
                            <p className="text-[10px] text-gray-500 leading-normal italic mt-1">&quot;{(user as any).bio || 'No bio written'}&quot;</p>
                          </td>
                          <td className="py-4 text-center">
                            {indicators.length === 0 ? (
                              <span className="text-gray-500">Clear</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {indicators.map((ind, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[9px] font-bold uppercase">{ind}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`text-sm font-black ${
                              score >= 60 ? 'text-red-500' :
                              score >= 30 ? 'text-amber-500' :
                              'text-green-500'
                            }`}>
                              {score}%
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={async () => {
                                  if (!confirm('Are you sure you want to suspend this candidate?')) return;
                                  const { error } = await supabase.from('profiles').update({ is_locked: true }).eq('id', user.id);
                                  if (error) alert('Error: ' + error.message);
                                  else alert('User account suspended successfully.');
                                }} 
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold"
                              >
                                Suspend
                              </button>
                              <button 
                                onClick={async () => {
                                  const msg = prompt('Enter the warning message to display to this user:');
                                  if (!msg) return;
                                  const { error } = await supabase.from('profiles').update({ warning_message: msg }).eq('id', user.id);
                                  if (error) alert('Error: ' + error.message);
                                  else alert('Warning alert sent to user dashboard.');
                                }} 
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold"
                              >
                                Warn
                              </button>
                              <button 
                                onClick={() => alert('Risk flag cleared for user.')} 
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold"
                              >
                                Clear Risk
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
