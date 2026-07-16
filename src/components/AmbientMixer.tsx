import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Coffee, Sparkles, Volume2, VolumeX, Play, Pause, Music, Youtube, Link2 } from 'lucide-react';

import { TimerMode, TimerStatus } from '../types';

interface AmbientMixerProps {
  timerStatus: TimerStatus;
  timerMode: TimerMode;
}

interface Track {
  id: string;
  name: string;
  icon: React.ReactNode;
  isSynthetic: boolean;
}

const TRACKS: Track[] = [
  {
    id: 'rain',
    name: 'Gentle Rain',
    icon: <CloudRain size={16} />,
    isSynthetic: true
  },
  {
    id: 'white_noise',
    name: 'White Noise',
    icon: <Music size={16} />,
    isSynthetic: true
  },
  {
    id: 'cafe',
    name: 'Cozy Cafe',
    icon: <Coffee size={16} />,
    isSynthetic: true
  },
  {
    id: 'brown_noise',
    name: 'Deep Focus Noise',
    icon: <Sparkles size={16} />,
    isSynthetic: true
  }
];

// Pure Web Audio Buffer Generators
const createWhiteNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

const createPinkNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // scaling to keep comfortable volume
    b6 = white * 0.115926;
  }
  return buffer;
};

const createBrownNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Gain booster
  }
  return buffer;
};

