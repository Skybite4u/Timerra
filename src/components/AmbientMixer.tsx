import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Trees, Coffee, Sparkles, Volume2, VolumeX, Play, Pause, RefreshCw, Music, Youtube, Link2 } from 'lucide-react';

interface AmbientMixerProps {
  timerStatus: 'idle' | 'running' | 'paused';
  timerMode: 'focus' | 'short_break' | 'long_break';
}

interface Track {
  id: string;
  name: string;
  icon: React.ReactNode;
  url?: string;
  isSynthetic: boolean;
}

const TRACKS: Track[] = [
  {
    id: 'rain',
    name: 'Gentle Rain',
    icon: <CloudRain size={16} />,
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Rain_on_roof_loop.ogg',
    isSynthetic: false
  },
  {
    id: 'forest',
    name: 'Forest Sanctuary',
    icon: <Trees size={16} />,
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Forest_birds_singing_loop.ogg',
    isSynthetic: false
  },
  {
    id: 'cafe',
    name: 'Cozy Cafe',
    icon: <Coffee size={16} />,
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Restaurant_ambience.ogg',
    isSynthetic: false
  },
  {
    id: 'brown_noise',
    name: 'Deep Focus Noise',
    icon: <Sparkles size={16} />,
    isSynthetic: true
  }
];

