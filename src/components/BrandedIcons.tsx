import React from 'react';

// Common definitions for Branded Gradients and Effects
export const BrandedDefs: React.FC = () => (
  <svg className="absolute w-0 h-0" width="0" height="0">
    <defs>
      {/* Golden Neon Gradient */}
      <linearGradient id="brand-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>

      {/* Cyber Cyan Neon Gradient */}
      <linearGradient id="brand-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>

      {/* Purple Amethyst Gradient */}
      <linearGradient id="brand-purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>

      {/* Emerald Aurora Gradient */}
      <linearGradient id="brand-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>

      {/* Crimson Core Flame Gradient */}
      <linearGradient id="brand-crimson-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>

      {/* Obsidian Space Dark Gradient */}
      <linearGradient id="brand-obsidian-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>

      {/* Glass Panel Fill */}
      <linearGradient id="brand-glass-fill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
      </linearGradient>

      {/* Glass Highlight Shine */}
      <linearGradient id="brand-shine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="40%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      {/* Soft Glow filter */}
      <filter id="brand-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* Deeper Shadows */}
      <filter id="brand-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
      </filter>
    </defs>
  </svg>
);

interface BrandedIconProps {
  className?: string;
  size?: number;
}

// ==========================================
// 1. TIMERRA CAPSULE EXTENSIONS
// ==========================================

export const ExportCapsule: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
    <rect x="9" y="11" width="6" height="3" rx="1" strokeWidth="1.5" opacity="0.6" />
  </svg>
);

export const ImportCapsule: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
    <rect x="9" y="5" width="6" height="3" rx="1" strokeWidth="1.5" opacity="0.6" />
  </svg>
);

export const RestoreCapsule: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
    <circle cx="12" cy="12" r="3" strokeWidth="1.5" opacity="0.8" />
  </svg>
);

export const ManageCapsules: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
    <path d="M17 17h.01" />
  </svg>
);

export const CapsuleHistory: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8v4l3 3" />
    <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
  </svg>
);

export const CapsuleSecurity: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1.5" />
  </svg>
);

export const CapsuleVerification: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 11 11 13 15 9" />
  </svg>
);

export const CapsuleEncryption: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5M14 9l1.5-1.5M16.5 6.5L18 5" />
  </svg>
);

export const CapsuleSuccess: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 11 11 13 15 9" />
    <path d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2z" className="animate-pulse" />
  </svg>
);

export const CapsuleError: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);


// ==========================================
// 2. MILESTONE VAULT ICONS
// ==========================================

export const Milestone: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
    <circle cx="14" cy="8" r="2" strokeWidth="1.5" />
  </svg>
);

export const XP: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
    <line x1="12" y1="2" x2="12" y2="22" opacity="0.3" />
    <path d="M8 8l8 8" />
    <path d="M16 8l-8 8" />
  </svg>
);

export const Level: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 20V10M12 20V4M6 20v-6" />
    <polyline points="6 14 12 4 18 10" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
  </svg>
);

export const Legendary: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    <circle cx="12" cy="11" r="3" strokeWidth="1" opacity="0.6" />
  </svg>
);

export const Timeline: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="12" x2="20" y2="12" />
    <circle cx="6" cy="12" r="3" fill="currentColor" />
    <circle cx="14" cy="12" r="3" fill="currentColor" />
    <circle cx="20" cy="12" r="1" />
    <path d="M14 15v3M6 9V6" opacity="0.7" />
  </svg>
);

export const Vault: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="7" x2="12" y2="9" />
    <line x1="12" y1="15" x2="12" y2="17" />
    <line x1="7" y1="12" x2="9" y2="12" />
    <line x1="15" y1="12" x2="17" y2="12" />
  </svg>
);

export const Pinned: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const Collection: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const Unlock: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    <circle cx="12" cy="16" r="1.5" />
  </svg>
);

export const Progress: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);


// ==========================================
// 3. LEGACY CARD ICONS
// ==========================================

export const LegacyCard: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M7 15h.01" />
    <path d="M11 15h2" />
  </svg>
);

export const Journey: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6H5a3 3 0 0 0 0 6h14a3 3 0 0 1 0 6H5" />
    <polyline points="15 3 18 6 15 9" />
  </svg>
);

export const Memory: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export const Archive: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" rx="1" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

export const Share: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export const Export: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

export const Favorite: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);


// ==========================================
// 4. INSIGHT ENGINE ICONS
// ==========================================

export const Analytics: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <circle cx="18" cy="10" r="1" />
    <circle cx="12" cy="4" r="1" />
    <circle cx="6" cy="14" r="1" />
  </svg>
);

export const Focus: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
  </svg>
);

