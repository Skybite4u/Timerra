import React from 'react';

// 1. Solar Orb Emblem - Premium abstract solar energy
export const SolarLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="solarGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="solarRay" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#solarGlow)" opacity="0.4" />
    {/* Inner Sun core */}
    <circle cx="50" cy="50" r="18" fill="url(#solarRay)" />
    {/* Concentric rotating rays */}
    <path d="M50 15 C55 25, 45 35, 50 45" stroke="url(#solarRay)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M50 85 C45 75, 55 65, 50 55" stroke="url(#solarRay)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M15 50 C25 55, 35 45, 45 50" stroke="url(#solarRay)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M85 50 C75 45, 65 55, 55 50" stroke="url(#solarRay)" strokeWidth="3.5" strokeLinecap="round" />
    {/* Diagonals */}
    <path d="M25 25 C33 33, 40 33, 45 45" stroke="url(#solarRay)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <path d="M75 75 C67 67, 60 67, 55 55" stroke="url(#solarRay)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <path d="M75 25 C67 33, 67 40, 55 45" stroke="url(#solarRay)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <path d="M25 75 C33 67, 33 60, 45 55" stroke="url(#solarRay)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// 2. Infinity Pulse Emblem - Futuristic Infinity + Pulse wave
export const InfinityPulseLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="infGrad" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
        <stop offset="30%" stopColor="#60A5FA" stopOpacity="1" />
        <stop offset="70%" stopColor="#34D399" stopOpacity="1" />
        <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* Sleek Infinity Loop */}
    <path 
      d="M30 15 C45 15, 45 45, 60 45 C75 45, 75 15, 90 15 C105 15, 115 25, 115 30 C115 35, 105 45, 90 45 C75 45, 75 15, 60 15 C45 15, 45 45, 30 45 C15 45, 5 35, 5 30 C5 25, 15 15, 30 15 Z" 
      stroke="url(#infGrad)" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      opacity="0.25"
    />
    <path 
      d="M30 15 C45 15, 45 45, 60 45 C75 45, 75 15, 90 15 C105 15, 115 25, 115 30 C115 35, 105 45, 90 45 C75 45, 75 15, 60 15" 
      stroke="url(#infGrad)" 
      strokeWidth="4" 
      strokeLinecap="round" 
    />
    {/* Integrated heart pulse rhythm wave right through the center intersection */}
    <path 
      d="M10 30 L45 30 L50 20 L55 42 L60 12 L65 38 L70 30 L110 30" 
      stroke="url(#pulseGrad)" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

// 3. Crystal Core Emblem - Geometric diamond crystal with glowing center
export const CrystalCoreLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="crysTop" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
      <linearGradient id="crysSide" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#C084FC" />
      </linearGradient>
      <linearGradient id="crysBottom" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#818CF8" />
      </linearGradient>
    </defs>
    {/* Facets */}
    {/* Center Top Facet */}
    <polygon points="50,15 68,38 50,55 32,38" fill="url(#crysTop)" opacity="0.9" />
    {/* Side Left Facet */}
    <polygon points="32,38 50,55 50,85 18,50" fill="url(#crysSide)" opacity="0.7" />
    {/* Side Right Facet */}
    <polygon points="68,38 50,55 50,85 82,50" fill="url(#crysSide)" opacity="0.8" />
    {/* Left Top Wing */}
    <polygon points="50,15 32,38 18,50" fill="url(#crysBottom)" opacity="0.65" />
    {/* Right Top Wing */}
    <polygon points="50,15 68,38 82,50" fill="url(#crysBottom)" opacity="0.75" />
    {/* Central Glowing Diamond Dot */}
    <circle cx="50" cy="48" r="4.5" fill="#FFFFFF" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,1))' }} />
  </svg>
);

