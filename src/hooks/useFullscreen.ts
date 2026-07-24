import { useState, useEffect } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFsChange = () => {
      const isFS = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFS);

      // Auto-rotate mode: Unlock screen orientation so device rotates freely with orientation changes
      if (typeof window !== 'undefined' && 'screen' in window && screen.orientation) {
        if ('unlock' in screen.orientation && typeof (screen.orientation as any).unlock === 'function') {
          try {
            (screen.orientation as any).unlock();
          } catch {
            /* ignore */
          }
        }
        if (isFS && 'lock' in screen.orientation && typeof (screen.orientation as any).lock === 'function') {
          try {
            // 'any' allows auto rotation to portrait or landscape seamlessly
            (screen.orientation as any).lock('any').catch(() => {});
          } catch {
            /* ignore */
          }
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = async (element?: HTMLElement) => {
    try {
      const isFS = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );

      if (!isFS) {
        const el = element || document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        } else if ((el as any).mozRequestFullScreen) {
          await (el as any).mozRequestFullScreen();
        } else if ((el as any).msRequestFullscreen) {
          await (el as any).msRequestFullscreen();
        }

        // Auto-rotate unlock/lock attempt on entering fullscreen
        if (typeof window !== 'undefined' && 'screen' in window && screen.orientation) {
          try {
            if ('unlock' in screen.orientation) {
              (screen.orientation as any).unlock();
            }
            if ('lock' in screen.orientation) {
              await (screen.orientation as any).lock('any').catch(() => {});
            }
          } catch {
            /* ignore */
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }

        if (typeof window !== 'undefined' && 'screen' in window && screen.orientation && 'unlock' in screen.orientation) {
          try {
            (screen.orientation as any).unlock();
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed', e);
    }
  };

  return { isFullscreen, toggleFullscreen, setIsFullscreen };
}