export const Trend: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const Heatmap: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
    <rect x="9.5" y="3" width="5" height="5" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="16" y="3" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" />
    <rect x="3" y="9.5" width="5" height="5" rx="1" fill="currentColor" opacity="0.7" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="currentColor" opacity="0.4" />
    <rect x="16" y="9.5" width="5" height="5" rx="1" fill="currentColor" opacity="0.8" />
    <rect x="3" y="16" width="5" height="5" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="9.5" y="16" width="5" height="5" rx="1" fill="currentColor" opacity="0.6" />
    <rect x="16" y="16" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
  </svg>
);

export const Consistency: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="8" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
  </svg>
);

export const FocusScore: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 10 10" />
    <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" className="font-sans">98</text>
  </svg>
);

export const Prediction: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M10 5.3a5 5 0 0 1 4 0" strokeWidth="1" opacity="0.8" />
  </svg>
);


// ==========================================
// 5. FOCUS CHRONICLE ICONS
// ==========================================

export const DailyJournal: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    <line x1="15" y1="5" x2="18" y2="8" strokeWidth="1.5" opacity="0.8" />
  </svg>
);

export const Replay: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

export const Moments: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="1" />
    <path d="M12 2a10 10 0 0 1 8.3 4.8" />
    <path d="M12 22a10 10 0 0 1-8.3-4.8" />
  </svg>
);


// ==========================================
// 6. ATMOS ENGINE ICONS
// ==========================================

export const Rain: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="16" y1="13" x2="16" y2="21" />
    <line x1="8" y1="13" x2="8" y2="21" />
    <line x1="12" y1="15" x2="12" y2="23" />
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
  </svg>
);

export const Forest: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 22 12 17 12 17 22 7 22 7 12 2 12 12 2" />
    <line x1="12" y1="12" x2="12" y2="22" strokeWidth="1.5" opacity="0.6" />
  </svg>
);

export const Ocean: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 6c.6 0 1.2-.2 1.6-.6L5.3 3.7c.9-.9 2.4-.9 3.3 0l1.7 1.7c.4.4 1 .6 1.6.6s1.2-.2 1.6-.6l1.7-1.7c.9-.9 2.4-.9 3.3 0l1.7 1.7c.4.4 1 .6 1.6.6" />
    <path d="M2 12c.6 0 1.2-.2 1.6-.6l1.7-1.7c.9-.9 2.4-.9 3.3 0l1.7 1.7c.4.4 1 .6 1.6.6s1.2-.2 1.6-.6l1.7-1.7c.9-.9 2.4-.9 3.3 0l1.7 1.7c.4.4 1 .6 1.6.6" />
    <path d="M2 18c.6 0 1.2-.2 1.6-.6l1.7-1.7c.9-.9 2.4-.9 3.3 0l1.7 1.7c.4.4 1 .6 1.6.6s1.2-.2 1.6-.6l1.7-1.7c.9-.9 2.4-.9 3.3 0l1.7 1.7c.4.4 1 .6 1.6.6" />
  </svg>
);

export const Aurora: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 10s3-5 10-5 10 5 10 5-3 5-10 5-10-5-10-5z" opacity="0.3" />
    <path d="M2 14c4-6 8-6 12 0s8 6 10 0" strokeDasharray="3 3" />
    <path d="M12 3v3M4 6l2 2M20 6l-2 2" opacity="0.8" />
  </svg>
);

export const Galaxy: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" className="animate-spin" style={{ animationDuration: '12s' }} />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <path d="M12 6a6 6 0 0 1 5.2 3" strokeWidth="1.5" />
    <path d="M12 18a6 6 0 0 1-5.2-3" strokeWidth="1.5" />
  </svg>
);

export const Snow: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

export const Cyber: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M21 9H3M21 15H3M12 3v18" strokeWidth="1" opacity="0.4" />
    <circle cx="12" cy="9" r="1.5" fill="currentColor" />
    <circle cx="6" cy="15" r="1.5" fill="currentColor" />
    <circle cx="18" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

export const Zen: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor" opacity="0.15" />
    <circle cx="12" cy="12" r="5" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

export const Fire: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const Moon: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);


// ==========================================
// 7. ORB SYSTEM ICONS
// ==========================================

export const OrbCore: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.15" className="animate-pulse" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

export const OrbEvolution: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 10 10" />
    <polyline points="12 2 15 5 12 8" strokeWidth="1.5" />
    <polyline points="12 22 9 19 12 16" strokeWidth="1.5" />
  </svg>
);

export const OrbEnergy: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export const OrbLevel: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <polyline points="12 8 16 12 12 16" />
  </svg>
);

export const OrbFusion: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="8" cy="12" r="6" strokeWidth="1.5" opacity="0.8" />
    <circle cx="16" cy="12" r="6" strokeWidth="1.5" opacity="0.8" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

export const OrbResonance: React.FC<BrandedIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20z" strokeWidth="1" strokeDasharray="3 3" className="animate-spin" style={{ animationDuration: '8s' }} />
    <circle cx="12" cy="12" r="8" strokeWidth="1" opacity="0.5" />
  </svg>
);
