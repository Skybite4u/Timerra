let audioCtx: AudioContext | null = null;

export function primeAudio(): void {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function vibrateClick(): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      /* ignore */
    }
  }
}

export function playClick(): void {
  // Trigger subtle haptic feedback for click
  vibrateClick();
  try {
    primeAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    // pitch drops 880 -> 220 Hz over 120ms
    const t0 = audioCtx.currentTime;
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.12);

    // exp gain 0 -> 0.18 -> 0 (never absolute zero in exp ramps)
    gainNode.gain.setValueAtTime(0.0001, t0);
    gainNode.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.13);
  } catch (e) {
    console.warn('Audio click play failed', e);
  }
}

export function playTick(volume: number = 0.5): void {
  try {
    primeAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    const t0 = audioCtx.currentTime;
    osc.frequency.setValueAtTime(640, t0);

    // Map volume 0.0-1.0 to gain up to 0.12 (standard default was 0.05 at 0.5)
    const targetGain = Math.max(0.0001, 0.12 * volume);
    gainNode.gain.setValueAtTime(0.0001, t0);
    gainNode.gain.exponentialRampToValueAtTime(targetGain, t0 + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.09);
  } catch (e) {
    console.warn('Audio tick play failed', e);
  }
}

export function vibrateStart(): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate([20, 30, 20]);
    } catch {
      /* ignore */
    }
  }
}

export function vibratePause(): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(15);
    } catch {
      /* ignore */
    }
  }
}

export function vibrateReset(): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate([25, 35, 25]);
    } catch {
      /* ignore */
    }
  }
}

export function vibrateComplete(): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate([40, 50, 40, 50, 60]);
    } catch {
      /* ignore */
    }
  }
}

export function playDefaultSweep(): void {
  try {
    primeAudio();
    if (!audioCtx) return;
    const freqs = [523.25, 587.33, 659.25, 783.99, 987.77];
    const t0 = audioCtx.currentTime;

    freqs.forEach((freq, index) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0 + index * 0.09);

      const triggerTime = t0 + index * 0.09;
      gainNode.gain.setValueAtTime(0.0001, triggerTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, triggerTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, triggerTime + 0.5);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(triggerTime);
      osc.stop(triggerTime + 0.6);
    });
  } catch (e) {
    console.warn('Audio sweep failed', e);
  }
}

export function playComplete(soundId: string = 'default', customSoundData?: string): void {
  // Trigger subtle haptic vibration upon completion
  vibrateComplete();
  try {
    primeAudio();
    if (!audioCtx) return;

    if (soundId === 'custom' && customSoundData) {
      try {
        const base64Clean = customSoundData.replace(/^data:audio\/[^;]+;base64,/, '');
        const binaryString = atob(base64Clean);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        audioCtx.decodeAudioData(bytes.buffer, (buffer) => {
          if (!audioCtx) return;
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.start(0);
        }, (err) => {
          console.warn('Failed to decode custom audio, playing fallback classic', err);
          playDefaultSweep();
        });
      } catch (e) {
        console.warn('Error playing custom sound, playing fallback classic', e);
        playDefaultSweep();
      }
      return;
    }

    const t0 = audioCtx.currentTime;

    if (soundId === 'digital') {
      // Digital retro chime / double beep
      [0, 0.15, 0.3].forEach((delay) => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, t0 + delay);
        gain.gain.setValueAtTime(0.0001, t0 + delay);
        gain.gain.exponentialRampToValueAtTime(0.08, t0 + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t0 + delay);
        osc.stop(t0 + delay + 0.1);
      });
    } else if (soundId === 'ambient') {
      // Harmonic warm pad chord
      const freqs = [329.63, 392.00, 440.00, 523.25]; // E4, G4, A4, C5
      freqs.forEach((freq, idx) => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(0.06, t0 + 0.2 + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 1.3);
      });
    } else if (soundId === 'cosmic') {
      // Cosmic laser/sci-fi ascending sweep
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t0);
      osc.frequency.exponentialRampToValueAtTime(1760, t0 + 0.8);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.8);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, t0);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.9);
    } else if (soundId === 'bell') {
      // Pure crystalline bell chime
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8);
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(600, t0);
      gain2.gain.setValueAtTime(0.0001, t0);
      gain2.gain.exponentialRampToValueAtTime(0.1, t0 + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);

      osc.start(t0);
      osc.stop(t0 + 2.0);
      osc2.start(t0);
      osc2.stop(t0 + 2.0);
    } else {
      // Default / classic pentatonic sweep
      playDefaultSweep();
    }
  } catch (e) {
    console.warn('Audio complete play failed', e);
  }
}
