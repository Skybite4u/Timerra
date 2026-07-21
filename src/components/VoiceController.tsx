import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Sparkles, Volume2, VolumeX, AlertCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TimerStatus } from '../types';

interface VoiceControllerProps {
  status: TimerStatus;
  isFocusSilenceMode: boolean;
  onTogglePlay: () => Promise<void>;
  onStop: () => Promise<void>;
  onToggleSilenceMode: () => void;
  isFullscreen: boolean;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  status,
  isFocusSilenceMode,
  onTogglePlay,
  onStop,
  onToggleSilenceMode,
  isFullscreen,
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [showBubble, setShowBubble] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setMicError('');
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      if (event.error === 'not-allowed') {
        setMicError('Microphone access denied.');
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Safe to ignore or let it continue
      } else {
        setMicError(`Error: ${event.error}`);
        setIsListening(false);
      }
    };

    rec.onend = () => {
      // Auto-restart if we're supposed to be listening
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Failed to auto-restart recognition:', e);
        }
      } else {
        setIsListening(false);
      }
    };

    rec.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript.trim();
      handleVoiceCommand(transcript);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Handle Speech Synthesis
  const speak = useCallback((text: string) => {
    if (isFocusSilenceMode) {
      // Silence mode active: Suppress all voice speech feedback
      return;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.1; // Elegant, friendly tone
      window.speechSynthesis.speak(utterance);
    }
  }, [isFocusSilenceMode]);

  // Show visual floating speech bubble
  const triggerVisualFeedback = useCallback((msg: string) => {
    setFeedbackMsg(msg);
    setShowBubble(true);

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
    }, 4000);
  }, []);

  // Process natural language commands
  const handleVoiceCommand = async (text: string) => {
    setLastTranscript(text);
    const cleaned = text.toLowerCase().trim();

    // Regex matchers
    const startRegex = /\b(start|play|go|begin|resume|continue|unpause|activation|activate)\b/i;
    const pauseRegex = /\b(pause|stop|hold|wait|suspend|break|freeze)\b/i;
    const resetRegex = /\b(reset|restart|clear|zero|reboot)\b/i;
    const silenceRegex = /\b(silence|silent|mute|unmute|sound)\b/i;

    if (startRegex.test(cleaned)) {
      if (status !== 'running') {
        await onTogglePlay();
        const confirmation = "Focus timer activated. Let's focus!";
        triggerVisualFeedback(confirmation);
        speak(confirmation);
      } else {
        const warning = "The timer is already running.";
        triggerVisualFeedback(warning);
        speak(warning);
      }
    } else if (pauseRegex.test(cleaned)) {
      if (status === 'running') {
        await onTogglePlay();
        const confirmation = "Focus session paused.";
        triggerVisualFeedback(confirmation);
        speak(confirmation);
      } else {
        const warning = "The timer is already paused.";
        triggerVisualFeedback(warning);
        speak(warning);
      }
    } else if (resetRegex.test(cleaned)) {
      await onStop();
      const confirmation = "Timer has been reset to Focus Mode.";
      triggerVisualFeedback(confirmation);
      speak(confirmation);
    } else if (silenceRegex.test(cleaned)) {
      onToggleSilenceMode();
      const nextSilenceState = !isFocusSilenceMode;
      const confirmation = nextSilenceState 
        ? "Silence mode enabled. Shh." 
        : "Silence mode disabled. Sound on.";
      triggerVisualFeedback(confirmation);
      
      // Speak ONLY if we just turned silence mode OFF
      if (!nextSilenceState) {
        speak("Sound feedback activated.");
      }
    } else {
      // Suggest options if commands are ambiguous
      const helpfulPrompt = `Heard "${text}". Try saying: Start, Pause, Reset, or Silence Mode.`;
      triggerVisualFeedback(helpfulPrompt);
    }
  };

  const toggleListening = () => {
    if (!isSupported) return;

    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      triggerVisualFeedback("Voice Control deactivated.");
      speak("Voice Control disabled.");
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
        triggerVisualFeedback("Voice Control active. Listening...");
        speak("Voice control active. I'm listening.");
      } catch (e) {
        console.error("Failed to start voice control", e);
        setMicError("Could not start microphone.");
      }
    }
  };

  if (!isSupported) {
    return null; // Gracefully hide if Speech Recognition is unsupported (e.g. some Firefox/Safari private configurations)
  }

  return (
    <div className={`fixed z-[40] transition-all duration-300 ${
      isFullscreen 
        ? 'bottom-20 right-6 md:bottom-6 md:right-6 scale-90' 
        : 'bottom-24 right-6 md:bottom-8 md:right-8'
    }`} id="voice-controller-widget">
      <div className="relative flex items-center justify-end">
        {/* Floating Speech Bubble */}
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="absolute right-14 mr-2 bg-[#0c1424]/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl max-w-xs text-xs text-slate-200 pointer-events-none select-none tm-glass-dense flex flex-col gap-1 z-50 min-w-[180px]"
            >
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-tm-primary">
                <Sparkles className="w-3 h-3 text-tm-accent animate-pulse" /> Voice Command
              </div>
              <p className="font-medium text-white">{feedbackMsg}</p>
              {lastTranscript && (
                <div className="text-[10px] text-slate-500 font-mono italic mt-1 pt-1 border-t border-white/5">
                  Heard: "{lastTranscript}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Circle Button */}
        <div className="relative group">
          {/* Animated Glow when listening */}
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-rose-500/25 animate-ping pointer-events-none scale-125" />
          )}
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-tm-primary/20 animate-pulse pointer-events-none scale-110" />
          )}

          <button
            onClick={toggleListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border cursor-pointer active:scale-90 ${
              isListening
                ? 'bg-rose-500/20 hover:bg-rose-500/35 border-rose-500/40 text-rose-400'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-slate-300'
            }`}
            title={isListening ? 'Disable Voice Control' : 'Enable Voice Control'}
          >
            {isListening ? (
              <Mic className="w-5 h-5 animate-bounce" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>
          
          {/* Quick instructions indicator tooltip on hover (non-mobile only) */}
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col items-end gap-1 pointer-events-none select-none">
            <div className="bg-slate-900/95 border border-white/10 py-1.5 px-2.5 rounded-xl text-[9px] font-bold text-slate-300 shadow-md whitespace-nowrap uppercase tracking-wider flex items-center gap-1.5">
              <span>{isListening ? 'Listening' : 'Voice Control'}</span>
              <kbd className="bg-white/10 px-1 rounded text-white text-[8px]">Speech</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Command Legend Panel when Mic is Active */}
      <AnimatePresence>
        {isListening && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute right-0 bottom-14 mt-2 bg-[#080d1a]/85 backdrop-blur-md border border-white/5 p-3 rounded-2xl shadow-xl w-64 text-[10px] text-slate-400 pointer-events-auto select-none flex flex-col gap-2 z-30"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
              <span className="font-extrabold uppercase tracking-widest text-slate-300 text-[8px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Command Legend
              </span>
              <div className="flex items-center gap-1">
                {isFocusSilenceMode ? (
                  <span className="flex items-center gap-0.5 text-[8px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full font-bold">
                    <VolumeX className="w-2.5 h-2.5" /> Silent Mode
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-bold">
                    <Volume2 className="w-2.5 h-2.5" /> Audio Speak
                  </span>
                )}
              </div>
            </div>
            
            {micError ? (
              <div className="flex items-start gap-1 text-rose-400 bg-rose-500/10 p-1.5 rounded-xl font-bold">
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{micError}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] p-1.5 rounded-lg transition-colors border border-white/[0.03]">
                  <span className="text-white font-bold flex items-center gap-1">
                    <Play className="w-2.5 h-2.5 text-tm-primary" /> "Start" / "Play"
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Starts timer</span>
                </div>
                <div className="flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] p-1.5 rounded-lg transition-colors border border-white/[0.03]">
                  <span className="text-white font-bold flex items-center gap-1">
                    <Pause className="w-2.5 h-2.5 text-rose-400" /> "Pause" / "Stop"
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Pauses timer</span>
                </div>
                <div className="flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] p-1.5 rounded-lg transition-colors border border-white/[0.03]">
                  <span className="text-white font-bold flex items-center gap-1">
                    <RotateCcw className="w-2.5 h-2.5 text-tm-accent" /> "Reset"
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Resets Pomodoro</span>
                </div>
                <div className="flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] p-1.5 rounded-lg transition-colors border border-white/[0.03]">
                  <span className="text-white font-bold flex items-center gap-1">
                    {isFocusSilenceMode ? <Volume2 className="w-2.5 h-2.5 text-emerald-400" /> : <VolumeX className="w-2.5 h-2.5 text-amber-400" />} "Silence Mode"
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Toggle sounds</span>
                </div>
              </div>
            )}
            
            <div className="text-[8px] text-slate-500 text-center italic mt-1 pt-1 border-t border-white/5">
              Powered by browser Web Speech API
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
