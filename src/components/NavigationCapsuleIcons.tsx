import React from 'react';

// Common definitions for Navigation Capsule Icons to keep them looking super glassy and consistent
const NavGlassDefs: React.FC = () => (
  <svg className="absolute w-0 h-0" width="0" height="0">
    <defs>
      {/* Cyan Neon */}
      <linearGradient id="nav-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="1" />
      </linearGradient>

      {/* Purple Neon */}
      <linearGradient id="nav-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
        <stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
      </linearGradient>

      {/* Amber/Gold */}
      <linearGradient id="nav-amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
      </linearGradient>

      {/* Success Green */}
      <linearGradient id="nav-success-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
        <stop offset="100%" stopColor="#059669" stopOpacity="1" />
      </linearGradient>

      {/* Rose Critical */}
      <linearGradient id="nav-rose-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
        <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
      </linearGradient>

      {/* Indigo */}
      <linearGradient id="nav-indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" stopOpacity="1" />
        <stop offset="100%" stopColor="#4f46e5" stopOpacity="1" />
      </linearGradient>

      {/* Glass Fill */}
      <linearGradient id="nav-glass-fill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>

      {/* Gloss reflection */}
      <linearGradient id="nav-reflection" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="30%" stopColor="#ffffff" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      {/* Metal cap gradient */}
      <linearGradient id="nav-metal-cap" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="50%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>

      {/* Glow Blur Filter */}
      <filter id="nav-glow-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id="nav-shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
      </filter>
    </defs>
  </svg>
);

interface NavIconProps {
  className?: string;
  size?: number;
}

// 1. FOCUS FEED (Bell inside Capsule)
export const BellCapsuleIcon: React.FC<NavIconProps> = ({ className = '', size = 24 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <NavGlassDefs />
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(34,211,238,0.25)]">
        <circle cx="32" cy="32" r="22" fill="url(#nav-primary-grad)" opacity="0.08" filter="blur(4px)" />
        <g filter="url(#nav-shadow)">
          {/* Glass Outer Capsule */}
          <rect x="23" y="10" width="18" height="44" rx="9" fill="url(#nav-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />
          
          {/* Left Gloss sweep */}
          <rect x="25" y="14" width="1.5" height="36" rx="0.75" fill="url(#nav-reflection)" />

          {/* Metal Cap top */}
          <path d="M23 19C23 14.0294 27.0294 10 32 10C36.9706 10 41 14.0294 41 19H23Z" fill="url(#nav-metal-cap)" opacity="0.85" />
          
          {/* Neon Pulse Core (Bell Shape) */}
          <g filter="url(#nav-glow-blur)">
            <path d="M32 25C29.5 25 28 27 28 30V35H36V30C36 27 34.5 25 32 25Z" fill="url(#nav-primary-grad)" />
            <path d="M26 36H38V38H26V36Z" fill="url(#nav-primary-grad)" />
            <circle cx="32" cy="40" r="2" fill="url(#nav-primary-grad)" />
          </g>
          <circle cx="32" cy="31" r="2.5" fill="#ffffff" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
};

// 2. HISTORY HUB (Clock/Loop inside Capsule)
export const HistoryCapsuleIcon: React.FC<NavIconProps> = ({ className = '', size = 24 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <NavGlassDefs />
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(168,85,247,0.25)]">
        <circle cx="32" cy="32" r="22" fill="url(#nav-accent-grad)" opacity="0.08" filter="blur(4px)" />
        <g filter="url(#nav-shadow)">
          {/* Glass Outer Capsule */}
          <rect x="23" y="10" width="18" height="44" rx="9" fill="url(#nav-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />
          
          {/* Left Gloss sweep */}
          <rect x="25" y="14" width="1.5" height="36" rx="0.75" fill="url(#nav-reflection)" />

          {/* Metal Cap bottom */}
          <path d="M23 45H41C41 49.9706 36.9706 54 32 54C27.0294 54 23 49.9706 23 45Z" fill="url(#nav-metal-cap)" opacity="0.85" />
          
          {/* Neon Pulse Core (Clock arrow) */}
          <g filter="url(#nav-glow-blur)">
            <circle cx="32" cy="28" r="7" stroke="url(#nav-accent-grad)" strokeWidth="2" strokeDasharray="32 10" />
            <path d="M32 24V28H35" stroke="url(#nav-accent-grad)" strokeWidth="2" strokeLinecap="round" />
            <path d="M38 28L40 26M38 28L36 26" stroke="url(#nav-accent-grad)" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <circle cx="32" cy="28" r="1.5" fill="#ffffff" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
};

