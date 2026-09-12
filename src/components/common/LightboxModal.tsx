import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { PortfolioItem } from '../../types';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PortfolioItem[];
  currentIndex: number;
  onIndexChange: (newIndex: number) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  items,
  currentIndex,
  onIndexChange
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : items.length - 1);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIndexChange(currentIndex < items.length - 1 ? currentIndex + 1 : 0);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      {/* Close button */}
      <button
        id="lightbox-close-btn"
        onClick={onClose}
        className="absolute top-5 left-5 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="إغلاق العارض"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev / Next controls */}
      {items.length > 1 && (
        <>
          <button
            id="lightbox-prev-btn"
            onClick={handlePrev}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-105"
            aria-label="اللوك السابق"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <button
            id="lightbox-next-btn"
            onClick={handleNext}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-105"
            aria-label="اللوك التالي"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Main Image View */}
      <div
        className="max-w-5xl max-h-[85vh] flex flex-col items-center justify-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative group overflow-hidden rounded-xl shadow-2xl bg-stone-950">
          <img
            src={currentItem.imageUrl}
            alt={currentItem.title}
            className="max-h-[72vh] max-w-full object-contain rounded-xl transition-all"
            loading="eager"
          />

          {/* Bottom metadata banner */}
          <div className="p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white w-full text-right">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/30 text-amber-200 border border-amber-400/30 mb-1.5">
                  <Tag className="w-3 h-3" />
                  {currentItem.categoryName || 'عرايس وزفاف'}
                </span>
                <h3 className="text-lg font-bold font-serif-display text-white">
                  {currentItem.title}
                </h3>
                {currentItem.description && (
                  <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
                    {currentItem.description}
                  </p>
                )}
              </div>
              <div className="text-left shrink-0">
                <span className="text-xs font-mono text-stone-400">
                  {currentIndex + 1} من {items.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
