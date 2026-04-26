'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
  CreditCard,
  Globe,
  Link,
  MessageSquare,
  ShieldAlert,
  Eye,
  EyeOff,
  Film,
  BookOpen,
  FileText,
  Trash2,
  Edit
} from 'lucide-react';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('cms');
  const [settings, setSettings] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Messaging & Staff State
  const [users, setUsers] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Site Posts State
  const [posts, setPosts] = useState<any[]>([]);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [currentPost, setCurrentPost] = useState<any>({
    title: '',
    slug: '',
    content: '',
    video_url: '',
    image_url: '',
    category: 'education',
    is_published: false
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
    banks_etb: any[];
    banks_usd: any[];
    pricing_usd: {
      "1m": number;
      "3m": number;
      "6m": number;
      "12m": number;
      "class": number;
      trial_days?: number;
    };
    pricing_etb: {
      "1m": number;
      "3m": number;
      "6m": number;
      "12m": number;
      "class": number;
      trial_days?: number;
    };
    website_url: string;
    [key: string]: any; // Allow index access for social links
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
    banks_etb: [
      { bank_name: '', account_number: '', account_holder: '' },
      { bank_name: '', account_number: '', account_holder: '' }
    ],
    banks_usd: [
      { bank_name: '', account_number: '', account_holder: '' },
      { bank_name: '', account_number: '', account_holder: '' }
    ],
    pricing_usd: { "1m": 0, "3m": 0, "6m": 0, "12m": 0, "class": 0, "trial_days": 3 },
    pricing_etb: { "1m": 0, "3m": 0, "6m": 0, "12m": 0, "class": 0, "trial_days": 3 },
    website_url: ''
  });

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
            banks_etb: data.bank_details?.etb || [
              { bank_name: '', account_number: '', account_holder: '' },
              { bank_name: '', account_number: '', account_holder: '' }
            ],
            banks_usd: data.bank_details?.usd || [
              { bank_name: '', account_number: '', account_holder: '' },
              { bank_name: '', account_number: '', account_holder: '' }
            ],
            pricing_usd: data.pricing_usd || { "1m": 50, "3m": 120, "6m": 200, "12m": 350, "class": 25 },
            pricing_etb: data.pricing_etb || { "1m": 500, "3m": 1200, "6m": 2000, "12m": 3500, "class": 250 }
          });
        }
      } else if (activeTab === 'pricing') {
        const { data } = await supabase.from('settings').select('*').limit(1).single();
        if (data) {
          setSettings(data);
          setCmsForm({
            ...cmsForm, // Keep other fields
            pricing_usd: data.pricing_usd || { "1m": 50, "3m": 120, "6m": 200, "12m": 350, "class": 25 },
            pricing_etb: data.pricing_etb || { "1m": 500, "3m": 1200, "6m": 2000, "12m": 3500, "class": 250 }
          });
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
      } else if (activeTab === 'matches') {
        const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, star_sign').limit(100);
        if (data) setUsers(data);
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
    } catch (err: any) {
      alert('Error saving post: ' + err.message);
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
        pricing_etb: cmsForm.pricing_etb
      })
      .eq('id', settings.id);

    if (error) alert('Error saving: ' + error.message);
    else alert('CMS Content Deployed Successfully!');
    setIsSaving(false);
  };

  const handleUpdateVerification = async (id: string, status: string) => {
    await supabase.from('verifications').update({ status }).eq('id', id);
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  };

  const handleUpdatePayment = async (id: string, status: string) => {
    await supabase.from('payments').update({ status }).eq('id', id);
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsSaving(true);
    
    // In a real app, this would be a bulk insert or a background job
    // For now, we fetch all users and send DMs (limited for safety)
    const { data: allUsers } = await supabase.from('profiles').select('id').limit(100);
    
    if (allUsers) {
      const messages = allUsers.map(u => ({
        sender_id: (supabase as any).auth.user()?.id || settings.admin_id,
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

  const handleUpdateAdminPassword = async () => {
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

  const MOCK_VERIFICATIONS = [
    { id: 'mock-1', profiles: { full_name: 'Kidus Yohannes' }, doc_type: 'Passport', status: 'pending' },
    { id: 'mock-2', profiles: { full_name: 'Hana Belayneh' }, doc_type: 'id', status: 'pending' }
  ];

  const displayVerifications = verifications.length > 0 ? verifications : MOCK_VERIFICATIONS;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content')
        .getPublicUrl(filePath);

      setCmsForm({ ...cmsForm, logo_url: publicUrl });
      alert('Logo uploaded! Click Deploy to save changes.');
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
     return (
        <div className="min-h-screen bg-accent flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518112166137-85899e9000ab?auto=format&fit=crop&q=80&w=2000")' }}>
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
                    <img src="/logo.png" alt="Beteseb Logo" className="h-10 opacity-30 grayscale" />
                 </div>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex admin-dark">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-card text-card-foreground flex flex-col p-6 shadow-2xl border-r border-border">
        <div className="mb-12">
          <Link href="/" className="flex items-center gap-2 text-primary group decoration-transparent">
             <Heart size={24} className="fill-primary group-hover:scale-110 transition-transform" />
             <span className="text-2xl font-bold tracking-tighter uppercase">BETESEB</span>
          </Link>
          <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest opacity-50">System Control</p>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { id: 'stats', icon: BarChart3, label: 'Analytics' },
            { id: 'cms', icon: Layout, label: 'Standard CMS' },
            { id: 'business', icon: SettingsIcon, label: 'Business Settings' },
            { id: 'social_feed', icon: Globe, label: 'Social Presence' },
            { id: 'verification', icon: ShieldCheck, label: 'Verifications' },
            { id: 'payments', icon: Heart, label: 'Payment Review' },
            { id: 'messaging', icon: MessageSquare, label: 'Communication' },
            { id: 'posts', icon: Film, label: 'Articles & News' },
            { id: 'pricing', icon: CreditCard, label: 'Pricing & Trial' },
            { id: 'matches', icon: Heart, label: 'Manual Matches' },
            { id: 'staff', icon: Users, label: 'Manage Staff' },
            { id: 'security', icon: ShieldAlert, label: 'Access Control' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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

      {/* Admin Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
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
              <div key={settings.id} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5 h-fit">
                    <div className="flex items-center gap-3 mb-10">
                       <Layout className="text-primary" size={24} />
                       <h3 className="text-xl font-bold uppercase tracking-widest">Site Identity</h3>
                    </div>
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Global Logo</label>
                          <div className="flex items-center gap-6 p-6 bg-background rounded-3xl border border-white/5">
                             {cmsForm.logo_url ? (
                                <img src={cmsForm.logo_url} className="h-12 object-contain" alt="Logo" />
                             ) : (
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-foreground/20 italic text-[10px]">No Logo</div>
                             )}
                             <input type="file" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                             <label htmlFor="logo-upload" className="btn-secondary py-3 text-[10px] cursor-pointer">Choose Image</label>
                          </div>
                       </div>

                       <label className="block">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Hero Headline</span>
                          <input 
                             type="text" 
                             value={cmsForm.hero_title}
                             onChange={(e) => setCmsForm({...cmsForm, hero_title: e.target.value})}
                             className="input-premium bg-background" 
                          />
                       </label>
                       <label className="block">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Hero Sub-headline</span>
                          <textarea 
                             rows={3}
                             value={cmsForm.hero_subtitle}
                             onChange={(e) => setCmsForm({...cmsForm, hero_subtitle: e.target.value})}
                             className="input-premium bg-background resize-none" 
                          />
                       </label>
                       <label className="block">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Footer Mission Statement</span>
                          <textarea 
                             rows={3}
                             value={cmsForm.footer_description}
                             onChange={(e) => setCmsForm({...cmsForm, footer_description: e.target.value})}
                             className="input-premium bg-background resize-none" 
                          />
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

                       <div className="pt-8 border-t border-white/5">
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6">Payment Routes</h4>
                           {/* Financial accounts */}
                           <div className="space-y-4">
                              <div className="p-6 bg-background rounded-[2rem] border border-white/5">
                                 <p className="text-[10px] font-bold text-foreground/40 mb-3">ETB - Commercial Bank</p>
                                 <input type="text" value={cmsForm.banks_etb[0]?.account_number || ''} onChange={(e) => {
                                    const newBanks = [...cmsForm.banks_etb];
                                    if (!newBanks[0]) newBanks[0] = { bank_name: 'CBE', account_number: '', account_holder: '' };
                                    newBanks[0].account_number = e.target.value;
                                    setCmsForm({...cmsForm, banks_etb: newBanks});
                                 }} placeholder="Account Number" className="input-premium bg-card mb-2" />
                              </div>
                              <div className="p-6 bg-background rounded-[2rem] border border-white/5">
                                 <p className="text-[10px] font-bold text-foreground/40 mb-3">USD - Swift/Wise</p>
                                 <input type="text" value={cmsForm.banks_usd[0]?.account_number || ''} onChange={(e) => {
                                    const newBanks = [...cmsForm.banks_usd];
                                    if (!newBanks[0]) newBanks[0] = { bank_name: 'USD Bank', account_number: '', account_holder: '' };
                                    newBanks[0].account_number = e.target.value;
                                    setCmsForm({...cmsForm, banks_usd: newBanks});
                                 }} placeholder="IBAN / Swift" className="input-premium bg-card mb-2" />
                              </div>
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
                 disabled={isSaving || !settings || (currentUser?.role !== 'superadmin' && process.env.NODE_ENV !== 'development')}
                 className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <Plus size={20} /> {isSaving ? 'Saving...' : 'Save Business Details'}
              </button>
            </header>

            {currentUser?.role !== 'superadmin' && process.env.NODE_ENV !== 'development' ? (
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

        {activeTab === 'social_feed' && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <header className="flex justify-between items-end">
               <div>
                 <h2 className="text-3xl font-bold italic uppercase tracking-tighter">Social Presence</h2>
                 <p className="text-foreground/40 mt-1">Automatic icon linking for external platforms.</p>
               </div>
               <button onClick={handleSaveCMS} className="btn-primary">Deploy Updates</button>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5">
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-10">Main Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {[
                         { id: 'facebook', label: 'Facebook' },
                         { id: 'youtube', label: 'YouTube' },
                         { id: 'tiktok', label: 'TikTok' },
                         { id: 'instagram', label: 'Instagram' },
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
                                  placeholder={`https://${social.id}.com/...`}
                                  value={(cmsForm as any)[social.id]}
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
                      <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">Live Preview</h3>
                      <p className="text-[10px] text-foreground/40 uppercase mb-8">Generated Footer Icons</p>
                      <div className="flex flex-wrap gap-4">
                         {['facebook', 'youtube', 'tiktok', 'instagram', 'telegram', 'whatsapp', 'linkedin', 'twitter'].map(id => (
                            (cmsForm as any)[id] && (
                               <div key={id} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary transition-all">
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
                 <h2 className="text-3xl font-bold italic uppercase tracking-tighter">Pricing & Trial</h2>
                 <p className="text-foreground/40 mt-1">Control subscription plans and free trial duration.</p>
               </div>
               <button onClick={handleSaveCMS} className="btn-primary">Deploy Updates</button>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5">
                 <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">Trial Logic</h3>
                 <label className="block">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Free Trial Days</span>
                    <input 
                      type="number" 
                      value={(cmsForm.pricing_usd as any)?.trial_days || 3}
                      onChange={(e) => setCmsForm({
                         ...cmsForm, 
                         pricing_usd: { ...cmsForm.pricing_usd, trial_days: parseInt(e.target.value) },
                         pricing_etb: { ...cmsForm.pricing_etb, trial_days: parseInt(e.target.value) }
                      })}
                      className="input-premium bg-background mt-2"
                    />
                 </label>
               </div>

               <div className="bg-card p-10 rounded-[3rem] shadow-2xl border border-white/5">
                 <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">USD Pricing ($)</h3>
                 <div className="space-y-4">
                    {['1m', '3m', '6m', '12m'].map(plan => (
                       <label key={plan} className="flex items-center gap-4">
                          <span className="text-[10px] w-12 font-bold text-foreground/40 uppercase tracking-widest">{plan}</span>
                          <input 
                            type="number" 
                            value={(cmsForm.pricing_usd as any)[plan]}
                            onChange={(e) => setCmsForm({
                               ...cmsForm, 
                               pricing_usd: { ...cmsForm.pricing_usd, [plan]: parseInt(e.target.value) }
                            })}
                            className="input-premium bg-background flex-1"
                          />
                       </label>
                    ))}
                 </div>
               </div>
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
                       {displayVerifications.map((req, i) => (
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
                                       <button onClick={() => handleUpdateVerification(req.id, 'verified')} className="p-3 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"><Check size={18} /></button>
                                       <button onClick={() => handleUpdateVerification(req.id, 'rejected')} className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={18} /></button>
                                    </>
                                  )}
                                  <button className="p-3 bg-accent/10 text-accent rounded-xl hover:bg-accent hover:text-white transition-all shadow-sm"><Search size={18} /></button>
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
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase">Receipt</th>
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase">Status</th>
                          <th className="p-6 text-xs font-bold text-gray-400 uppercase text-center">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {payments.length === 0 ? (
                         <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">No payment requests found.</td></tr>
                       ) : (
                         payments.map((p) => (
                           <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-6 font-bold text-accent">{p.profiles?.full_name}</td>
                              <td className="p-6">
                                 <a href={p.receipt_url} target="_blank" className="text-primary font-semibold flex items-center gap-1 hover:underline">
                                    <Video size={14} /> View Receipt
                                 </a>
                              </td>
                              <td className="p-6">
                                 <span className={`font-bold text-sm ${p.status === 'approved' ? 'text-green-500' : p.status === 'rejected' ? 'text-red-500' : 'text-primary'}`}>
                                    {p.status.toUpperCase()}
                                 </span>
                              </td>
                              <td className="p-6">
                                 <div className="flex gap-2 justify-center">
                                    {p.status === 'pending' && (
                                       <>
                                          <button onClick={() => handleUpdatePayment(p.id, 'approved')} className="p-3 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"><Check size={18} /></button>
                                          <button onClick={() => handleUpdatePayment(p.id, 'rejected')} className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={18} /></button>
                                       </>
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
                     <button onClick={() => setIsEditingPost(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
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
                           <input type="text" value={currentPost.video_url} onChange={(e) => setCurrentPost({...currentPost, video_url: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner" placeholder="https://youtube.com/watch?v=..." />
                        </label>
                        <label className="block">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Featured Image URL</span>
                           <input type="text" value={currentPost.image_url} onChange={(e) => setCurrentPost({...currentPost, image_url: e.target.value})} className="mt-2 block w-full p-4 bg-muted rounded-2xl border-transparent focus:ring-primary focus:bg-white transition-all shadow-inner" placeholder="https://..." />
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
                               <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
                               <button onClick={() => { setCurrentPost(post); setIsEditingPost(true); }} className="flex-1 p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-xs">
                                  <Edit size={16} /> Edit
                               </button>
                               <button onClick={() => handleDeletePost(post.id)} className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all">
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

         {activeTab === 'staff' && (
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
                                 <button onClick={() => handleUpdateRole(user.id, 'moderator')} className="text-[10px] font-bold px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white">Moderator</button>
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
                                 {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary font-bold">{user.full_name?.charAt(0)}</div>}
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
                  <p className="text-gray-400 max-w-xs mx-auto text-sm">Select two profiles from the left to manually create a "Sacred Union" match. This will prioritize them in each other's feeds.</p>
                  <div className="flex gap-4 opacity-30">
                     <div className="w-16 h-16 rounded-2xl bg-muted border-2 border-dashed border-gray-500" />
                     <div className="w-16 h-16 rounded-2xl bg-muted border-2 border-dashed border-gray-500" />
                  </div>
                  <button disabled className="btn-primary opacity-50 cursor-not-allowed">Forge Manual Match</button>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