// 3. FOCUS DNA (Double Helix inside Capsule)
export const DnaCapsuleIcon: React.FC<NavIconProps> = ({ className = '', size = 24 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <NavGlassDefs />
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(129,140,248,0.25)]">
        <circle cx="32" cy="32" r="22" fill="url(#nav-indigo-grad)" opacity="0.08" filter="blur(4px)" />
        <g filter="url(#nav-shadow)">
          {/* Glass Outer Capsule */}
          <rect x="23" y="10" width="18" height="44" rx="9" fill="url(#nav-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />
          
          {/* Left Gloss sweep */}
          <rect x="25" y="14" width="1.5" height="36" rx="0.75" fill="url(#nav-reflection)" />

          {/* Dual Metal Caps (Top and Bottom) */}
          <path d="M23 15C23 12.2386 25.2386 10 28 10H36C38.7614 10 41 12.2386 41 15V16H23V15Z" fill="url(#nav-metal-cap)" opacity="0.6" />
          <path d="M23 48H41V49C41 51.7614 38.7614 54 36 54H28C25.2386 54 23 51.7614 23 49V48Z" fill="url(#nav-metal-cap)" opacity="0.6" />
          
          {/* Neon DNA Wave Core */}
          <g filter="url(#nav-glow-blur)">
            {/* Wave 1 */}
            <path d="M28 20C29 20 31 22 32 24C33 26 35 28 36 28C37 28 35 32 32 34C29 36 28 38 28 40" stroke="url(#nav-indigo-grad)" strokeWidth="1.8" strokeLinecap="round" />
            {/* Wave 2 */}
            <path d="M36 20C35 20 33 22 32 24C31 26 29 28 28 28C27 28 29 32 32 34C35 36 36 38 36 40" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" />
            {/* Cross Bars */}
            <line x1="29.5" y1="23" x2="34.5" y2="23" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
            <line x1="28" y1="28" x2="36" y2="28" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
            <line x1="29.5" y1="33" x2="34.5" y2="33" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
          </g>
          {/* Glow beads */}
          <circle cx="32" cy="24" r="1.5" fill="#ffffff" />
          <circle cx="32" cy="34" r="1.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
};

// 4. PORTAL / MORE PANEL (Bento Grid of Miniature Capsule Outlines)
export const PortalCapsuleIcon: React.FC<NavIconProps> = ({ className = '', size = 24 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <NavGlassDefs />
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.25)]">
        <circle cx="32" cy="32" r="22" fill="url(#nav-amber-grad)" opacity="0.08" filter="blur(4px)" />
        <g filter="url(#nav-shadow)">
          {/* A matrix of 4 glass capsules forming a beautiful bento gate */}
          {/* Top-Left */}
          <rect x="18" y="14" width="11" height="15" rx="5.5" fill="url(#nav-glass-fill)" stroke="url(#nav-amber-grad)" strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="23.5" cy="21.5" r="2" fill="#ffffff" opacity="0.8" />

          {/* Top-Right */}
          <rect x="35" y="14" width="11" height="15" rx="5.5" fill="url(#nav-glass-fill)" stroke="url(#nav-primary-grad)" strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="40.5" cy="21.5" r="2" fill="url(#nav-primary-grad)" filter="url(#nav-glow-blur)" />

          {/* Bottom-Left */}
          <rect x="18" y="35" width="11" height="15" rx="5.5" fill="url(#nav-glass-fill)" stroke="url(#nav-accent-grad)" strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="23.5" cy="42.5" r="2" fill="url(#nav-accent-grad)" filter="url(#nav-glow-blur)" />

          {/* Bottom-Right */}
          <rect x="35" y="35" width="11" height="15" rx="5.5" fill="url(#nav-glass-fill)" stroke="url(#nav-success-grad)" strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="40.5" cy="42.5" r="2" fill="#ffffff" opacity="0.8" />

          {/* Core Portal Shimmer ring linking them */}
          <circle cx="32" cy="32" r="6" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="3 3" />
        </g>
      </svg>
    </div>
  );
};

// 5. SETTINGS (Gears/Sliders inside Capsule)
export const SettingsCapsuleIcon: React.FC<NavIconProps> = ({ className = '', size = 24 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <NavGlassDefs />
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.25)]">
        <g filter="url(#nav-shadow)">
          <rect x="23" y="10" width="18" height="44" rx="9" fill="url(#nav-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.15" />
          <rect x="25" y="14" width="1.5" height="36" rx="0.75" fill="url(#nav-reflection)" />
          
          {/* Sliders Core */}
          <g filter="url(#nav-glow-blur)">
            {/* Slide Track 1 */}
            <line x1="29" y1="18" x2="29" y2="46" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" />
            <rect x="27" y="24" width="4" height="4" rx="1.5" fill="url(#nav-amber-grad)" />

            {/* Slide Track 2 */}
            <line x1="35" y1="18" x2="35" y2="46" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" />
            <rect x="33" y="36" width="4" height="4" rx="1.5" fill="url(#nav-primary-grad)" />
          </g>
        </g>
      </svg>
    </div>
  );
};