export const AmbientMixer: React.FC<AmbientMixerProps> = ({ timerStatus, timerMode }) => {
  // Track levels (0-100) and toggles
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({
    rain: 50,
    forest: 30,
    cafe: 20,
    brown_noise: 40
  });
  
  const [playingTracks, setPlayingTracks] = useState<{ [key: string]: boolean }>({
    rain: false,
    forest: false,
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

  // References to active Audio objects and Web Audio API
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const brownNoiseSource = useRef<AudioBufferSourceNode | null>(null);
  const brownNoiseGain = useRef<GainNode | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      
      // Stop all HTML5 Audio objects
      Object.keys(audioRefs.current).forEach(key => {
        const audio = audioRefs.current[key];
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      
      // Stop synthetic noise
      if (brownNoiseSource.current) {
        try {
          brownNoiseSource.current.stop();
        } catch (e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Get or initialize standard HTML5 Audio track
  const getAudioTrack = (trackId: string, url: string): HTMLAudioElement => {
    if (!audioRefs.current[trackId]) {
      const audio = new Audio(url);
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      audioRefs.current[trackId] = audio;
    }
    return audioRefs.current[trackId];
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

  // Synthesize Deep Brown Focus Noise
  const startBrownNoise = (volume: number) => {
    const ctx = initAudioCtx();
    if (brownNoiseSource.current) {
      stopBrownNoise();
    }

    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brownian integration filter
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain booster
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    const targetVolume = masterMuted ? 0 : (volume / 100) * 0.18; // deep comfortable scaling
    gainNode.gain.setValueAtTime(targetVolume, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start(0);
    brownNoiseSource.current = source;
    brownNoiseGain.current = gainNode;
  };

  const stopBrownNoise = () => {
    if (brownNoiseSource.current) {
      try {
        brownNoiseSource.current.stop();
        brownNoiseSource.current.disconnect();
      } catch (e) {}
      brownNoiseSource.current = null;
    }
    if (brownNoiseGain.current) {
      brownNoiseGain.current.disconnect();
      brownNoiseGain.current = null;
    }
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

    const trackObj = TRACKS.find(t => t.id === trackId);
    if (!trackObj) return;

    if (trackObj.isSynthetic) {
      if (isNowPlaying) {
        startBrownNoise(volumes[trackId]);
      } else {
        stopBrownNoise();
      }
    } else if (trackObj.url) {
      const audio = getAudioTrack(trackId, trackObj.url);
      if (isNowPlaying) {
        audio.volume = masterMuted ? 0 : volumes[trackId] / 100;
        audio.play().catch(err => {
          console.warn(`Autoplay blocked or stream failure for ${trackId}:`, err);
          // Auto revert play state
          setPlayingTracks(prev => ({ ...prev, [trackId]: false }));
        });
      } else {
        audio.pause();
      }
    }
  };

  // Handle track independent volume changes
  const handleVolumeChange = (trackId: string, value: number) => {
    setVolumes(prev => ({ ...prev, [trackId]: value }));
    
    if (masterMuted) return;

    const trackObj = TRACKS.find(t => t.id === trackId);
    if (!trackObj) return;

    if (trackObj.isSynthetic) {
      if (brownNoiseGain.current && playingTracks[trackId]) {
        brownNoiseGain.current.gain.setValueAtTime((value / 100) * 0.18, audioCtxRef.current?.currentTime || 0);
      }
    } else {
      if (audioRefs.current[trackId] && playingTracks[trackId]) {
        audioRefs.current[trackId].volume = value / 100;
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
      // Pause all playing tracks
      TRACKS.forEach(track => {
        if (playingTracks[track.id]) {
          if (track.isSynthetic) {
            stopBrownNoise();
          } else if (audioRefs.current[track.id]) {
            audioRefs.current[track.id].pause();
          }
        }
      });
      setPlayingTracks({ rain: false, forest: false, cafe: false, brown_noise: false });
      setIsFadedOut(false);
    } else {
      // Turn on all tracks that have volume > 10% as a nice shortcut mix
      const nextPlaying = { ...playingTracks };
      let activated = false;
      
      TRACKS.forEach(track => {
        if (volumes[track.id] > 10) {
          nextPlaying[track.id] = true;
          activated = true;
          
          if (track.isSynthetic) {
            startBrownNoise(volumes[track.id]);
          } else if (track.url) {
            const audio = getAudioTrack(track.id, track.url);
            audio.volume = masterMuted ? 0 : volumes[track.id] / 100;
            audio.play().catch(e => console.warn(e));
          }
        }
      });

      // Default fallback if all are 0
      if (!activated) {
        nextPlaying.rain = true;
        const rainTrack = TRACKS[0];
        if (rainTrack.url) {
          const audio = getAudioTrack('rain', rainTrack.url);
          audio.volume = masterMuted ? 0 : volumes.rain / 100;
          audio.play().catch(e => console.warn(e));
        }
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
        if (track.isSynthetic) {
          if (brownNoiseGain.current) {
            brownNoiseGain.current.gain.setValueAtTime(
              nextMute ? 0 : (volumes[track.id] / 100) * 0.18,
              audioCtxRef.current?.currentTime || 0
            );
          }
        } else if (audioRefs.current[track.id]) {
          audioRefs.current[track.id].volume = nextMute ? 0 : volumes[track.id] / 100;
        }
      }
    });
  };

  // Intelligent Autopilot: Trigger Fade-Out or Fade-In based on Timer changes!
  useEffect(() => {
    // If autoStop is enabled:
    // When timer ends (goes to break or idle) or pauses, we want to fade out soundscapes gracefully.
    // When focus starts/runs again, we want to resume (fade in) standard levels!
    const isTimerActive = timerStatus === 'running';
    const isFocusSession = timerMode === 'focus';

    if (autoStopOnBreak) {
      if (!isTimerActive || !isFocusSession) {
        // Fade out active ambient soundscapes if they are playing
        if (isAnyPlaying && !isFadedOut) {
          triggerGracefulFadeOut();
        }
      } else {
        // Resume / Fade in if we were previously autopilot faded out
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
          if (track.isSynthetic) {
            if (brownNoiseGain.current) {
              const normalVol = (volumes[track.id] / 100) * 0.18;
              brownNoiseGain.current.gain.setValueAtTime(
                masterMuted ? 0 : normalVol * ratio,
                audioCtxRef.current?.currentTime || 0
              );
            }
          } else if (audioRefs.current[track.id]) {
            const normalVol = volumes[track.id] / 100;
            audioRefs.current[track.id].volume = masterMuted ? 0 : normalVol * ratio;
          }
        }
      });

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current!);
        fadeIntervalRef.current = null;
        
        // Actually pause playback
        TRACKS.forEach(track => {
          if (playingTracks[track.id]) {
            if (track.isSynthetic) {
              stopBrownNoise();
            } else if (audioRefs.current[track.id]) {
              audioRefs.current[track.id].pause();
            }
          }
        });
        
        setIsFadedOut(true);
      }
    }, stepDuration);
  };

  // Graceful Fade In (Restore audio to user set levels)
  const triggerGracefulFadeIn = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    // First start the players with volume at 0
    TRACKS.forEach(track => {
      if (playingTracks[track.id]) {
        if (track.isSynthetic) {
          startBrownNoise(0);
        } else if (track.url) {
          const audio = getAudioTrack(track.id, track.url);
          audio.volume = 0;
          audio.play().catch(e => console.warn(e));
        }
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
          if (track.isSynthetic) {
            if (brownNoiseGain.current) {
              const normalVol = (volumes[track.id] / 100) * 0.18;
              brownNoiseGain.current.gain.setValueAtTime(
                masterMuted ? 0 : normalVol * ratio,
                audioCtxRef.current?.currentTime || 0
              );
            }
          } else if (audioRefs.current[track.id]) {
            const normalVol = volumes[track.id] / 100;
            audioRefs.current[track.id].volume = masterMuted ? 0 : normalVol * ratio;
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
