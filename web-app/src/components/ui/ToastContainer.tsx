import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: 'text-green-400 border-green-500/30 bg-green-500/10',
  error: 'text-red-400 border-red-500/30 bg-red-500/10',
  warning: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  info: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const newToast = { ...toast, id: Date.now().toString() };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      removeToast(newToast.id);
    }, toast.duration || 5000);
  };

  // Expose addToast globally for use throughout the app
  useEffect(() => {
    (window as any).showToast = addToast;
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className={`toast ${toastColors[toast.type]} max-w-sm`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{toast.title}</p>
                <p className="text-sm text-gray-300">{toast.message}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};