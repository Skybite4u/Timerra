import { ThemeName } from '../types';

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  desc: string;
}

export const THEMES: ThemeConfig[] = [
  { id: 'blue', name: 'Cosmic Blue', desc: 'Serene cobalt with deep cyan waves' },
  { id: 'purple', name: 'Royal Violet', desc: 'Nebula violet fading into hot pink' },
  { id: 'emerald', name: 'Neo Mint', desc: 'Lush organic greens with mint energy' },
  { id: 'orange', name: 'Solar Flare', desc: 'Volcanic orange with warm amber waves' },
  { id: 'red', name: 'Ruby Core', desc: 'Deep ruby red with laser crimson waves' },
  { id: 'cyber', name: 'Hyper Cyber', desc: 'High-contrast neon cyan and magenta' },
  { id: 'midnight', name: 'Deep Midnight', desc: 'Abyssal navy blue with ink waves' },
  { id: 'aurora', name: 'Boreal Glow', desc: 'Northern lights shimmer in emerald & amethyst' },
  { id: 'neonPulse', name: 'Neon Pulse', desc: 'Ultra bright high-contrast neon green & vivid magenta pulse' },
  { id: 'cyberNeon', name: 'Cyber Neon', desc: 'High-voltage laser cyan & neon electric magenta glow' },
  { id: 'prismGlass', name: 'Prism Glass', desc: 'Multichromatic holographic glass with iridescent refractions' },
  { id: 'crystalIce', name: 'Crystal Ice', desc: 'Frosted arctic glacier glass with radiant ice blue aura' },
  { id: 'glassmorphism', name: 'Ethereal Glass', desc: 'Frosted translucency & luminous sky cyan' },
  { id: 'glassyLight', name: 'Glassy Light Mode', desc: 'Soft eye-friendly frosted icy blue phone light theme' },
  { id: 'custom', name: 'Custom Studio', desc: 'Craft your own premium primary & accent color palette' },
];

export function themeClass(theme: ThemeName): string {
  return `theme-${theme}`;
}