// 6. BACKUP CAPSULE (Database structure inside Capsule)
export const BackupCapsuleIcon: React.FC<NavIconProps> = ({ className = '', size = 24 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <NavGlassDefs />
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(52,211,153,0.25)]">
        <g filter="url(#nav-shadow)">
          <rect x="23" y="10" width="18" height="44" rx="9" fill="url(#nav-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.15" />
          <rect x="25" y="14" width="1.5" height="36" rx="0.75" fill="url(#nav-reflection)" />

          {/* Database Cylinder Stack Core */}
          <g filter="url(#nav-glow-blur)">
            {/* Cylinder 1 */}
            <ellipse cx="32" cy="22" rx="5" ry="1.8" fill="url(#nav-success-grad)" />
            <path d="M27 22V26C27 27 29 27.8 32 27.8C35 27.8 37 27 37 26V22" fill="url(#nav-success-grad)" opacity="0.8" />
            
            {/* Cylinder 2 */}
            <ellipse cx="32" cy="32" rx="5" ry="1.8" fill="url(#nav-success-grad)" />
            <path d="M27 32V36C27 37 29 37.8 32 37.8C35 37.8 37 37 37 36V32" fill="url(#nav-success-grad)" opacity="0.8" />
          </g>
          <ellipse cx="32" cy="22" rx="3" ry="1" fill="#ffffff" opacity="0.7" />
          <ellipse cx="32" cy="32" rx="3" ry="1" fill="#ffffff" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
};

// 7. GUIDE CAPSULE (Book/Help inside Capsule)
export const GuideCapsuleIcon: React.FC<NavIconProps> = ({ className = '', size = 24 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <NavGlassDefs />
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(34,211,238,0.25)]">
        <g filter="url(#nav-shadow)">
          <rect x="23" y="10" width="18" height="44" rx="9" fill="url(#nav-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.15" />
          <rect x="25" y="14" width="1.5" height="36" rx="0.75" fill="url(#nav-reflection)" />

          {/* Question Mark or Book pages */}
          <g filter="url(#nav-glow-blur)">
            <path d="M29 22C29 19.5 31 18 32.5 18C34 18 35 19 35 20.5C35 22 33.5 23 32.5 24V27" stroke="url(#nav-primary-grad)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="32.5" cy="31.5" r="1.5" fill="url(#nav-primary-grad)" />
          </g>
        </g>
      </svg>
    </div>
  );
};

// 8. MILESTONE VAULT (Trophy inside Capsule)
export const MilestoneCapsuleIcon: React.FC<NavIconProps> = ({ className = '', size = 24 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <NavGlassDefs />
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.25)]">
        <g filter="url(#nav-shadow)">
          <rect x="23" y="10" width="18" height="44" rx="9" fill="url(#nav-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.15" />
          <rect x="25" y="14" width="1.5" height="36" rx="0.75" fill="url(#nav-reflection)" />

          {/* Trophy design */}
          <g filter="url(#nav-glow-blur)">
            <path d="M28 20H36V26C36 28 34 30 32 30C30 30 28 28 28 26V20Z" fill="url(#nav-amber-grad)" />
            <path d="M31 30H33V34H31V30Z" fill="url(#nav-amber-grad)" />
            <path d="M29 34H35V36H29V34Z" fill="url(#nav-amber-grad)" />
          </g>
          <circle cx="32" cy="23" r="1.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
};

// 9. LEGACY CAPSULE (Star / retro shape inside Capsule)
export const LegacyCapsuleIcon: React.FC<NavIconProps> = ({ className = '', size = 24 }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <NavGlassDefs />
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(244,63,94,0.25)]">
        <g filter="url(#nav-shadow)">
          <rect x="23" y="10" width="18" height="44" rx="9" fill="url(#nav-glass-fill)" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.15" />
          <rect x="25" y="14" width="1.5" height="36" rx="0.75" fill="url(#nav-reflection)" />

          {/* Retro Star */}
          <g filter="url(#nav-glow-blur)">
            <path d="M32 18L34 23.5L39.5 24L35 27.5L36.5 33L32 30L27.5 33L29 27.5L24.5 24L30 23.5L32 18Z" fill="url(#nav-rose-grad)" />
          </g>
          <circle cx="32" cy="26" r="1.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
};
