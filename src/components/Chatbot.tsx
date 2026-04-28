'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  Headphones, 
  Loader2, 
  ChevronDown
} from 'lucide-react';
import { aiSupport, ChatMessage } from '@/lib/ai-support';
import { supabase } from '@/lib/supabase';

export default function Chatbot() {
  const t = useTranslations('Chatbot');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'ai' | 'ticket'>('ai');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadReplies, setUnreadReplies] = useState(0);
  
  // Ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchUnreadReplies(user.id);
      }
    };
    const fetchUnreadReplies = async (uid: string) => {
      const { data } = await supabase
        .from('support_replies')
        .select('*, support_tickets!inner(user_id)')
        .eq('support_tickets.user_id', uid)
        .eq('is_read', false);
      if (data) setUnreadReplies(data.length);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([
        { role: 'assistant', content: t('welcome') }
      ]);
    }
  }, [isOpen, t, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiSupport.chat([...messages, userMessage], locale);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTicket(true);
    try {
      await aiSupport.createTicket({
        user_id: userId || undefined,
        subject: ticketSubject,
        message: ticketMessage,
        language: locale
      });
      setTicketSuccess(true);
      setTimeout(() => {
        setMode('ai');
        setTicketSuccess(false);
        setTicketSubject('');
        setTicketMessage('');
      }, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      {/* Floating Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadReplies(0); // Clear on open
        }}
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
        title={isOpen ? "Close Chat" : "Open Chat"}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-white text-accent' : 'bg-primary text-white'
        }`}
      >
        {isOpen ? <ChevronDown size={28} /> : <MessageSquare size={28} />}
        {!isOpen && unreadReplies > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-accent text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-bounce font-black">
            {unreadReplies}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[400px] max-w-[90vw] h-[600px] max-h-[80vh] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-500">
          
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-accent to-accent/90 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Bot size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest">{t('botName')}</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold opacity-60 tracking-wider uppercase">{t('status')}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              aria-label="Close Chat"
              title="Close Chat"
              className="opacity-60 hover:opacity-100 transition-opacity p-2"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Switcher (Tab) */}
          <div className="flex p-2 bg-gray-50/50">
            <button 
              onClick={() => setMode('ai')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'ai' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
            >
              AI Assistant
            </button>
            <button 
              onClick={() => setMode('ticket')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'ticket' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
            >
              Talk to Human
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
            {mode === 'ai' ? (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-muted text-accent rounded-tl-none border border-gray-100'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-4 rounded-3xl rounded-tl-none flex gap-2">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                {ticketSuccess ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-accent">Ticket Submitted!</h4>
                      <p className="text-xs text-gray-400 mt-1">Our team will respond within 24 hours.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-blue-700">
                      <Headphones size={20} className="shrink-0" />
                      <p className="text-xs leading-relaxed font-medium">
                        Send a direct message to our support team. We usually respond within a few hours.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subject</label>
                      <input 
                        type="text" 
                        required
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className="w-full p-4 bg-muted border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary transition-all"
                        placeholder="e.g. Payment Issue"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Message</label>
                      <textarea 
                        required
                        rows={5}
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        className="w-full p-4 bg-muted border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary transition-all resize-none"
                        placeholder="Describe your issue in detail..."
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmittingTicket}
                      className="w-full bg-accent text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingTicket ? <Loader2 className="animate-spin" size={16} /> : 'Submit Support Ticket'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Input (only for AI mode) */}
          {mode === 'ai' && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('placeholder')}
                  className="w-full py-4 pl-6 pr-14 bg-white border border-gray-100 rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner"
                />
                <button
                  onClick={handleSend}
                  aria-label="Send Message"
                  title="Send Message"
                  className="absolute right-2 p-3 bg-primary text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 opacity-30">
                <Sparkles size={10} />
                <span className="text-[8px] font-bold uppercase tracking-widest">AI Powered by Beteseb Engine</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Add these to lucide-react if missing above
function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
