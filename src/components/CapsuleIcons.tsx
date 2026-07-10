import React from 'react';

// Common SVG Gradients and Filters definition block to keep code DRY and clean
const GlassDefs: React.FC = () => (
  <svg className="absolute w-0 h-0" width="0" height="0">
    <defs>
      {/* Primary Cyan-to-Blue Neon Glow */}
      <linearGradient id="capsule-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="1" />
      </linearGradient>

      {/* Accent Pink/Magenta-to-Cyan Glow */}
      <linearGradient id="capsule-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
      </linearGradient>

      {/* Green Success Glow */}
      <linearGradient id="capsule-success-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
        <stop offset="100%" stopColor="#059669" stopOpacity="1" />
      </linearGradient>

      {/* Gold/Orange Glow */}
      <linearGradient id="capsule-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
      </linearGradient>

      {/* Glass Body Fill Gradient */}
      <linearGradient id="capsule-glass-fill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
      </linearGradient>

      {/* Glass Reflection Highlight */}
      <linearGradient id="capsule-reflection" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="30%" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      {/* Silver Metal Cap Gradient */}
      <linearGradient id="capsule-metal-cap" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>

      {/* Glowing Backdrop Filter */}
      <filter id="capsule-glow-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* Shadow filter for depth */}
      <filter id="capsule-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.5" />
      </filter>
    </defs>
  </svg>
);

interface IconProps {
  className?: string;
  size?: number;
}

export const ExportCapsuleIcon: React.FC<IconProps> = ({ className = '', size = 56 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <GlassDefs />
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(34,211,238,0.2)] animate-pulse-slow"
      >
        {/* Soft Background Neon Glow */}
        <circle cx="32" cy="32" r="20" fill="url(#capsule-primary-grad)" opacity="0.12" filter="blur(6px)" />

        {/* 3D Glass Capsule Silhouette */}
        <g filter="url(#capsule-shadow)">
          {/* Glass Outer Border */}
          <rect x="22" y="10" width="20" height="36" rx="10" fill="url(#capsule-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" />
          
          {/* Top Metal Cap */}
          <path d="M22 20C22 14.4772 26.4772 10 32 10C37.5228 10 42 14.4772 42 20H22Z" fill="url(#capsule-metal-cap)" opacity="0.8" />
          <line x1="22.5" y1="20" x2="41.5" y2="20" stroke="#ffffff" strokeOpacity="0.3" />

          {/* Left Glass Highlight sweep */}
          <rect x="24" y="14" width="2" height="28" rx="1" fill="url(#capsule-reflection)" />

          {/* Core Energy Pulse Sphere */}
          <circle cx="32" cy="32" r="6" fill="url(#capsule-primary-grad)" filter="url(#capsule-glow-blur)" />
          <circle cx="32" cy="32" r="3" fill="#ffffff" opacity="0.9" />

          {/* Exporting Data Beam (Downward arrow ejecting from bottom) */}
          <path
            d="M32 38V49M32 49L28 45M32 49L36 45"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-bounce"
            style={{ transformOrigin: '32px 42px' }}
          />

          {/* Little energy particles discharging downwards */}
          <circle cx="28" cy="51" r="1" fill="#22d3ee" opacity="0.6" />
          <circle cx="36" cy="53" r="1.5" fill="#0284c7" opacity="0.8" />
          <circle cx="32" cy="56" r="1" fill="#ffffff" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
};

