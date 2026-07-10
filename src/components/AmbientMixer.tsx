import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Trees, Coffee, Sparkles, Volume2, VolumeX, Play, Pause, RefreshCw, Music, Youtube, Link2 } from 'lucide-react';

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

// Pure Web Audio Buffer Generators (placed at top-level to prevent re-creation)
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
  const [autoStopOnBreak, setAutoStopOnBreak] = useState<boolean>(true);
  const [isFadedOut, setIsFadedOut] = useState<boolean>(false);

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
      // Clear interval
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      
      // Stop all synthetic tracks
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
    const targetVolume = masterMuted ? 0 : (volume / 100) * 0.15; // Soft ceiling
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
    const targetVolume = masterMuted ? 0 : (volume / 100) * 0.22;
    gainNode.gain.setValueAtTime(targetVolume, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);

    activeSources.current['brown_noise'] = {
      sources: [source],
      gains: [gainNode]
    };
  };

  // 3. Gentle Rain Synthesizer (Pink Noise + Lowpass + random crackle droplets)
  const startRain = (volume: number) => {
    stopSyntheticTrack('rain');
    const ctx = initAudioCtx();

    // Pink noise base
    const pinkBuffer = createPinkNoiseBuffer(ctx);
    const pinkSource = ctx.createBufferSource();
    pinkSource.buffer = pinkBuffer;
    pinkSource.loop = true;

    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(1400, ctx.currentTime);

    const pinkGainNode = ctx.createGain();
    const targetVolume = masterMuted ? 0 : (volume / 100) * 0.25;
    pinkGainNode.gain.setValueAtTime(targetVolume, ctx.currentTime);

    pinkSource.connect(filterNode);
    filterNode.connect(pinkGainNode);
    pinkGainNode.connect(ctx.destination);

    pinkSource.start(0);

    // Random droplet generator
    const dropletIntervals: any[] = [];
    const triggerRaindroplet = () => {
      // Fetch latest values directly from refs to avoid stale capture
      if (!activeSources.current['rain'] || masterMuted) return;

      try {
        const osc = ctx.createOscillator();
        const dropGain = ctx.createGain();

        const freq = 1100 + Math.random() * 800; // 1100Hz to 1900Hz
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'sine';

        const dropFilter = ctx.createBiquadFilter();
        dropFilter.type = 'bandpass';
        dropFilter.frequency.setValueAtTime(freq, ctx.currentTime);
        dropFilter.Q.setValueAtTime(6, ctx.currentTime);

        const latestVolRatio = volumes['rain'] / 100;
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
      const delay = 50 + Math.random() * 160; // droplets speed trigger
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

  // 4. Cozy Cafe Synthesizer (Room rumble + voice-frequency bandpass babble + random clinks)
  const startCafe = (volume: number) => {
    stopSyntheticTrack('cafe');
    const ctx = initAudioCtx();

    // Low crowd room rumble
    const rumbleOsc1 = ctx.createOscillator();
    rumbleOsc1.type = 'sine';
    rumbleOsc1.frequency.setValueAtTime(85, ctx.currentTime);

    const rumbleOsc2 = ctx.createOscillator();
    rumbleOsc2.type = 'sine';
    rumbleOsc2.frequency.setValueAtTime(105, ctx.currentTime);

    const rumbleGain = ctx.createGain();
    const targetRumbleVol = masterMuted ? 0 : (volume / 100) * 0.04;
    rumbleGain.gain.setValueAtTime(targetRumbleVol, ctx.currentTime);

    rumbleOsc1.connect(rumbleGain);
    rumbleOsc2.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);

    rumbleOsc1.start(0);
    rumbleOsc2.start(0);

    // Crowd babble simulation
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
    const targetBabbleVol = masterMuted ? 0 : (volume / 100) * 0.20;
    babbleGain.gain.setValueAtTime(targetBabbleVol, ctx.currentTime);

    chatterLfo.connect(chatterLfoGain);
    chatterLfoGain.connect(babbleGain.gain);

    babbleSource.connect(babbleFilter);
    babbleFilter.connect(babbleGain);
    babbleGain.connect(ctx.destination);

    babbleSource.start(0);
    chatterLfo.start(0);

    // Random coffee cup clinks
    const clinkIntervals: any[] = [];
    const triggerCupClink = () => {
      if (!activeSources.current['cafe'] || masterMuted) return;

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

        const latestVolRatio = volumes['cafe'] / 100;
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
      const delay = 1400 + Math.random() * 3800; // random coffee cups clink intervals
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
    
    // Clear any active fade operations
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
    
    if (masterMuted) return;
    if (!playingTracks[trackId]) return;

    const active = activeSources.current[trackId];
    if (active && active.gains.length > 0) {
      const ctx = audioCtxRef.current;
      const time = ctx ? ctx.currentTime : 0;
      
      if (trackId === 'rain') {
        active.gains[0].gain.setValueAtTime((value / 100) * 0.25, time);
      } else if (trackId === 'white_noise') {
        active.gains[0].gain.setValueAtTime((value / 100) * 0.15, time);
      } else if (trackId === 'cafe') {
        if (active.gains[0]) active.gains[0].gain.setValueAtTime((value / 100) * 0.04, time);
        if (active.gains[1]) active.gains[1].gain.setValueAtTime((value / 100) * 0.20, time);
      } else if (trackId === 'brown_noise') {
        active.gains[0].gain.setValueAtTime((value / 100) * 0.22, time);
      }
    }
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

    TRACKS.forEach(track => {
      if (playingTracks[track.id]) {
        const active = activeSources.current[track.id];
        if (active && active.gains.length > 0) {
          const ctx = audioCtxRef.current;
          const time = ctx ? ctx.currentTime : 0;
          
          const currentVol = volumes[track.id];
          if (track.id === 'rain') {
            active.gains[0].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.25, time);
          } else if (track.id === 'white_noise') {
            active.gains[0].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.15, time);
          } else if (track.id === 'cafe') {
            if (active.gains[0]) active.gains[0].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.04, time);
            if (active.gains[1]) active.gains[1].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.20, time);
          } else if (track.id === 'brown_noise') {
            active.gains[0].gain.setValueAtTime(nextMute ? 0 : (currentVol / 100) * 0.22, time);
          }
        }
      }
    });
  };

  // Intelligent Autopilot: Trigger Fade-Out or Fade-In based on Timer changes!
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
    const stepDuration = 100; // Total 1.5 second fade
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
            
            const currentVol = volumes[track.id];
            if (track.id === 'rain') {
              active.gains[0].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.25 * ratio, time);
            } else if (track.id === 'white_noise') {
              active.gains[0].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.15 * ratio, time);
            } else if (track.id === 'cafe') {
              if (active.gains[0]) active.gains[0].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.04 * ratio, time);
              if (active.gains[1]) active.gains[1].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.20 * ratio, time);
            } else if (track.id === 'brown_noise') {
              active.gains[0].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.22 * ratio, time);
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

  // Graceful Fade In (Restore audio to user set levels)
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
    const stepDuration = 100; // Total 1.5 second fade
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
            
            const currentVol = volumes[track.id];
            if (track.id === 'rain') {
              active.gains[0].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.25 * ratio, time);
            } else if (track.id === 'white_noise') {
              active.gains[0].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.15 * ratio, time);
            } else if (track.id === 'cafe') {
              if (active.gains[0]) active.gains[0].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.04 * ratio, time);
              if (active.gains[1]) active.gains[1].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.20 * ratio, time);
            } else if (track.id === 'brown_noise') {
              active.gains[0].gain.setValueAtTime(masterMuted ? 0 : (currentVol / 100) * 0.22 * ratio, time);
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
    <div className="w-full flex flex-col p-5 rounded-3xl glossy-panel glossy-panel-hover relative overflow-hidden animate-fade-in select-none">
      <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-blue-500/5 blur-2xl pointer-events-none" />
      
      {/* Header section with Master Trigger */}
      <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Volume2 size={16} className={isAnyPlaying && !isFadedOut ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Ambient Soundscapes</h3>
            <p className="text-[10px] text-slate-500">Simultaneous Multi-Track Mixer</p>
          </div>
        </div>

        {/* Master mute/unmute and global toggle */}
        <div className="flex items-center gap-2">
          {/* Mute button */}
          <button
            id="btn-ambient-mute-toggle"
            onClick={handleMasterMuteToggle}
            className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
              masterMuted 
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' 
                : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-400'
            }`}
            title={masterMuted ? "Unmute Master" : "Mute Master"}
          >
            {masterMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Master Play / Pause */}
          <button
            id="btn-ambient-master-toggle"
            onClick={handleMasterToggle}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-95 ${
              isAnyPlaying && !isFadedOut
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {isAnyPlaying && !isFadedOut ? (
              <>
                <Pause size={10} fill="currentColor" /> Stop Mix
              </>
            ) : (
              <>
                <Play size={10} fill="currentColor" /> Play Mix
              </>
            )}
          </button>
        </div>
      </div>

      {/* Autopilot and status indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 px-1 relative z-10 text-[10px]">
        <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer hover:text-slate-400 select-none">
          <input
            type="checkbox"
            checked={autoStopOnBreak}
            onChange={(e) => setAutoStopOnBreak(e.target.checked)}
            className="w-3.5 h-3.5 bg-black border border-white/10 rounded text-blue-600 focus:ring-0 cursor-pointer"
          />
          Auto-Stop/Fade during breaks
        </label>

        {isFadedOut && (
          <span className="text-blue-400 animate-pulse font-semibold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full text-[9px]">
            Autopilot Paused
          </span>
        )}
      </div>

      {/* Mixer Tracks list */}
      <div className="flex flex-col gap-3.5 relative z-10">
        {TRACKS.map(track => {
          const isPlaying = playingTracks[track.id] && !isFadedOut;
          const volValue = volumes[track.id];
          return (
            <div
              key={track.id}
              className={`p-3 rounded-2xl border transition-all duration-300 ${
                isPlaying 
                  ? 'bg-blue-500/[0.02] border-blue-500/20 shadow-md shadow-blue-500/[0.02]' 
                  : 'bg-white/[0.01] border-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                {/* Track icon & title */}
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border transition-all ${
                    isPlaying 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]' 
                      : 'bg-white/5 border-white/5 text-slate-500'
                  }`}>
                    {track.icon}
                  </div>
                  <div>
                    <h4 className={`text-[11px] font-bold uppercase tracking-wider ${isPlaying ? 'text-slate-200' : 'text-slate-400'}`}>
                      {track.name}
                    </h4>
                    {track.isSynthetic && (
                      <p className="text-[8px] text-blue-400 font-semibold tracking-wider uppercase">Local Synth</p>
                    )}
                  </div>
                </div>

                {/* Individual play state */}
                <button
                  id={`btn-track-toggle-${track.id}`}
                  onClick={() => toggleTrack(track.id)}
                  className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                    isPlaying
                      ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                      : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                </button>
              </div>

              {/* Slider track control */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-slate-600 w-3">
                  {isPlaying ? <Volume2 size={10} className="text-blue-500/70" /> : <VolumeX size={10} />}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volValue}
                  onChange={(e) => handleVolumeChange(track.id, parseInt(e.target.value, 10))}
                  className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[9px] font-mono text-slate-500 min-w-[20px] text-right">
                  {volValue}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- YouTube Focus Music Station --- */}
      <div className="mt-5 pt-5 border-t border-white/5 flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Youtube size={14} className={ytActive ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                YouTube Ambient Radio
              </h4>
              <p className="text-[8px] text-slate-500 font-medium uppercase">Background Focus Streamer</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            id="toggle-yt-player"
            onClick={() => setYtActive(!ytActive)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
              ytActive 
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' 
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
          <div className="p-2 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[9px] text-rose-300/90 leading-relaxed font-mono flex items-center gap-1.5 animate-fade-in">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
            </span>
            <span>
              {!autoStopOnBreak || (timerStatus === 'running' && timerMode === 'focus') 
                ? 'Streaming Background YouTube Audio...' 
                : 'Autopilot Paused (Resumes when Focus starts)'}
            </span>
          </div>
        )}

        {/* Curated Stations Grid */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">
            Curated Ambient Streams
          </span>
          <div className="flex flex-wrap gap-1.5">
            {YT_STATIONS.map(station => {
              const isSelected = ytVideoId === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => {
                    setYtVideoId(station.id);
                    setYtActive(true);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[9px] font-medium border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-semibold shadow-[0_0_8px_rgba(239,68,68,0.08)]'
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {station.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">
            Load Custom YouTube Stream
          </span>
          <div className="flex gap-1.5">
            <div className="flex-1 relative flex items-center">
              <Link2 size={11} className="absolute left-3 text-slate-500" />
              <input
                type="text"
                placeholder="Paste video ID or watch link..."
                value={customYtInput}
                onChange={(e) => setCustomYtInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustomYt(); }}
                className="w-full pl-7 pr-3 py-1.5 bg-black/20 border border-white/5 rounded-xl text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/30 transition-colors"
              />
            </div>
            <button
              onClick={handleApplyCustomYt}
              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 hover:border-rose-500/30 rounded-xl text-[9px] font-bold transition-all cursor-pointer"
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

        <p className="text-[9px] text-slate-600 leading-relaxed pl-0.5">
          ⚠️ <strong>Note:</strong> YouTube stream is fetched server-side or rendered via browser iframe directly to keep ambient focus private and seamless.
        </p>
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
