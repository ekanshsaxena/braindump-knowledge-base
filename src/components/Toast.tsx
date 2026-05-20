'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let addToastFn: ((msg: string, type: ToastType) => string) | null = null;
let removeToastFn: ((id: string) => void) | null = null;

export const toast = {
  success: (msg: string) => addToastFn?.(msg, 'success') ?? '',
  error: (msg: string) => addToastFn?.(msg, 'error') ?? '',
  loading: (msg: string) => addToastFn?.(msg, 'loading') ?? '',
  dismiss: (id: string) => removeToastFn?.(id),
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      if (type !== 'loading') {
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
      }
      return id;
    };
    removeToastFn = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
    return () => {
      addToastFn = null;
      removeToastFn = null;
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-2.5 bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-3 rounded-xl shadow-2xl text-sm max-w-xs"
          >
            {t.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {t.type === 'loading' && <Loader2 className="w-4 h-4 text-violet-400 shrink-0 animate-spin" />}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
