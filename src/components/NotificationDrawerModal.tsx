'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserNotification, 
  NotificationCategory, 
  fetchUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '@/lib/notifications';
import { toggleFollowUser, isFollowingUser } from '@/lib/social';
import { 
  Bell, 
  X, 
  CheckCheck, 
  UserPlus, 
  Heart, 
  MessageSquare, 
  Gift, 
  Headphones, 
  BookOpen, 
  Calendar, 
  CreditCard,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { Link } from '@/i18n/routing';

interface NotificationDrawerModalProps {
  userId: string;
  currentUserName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawerModal({
  userId,
  currentUserName,
  isOpen,
  onClose
}: NotificationDrawerModalProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await fetchUserNotifications(userId);
    setNotifications(data);

    // Pre-check follow status for follow notifications with Follow Back metadata
    const followStatusMap: Record<string, boolean> = {};
    for (const item of data) {
      if (item.metadata?.follower_id) {
        const isF = await isFollowingUser(userId, item.metadata.follower_id);
        followStatusMap[item.metadata.follower_id] = isF;
      }
    }
    setFollowingMap(followStatusMap);
    setLoading(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleItemClick = async (n: UserNotification) => {
    if (!n.is_read) {
      await markNotificationAsRead(n.id);
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
    }
  };

  const handleFollowBack = async (e: React.MouseEvent, followerId: string, followerName: string) => {
    e.stopPropagation();
    const result = await toggleFollowUser(userId, currentUserName, followerId);
    setFollowingMap(prev => ({ ...prev, [followerId]: result.isFollowing }));
  };

  if (!isOpen) return null;

  const categories: { id: NotificationCategory | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'social', label: 'Social', icon: Heart },
    { id: 'support', label: 'Support', icon: Headphones },
    { id: 'course', label: 'Courses', icon: BookOpen },
    { id: 'appointment', label: 'Appointments', icon: Calendar },
    { id: 'subscription', label: 'Subscriptions', icon: CreditCard },
  ];

  const filteredNotifications = activeCategory === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeCategory);

  const getCategoryIcon = (category: NotificationCategory, metadata?: any) => {
    if (metadata?.type === 'follow') return <UserPlus className="text-blue-500" size={18} />;
    switch (category) {
      case 'social':
        return <Heart className="text-red-500" size={18} />;
      case 'support':
        return <Headphones className="text-purple-500" size={18} />;
      case 'course':
        return <BookOpen className="text-amber-500" size={18} />;
      case 'appointment':
        return <Calendar className="text-emerald-500" size={18} />;
      case 'subscription':
        return <CreditCard className="text-indigo-500" size={18} />;
      default:
        return <Bell className="text-primary" size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#FDFBF9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-accent">Notifications</h3>
              <p className="text-xs text-gray-500 font-medium">Platform-wide updates & alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="p-2 text-gray-400 hover:text-primary transition-colors rounded-xl hover:bg-muted"
            >
              <CheckCheck size={18} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-accent transition-colors rounded-xl hover:bg-muted"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="p-3 border-b border-gray-100 bg-muted/30 overflow-x-auto flex gap-2 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isSelected 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-muted'
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm font-bold text-gray-400 animate-pulse">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-3">
              <Bell size={40} className="mx-auto opacity-20" />
              <p className="text-sm font-bold">No notifications in this category</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                  !n.is_read 
                    ? 'bg-primary/5 border-primary/20 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                {!n.is_read && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-ping" />
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 mt-0.5">
                    {getCategoryIcon(n.category, n.metadata)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 pr-4">
                      <h4 className="font-bold text-sm text-accent truncate">{n.title}</h4>
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed mb-2">{n.message}</p>

                    {/* Instant Follow Back Button */}
                    {n.metadata?.type === 'follow' && n.metadata?.follower_id && (
                      <div className="mt-2 pt-2 border-t border-gray-100/50 flex items-center justify-between">
                        <button
                          onClick={(e) => handleFollowBack(e, n.metadata?.follower_id!, n.metadata?.follower_name || 'User')}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            followingMap[n.metadata?.follower_id!]
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-primary text-white shadow-sm hover:scale-105 active:scale-95'
                          }`}
                        >
                          {followingMap[n.metadata?.follower_id!] ? (


                            <>
                              <UserCheck size={14} /> Following
                            </>
                          ) : (
                            <>
                              <UserPlus size={14} /> Follow Back
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {n.link_url && (
                      <Link 
                        href={n.link_url} 
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline mt-1"
                      >
                        View Details <ChevronRight size={10} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
