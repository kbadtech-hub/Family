'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Users, 
  HelpCircle, 
  BookOpen, 
  Calendar, 
  CreditCard,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { 
  AppNotification, 
  NotificationCategory, 
  getAggregatedNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '@/lib/notifications';

interface NotificationDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  locale?: string;
}

export default function NotificationDrawerModal({
  isOpen,
  onClose,
  userId,
  locale = 'am'
}: NotificationDrawerModalProps) {
  const [activeTab, setActiveTab] = useState<NotificationCategory | 'all'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadNotifications = async () => {
      setLoading(true);
      const data = await getAggregatedNotifications(userId, activeTab);
      setNotifications(data);
      setLoading(false);
    };

    loadNotifications();
  }, [isOpen, userId, activeTab]);

  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    if (!id.startsWith('synth-')) {
      await markNotificationAsRead(id);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (userId) {
      await markAllNotificationsAsRead(userId);
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'social':
        return <Users size={18} className="text-blue-500" />;
      case 'support':
        return <HelpCircle size={18} className="text-amber-500" />;
      case 'course':
        return <BookOpen size={18} className="text-emerald-500" />;
      case 'appointment':
        return <Calendar size={18} className="text-purple-500" />;
      case 'subscription':
        return <CreditCard size={18} className="text-primary" />;
      default:
        return <Bell size={18} className="text-primary" />;
    }
  };

  const tabs: { id: NotificationCategory | 'all'; labelAm: string; labelEn: string }[] = [
    { id: 'all', labelAm: 'ሁሉም', labelEn: 'All' },
    { id: 'social', labelAm: 'ማህበራዊ', labelEn: 'Social' },
    { id: 'support', labelAm: 'ድጋፍ', labelEn: 'Support' },
    { id: 'course', labelAm: 'ኮርሶች', labelEn: 'Courses' },
    { id: 'appointment', labelAm: 'ቀጠሮዎች', labelEn: 'Appointments' },
    { id: 'subscription', labelAm: 'ደንበኝነት', labelEn: 'Subscriptions' }
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
      {/* Click Backdrop to Close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-accent">
                {locale === 'am' ? 'ማሳወቂያዎች' : 'Notifications'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {unreadCount > 0 
                  ? (locale === 'am' ? `${unreadCount} ያልተነበቡ ማሳወቂያዎች` : `${unreadCount} unread notifications`)
                  : (locale === 'am' ? 'ሁሉም ተነበዋል' : 'All notifications read')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="p-2 hover:bg-muted text-gray-500 hover:text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                title={locale === 'am' ? 'ሁሉንም እንደተነበበ አድርግ' : 'Mark all as read'}
              >
                <CheckCheck size={16} />
                <span className="hidden sm:inline">{locale === 'am' ? 'ሁሉንም አንብብ' : 'Mark All Read'}</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-accent rounded-xl hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-3 bg-muted/40 overflow-x-auto scrollbar-none border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'text-gray-600 hover:bg-white hover:text-accent'
              }`}
            >
              {tab.labelAm}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FDFBF9]">
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-bold animate-pulse text-sm">
              {locale === 'am' ? 'ማሳወቂያዎች በመጫን ላይ...' : 'Loading notifications...'}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={28} />
              </div>
              <p className="text-sm font-bold text-gray-500">
                {locale === 'am' ? 'ምንም አይነት ማሳወቂያ የለም።' : 'No notifications available.'}
              </p>
            </div>
          ) : (
            notifications.map(item => (
              <div 
                key={item.id}
                onClick={() => handleMarkRead(item.id)}
                className={`p-4 rounded-2xl border transition-all duration-300 relative group ${
                  item.is_read 
                    ? 'bg-white border-gray-100 opacity-90' 
                    : 'bg-white border-primary/30 shadow-md ring-2 ring-primary/5'
                }`}
              >
                {!item.is_read && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-muted/60 mt-0.5 flex-shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-sm font-bold text-accent leading-snug mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed mb-3">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium pt-2 border-t border-gray-50">
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {item.link_url && (
                        <Link 
                          href={item.link_url} 
                          onClick={onClose}
                          className="text-primary font-bold hover:underline flex items-center gap-1"
                        >
                          {locale === 'am' ? 'ይጎብኙ' : 'View'} <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 text-center">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-muted text-accent hover:bg-gray-200 rounded-2xl text-xs font-bold transition-all"
          >
            {locale === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