export const ImportCapsuleIcon: React.FC<IconProps> = ({ className = '', size = 56 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <GlassDefs />
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(236,72,153,0.2)]"
      >
        {/* Soft Background Neon Glow */}
        <circle cx="32" cy="32" r="20" fill="url(#capsule-accent-grad)" opacity="0.12" filter="blur(6px)" />

        {/* 3D Glass Capsule Silhouette */}
        <g filter="url(#capsule-shadow)">
          {/* Glass Outer Border */}
          <rect x="22" y="18" width="20" height="36" rx="10" fill="url(#capsule-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" />
          
          {/* Bottom Metal Cap */}
          <path d="M22 44H42C42 49.5228 37.5228 54 32 54C26.4772 54 22 49.5228 22 44Z" fill="url(#capsule-metal-cap)" opacity="0.8" />
          <line x1="22.5" y1="44" x2="41.5" y2="44" stroke="#ffffff" strokeOpacity="0.3" />

          {/* Left Glass Highlight sweep */}
          <rect x="24" y="22" width="2" height="28" rx="1" fill="url(#capsule-reflection)" />

          {/* Importing Data Beam (Downward arrow entering capsule) */}
          <path
            d="M32 5V18M32 18L28 14M32 18L36 14"
            stroke="#ec4899"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          />

          {/* Core Absorption Portal inside glass */}
          <circle cx="32" cy="30" r="6" fill="url(#capsule-accent-grad)" filter="url(#capsule-glow-blur)" />
          <circle cx="32" cy="30" r="3" fill="#ffffff" opacity="0.9" />

          {/* Swirling orbiting rings entering glass */}
          <ellipse cx="32" cy="24" rx="7" ry="2" stroke="#06b6d4" strokeWidth="1" opacity="0.6" strokeDasharray="3 2" />
        </g>
      </svg>
    </div>
  );
};

export const RestoreCapsuleIcon: React.FC<IconProps> = ({ className = '', size = 56 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <GlassDefs />
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(52,211,153,0.2)]"
      >
        {/* Soft Background Neon Glow */}
        <circle cx="32" cy="32" r="20" fill="url(#capsule-success-grad)" opacity="0.12" filter="blur(6px)" />

        <g filter="url(#capsule-shadow)">
          {/* Diagonal Glass Capsule (representing time transition) */}
          <g style={{ transform: 'rotate(-30deg)', transformOrigin: '32px 32px' }}>
            <rect x="22" y="14" width="20" height="36" rx="10" fill="url(#capsule-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />
            {/* Gloss Highlight */}
            <rect x="24" y="18" width="1.5" height="28" rx="0.75" fill="url(#capsule-reflection)" />
            {/* Core glowing matrix */}
            <circle cx="32" cy="32" r="5" fill="url(#capsule-success-grad)" filter="url(#capsule-glow-blur)" />
          </g>

          {/* Outer Cosmic Restore Ring (Clockwise spiral/arrow) */}
          <path
            d="M12 32C12 20.9543 20.9543 12 32 12C43.0457 12 52 20.9543 52 32C52 43.0457 43.0457 52 32 52"
            stroke="#34d399"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="4 4"
            className="animate-spin"
            style={{ transformOrigin: '32px 32px', animationDuration: '8s' }}
          />

          {/* Sparkly restoration star */}
          <path
            d="M32 6L33.5 10L37.5 11.5L33.5 13L32 17L30.5 13L26.5 11.5L30.5 10L32 6Z"
            fill="#34d399"
            filter="url(#capsule-glow-blur)"
          />
          <path
            d="M48 48L49 51L52 52L49 53L48 56L47 53L44 52L47 51L48 48Z"
            fill="#059669"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
};

export const ManageCapsuleIcon: React.FC<IconProps> = ({ className = '', size = 56 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <GlassDefs />
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
      >
        {/* Soft Background Neon Glow */}
        <circle cx="32" cy="32" r="20" fill="url(#capsule-gold-grad)" opacity="0.12" filter="blur(6px)" />

        <g filter="url(#capsule-shadow)">
          {/* Glass Console Backing Card */}
          <rect x="12" y="12" width="40" height="40" rx="10" fill="url(#capsule-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />

          {/* Left Capsule Container */}
          <rect x="18" y="20" width="10" height="24" rx="5" fill="url(#capsule-glass-fill)" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.4" />
          <circle cx="23" cy="32" r="3" fill="#f59e0b" filter="url(#capsule-glow-blur)" />

          {/* Right Capsule Container */}
          <rect x="36" y="20" width="10" height="24" rx="5" fill="url(#capsule-glass-fill)" stroke="#d97706" strokeWidth="1" strokeOpacity="0.4" />
          <circle cx="41" cy="32" r="3" fill="#ffffff" opacity="0.9" />

          {/* Sleek Central Connection Bus/Network Lines */}
          <path d="M26 32H38" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="2 2" />
          <path d="M32 16V48" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />

          {/* Golden Database Nodes */}
          <circle cx="32" cy="20" r="2" fill="#f59e0b" />
          <circle cx="32" cy="44" r="2" fill="#d97706" />

          {/* Diagonal Specular Sweeps */}
          <path d="M14 14L28 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M14 14V28" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
};
