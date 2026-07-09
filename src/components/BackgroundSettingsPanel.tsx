import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Upload,
  RefreshCw,
  Eye,
  Settings,
  Flame,
  Palette,
  CloudLightning
} from 'lucide-react';
import { BackgroundConfig } from '../types';

interface BackgroundSettingsPanelProps {
  config: BackgroundConfig;
  onChange: (newConfig: BackgroundConfig) => void;
  onReset: () => void;
}

export function BackgroundSettingsPanel({ config, onChange, onReset }: BackgroundSettingsPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    type,
    opacity,
    blur,
    brightness,
    darkOverlay,
    zoom,
    position,
    animationSpeed,
    loop,
    muted,
    customFileName,
  } = config;

  const updateField = (field: keyof BackgroundConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  // Convert uploaded image or video to Base64
  const handleFile = (file: File) => {
    setErrorMsg(null);
    const maxSize = 20 * 1024 * 1024; // 20 MB ceiling for storage
    if (file.size > maxSize) {
      setErrorMsg('⚠️ File is too large! Please choose an asset under 20MB.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setErrorMsg('⚠️ Invalid file type! Please upload a valid image (PNG/JPG/GIF) or video (MP4/WEBM).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onChange({
        ...config,
        type: isVideo ? 'video' : 'image',
        customFileBase64: base64,
        customFileName: file.name,
        customFileType: file.type,
      });
    };
    reader.onerror = () => {
      setErrorMsg('⚠️ An error occurred while reading the file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const backgroundPresets: { id: typeof config.type; label: string; icon: any; desc: string }[] = [
    { id: 'gradient', label: 'Solid Graphite', icon: Palette, desc: 'Ultra-low contrast slate graphite backdrop' },
    { id: 'aurora', label: 'Ethereal Aurora', icon: Sparkles, desc: 'Shifting sinus waves of purple and cyan' },
    { id: 'particles', label: 'Constellation Grid', icon: Sliders, desc: 'Floating grid of interconnected stars' },
    { id: 'fireflies', label: 'Summer Fireflies', icon: Flame, desc: 'Warm glowing golden fireflies' },
    { id: 'stars', label: 'Cosmic Twinkle', icon: ImageIcon, desc: 'Dense night sky with pulsating stellar dust' },
    { id: 'galaxy', label: 'Nebula Portal', icon: Eye, desc: 'Swirling gravitational cosmic nebula fields' },
    { id: 'rain', label: 'Soothing Rain', icon: CloudLightning, desc: 'Vertical falling line drops with custom wind' },
    { id: 'snow', label: 'Alpine Blizzard', icon: ImageIcon, desc: 'Gentle drifting white circular crystal flakes' },
    { id: 'sakura', label: 'Sakura Garden', icon: ImageIcon, desc: 'Organic pink falling sakura garden leaves' },
    { id: 'clouds', label: 'Floating Clouds', icon: ImageIcon, desc: 'Slow, peaceful drifting ambient clouds' },
    { id: 'shapes', label: 'Geometric Floating', icon: ImageIcon, desc: 'Pulsating 3D glass geometric spheres and cubes' },
  ];

  return (
    <div className="w-full flex flex-col p-6 rounded-3xl backdrop-blur-xl bg-slate-900/40 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] select-none">
      
      {/* HEADER HUD */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sliders size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Active Canvas Engine</h3>
            <p className="text-[10px] text-slate-500 font-medium">Fine-tune focus space ambience</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-white bg-white/5 border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <RefreshCw size={10} /> Reset Canvas
        </button>
      </div>

      {/* CHOOSE PRESETS CONTAINER */}
      <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mb-2 block">
        1. Select Dynamic Background Engine
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
        {backgroundPresets.map((preset) => {
          const isSelected = type === preset.id;
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              onClick={() => updateField('type', preset.id)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-300 flex flex-col gap-1 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                  : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={12} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
                <span className="text-[10.5px] font-bold truncate leading-tight">{preset.label}</span>
              </div>
              <span className="text-[8.5px] text-slate-500 line-clamp-1 leading-normal font-medium">{preset.desc}</span>
            </button>
          );
        })}
      </div>

      {/* 2. CUSTOM UPLOADS CONTAINER */}
      <div className="border-t border-white/5 pt-4 mb-5">
        <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mb-2.5 block">
          2. Or Import Custom Media Files (Images / Videos)
        </label>

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-400 bg-indigo-500/5'
              : 'border-white/10 hover:border-white/20 bg-black/10'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-1.5">
            <div className="p-2 rounded-full bg-white/5 border border-white/5 text-slate-400">
              <Upload size={14} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold text-slate-300">
                Click to browse or drag & drop media
              </p>
              <p className="text-[8.5px] text-slate-500 mt-0.5 font-medium">
                Supports JPG, PNG, GIF, MP4, WEBM up to 20MB
              </p>
            </div>
          </div>
        </div>

        {/* Current Custom File Feedback */}
        {(type === 'image' || type === 'video') && customFileName && (
          <div className="mt-3 px-3 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center justify-between text-[10px] text-indigo-300 font-mono">
            <span className="truncate max-w-[210px] flex items-center gap-1.5">
              {type === 'video' ? <VideoIcon size={12} /> : <ImageIcon size={12} />}
              {customFileName}
            </span>
            <span className="text-[8.5px] font-bold uppercase text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
              {type} Loaded
            </span>
          </div>
        )}

        {errorMsg && (
          <p className="text-[10px] text-rose-400 font-semibold mt-2.5 pl-0.5">
            {errorMsg}
          </p>
        )}
      </div>

      {/* 3. HARDWARE PARAMETERS ADJUST SLIDERS */}
      <div className="border-t border-white/5 pt-4 flex flex-col gap-3.5">
        <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mb-1 block">
          3. Ambient Fine-Tuning Board
        </label>

        {/* Opacity */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
            <span>Canvas Opacity</span>
            <span className="font-mono text-[10.5px] text-slate-300">{opacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => updateField('opacity', Number(e.target.value))}
            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5"
          />
        </div>

        {/* Blur */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
            <span>Background Blur</span>
            <span className="font-mono text-[10.5px] text-slate-300">{blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            value={blur}
            onChange={(e) => updateField('blur', Number(e.target.value))}
            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5"
          />
        </div>

        {/* Brightness */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
            <span>Canvas Brightness</span>
            <span className="font-mono text-[10.5px] text-slate-300">{brightness}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="150"
            value={brightness}
            onChange={(e) => updateField('brightness', Number(e.target.value))}
            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5"
          />
        </div>

        {/* Dark Overlay opacity */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
            <span>Dark Fog Density</span>
            <span className="font-mono text-[10.5px] text-slate-300">{darkOverlay}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="95"
            value={darkOverlay}
            onChange={(e) => updateField('darkOverlay', Number(e.target.value))}
            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5"
          />
        </div>

        {/* Background Zoom */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
            <span>Canvas Camera Zoom</span>
            <span className="font-mono text-[10.5px] text-slate-300">{zoom}%</span>
          </div>
          <input
            type="range"
            min="100"
            max="150"
            value={zoom}
            onChange={(e) => updateField('zoom', Number(e.target.value))}
            className="w-full h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5"
          />
        </div>

        {/* Extra adjustments for video/custom files */}
        <div className="grid grid-cols-2 gap-3 mt-1.5">
          {/* Position Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Anchor Point</label>
            <select
              value={position}
              onChange={(e) => updateField('position', e.target.value)}
              className="px-2.5 py-1.5 bg-black/20 border border-white/10 rounded-xl text-[10px] text-slate-400 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
            >
              <option value="center" className="bg-slate-950">Center</option>
              <option value="top" className="bg-slate-950">Top</option>
              <option value="bottom" className="bg-slate-950">Bottom</option>
              <option value="left" className="bg-slate-950">Left</option>
              <option value="right" className="bg-slate-950">Right</option>
            </select>
          </div>

          {/* Animation Speed Slider */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-0.5 flex items-center justify-between">
              <span>Drift Speed</span>
              <span className="font-mono text-slate-300 font-bold">{animationSpeed.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => updateField('animationSpeed', Number(e.target.value))}
              className="w-full h-2.5 mt-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5"
            />
          </div>
        </div>

        {/* Video Audio Control Switch */}
        {type === 'video' && (
          <div className="flex items-center justify-between p-2.5 bg-black/20 border border-white/5 rounded-xl mt-1 text-[10.5px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              {muted ? <VolumeX size={12} className="text-slate-500" /> : <Volume2 size={12} className="text-indigo-400" />}
              Background Video Audio
            </span>
            <button
              onClick={() => updateField('muted', !muted)}
              className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                !muted
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {muted ? 'Muted' : 'Unmuted'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
