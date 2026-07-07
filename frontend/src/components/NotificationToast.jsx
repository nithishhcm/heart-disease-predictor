import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertOctagon, Info, AlertTriangle, X } from 'lucide-react';

const NotificationToast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.3)',
      icon: <CheckCircle className="text-[#22c55e]" size={20} />,
      title: 'Success Operation'
    },
    error: {
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      icon: <AlertOctagon className="text-[#ef4444]" size={20} />,
      title: 'System Alert'
    },
    warning: {
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'rgba(249, 115, 22, 0.3)',
      icon: <AlertTriangle className="text-[#f97316]" size={20} />,
      title: 'Warning Event'
    },
    info: {
      color: '#00f0ff',
      bg: 'rgba(0, 240, 255, 0.1)',
      border: 'rgba(0, 240, 255, 0.3)',
      icon: <Info className="text-[#00f0ff]" size={20} />,
      title: 'Telemetry Notification'
    }
  };

  const current = config[type] || config.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full p-4 rounded-xl backdrop-blur-md flex items-start gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.85)',
        borderColor: current.border,
        boxShadow: `0 0 15px ${current.bg}`
      }}
    >
      <div className="flex-shrink-0 mt-0.5">{current.icon}</div>
      <div className="flex-grow">
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: current.color }}>
          {current.title}
        </h4>
        <p className="text-sm text-gray-300 leading-snug">{message}</p>
      </div>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 text-gray-500 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/5"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default NotificationToast;