// 4. Galaxy Core Emblem - Spiral galaxy swirl
export const GalaxyCoreLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="galCore" cx="50%" cy="50%" r="40%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="40%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="galArm" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    {/* Core Glow */}
    <circle cx="50" cy="50" r="30" fill="url(#galCore)" />
    {/* Spiral Arms */}
    <path d="M50 50 Q65 35 60 20 T40 12" stroke="url(#galArm)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    <path d="M50 50 Q35 65 40 80 T60 88" stroke="url(#galArm)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    <path d="M50 50 Q30 40 22 55 T32 75" stroke="url(#galArm)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    <path d="M50 50 Q70 60 78 45 T68 25" stroke="url(#galArm)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    {/* Micro stars */}
    <circle cx="50" cy="50" r="4" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 6px #F472B6)' }} />
    <circle cx="65" cy="30" r="1.5" fill="#FFFFFF" opacity="0.8" />
    <circle cx="35" cy="70" r="1.5" fill="#FFFFFF" opacity="0.8" />
    <circle cx="28" cy="35" r="1" fill="#6366F1" opacity="0.9" />
    <circle cx="72" cy="65" r="1" fill="#F472B6" opacity="0.9" />
  </svg>
);

// 5. Cloud Nest Emblem - Minimalist premium cloud
export const CloudNestLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="cloudGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#BAE6FD" />
      </linearGradient>
    </defs>
    {/* Circular base */}
    <circle cx="50" cy="50" r="42" stroke="url(#cloudGrad)" strokeWidth="2" strokeDasharray="3 3" opacity="0.3" />
    {/* Cloud nesting shapes */}
    <path 
      d="M32 62 C26 62 22 57 22 51 C22 46 26 42 31 41 C33 33 41 28 50 28 C58 28 65 34 67 41 C72 42 76 46 76 52 C76 58 71 62 65 62 L32 62 Z" 
      fill="url(#skyGrad)" 
      opacity="0.9" 
    />
    <path 
      d="M32 62 C26 62 22 57 22 51 C22 46 26 42 31 41 C33 33 41 28 50 28 C58 28 65 34 67 41 C72 42 76 46 76 52 C76 58 71 62 65 62 L32 62 Z" 
      stroke="url(#cloudGrad)" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Floating birds / wind lines */}
    <path d="M28 35 Q32 32 36 35 Q40 32 44 35" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 6. Moon Core Emblem - Minimal crescent moon luxury line art
export const MoonCoreLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
      <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#moonGlow)" />
    {/* Line art crescent moon */}
    <path 
      d="M62 24 C40 24 26 40 26 58 C26 76 40 84 58 84 C68 84 76 78 80 72 C62 76 42 66 42 48 C42 34 54 26 68 24 C66 24 64 24 62 24 Z" 
      fill="url(#moonGrad)" 
    />
    <path 
      d="M62 24 C40 24 26 40 26 58 C26 76 40 84 58 84 C68 84 76 78 80 72 C62 76 42 66 42 48 C42 34 54 26 68 24 C66 24 64 24 62 24 Z" 
      stroke="#CBD5E1" 
      strokeWidth="2" 
      strokeLinejoin="round" 
    />
    {/* Star sparklers */}
    <path d="M72 38 L74 42 L78 44 L74 46 L72 50 L70 46 L66 44 L70 42 Z" fill="#F1F5F9" />
    <circle cx="34" cy="34" r="1.5" fill="#E2E8F0" />
    <circle cx="30" cy="68" r="1.5" fill="#94A3B8" />
  </svg>
);

// 7. Rocket Engine Emblem - Futuristic minimal rocket engine
export const RocketEngineLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="rocketFlame" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* Geometric engine nozzle & body */}
    <polygon points="50,15 65,55 58,62 42,62 35,55" fill="url(#rocketBody)" stroke="#F87171" strokeWidth="2" />
    {/* Side stabilizers wings */}
    <polygon points="35,55 20,62 32,62" fill="#EA580C" />
    <polygon points="65,55 80,62 68,62" fill="#EA580C" />
    {/* Thrust Core lines */}
    <line x1="50" y1="15" x2="50" y2="55" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
    {/* Blazing Flame Thrust */}
    <polygon points="45,64 50,90 55,64 50,70" fill="url(#rocketFlame)" />
    {/* Speed particle lines */}
    <line x1="22" y1="20" x2="22" y2="45" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <line x1="78" y1="30" x2="78" y2="55" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

