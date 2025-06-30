import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { stickerQueue } from '../../services/stickers/stickerQueue';

interface StickerStatusIndicatorProps {
  className?: string;
}

export const StickerStatusIndicator: React.FC<StickerStatusIndicatorProps> = ({ 
  className = '' 
}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkPendingJobs = () => {
      const count = stickerQueue.getPendingCount();
      setPendingCount(count);
      setIsVisible(count > 0);
    };

    // Check immediately
    checkPendingJobs();

    // Poll every 5 seconds
    const interval = setInterval(checkPendingJobs, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-pulse">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">
          {pendingCount === 1 
            ? 'Generating 1 sticker...' 
            : `Generating ${pendingCount} stickers...`
          }
        </span>
      </div>
    </div>
  );
};

// Toast notification for completed stickers
export const StickerCompletionToast: React.FC<{
  word: string;
  stickerUrl: string;
  onClose: () => void;
}> = ({ word, stickerUrl, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-green-200 p-4 flex items-center space-x-3 max-w-sm animate-slide-up">
      <img 
        src={stickerUrl} 
        alt={word}
        className="w-12 h-12 rounded-lg object-cover"
      />
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <p className="text-sm font-medium text-gray-900">Sticker ready!</p>
        </div>
        <p className="text-xs text-gray-600">"{word}" sticker generated</p>
      </div>
      <button 
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        ×
      </button>
    </div>
  );
}; 