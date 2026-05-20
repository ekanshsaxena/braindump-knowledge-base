'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Link2, Loader2, X } from 'lucide-react';
import { UrlMetadata } from '@/types';
import { extractUrls } from '@/lib/metadata';
import { toast } from './Toast';

interface Props {
  onEntryAdded: () => void;
}

export default function DumpBox({ onEntryAdded }: Props) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlPreview, setUrlPreview] = useState<UrlMetadata | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewUrlRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 260) + 'px';
  };

  const fetchPreview = useCallback(async (url: string) => {
    if (url === previewUrlRef.current) return;
    previewUrlRef.current = url;
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (previewUrlRef.current === url) setUrlPreview(data?.error ? null : data);
    } catch {
      setUrlPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const urls = extractUrls(content);
    if (urls.length === 0) {
      setUrlPreview(null);
      previewUrlRef.current = '';
      return;
    }
    debounceRef.current = setTimeout(() => fetchPreview(urls[0]), 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, fetchPreview]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const loadId = toast.loading('Saving & categorizing...');
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      toast.dismiss(loadId);
      toast.success('Saved and categorized!');
      setContent('');
      setUrlPreview(null);
      previewUrlRef.current = '';
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      onEntryAdded();
    } catch {
      toast.dismiss(loadId);
      toast.error('Failed to save. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      <div
        className={`relative bg-zinc-50 dark:bg-zinc-900 rounded-2xl border transition-all duration-200 ${
          content
            ? 'border-violet-400/60 dark:border-violet-500/50 shadow-lg shadow-violet-500/10'
            : 'border-zinc-200 dark:border-zinc-800'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Dump your thoughts, paste a link, or save anything you want to remember..."
          className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 px-5 pt-4 pb-2 resize-none outline-none text-[15px] leading-relaxed min-h-[80px]"
          rows={3}
        />

        <AnimatePresence>
          {(loadingPreview || urlPreview) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-4 mb-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 overflow-hidden">
                {loadingPreview ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 text-zinc-400 text-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching link preview...</span>
                  </div>
                ) : urlPreview ? (
                  <div className="flex gap-3">
                    {urlPreview.thumbnail && (
                      <img
                        src={urlPreview.thumbnail}
                        alt=""
                        className="w-20 h-16 object-cover shrink-0"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    )}
                    <div className="py-2 pr-3 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {urlPreview.favicon && (
                          <img src={urlPreview.favicon} alt="" className="w-3.5 h-3.5" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                        )}
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{urlPreview.siteName}</span>
                      </div>
                      {urlPreview.title && (
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium line-clamp-1">{urlPreview.title}</p>
                      )}
                      {urlPreview.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">{urlPreview.description}</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2 text-xs">
            {extractUrls(content).length > 0 && (
              <span className="flex items-center gap-1 text-violet-500">
                <Link2 className="w-3 h-3" />
                Link detected
              </span>
            )}
            {content.length > 0 && (
              <span className="text-zinc-400 dark:text-zinc-600">⌘↵ to save</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {content && (
              <button
                onClick={() => {
                  setContent('');
                  setUrlPreview(null);
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-150 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
