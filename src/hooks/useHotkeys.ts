import { useEffect } from 'react';

interface HotkeysProps {
  onTogglePlay: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  onToggleSettings: () => void;
  onToggleStopwatchMode: () => void;
}

export function useHotkeys({
  onTogglePlay,
  onReset,
  onToggleFullscreen,
  onToggleSettings,
  onToggleStopwatchMode,
}: HotkeysProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        onTogglePlay();
        return;
      }

      switch (e.key) {
        case 'r':
        case 'R':
          onReset();
          break;
        case 'f':
        case 'F':
          onToggleFullscreen();
          break;
        case 's':
        case 'S':
          onToggleSettings();
          break;
        case 'm':
        case 'M':
          onToggleStopwatchMode();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onReset, onToggleFullscreen, onToggleSettings, onToggleStopwatchMode]);
}
