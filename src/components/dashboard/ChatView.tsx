'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  CheckCheck,
  User,
  Heart,
  Lightbulb,
  Languages,
  Eye,
  EyeOff
} from 'lucide-react';
import Image from 'next/image';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  translations?: Record<string, string>;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  star_sign: string;
}

export default function ChatView() {
  const [matches, setMatches] = useState<Profile[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Fetch potential matches (for now, other users)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(10);
        
        if (profiles) setMatches(profiles);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedMatch || !currentUser) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedMatch.id}),and(sender_id.eq.${selectedMatch.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === selectedMatch.id) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMatch, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const suggestIceBreaker = () => {
    const suggestions = [
      "I see we both value tradition. How does your family celebrate holidays?",
      "Your profile mentions a love for our culture. What's your favorite traditional dish?",
      "I'm looking for someone who values family highly. What does a perfect family weekend look like to you?",
      "Your star sign is fascinating. Do you believe our compatibility is written in the stars?",
      "What is the one traditional value you'd never want to lose in a modern world?"
    ];
    const random = suggestions[Math.floor(Math.random() * suggestions.length)];
    setNewMessage(random);
  };

  const handleTranslate = async (messageId: string, targetLang: string) => {
    // Simulate AI Translation
    // In a real app, this would call an Edge Function or AI API
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    if (msg.translations?.[targetLang]) {
        // Toggle back to original (simulated by clearing for this view)
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, translations: { ...m.translations, [targetLang]: '' } } : m));
        return;
    }

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          translations: {
            ...m.translations,
            [targetLang]: `[AI ${targetLang.toUpperCase()}]: ${m.content} (Translated)`
          }
        };
      }
      return m;
    }));

    // Persist to DB
    await supabase.from('messages').update({
      translations: {
        ...msg.translations,
        [targetLang]: `[AI ${targetLang.toUpperCase()}]: ${msg.content} (Translated)`
      }
    }).eq('id', messageId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || !currentUser) return;

    const msgData = {
      sender_id: currentUser.id,
      receiver_id: selectedMatch.id,
      content: newMessage.trim(),
    };

    const { data, error } = await supabase.from('messages').insert(msgData).select().single();

    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading family chat...</div>;

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-[2.5rem] overflow-hidden border border-muted shadow-2xl">
      {/* Sidebar - Matches */}
      <aside className="w-full md:w-80 border-r border-muted flex flex-col">
        <div className="p-6 border-b border-muted">
          <h2 className="text-xl font-bold text-accent mb-4 tracking-tighter uppercase">Matches</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search matches..." 
              className="w-full pl-10 pr-4 py-3 bg-muted/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {matches.length === 0 ? (
             <div className="p-8 text-center text-gray-400 text-sm">No matches yet. Keep exploring!</div>
          ) : (
            matches.map((match) => (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all group ${
                  selectedMatch?.id === match.id ? 'bg-primary/10 border-primary/20 bg-primary/5' : 'hover:bg-muted/30'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-secondary border-2 border-primary overflow-hidden">
                    {match.avatar_url ? (
                      <Image src={match.avatar_url} alt={match.full_name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary"><User size={24} /></div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-accent group-hover:text-primary transition-colors">{match.full_name}</p>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">{match.star_sign || 'Abushakir Match'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#FDFBF9]">
        {selectedMatch ? (
          <>
            {/* Header */}
            <header className="p-6 bg-white border-b border-muted flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary border border-primary overflow-hidden">
                  <Image src={selectedMatch.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=200'} alt="" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-accent">{selectedMatch.full_name}</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Now</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <button className="hover:text-primary transition-colors"><Phone size={20} /></button>
                <button className="hover:text-primary transition-colors"><Video size={20} /></button>
                <button className="hover:text-primary transition-colors"><MoreVertical size={20} /></button>
              </div>
            </header>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-10 space-y-6 scroll-smooth"
            >
              <div className="flex flex-col items-center mb-8">
                 <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10 text-center max-w-xs">
                    <Heart size={20} className="text-primary mx-auto mb-2 fill-primary/20" />
                    <p className="text-xs text-accent font-medium mt-1 uppercase tracking-tighter">Your Abushakir Compatibility is High!</p>
                    <p className="text-[10px] text-gray-400 mt-1">Start a conversation with traditional values.</p>
                 </div>
              </div>

              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] group relative ${msg.sender_id === currentUser?.id ? 'items-end' : 'items-start'}`}>
                    <div className={`
                      px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm
                      ${msg.sender_id === currentUser?.id 
                        ? 'bg-accent text-white rounded-tr-none' 
                        : 'bg-white text-gray-600 rounded-tl-none border border-muted'
                      }
                    `}>
                      {msg.translations?.[locale] || msg.content}
                      
                      {/* Translation Toggle */}
                      <button 
                        onClick={() => handleTranslate(msg.id, locale)}
                        className={`absolute -bottom-6 ${msg.sender_id === currentUser?.id ? 'right-0' : 'left-0'} p-2 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all hover:text-primary`}
                      >
                        <Languages size={10} /> {msg.translations?.[locale] ? 'Original' : 'Translate to ' + locale}
                      </button>
                    </div>
                    <div className={`flex items-center gap-2 mt-2 px-2 text-[10px] ${msg.sender_id === currentUser?.id ? 'justify-end text-gray-400' : 'justify-start text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_id === currentUser?.id && <CheckCheck size={14} className="text-primary" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-muted space-y-4">
              <div className="flex gap-2">
                 <button 
                  type="button"
                  onClick={suggestIceBreaker}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                 >
                    <Lightbulb size={12} /> Suggest AI Ice-Breaker
                 </button>
              </div>
              <div className="flex items-center gap-4 bg-muted/30 rounded-[2rem] p-2 pl-6 focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-muted">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message with respect..." 
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm text-accent py-3"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-primary/20"
                >
                  <Send size={20} className="ml-1" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
             <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-4">
                <Heart size={48} className="text-primary fill-primary/10 animate-pulse" />
             </div>
              <div>
                 <h3 className="text-3xl font-black text-accent mb-2 italic tracking-tighter">Select a Match</h3>
                 <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
                   Connect with your potential partner within the Beteseb family. Secure, real-time, and privacy-focused messaging.
                 </p>
              </div>
             <div className="grid grid-cols-2 gap-4 mt-8 opacity-40">
                <div className="p-4 bg-white rounded-3xl border border-muted flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center"><CheckCheck size={16} /></div>
                   <span className="text-[10px] font-bold uppercase">Encrypted</span>
                </div>
                <div className="p-4 bg-white rounded-3xl border border-muted flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><User size={16} /></div>
                   <span className="text-[10px] font-bold uppercase">Private</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
