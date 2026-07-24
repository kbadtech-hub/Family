'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { moderateText } from '@/lib/moderation';
import { X, Check, AlertTriangle } from 'lucide-react';

interface EditPostModalProps {
  post: {
    id: string;
    content: string;
    edit_count?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onPostEdited: (newContent: string) => void;
}

export default function EditPostModal({
  post,
  isOpen,
  onClose,
  onPostEdited
}: EditPostModalProps) {
  const [content, setContent] = useState(post.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const canEdit = (post.edit_count || 0) < 1;

  const handleSaveEdit = async () => {
    if (!content.trim() || !canEdit || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    // 1. AI Moderation Check
    const modResult = await moderateText(content.trim());
    if (!modResult.approved) {
      setErrorMsg(`⚠️ Auto-Moderation Alert: ${modResult.reason || 'Content violates family community guidelines.'}`);
      setIsSubmitting(false);
      return;
    }

    // 2. Update post in Supabase (1-time edit limit)
    const { error } = await supabase
      .from('community_posts')
      .update({
        content: content.trim(),
        is_edited: true,
        edit_count: 1
      })
      .eq('id', post.id);

    if (error) {
      setErrorMsg(error.message);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onPostEdited(content.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#FDFBF9]">
          <div>
            <h3 className="font-bold text-lg text-accent">Edit Post</h3>
            <p className="text-xs text-gray-500 font-medium">
              {canEdit ? 'Posts can be edited 1 time only.' : 'This post has already been edited.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-accent rounded-2xl">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!canEdit ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold">
              ⚠️ You have already edited this post once. Further edits are restricted.
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[140px] p-4 rounded-2xl bg-muted/30 border border-gray-200 text-base font-medium text-gray-900 focus:ring-primary focus:border-primary"
              />
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-[#FDFBF9] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl border border-gray-200 font-bold text-xs uppercase tracking-widest text-gray-600 hover:bg-muted"
          >
            Cancel
          </button>
          {canEdit && (
            <button
              onClick={handleSaveEdit}
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Saving...' : 'Save Edit'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