// 8. Premium Book Emblem - Ancient Library luxury emblem
export const AncientLibraryLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="bookPages" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Circular elegant frame */}
    <circle cx="50" cy="50" r="44" stroke="url(#bookCover)" strokeWidth="1.5" strokeDasharray="5 2" opacity="0.5" />
    {/* Open book geometry */}
    <path 
      d="M50 72 C50 72, 38 65, 20 68 L20 30 C38 28, 50 35, 50 35 C50 35, 62 28, 80 30 L80 68 C62 65, 50 72, 50 72 Z" 
      fill="url(#bookPages)" 
      stroke="url(#bookCover)" 
      strokeWidth="3.5" 
      strokeLinejoin="round" 
    />
    {/* Central book spine spine divider */}
    <line x1="50" y1="35" x2="50" y2="72" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
    {/* Rising magical wisdom dust */}
    <circle cx="42" cy="22" r="2" fill="#FBBF24" />
    <circle cx="58" cy="18" r="1.5" fill="#FEF3C7" />
    <circle cx="50" cy="25" r="2.5" fill="#FBBF24" style={{ filter: 'drop-shadow(0 0 5px #FBBF24)' }} />
  </svg>
);

// 9. Minimal Zen Circle - Japanese enso Zen circle with center drop
export const ZenCircleLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="zenEnso" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14B8A6" />
        <stop offset="50%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
      <linearGradient id="waterDrop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#CCFBF1" />
        <stop offset="100%" stopColor="#14B8A6" />
      </linearGradient>
    </defs>
    {/* Zen Enso hand-brushed look circle (represented by a beautifully tapered stroke path) */}
    <path 
      d="M50 14 C70 14 86 30 86 50 C86 70 70 86 50 86 C32 86 16 71 14 53 C12 37 25 18 43 15 C44.5 14.8 45 15.5 44 16 C30 23 23 37 26 51 C30 65 43 75 58 72 C71 69 78 55 75 41 C72 27 58 20 50 20" 
      stroke="url(#zenEnso)" 
      strokeWidth="5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      opacity="0.85"
    />
    {/* Central water drop shape */}
    <path 
      d="M50 32 C50 32 40 46 40 54 C40 59.5 44.5 64 50 64 C55.5 64 60 59.5 60 54 C60 46 50 32 50 32 Z" 
      fill="url(#waterDrop)" 
    />
    {/* Water ripple circles */}
    <circle cx="50" cy="54" r="16" stroke="#14B8A6" strokeWidth="1" opacity="0.3" />
    <circle cx="50" cy="54" r="22" stroke="#14B8A6" strokeWidth="0.5" opacity="0.15" />
  </svg>
);

// Unified selector matching Mode string to Logo
interface ModeIconProps {
  mode: string;
  className?: string;
}

export const ModeIcon: React.FC<ModeIconProps> = ({ mode, className }) => {
  switch (mode) {
    case 'focus':
      return <SolarLogo className={className} />;
    case 'stopwatch':
      return <InfinityPulseLogo className={className} />;
    case 'deepFocus':
      return <CrystalCoreLogo className={className} />;
    case 'infinityFocus':
      return <GalaxyCoreLogo className={className} />;
    case 'shortBreak':
      return <CloudNestLogo className={className} />;
    case 'longBreak':
      return <MoonCoreLogo className={className} />;
    case 'sprint':
      return <RocketEngineLogo className={className} />;
    case 'marathon':
      return <AncientLibraryLogo className={className} />;
    case 'zen':
      return <ZenCircleLogo className={className} />;
    default:
      return <SolarLogo className={className} />;
  }
};
