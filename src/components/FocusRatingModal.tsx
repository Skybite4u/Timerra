import React, { useState } from 'react';
import { Star, Check, X } from 'lucide-react';

interface FocusRatingModalProps {
  isOpen: boolean;
  subject: string;
  durationMinutes: number;
  onSave: (rating: number) => void;
  onClose: () => void;
}

export const FocusRatingModal: React.FC<FocusRatingModalProps> = ({
  isOpen,
  subject,
  durationMinutes,
  onSave,
  onClose,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);

  if (!isOpen) return null;

  return (
    <div id="focus-rating-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="focus-rating-modal-card"
        className="w-full max-w-sm p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-slide-in-up"
      >
        {/* Decorative ambient color spots */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-tm-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-tm-accent/10 rounded-full blur-2xl pointer-events-none" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-tm-primary to-tm-accent flex items-center justify-center shadow-lg">
            <Star className="w-6 h-6 text-white fill-white/20" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white">
              Rate Your Focus
            </h3>
            <p className="text-xs text-slate-400">
              How focused were you during <span className="text-tm-primary font-bold">"{subject}"</span>?
            </p>
            {durationMinutes > 0 && (
              <span className="inline-block text-[10px] bg-white/5 text-slate-400 px-2.5 py-0.5 rounded-full border border-white/5">
                Session: {durationMinutes} min
              </span>
            )}
          </div>

          {/* Interactive Stars */}
          <div className="flex items-center justify-center gap-2 py-3">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = hoverRating ? star <= hoverRating : star <= rating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-lg hover:bg-white/5 transition-all transform hover:scale-125 duration-150 cursor-pointer text-amber-400 focus:outline-none"
                >
                  <Star 
                    className={`w-8 h-8 transition-colors ${
                      active 
                        ? 'fill-amber-400 stroke-amber-400' 
                        : 'fill-transparent stroke-white/20'
                    }`} 
                  />
                </button>
              );
            })}
          </div>

          {/* Helper label based on rating */}
          <div className="h-4 text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            {hoverRating === 1 || (!hoverRating && rating === 1) && "Highly Distracted 🥱"}
            {hoverRating === 2 || (!hoverRating && rating === 2) && "Slightly Unfocused 📱"}
            {hoverRating === 3 || (!hoverRating && rating === 3) && "Moderate Focus ☕"}
            {hoverRating === 4 || (!hoverRating && rating === 4) && "Good Flow State 🎯"}
            {hoverRating === 5 || (!hoverRating && rating === 5) && "Deep Transcendence 🚀"}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
            >
              Skip
            </button>
            <button
              onClick={() => {
                if (rating > 0) {
                  onSave(rating);
                }
              }}
              disabled={rating === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all border cursor-pointer ${
                rating > 0 
                  ? 'bg-gradient-to-tr from-tm-primary to-tm-accent border-white/10 shadow-lg hover:brightness-110 active:scale-95' 
                  : 'bg-slate-800 border-white/5 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Rating</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
