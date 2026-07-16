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
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      // Subtle, extremely fast tap for button clicks to offer haptic confirmation
      navigator.vibrate(15);
    }
  } catch (err) {
    console.warn('Click vibration failed to execute:', err);
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

export function playTick(): void {
  try {
    primeAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    const t0 = audioCtx.currentTime;
    osc.frequency.setValueAtTime(640, t0);

    // gain 0 -> 0.05 -> 0 over 80ms
    gainNode.gain.setValueAtTime(0.0001, t0);
    gainNode.gain.exponentialRampToValueAtTime(0.05, t0 + 0.005);
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
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      // Subtle, crisp double-tap for starting/resuming the timer
      navigator.vibrate([30, 40, 30]);
    }
  } catch (err) {
    console.warn('Vibration failed to execute:', err);
  }
}

export function vibratePause(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      // A clean single, slightly shorter tap for pausing the timer
      navigator.vibrate(25);
    }
  } catch (err) {
    console.warn('Vibration failed to execute:', err);
  }
}

export function vibrateComplete(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      // Prominent, festive haptic sequence matching the completion tone
      navigator.vibrate([80, 50, 80, 50, 150]);
    }
  } catch (err) {
    console.warn('Vibration failed to execute:', err);
  }
}

export function playComplete(): void {
  // Trigger subtle haptic vibration upon completion
  vibrateComplete();
  try {
    primeAudio();
    if (!audioCtx) return;

    // C-major pentatonic sweep 523, 587, 659, 784, 988 Hz, 90ms stagger
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
    console.warn('Audio complete play failed', e);
  }
}