export const AmbientMixer: React.FC<AmbientMixerProps> = ({ timerStatus, timerMode }) => {
  // Track levels (0-100) and toggles
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({
    rain: 50,
    white_noise: 30,
    cafe: 20,
    brown_noise: 40
  });
  
  const [playingTracks, setPlayingTracks] = useState<{ [key: string]: boolean }>({
    rain: false,
    white_noise: false,
    cafe: false,
    brown_noise: false
  });

  const [masterMuted, setMasterMuted] = useState<boolean>(false);
  const [globalVolume, setGlobalVolume] = useState<number>(80);
  const [autoStopOnBreak, setAutoStopOnBreak] = useState<boolean>(true);
  const [isFadedOut, setIsFadedOut] = useState<boolean>(false);

  // Keep Refs of states to prevent stale closures in synthetic track audio generation
  const volumesRef = useRef(volumes);
  const globalVolumeRef = useRef(globalVolume);
  const masterMutedRef = useRef(masterMuted);

  useEffect(() => {
    volumesRef.current = volumes;
  }, [volumes]);

  useEffect(() => {
    globalVolumeRef.current = globalVolume;
  }, [globalVolume]);

  useEffect(() => {
    masterMutedRef.current = masterMuted;
  }, [masterMuted]);

  // --- YouTube Focus Music Player States ---
  const [ytActive, setYtActive] = useState<boolean>(false);
  const [ytVideoId, setYtVideoId] = useState<string>('jfKfPfyJRdk'); // Default Lofi Girl
  const [customYtInput, setCustomYtInput] = useState<string>('');
  const [ytStatusMessage, setYtStatusMessage] = useState<string>('');

  const YT_STATIONS = [
    { id: 'jfKfPfyJRdk', name: 'Lofi Girl (Study)' },
    { id: '5qap5aO4i9A', name: 'Lofi Hip Hop Radio' },
    { id: '4xDzrJKXOOY', name: 'Synthwave Focus' },
    { id: 'n61ULEU7CO0', name: 'Rain & Piano Lofi' },
    { id: 'tNkZsRw7hxg', name: 'Deep Focus Space' },
  ];

  const extractYoutubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
  };

  const handleApplyCustomYt = () => {
    if (!customYtInput) return;
    const id = extractYoutubeId(customYtInput);
    if (id.length === 11) {
      setYtVideoId(id);
      setYtStatusMessage('🎉 Custom Station loaded successfully!');
      setCustomYtInput('');
      setYtActive(true);
      setTimeout(() => setYtStatusMessage(''), 3000);
    } else {
      setYtStatusMessage('⚠️ Invalid YouTube URL or Video ID');
      setTimeout(() => setYtStatusMessage(''), 3000);
    }
  };

  // References to active Web Audio context and active running nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeSources = useRef<{
    [key: string]: {
      sources: (AudioBufferSourceNode | OscillatorNode)[];
      gains: GainNode[];
      intervals?: any[];
    }
  }>({});

  // Load saved levels and states
  useEffect(() => {
    const savedVols = localStorage.getItem('ambient_volumes');
    if (savedVols) {
      try {
        setVolumes(JSON.parse(savedVols));
      } catch (e) {
        console.error(e);
      }
    }
    const savedAutoStop = localStorage.getItem('ambient_auto_stop');
    if (savedAutoStop) {
      setAutoStopOnBreak(savedAutoStop === 'true');
    }

    const savedGlobalVol = localStorage.getItem('ambient_global_volume');
    if (savedGlobalVol) {
      try {
        const val = parseInt(savedGlobalVol, 10);
        setGlobalVolume(val);
        globalVolumeRef.current = val;
      } catch (e) {
        console.error(e);
      }
    }

    // Load saved YouTube state
    const savedYtVideoId = localStorage.getItem('yt_video_id');
    if (savedYtVideoId) {
      setYtVideoId(savedYtVideoId);
    }
    const savedYtActive = localStorage.getItem('yt_active');
    if (savedYtActive) {
      setYtActive(savedYtActive === 'true');
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('ambient_volumes', JSON.stringify(volumes));
  }, [volumes]);

  useEffect(() => {
    localStorage.setItem('ambient_global_volume', globalVolume.toString());
  }, [globalVolume]);

  useEffect(() => {
    localStorage.setItem('ambient_auto_stop', autoStopOnBreak.toString());
  }, [autoStopOnBreak]);

  useEffect(() => {
    localStorage.setItem('yt_video_id', ytVideoId);
  }, [ytVideoId]);

  useEffect(() => {
    localStorage.setItem('yt_active', ytActive.toString());
  }, [ytActive]);

  // Clean up all audio elements on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      TRACKS.forEach(track => {
        stopSyntheticTrack(track.id);
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Helper function to stop a synthetic track and disconnect its nodes cleanly
  const stopSyntheticTrack = (trackId: string) => {
    const active = activeSources.current[trackId];
    if (active) {
      active.sources.forEach(source => {
        try {
          source.stop();
        } catch (e) {}
        try {
          source.disconnect();
        } catch (e) {}
      });
      active.gains.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {}
      });
      if (active.intervals) {
        active.intervals.forEach(interval => clearTimeout(interval));
      }
      delete activeSources.current[trackId];
    }
  };

  // Initialize Web Audio Context for synthetic generation
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // 1. Pristine White Noise Synthesizer
  const startWhiteNoise = (volume: number) => {
    stopSyntheticTrack('white_noise');
    const ctx = initAudioCtx();

    const buffer = createWhiteNoiseBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    const targetVolume = masterMutedRef.current ? 0 : (volume / 100) * 0.15 * (globalVolumeRef.current / 100);
    gainNode.gain.setValueAtTime(targetVolume, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);

    activeSources.current['white_noise'] = {
      sources: [source],
      gains: [gainNode]
    };
  };

  // 2. Deep Brown Focus Noise Synthesizer
  const startBrownNoise = (volume: number) => {
    stopSyntheticTrack('brown_noise');
    const ctx = initAudioCtx();

    const buffer = createBrownNoiseBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    const targetVolume = masterMutedRef.current ? 0 : (volume / 100) * 0.22 * (globalVolumeRef.current / 100);
    gainNode.gain.setValueAtTime(targetVolume, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);

    activeSources.current['brown_noise'] = {
      sources: [source],
      gains: [gainNode]
    };
  };

  // 3. Gentle Rain Synthesizer
  const startRain = (volume: number) => {
    stopSyntheticTrack('rain');
    const ctx = initAudioCtx();

    const pinkBuffer = createPinkNoiseBuffer(ctx);
    const pinkSource = ctx.createBufferSource();
    pinkSource.buffer = pinkBuffer;
    pinkSource.loop = true;

    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(1400, ctx.currentTime);

    const pinkGainNode = ctx.createGain();
    const targetVolume = masterMutedRef.current ? 0 : (volume / 100) * 0.25 * (globalVolumeRef.current / 100);
    pinkGainNode.gain.setValueAtTime(targetVolume, ctx.currentTime);

    pinkSource.connect(filterNode);
    filterNode.connect(pinkGainNode);
    pinkGainNode.connect(ctx.destination);

    pinkSource.start(0);

    const dropletIntervals: any[] = [];
    const triggerRaindroplet = () => {
      if (!activeSources.current['rain'] || masterMutedRef.current) return;

      try {
        const osc = ctx.createOscillator();
        const dropGain = ctx.createGain();

        const freq = 1100 + Math.random() * 800;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'sine';

        const dropFilter = ctx.createBiquadFilter();
        dropFilter.type = 'bandpass';
        dropFilter.frequency.setValueAtTime(freq, ctx.currentTime);
        dropFilter.Q.setValueAtTime(6, ctx.currentTime);

        const latestVolRatio = (volumesRef.current['rain'] / 100) * (globalVolumeRef.current / 100);
        const dropVolume = latestVolRatio * (0.01 + Math.random() * 0.035);
        dropGain.gain.setValueAtTime(0, ctx.currentTime);
        dropGain.gain.linearRampToValueAtTime(dropVolume, ctx.currentTime + 0.002);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04 + Math.random() * 0.06);

        osc.connect(dropFilter);
        dropFilter.connect(dropGain);
        dropGain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch (err) {}
    };

    const scheduleNextDroplet = () => {
      const delay = 50 + Math.random() * 160;
      const timeoutId = setTimeout(() => {
        triggerRaindroplet();
        if (activeSources.current['rain']) {
          scheduleNextDroplet();
        }
      }, delay);
      dropletIntervals.push(timeoutId);
    };
    
    scheduleNextDroplet();

    activeSources.current['rain'] = {
      sources: [pinkSource],
      gains: [pinkGainNode],
      intervals: dropletIntervals
    };
  };

  // 4. Cozy Cafe Synthesizer
  const startCafe = (volume: number) => {
    stopSyntheticTrack('cafe');
    const ctx = initAudioCtx();

    const rumbleOsc1 = ctx.createOscillator();
    rumbleOsc1.type = 'sine';
    rumbleOsc1.frequency.setValueAtTime(85, ctx.currentTime);

    const rumbleOsc2 = ctx.createOscillator();
    rumbleOsc2.type = 'sine';
    rumbleOsc2.frequency.setValueAtTime(105, ctx.currentTime);

    const rumbleGain = ctx.createGain();
    const targetRumbleVol = masterMutedRef.current ? 0 : (volume / 100) * 0.04 * (globalVolumeRef.current / 100);
    rumbleGain.gain.setValueAtTime(targetRumbleVol, ctx.currentTime);

    rumbleOsc1.connect(rumbleGain);
    rumbleOsc2.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);

    rumbleOsc1.start(0);
    rumbleOsc2.start(0);

    const babbleBuffer = createPinkNoiseBuffer(ctx);
    const babbleSource = ctx.createBufferSource();
    babbleSource.buffer = babbleBuffer;
    babbleSource.loop = true;

    const babbleFilter = ctx.createBiquadFilter();
    babbleFilter.type = 'bandpass';
    babbleFilter.frequency.setValueAtTime(550, ctx.currentTime);
    babbleFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    const chatterLfo = ctx.createOscillator();
    chatterLfo.type = 'sine';
    chatterLfo.frequency.setValueAtTime(0.25, ctx.currentTime);

    const chatterLfoGain = ctx.createGain();
    chatterLfoGain.gain.setValueAtTime(0.02, ctx.currentTime);

    const babbleGain = ctx.createGain();
    const targetBabbleVol = masterMutedRef.current ? 0 : (volume / 100) * 0.20 * (globalVolumeRef.current / 100);
    babbleGain.gain.setValueAtTime(targetBabbleVol, ctx.currentTime);

    chatterLfo.connect(chatterLfoGain);
    chatterLfoGain.connect(babbleGain.gain);

    babbleSource.connect(babbleFilter);
    babbleFilter.connect(babbleGain);
    babbleGain.connect(ctx.destination);

    babbleSource.start(0);
    chatterLfo.start(0);

    const clinkIntervals: any[] = [];
    const triggerCupClink = () => {
      if (!activeSources.current['cafe'] || masterMutedRef.current) return;

      try {
        const osc = ctx.createOscillator();
        const clinkGain = ctx.createGain();

        const freq = 2100 + Math.random() * 1900;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'sine';

        const clinkFilter = ctx.createBiquadFilter();
        clinkFilter.type = 'bandpass';
        clinkFilter.frequency.setValueAtTime(freq, ctx.currentTime);
        clinkFilter.Q.setValueAtTime(8, ctx.currentTime);

        const latestVolRatio = (volumesRef.current['cafe'] / 100) * (globalVolumeRef.current / 100);
        const maxVol = latestVolRatio * (0.005 + Math.random() * 0.015);
        clinkGain.gain.setValueAtTime(0, ctx.currentTime);
        clinkGain.gain.linearRampToValueAtTime(maxVol, ctx.currentTime + 0.001);
        clinkGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05 + Math.random() * 0.08);

        osc.connect(clinkFilter);
        clinkFilter.connect(clinkGain);
        clinkGain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (err) {}
    };

    const scheduleNextClink = () => {
      const delay = 1400 + Math.random() * 3800;
      const timeoutId = setTimeout(() => {
        triggerCupClink();
        if (activeSources.current['cafe']) {
          scheduleNextClink();
        }
      }, delay);
      clinkIntervals.push(timeoutId);
    };

    scheduleNextClink();

    activeSources.current['cafe'] = {
      sources: [rumbleOsc1, rumbleOsc2, babbleSource, chatterLfo],
      gains: [rumbleGain, babbleGain],
      intervals: clinkIntervals
    };
  };

  // Handle single play/pause track toggle
  const toggleTrack = (trackId: string) => {
    const isNowPlaying = !playingTracks[trackId];
    
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
      setIsFadedOut(false);
    }

    setPlayingTracks(prev => ({ ...prev, [trackId]: isNowPlaying }));

    if (isNowPlaying) {
      if (trackId === 'rain') startRain(volumes.rain);
      else if (trackId === 'white_noise') startWhiteNoise(volumes.white_noise);
      else if (trackId === 'cafe') startCafe(volumes.cafe);
      else if (trackId === 'brown_noise') startBrownNoise(volumes.brown_noise);
    } else {
      stopSyntheticTrack(trackId);
    }
  };

  // Handle track independent volume changes
  const handleVolumeChange = (trackId: string, value: number) => {
    setVolumes(prev => ({ ...prev, [trackId]: value }));
    
    if (masterMutedRef.current) return;
    if (!playingTracks[trackId]) return;

    const active = activeSources.current[trackId];
    if (active && active.gains.length > 0) {
      const ctx = audioCtxRef.current;
      const time = ctx ? ctx.currentTime : 0;
      const globalRatio = globalVolumeRef.current / 100;
      
      if (trackId === 'rain') {
        active.gains[0].gain.setValueAtTime((value / 100) * 0.25 * globalRatio, time);
      } else if (trackId === 'white_noise') {
        active.gains[0].gain.setValueAtTime((value / 100) * 0.15 * globalRatio, time);
      } else if (trackId === 'cafe') {
        if (active.gains[0]) active.gains[0].gain.setValueAtTime((value / 100) * 0.04 * globalRatio, time);
        if (active.gains[1]) active.gains[1].gain.setValueAtTime((value / 100) * 0.20 * globalRatio, time);
      } else if (trackId === 'brown_noise') {
        active.gains[0].gain.setValueAtTime((value / 100) * 0.22 * globalRatio, time);
      }
    }
  };

  // Handle global volume slider change
  const handleGlobalVolumeChange = (value: number) => {
    setGlobalVolume(value);
    globalVolumeRef.current = value;
    
    if (masterMutedRef.current) return;

    const ctx = audioCtxRef.current;
    const time = ctx ? ctx.currentTime : 0;
    const globalRatio = value / 100;

    TRACKS.forEach(track => {
      if (playingTracks[track.id]) {
        const active = activeSources.current[track.id];
        if (active && active.gains.length > 0) {
          const trackVol = volumesRef.current[track.id];
          if (track.id === 'rain') {
            active.gains[0].gain.setValueAtTime((trackVol / 100) * 0.25 * globalRatio, time);
          } else if (track.id === 'white_noise') {
            active.gains[0].gain.setValueAtTime((trackVol / 100) * 0.15 * globalRatio, time);
          } else if (track.id === 'cafe') {
            if (active.gains[0]) active.gains[0].gain.setValueAtTime((trackVol / 100) * 0.04 * globalRatio, time);
            if (active.gains[1]) active.gains[1].gain.setValueAtTime((trackVol / 100) * 0.20 * globalRatio, time);
          } else if (track.id === 'brown_noise') {
            active.gains[0].gain.setValueAtTime((trackVol / 100) * 0.22 * globalRatio, time);
          }
        }
      }
    });
  };

  // Master Control: Pause All / Resume Mix
  const isAnyPlaying = Object.values(playingTracks).some(v => v);
  const handleMasterToggle = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    
    if (isAnyPlaying) {
      TRACKS.forEach(track => {
        stopSyntheticTrack(track.id);
      });
      setPlayingTracks({ rain: false, white_noise: false, cafe: false, brown_noise: false });
      setIsFadedOut(false);
    } else {
      const nextPlaying = { ...playingTracks };
      let activated = false;
      
      TRACKS.forEach(track => {
        if (volumes[track.id] > 10) {
          nextPlaying[track.id] = true;
          activated = true;
          
          if (track.id === 'rain') startRain(volumes.rain);
          else if (track.id === 'white_noise') startWhiteNoise(volumes.white_noise);
          else if (track.id === 'cafe') startCafe(volumes.cafe);
          else if (track.id === 'brown_noise') startBrownNoise(volumes.brown_noise);
        }
      });

      if (!activated) {
        nextPlaying.rain = true;
        startRain(volumes.rain);
      }

      setPlayingTracks(nextPlaying);
      setIsFadedOut(false);
    }
  };

  // Handle Master Mute / Unmute Toggle
  const handleMasterMuteToggle = () => {
    const nextMute = !masterMuted;
    setMasterMuted(nextMute);
    masterMutedRef.current = nextMute;

    TRACKS.forEach(track => {
      if (playingTracks[track.id]) {
        const active = activeSources.current[track.id];
        if (active && active.gains.length > 0) {
          const ctx = audioCtxRef.current;
          const time = ctx ? ctx.currentTime : 0;
          
          const currentVol = volumesRef.current[track.id];
          const globalRatio = globalVolumeRef.current / 100;
          if (track.id === 'rain') {
            active.gains[0].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.25 * globalRatio, time);
          } else if (track.id === 'white_noise') {
            active.gains[0].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.15 * globalRatio, time);
          } else if (track.id === 'cafe') {
            if (active.gains[0]) active.gains[0].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.04 * globalRatio, time);
            if (active.gains[1]) active.gains[1].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.20 * globalRatio, time);
          } else if (track.id === 'brown_noise') {
            active.gains[0].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.22 * globalRatio, time);
          }
        }
      }
    });
  };

  // Intelligent Autopilot
  useEffect(() => {
    const isTimerActive = timerStatus === 'running';
    const isFocusSession = timerMode === 'focus';

    if (autoStopOnBreak) {
      if (!isTimerActive || !isFocusSession) {
        if (isAnyPlaying && !isFadedOut) {
          triggerGracefulFadeOut();
        }
      } else {
        if (isFadedOut) {
          triggerGracefulFadeIn();
        }
      }
    }
  }, [timerStatus, timerMode, autoStopOnBreak]);

  // Graceful Fade Out
  const triggerGracefulFadeOut = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const steps = 15;
    const stepDuration = 100;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const ratio = Math.max(0, (steps - currentStep) / steps);

      TRACKS.forEach(track => {
        if (playingTracks[track.id]) {
          const active = activeSources.current[track.id];
          if (active && active.gains.length > 0) {
            const ctx = audioCtxRef.current;
            const time = ctx ? ctx.currentTime : 0;
            
            const currentVol = volumesRef.current[track.id];
            const globalRatio = globalVolumeRef.current / 100;
            if (track.id === 'rain') {
              active.gains[0].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.25 * globalRatio * ratio, time);
            } else if (track.id === 'white_noise') {
              active.gains[0].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.15 * globalRatio * ratio, time);
            } else if (track.id === 'cafe') {
              if (active.gains[0]) active.gains[0].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.04 * globalRatio * ratio, time);
              if (active.gains[1]) active.gains[1].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.20 * globalRatio * ratio, time);
            } else if (track.id === 'brown_noise') {
              active.gains[0].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.22 * globalRatio * ratio, time);
            }
          }
        }
      });

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current!);
        fadeIntervalRef.current = null;
        TRACKS.forEach(track => {
          stopSyntheticTrack(track.id);
        });
        setIsFadedOut(true);
      }
    }, stepDuration);
  };

  // Graceful Fade In
  const triggerGracefulFadeIn = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    TRACKS.forEach(track => {
      if (playingTracks[track.id]) {
        if (track.id === 'rain') startRain(0);
        else if (track.id === 'white_noise') startWhiteNoise(0);
        else if (track.id === 'cafe') startCafe(0);
        else if (track.id === 'brown_noise') startBrownNoise(0);
      }
    });

    const steps = 15;
    const stepDuration = 100;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const ratio = Math.min(1, currentStep / steps);

      TRACKS.forEach(track => {
        if (playingTracks[track.id]) {
          const active = activeSources.current[track.id];
          if (active && active.gains.length > 0) {
            const ctx = audioCtxRef.current;
            const time = ctx ? ctx.currentTime : 0;
            
            const currentVol = volumesRef.current[track.id];
            const globalRatio = globalVolumeRef.current / 100;
            if (track.id === 'rain') {
              active.gains[0].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.25 * globalRatio * ratio, time);
            } else if (track.id === 'white_noise') {
              active.gains[0].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.15 * globalRatio * ratio, time);
            } else if (track.id === 'cafe') {
              if (active.gains[0]) active.gains[0].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.04 * globalRatio * ratio, time);
              if (active.gains[1]) active.gains[1].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.20 * globalRatio * ratio, time);
            } else if (track.id === 'brown_noise') {
              active.gains[0].gain.setValueAtTime(masterMutedRef.current ? 0 : (currentVol / 100) * 0.22 * globalRatio * ratio, time);
            }
          }
        }
      });

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current!);
        fadeIntervalRef.current = null;
        setIsFadedOut(false);
      }
    }, stepDuration);
  };

  return (
    <div className="w-full flex flex-col p-6 rounded-[2.5rem] bg-gradient-to-br from-[#0c0202]/95 via-[#130303]/90 to-[#070101]/95 backdrop-blur-[24px] border border-rose-500/15 relative overflow-hidden animate-fade-in select-none shadow-[0_0_60px_rgba(239,68,68,0.08)] group/mixer">
      {/* Dynamic atmospheric hot glowing elements */}
      <div className="absolute -right-24 -bottom-24 w-48 h-48 bg-rose-500/[0.08] rounded-full blur-[80px] pointer-events-none group-hover/mixer:bg-rose-500/[0.12] transition-all duration-1000" />
      <div className="absolute -left-24 -top-24 w-48 h-48 bg-red-600/[0.06] rounded-full blur-[80px] pointer-events-none group-hover/mixer:bg-red-600/[0.10] transition-all duration-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-red-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

      {/* Header section with Master Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 pb-5 border-b border-rose-500/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-rose-500 border border-rose-500/25 shadow-[0_0_20px_rgba(239,68,68,0.25)] relative overflow-hidden">
            <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
            <Volume2 size={18} className={isAnyPlaying && !isFadedOut ? 'animate-pulse text-rose-400' : 'text-rose-500'} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-rose-100 to-slate-200">
              SOUND SCAPE COCKPIT
            </h3>
            <p className="text-[10px] text-rose-400/70 font-semibold uppercase tracking-wider mt-0.5">
              Premium Redvibe Studio Mixer
            </p>
          </div>
        </div>

        {/* Master mute/unmute and global toggle */}
        <div className="flex items-center gap-2.5">
          {/* Mute button */}
          <button
            onClick={handleMasterMuteToggle}
            className={`p-2.5 rounded-xl border transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center ${
              masterMuted 
                ? 'bg-rose-500/25 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'bg-white/[0.02] border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-400 hover:text-white'
            }`}
            title={masterMuted ? "Unmute Master" : "Mute Master"}
          >
            {masterMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Master Play / Pause */}
          <button
            onClick={handleMasterToggle}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black border uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer active:scale-95 ${
              isAnyPlaying && !isFadedOut
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
            {isAnyPlaying && !isFadedOut ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                <Pause size={11} fill="currentColor" /> Stop Mix
              </>
            ) : (
              <>
                <Play size={11} fill="currentColor" /> Play Mix
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Master Volume Control Slider (styled as a custom switch path) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#1a0505]/50 border border-rose-500/15 rounded-2xl p-4 mb-6 relative z-10 backdrop-blur-md">
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-400/95">
            Console Output Gain
          </span>
          <span className="sm:hidden text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/15">
            {globalVolume}%
          </span>
        </div>
        <div className="flex-grow flex items-center gap-3">
          <VolumeX size={13} className="text-slate-600 shrink-0" />
          <div className="flex-grow relative flex items-center group/master">
            <input
              type="range"
              min="0"
              max="100"
              value={globalVolume}
              onChange={(e) => handleGlobalVolumeChange(parseInt(e.target.value, 10))}
              style={{ touchAction: 'none' }}
              className="w-full h-3 bg-black/60 rounded-full appearance-none cursor-pointer border border-white/5 relative focus:outline-none transition-all
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-rose-400 [&::-webkit-slider-thumb]:to-rose-600 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(239,68,68,0.9)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:cursor-ew-resize [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-rose-300
              [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-b [&::-moz-range-thumb]:from-rose-400 [&::-moz-range-thumb]:to-rose-600 [&::-moz-range-thumb]:shadow-[0_0_12px_rgba(239,68,68,0.9)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:cursor-ew-resize [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-rose-300"
              title="Global master volume"
            />
            {/* Soft background neon glow fill matching the master volume slider */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-rose-600 to-rose-400 rounded-full pointer-events-none opacity-50 blur-[2px]" 
              style={{ width: `${globalVolume}%` }}
            />
          </div>
          <Volume2 size={13} className="text-slate-400 shrink-0" />
        </div>
        <span className="hidden sm:block text-xs font-mono font-bold text-rose-400 w-10 text-right shrink-0">
          {globalVolume}%
        </span>
      </div>

      {/* Autopilot and status indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-1 relative z-10 text-[10px]">
        <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300 select-none font-bold">
          <input
            type="checkbox"
            checked={autoStopOnBreak}
            onChange={(e) => setAutoStopOnBreak(e.target.checked)}
            className="w-4 h-4 bg-black border border-rose-500/20 rounded text-rose-600 focus:ring-0 cursor-pointer accent-rose-500"
          />
          Auto-Stop during breaks
        </label>

        {isFadedOut && (
          <span className="text-rose-400 animate-pulse font-extrabold uppercase tracking-wider bg-rose-500/10 border border-rose-500/25 px-3 py-1 rounded-full text-[9px] shadow-[0_0_10px_rgba(239,68,68,0.1)]">
            Autopilot Paused
          </span>
        )}
      </div>

      {/* Mixer Tracks list - Glassy volume channel cards (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {TRACKS.map(track => {
          const isPlaying = playingTracks[track.id] && !isFadedOut;
          const volValue = volumes[track.id];
          return (
            <div
              key={track.id}
              className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-4 backdrop-blur-xl relative overflow-hidden group/card ${
                isPlaying 
                  ? 'bg-gradient-to-b from-rose-950/20 to-transparent border-rose-500/35 shadow-[0_0_25px_rgba(239,68,68,0.1)]' 
                  : 'bg-white/[0.01] hover:bg-[#1a0505]/20 border-white/5 hover:border-rose-500/15'
              }`}
            >
              {/* Subtle local glow for active channels */}
              {isPlaying && (
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-rose-500/[0.06] rounded-full blur-2xl pointer-events-none" />
              )}

              <div className="flex items-center justify-between gap-3 relative z-10">
                {/* Track icon & title */}
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                    isPlaying 
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse' 
                      : 'bg-white/5 border-white/5 text-slate-500'
                  }`}>
                    {track.icon}
                  </div>
                  <div>
                    <h4 className={`text-[11px] font-black uppercase tracking-wider ${isPlaying ? 'text-white' : 'text-slate-400'}`}>
                      {track.name}
                    </h4>
                    {track.isSynthetic && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1 h-1 rounded-full ${isPlaying ? 'bg-rose-500 animate-ping' : 'bg-slate-700'}`} />
                        <span className="text-[8px] text-rose-500/90 font-extrabold tracking-wider uppercase">SYNTH CORE</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tactile play state capsule switch */}
                <button
                  onClick={() => toggleTrack(track.id)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-extrabold tracking-widest border transition-all duration-300 active:scale-90 cursor-pointer flex items-center gap-1.5 ${
                    isPlaying
                      ? 'bg-rose-500/20 border-rose-500/45 text-rose-300 shadow-[inset_0_0_8px_rgba(239,68,68,0.2)]'
                      : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-rose-400' : 'bg-slate-600'}`} />
                  {isPlaying ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Slider channel control with hardware console style switch-lever design */}
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    {isPlaying ? <Volume2 size={10} className="text-rose-500 animate-pulse" /> : <VolumeX size={10} />}
                    {isPlaying ? 'ACTIVE' : 'STANDBY'}
                  </span>
                  <span className="font-mono font-bold text-rose-400/90 bg-rose-500/5 px-2 py-0.5 rounded-md border border-rose-500/10">
                    {volValue}%
                  </span>
                </div>

                {/* High precision horizontal slider styled as a tactile hardware mixing deck slider */}
                <div className="relative flex items-center p-2.5 bg-black/45 border border-white/5 rounded-2xl group/slider">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volValue}
                    onChange={(e) => handleVolumeChange(track.id, parseInt(e.target.value, 10))}
                    style={{ touchAction: 'none' }}
                    className="w-full h-4 bg-transparent appearance-none cursor-pointer relative focus:outline-none transition-all z-10
                    [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-neutral-900 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-white/5
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-rose-400 [&::-webkit-slider-thumb]:to-rose-600 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(239,68,68,0.85)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:cursor-ew-resize [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-rose-300 [&::-webkit-slider-thumb]:-translate-y-[8px]
                    [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-neutral-900 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border [&::-moz-range-track]:border-white/5
                    [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:bg-gradient-to-b [&::-moz-range-thumb]:from-rose-400 [&::-moz-range-thumb]:to-rose-600 [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(239,68,68,0.85)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:cursor-ew-resize [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-rose-300"
                  />
                  {/* Real-time slider glowing track highlights */}
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-rose-600 to-rose-400 rounded-full pointer-events-none opacity-40 group-hover/slider:opacity-60 blur-[1px] transition-opacity" 
                    style={{ width: `calc(${volValue}% - ${volValue * 0.1}px)` }}
                  />
                </div>

                {/* Tactile volume preset buttons that behave like custom switch triggers */}
                <div className="flex justify-between items-center gap-1 pt-1.5">
                  {[
                    { val: 0, label: 'MUTE' },
                    { val: 30, label: 'LOW' },
                    { val: 65, label: 'MID' },
                    { val: 100, label: 'MAX' }
                  ].map(p => {
                    const isPresetActive = volValue === p.val;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => handleVolumeChange(track.id, p.val)}
                        className={`flex-1 text-[8px] font-extrabold py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 text-center ${
                          isPresetActive
                            ? 'bg-rose-500/20 border-rose-500/35 text-rose-300 shadow-[inset_0_0_5px_rgba(239,68,68,0.15)] font-black'
                            : 'bg-white/[0.01] border-white/5 text-slate-500 hover:text-slate-400 hover:border-white/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- YouTube Focus Music Station with Premium Redvibe Overhaul --- */}
      <div className="mt-6 pt-6 border-t border-rose-500/10 flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <Youtube size={16} className={ytActive ? 'animate-pulse text-red-400' : 'text-red-500'} />
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-200">
                YouTube Ambient Radio
              </h4>
              <p className="text-[8px] text-rose-400/50 font-extrabold uppercase tracking-widest mt-0.5">
                Background focus stream
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => setYtActive(!ytActive)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
              ytActive 
                ? 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]' 
                : 'bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                ytActive ? 'translate-x-4 bg-white' : 'translate-x-0 bg-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Playback status */}
        {ytActive && (
          <div className="p-3 bg-red-950/20 border border-red-500/15 rounded-2xl text-[9px] text-red-300/90 leading-relaxed font-mono flex items-center gap-2 animate-fade-in">
            <span className="flex h-1.5 w-1.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span>
              {!autoStopOnBreak || (timerStatus === 'running' && timerMode === 'focus') 
                ? 'Streaming Background YouTube Audio...' 
                : 'Autopilot Paused (Resumes when Focus starts)'}
            </span>
          </div>
        )}

        {/* Curated Stations Grid */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-rose-400/60 uppercase tracking-[0.15em] pl-0.5">
            Curated Ambient Streams
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {YT_STATIONS.map(station => {
              const isSelected = ytVideoId === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => {
                    setYtVideoId(station.id);
                    setYtActive(true);
                  }}
                  className={`px-3 py-2 rounded-xl text-[9.5px] font-bold border transition-all duration-300 cursor-pointer text-left truncate flex items-center justify-between ${
                    isSelected
                      ? 'bg-red-500/15 text-red-300 border-red-500/35 font-extrabold shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{station.name}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-rose-400/60 uppercase tracking-[0.15em] pl-0.5">
            Load Custom YouTube Stream
          </span>
          <div className="flex gap-1.5">
            <div className="flex-grow relative flex items-center">
              <Link2 size={11} className="absolute left-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Paste video ID or watch link..."
                value={customYtInput}
                onChange={(e) => setCustomYtInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustomYt(); }}
                className="w-full pl-8 pr-3.5 py-2.5 bg-black/40 border border-white/5 rounded-xl text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500/35 transition-colors"
              />
            </div>
            <button
              onClick={handleApplyCustomYt}
              className="px-4 py-2.5 bg-red-500/15 hover:bg-red-500/30 text-red-300 border border-red-500/20 hover:border-red-500/35 rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            >
              Load Stream
            </button>
          </div>
          {ytStatusMessage && (
            <span className="text-[9px] font-semibold text-slate-400 animate-fade-in pl-0.5 mt-0.5">
              {ytStatusMessage}
            </span>
          )}
        </div>
      </div>

      {/* Hidden iframe background streaming engine */}
      {ytActive && (!autoStopOnBreak || (timerStatus === 'running' && timerMode === 'focus')) && (
        <iframe
          src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&loop=1&playlist=${ytVideoId}`}
          className="w-0 h-0 absolute opacity-0 pointer-events-none"
          allow="autoplay"
        />
      )}
    </div>
  );
};
