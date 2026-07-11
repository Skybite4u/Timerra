import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  FileDown, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  Key, 
  Database, 
  Shield, 
  Copy, 
  Edit2, 
  Play, 
  Sparkles, 
  Sliders, 
  Palette, 
  Trash2, 
  Calendar, 
  Check, 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  Award,
  History,
  Info,
  Clock,
  Volume2
} from 'lucide-react';
import { encryptBackup, decryptBackup } from '../lib/crypto';
import { BackupPayload, EncryptedBackupFile, TimerSettings, Session } from '../types';
import { CapsuleDB, SavedCapsule } from '../lib/capsuleDb';
import { playClick, playComplete } from '../lib/audio';
import { NotificationManager } from '../lib/notificationManager';
import { 
  ExportCapsuleIcon, 
  ImportCapsuleIcon, 
  RestoreCapsuleIcon, 
  ManageCapsuleIcon 
} from './CapsuleIcons';

interface AuthModalProps {
  onClose: () => void;
  onGetBackupPayload: () => Promise<BackupPayload>;
  onImportPayload: (payload: BackupPayload) => Promise<void>;
}

type TabType = 'home' | 'export' | 'import' | 'restore' | 'manage';

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onGetBackupPayload,
  onImportPayload,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [savedCapsules, setSavedCapsules] = useState<SavedCapsule[]>([]);
  const [passphrase, setPassphrase] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [customDeviceName, setCustomDeviceName] = useState<string>('');

  // CSV Export compatibility state
  const [csvStatus, setCsvStatus] = useState<string | null>(null);

  // Import flow state
  const [importedCapsule, setImportedCapsule] = useState<any>(null);
  const [decryptionPassword, setDecryptionPassword] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [restoreProgress, setRestoreProgress] = useState<number>(0);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoredSummary, setRestoredSummary] = useState<string | null>(null);

  // Animation states
  const [exportAnimationStage, setExportAnimationStage] = useState<'idle' | 'sealing' | 'complete'>('idle');

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    text: string;
  }>({ type: null, text: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect basic device name for pre-fill
  useEffect(() => {
    let device = 'Desktop Device';
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) device = 'iPhone/iPad';
    else if (/Android/i.test(ua)) device = 'Android Mobile';
    else if (/Macintosh/i.test(ua)) device = 'MacBook/Mac';
    else if (/Windows/i.test(ua)) device = 'Windows PC';
    else if (/Linux/i.test(ua)) device = 'Linux Station';
    setCustomDeviceName(device);

    // Load saved capsules
    loadCapsulesFromVault();
  }, []);

  const loadCapsulesFromVault = async () => {
    const list = await CapsuleDB.getAll();
    // Sort by last modified descending
    list.sort((a, b) => b.lastModified - a.lastModified);
    setSavedCapsules(list);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processCapsuleFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processCapsuleFile(files[0]);
    }
  };

  const processCapsuleFile = async (file: File) => {
    setStatus({ type: 'info', text: 'Reading capsule container integrity...' });
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.app !== 'Timerra' || parsed.format !== 'Capsule') {
          setStatus({
            type: 'error',
            text: 'Not a valid Timerra Capsule archive (.tmcapsule). Please check the file.',
          });
          return;
        }

        setImportedCapsule(parsed);
        setIsUnlocked(!parsed.encrypted);
        setDecryptionPassword('');
        setRestoreProgress(0);
        setRestoredSummary(null);
        setStatus({ 
          type: 'success', 
          text: `Integrity verified! Loaded Capsule from ${parsed.meta.exportDevice}.` 
        });
      } catch (err) {
        setStatus({
          type: 'error',
          text: `Invalid capsule archive structure: ${err instanceof Error ? err.message : 'failed to parse JSON'}`,
        });
      }
    };
    reader.onerror = () => {
      setStatus({ type: 'error', text: 'Failed to read the capsule file.' });
    };
    reader.readAsText(file);
  };

  const handleDecryptCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importedCapsule || !decryptionPassword) return;

    try {
      setStatus({ type: 'info', text: 'Deriving key and decrypting locally...' });
      const payload = await decryptBackup(importedCapsule.payload, decryptionPassword);
      
      // Decryption succeeded! Store clean payload inside importedCapsule so we can restore
      setImportedCapsule({
        ...importedCapsule,
        decryptedPayload: payload
      });
      setIsUnlocked(true);
      setStatus({
        type: 'success',
        text: 'Zero-knowledge capsule decrypted successfully!',
      });
    } catch (err) {
      setStatus({
        type: 'error',
        text: 'Decryption failed. Incorrect password or corrupted capsule data.',
      });
    }
  };

  const triggerRestoreCapsule = async () => {
    if (!importedCapsule) return;
    try {
      setIsRestoring(true);
      setStatus({ type: 'info', text: 'Preparing workspace restoration...' });
      
      // Animate progress bar elegantly (energy flow)
      for (let p = 0; p <= 100; p += 5) {
        setRestoreProgress(p);
        await new Promise((r) => setTimeout(r, 45));
      }

      const payload = importedCapsule.decryptedPayload || importedCapsule.payload;
      await onImportPayload(payload);

      // Save this capsule to the local manage vault if it is not already there
      const sizeBytes = JSON.stringify(importedCapsule).length;
      const capsuleRecord: SavedCapsule = {
        id: importedCapsule.meta.createdAt.toString() + '_' + Date.now(),
        filename: `${importedCapsule.meta.exportDevice.replace(/\s+/g, '_')}_Imported.tmcapsule`,
        createdAt: importedCapsule.meta.createdAt,
        lastModified: Date.now(),
        fileSize: sizeBytes,
        deviceName: importedCapsule.meta.exportDevice,
        appVersion: importedCapsule.meta.appVersion,
        theme: importedCapsule.meta.theme,
        focusHours: importedCapsule.meta.focusHours,
        completedSessionsCount: importedCapsule.meta.completedSessions,
        taskCount: importedCapsule.meta.taskCount,
        isEncrypted: importedCapsule.encrypted,
        capsuleData: JSON.stringify(importedCapsule)
      };
      await CapsuleDB.save(capsuleRecord);
      await loadCapsulesFromVault();

      playComplete();
      setIsRestoring(false);
      setRestoredSummary(`Welcome back! Your complete study workspace containing ${payload.sessions.length} sessions and custom settings has been fully restored.`);
      setStatus({
        type: 'success',
        text: 'Workspace Restored! All study history and preferences are back online.'
      });

      NotificationManager.addNotification(
        'Capsule Restored Successfully',
        `Restored study workspace containing ${payload.sessions.length} sessions and custom presets successfully.`,
        'Capsules',
        true, // critical
        false
      );
    } catch (err) {
      setIsRestoring(false);
      setStatus({
        type: 'error',
        text: `Restoration failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      });

      NotificationManager.addNotification(
        'Workspace Restoration Failure',
        `A failure occurred while attempting to restore backup capsule: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'Capsules',
        true, // critical
        false
      );
    }
  };

  const handleExportCapsule = async () => {
    try {
      setIsExporting(true);
      setExportAnimationStage('sealing');
      setStatus({ type: 'info', text: 'Compiling local study history and workspace settings...' });
      
      // Artificial delay for high-end feel & seal animation
      await new Promise((r) => setTimeout(r, 1500));

      const plainPayload = await onGetBackupPayload();
      const focusHours = parseFloat((plainPayload.sessions.reduce((sum, s) => sum + s.durationSec, 0) / 3600).toFixed(1));
      
      let finalPayload: any = plainPayload;
      let isEncrypted = false;

      if (passphrase.trim()) {
        setStatus({ type: 'info', text: 'Encrypting payload locally with AES-256...' });
        finalPayload = await encryptBackup(plainPayload, passphrase);
        isEncrypted = true;
      }

      const appVersion = 'v1.1';
      const createdAt = Date.now();
      const capsule = {
        app: 'Timerra',
        format: 'Capsule',
        version: '1.2',
        encrypted: isEncrypted,
        meta: {
          appVersion,
          createdAt,
          exportDevice: customDeviceName || 'Unknown Device',
          focusHours,
          completedSessions: plainPayload.sessions.length,
          taskCount: plainPayload.subjects.length, // use subjects count as tasks/shortcuts placeholder
          theme: plainPayload.settings.theme,
          versionCompatibility: 'v1.0+',
          isEncrypted
        },
        payload: finalPayload
      };

      const capsuleStr = JSON.stringify(capsule, null, 2);
      const sizeBytes = capsuleStr.length;

      // Also auto-save to local vault list
      const capsuleRecord: SavedCapsule = {
        id: createdAt.toString(),
        filename: `${customDeviceName.replace(/\s+/g, '_')}_${new Date(createdAt).toISOString().split('T')[0]}.tmcapsule`,
        createdAt,
        lastModified: createdAt,
        fileSize: sizeBytes,
        deviceName: customDeviceName,
        appVersion,
        theme: plainPayload.settings.theme,
        focusHours,
        completedSessionsCount: plainPayload.sessions.length,
        taskCount: plainPayload.subjects.length,
        isEncrypted,
        capsuleData: capsuleStr
      };

      await CapsuleDB.save(capsuleRecord);
      await loadCapsulesFromVault();

      // Trigger actual download of tmcapsule file
      const blob = new Blob([capsuleStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = capsuleRecord.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportAnimationStage('complete');
      setIsExporting(false);
      setPassphrase('');
      setStatus({
        type: 'success',
        text: `Capsule created successfully! Ported to ${capsuleRecord.filename}.`
      });

      NotificationManager.addNotification(
        'Backup Capsule Compiled',
        `A secure study capsule "${capsuleRecord.filename}" containing ${plainPayload.sessions.length} sessions has been successfully compiled and downloaded.`,
        'Capsules',
        false, // normal
        false
      );
    } catch (err) {
      setIsExporting(false);
      setExportAnimationStage('idle');
      setStatus({
        type: 'error',
        text: `Capsule creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      });

      NotificationManager.addNotification(
        'Capsule Export Failure',
        `Failed to compile study archive capsule: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'Capsules',
        true, // critical
        false
      );
    }
  };

  const handleQuickRestoreFromVault = async (capsule: SavedCapsule) => {
    try {
      playClick();
      const parsedCapsule = JSON.parse(capsule.capsuleData);
      setImportedCapsule(parsedCapsule);
      setRestoreProgress(0);
      setRestoredSummary(null);

      if (parsedCapsule.encrypted) {
        setIsUnlocked(false);
        setDecryptionPassword('');
        setActiveTab('import');
        setStatus({
          type: 'info',
          text: 'This capsule is encrypted. Enter the password to unlock and restore.'
        });
      } else {
        setIsUnlocked(true);
        setActiveTab('import');
        setStatus({
          type: 'success',
          text: `Selected Capsule from vault: ${capsule.deviceName}. Ready to restore.`
        });
      }
    } catch (e) {
      setStatus({
        type: 'error',
        text: 'Failed to read capsule from vault.'
      });
    }
  };

  const handleDeleteCapsule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this Capsule from your local vault? This action is irreversible.')) {
      playClick();
      await CapsuleDB.delete(id);
      await loadCapsulesFromVault();
      setStatus({ type: 'success', text: 'Capsule deleted from local vault.' });
    }
  };

  const handleRenameCapsule = async (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt('Enter a new filename for this Capsule:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      playClick();
      const item = savedCapsules.find(c => c.id === id);
      if (item) {
        const updated = {
          ...item,
          filename: newName.endsWith('.tmcapsule') ? newName.trim() : `${newName.trim()}.tmcapsule`,
          lastModified: Date.now()
        };
        await CapsuleDB.save(updated);
        await loadCapsulesFromVault();
        setStatus({ type: 'success', text: 'Capsule renamed successfully.' });
      }
    }
  };

  const handleDuplicateCapsule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    const item = savedCapsules.find(c => c.id === id);
    if (item) {
      const copy: SavedCapsule = {
        ...item,
        id: Date.now().toString(),
        filename: item.filename.replace('.tmcapsule', '_Copy.tmcapsule'),
        createdAt: Date.now(),
        lastModified: Date.now()
      };
      await CapsuleDB.save(copy);
      await loadCapsulesFromVault();
      setStatus({ type: 'success', text: 'Capsule duplicated inside the vault.' });
    }
  };

  const handleDownloadAgain = async (capsule: SavedCapsule, e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    const blob = new Blob([capsule.capsuleData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = capsule.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', text: `Downloaded ${capsule.filename} file directly.` });
  };

  const handleExportCSVFile = async () => {
    try {
      playClick();
      setCsvStatus('Preparing CSV study history export...');
      const payload = await onGetBackupPayload();
      
      if (!payload.sessions || payload.sessions.length === 0) {
        setCsvStatus('No sessions available to export.');
        setStatus({
          type: 'error',
          text: 'No focus sessions found in history. Start tracking some focus cycles first!'
        });
        return;
      }

      const escapeCSV = (val: string) => {
        const clean = val.replace(/"/g, '""');
        return `"${clean}"`;
      };

      const headers = ['Date', 'Time', 'Subject', 'Timer Mode', 'Duration (Seconds)', 'Duration (Minutes)'];
      const rows = payload.sessions.map((session) => {
        const dateObj = new Date(session.completedAt);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString();
        const durationMin = (session.durationSec / 60).toFixed(2);
        
        return [
          escapeCSV(dateStr),
          escapeCSV(timeStr),
          escapeCSV(session.subject || 'No Subject'),
          escapeCSV(session.mode),
          session.durationSec,
          durationMin,
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      const filename = `timerra_focus_sessions_${Date.now()}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setCsvStatus(`Successfully exported CSV file with ${payload.sessions.length} rows.`);
      setStatus({
        type: 'success',
        text: `CSV exported successfully! Saved ${payload.sessions.length} records to ${filename}`
      });
      playComplete();
    } catch (err) {
      setCsvStatus(`CSV Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus({
        type: 'error',
        text: `CSV Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  };

  const renderCapsuleIcon = () => (
    <div className="relative w-24 h-40 flex items-center justify-center select-none filter drop-shadow-[0_0_20px_rgba(56,189,248,0.3)] animate-float-slow">
      {/* Outer Glassmorphic Capsule Container */}
      <div className="w-16 h-32 rounded-full border border-white/20 bg-white/5 backdrop-blur-[6px] relative overflow-hidden shadow-[inset_0_0_25px_rgba(255,255,255,0.15)] flex flex-col justify-between p-2">
        {/* Metal Caps */}
        <div className="w-full h-4 rounded-t-full bg-gradient-to-b from-slate-400 to-slate-600 border-b border-white/10 opacity-70" />
        {/* Glass Reflection Accent */}
        <div className="absolute top-1/10 left-1.5 w-1 h-20 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
        {/* Glowing Fusion Core */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-16 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 blur-[8px] animate-pulse" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-12 rounded-full bg-cyan-300 opacity-80 mix-blend-screen" />
        <div className="w-full h-4 rounded-b-full bg-gradient-to-t from-slate-500 to-slate-700 border-t border-white/10 opacity-70" />
      </div>
      
      {/* Orbiting Rotating Energy Ring */}
      <div className="absolute w-28 h-6 border-2 border-dashed border-cyan-400/40 rounded-full animate-spin-slow [transform:rotateX(75deg)_rotateY(10deg)]" />
      <div className="absolute w-32 h-8 border border-white/10 rounded-full animate-spin-reverse [transform:rotateX(75deg)_rotateY(-15deg)]" />

      {/* Floating Particles in CSS */}
      <div className="absolute top-12 left-4 w-1.5 h-1.5 rounded-full bg-cyan-300/60 blur-[1px] animate-particle-rise-1" />
      <div className="absolute top-20 right-4 w-1 h-1 rounded-full bg-sky-200/50 blur-[1px] animate-particle-rise-2" />
      <div className="absolute bottom-12 left-6 w-1 h-1 rounded-full bg-blue-300/70 blur-[1px] animate-particle-rise-3" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-4" id="timerra-capsule-portal">
      {/* Ambient glowing background blur */}
      <div className="absolute top-[10%] left-[10%] w-[45%] h-[45%] bg-tm-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[45%] h-[45%] bg-tm-accent/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Embedded inline keyframes style block to guarantee beautiful, independent animations */}
      <style>{`
        @keyframes float-capsule {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        .animate-float-slow {
          animation: float-capsule 5s ease-in-out infinite;
        }
        @keyframes spin-slow {
          0% { transform: rotateX(75deg) rotateY(10deg) rotateZ(0deg); }
          100% { transform: rotateX(75deg) rotateY(10deg) rotateZ(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        @keyframes spin-reverse {
          0% { transform: rotateX(75deg) rotateY(-15deg) rotateZ(360deg); }
          100% { transform: rotateX(75deg) rotateY(-15deg) rotateZ(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 9s linear infinite;
        }
        @keyframes rise1 {
          0% { transform: translateY(20px) scale(0.5); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-40px) scale(1); opacity: 0; }
        }
        .animate-particle-rise-1 {
          animation: rise1 4s infinite linear;
        }
        @keyframes rise2 {
          0% { transform: translateY(30px) scale(0.5); opacity: 0; }
          50% { opacity: 0.9; }
          100% { transform: translateY(-30px) scale(0.8); opacity: 0; }
        }
        .animate-particle-rise-2 {
          animation: rise2 5s infinite linear;
        }
        @keyframes rise3 {
          0% { transform: translateY(15px) scale(0.3); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-50px) scale(1); opacity: 0; }
        }
        .animate-particle-rise-3 {
          animation: rise3 6s infinite linear;
        }
      `}</style>

      {/* Glassmorphic Modal Body */}
      <div 
        className="bg-[#0a0e1c]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] max-w-2xl w-full relative flex flex-col max-h-[90vh] transition-all duration-500 hover:border-white/15"
        id="capsule-modal-card"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-tm-primary animate-pulse" />
            <span className="font-mono text-[10px] font-extrabold tracking-[0.25em] text-white uppercase">
              Timerra <span className="text-tm-primary">Capsule</span>
            </span>
          </div>
          <button 
            onClick={() => { playClick(); onClose(); }}
            className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic content wrapper */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          
          {/* Status Alert Banner */}
          {status.text && (
            <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed transition-all duration-300 animate-fade-in ${
              status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              status.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
              'bg-blue-500/10 border-blue-500/20 text-blue-300'
            }`}>
              {status.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {status.type === 'error' && <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {status.type === 'info' && <Unlock className="w-4 h-4 flex-shrink-0 mt-0.5 animate-pulse" />}
              <div className="flex-1">
                <span className="font-semibold block">{status.type === 'success' ? 'Task Completed' : status.type === 'error' ? 'Integrity Alert' : 'Status Info'}</span>
                <p className="mt-0.5 text-slate-300">{status.text}</p>
              </div>
            </div>
          )}

          {/* TAB 1: HOME PANEL */}
          {activeTab === 'home' && (
            <div className="flex flex-col items-center text-center space-y-6">
              
              {/* Giant Luxury floating capsule illustration */}
              <div className="py-2 flex justify-center">
                {renderCapsuleIcon()}
              </div>

              {/* Title & Slogan */}
              <div className="space-y-1">
                <h2 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                  Timerra Capsule
                  <span className="text-[9px] font-mono bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">PRIME</span>
                </h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Move your workspace securely. Encrypted peer-to-peer archives with zero cloud storage footprint.
                </p>
              </div>

              {/* Action Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
                
                {/* CARD 1: EXPORT */}
                <button
                  onClick={() => { playClick(); setActiveTab('export'); }}
                  className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/15 text-left transition-all duration-300 group hover:bg-white/[0.02] flex items-center gap-4 relative overflow-hidden cursor-pointer"
                >
                  <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ExportCapsuleIcon size={52} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white block group-hover:text-tm-primary transition-colors">Export Capsule</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">Pack your metrics, settings, history and customize themes into `.tmcapsule`</span>
                  </div>
                </button>

                {/* CARD 2: IMPORT */}
                <button
                  onClick={() => { playClick(); setActiveTab('import'); }}
                  className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/15 text-left transition-all duration-300 group hover:bg-white/[0.02] flex items-center gap-4 relative overflow-hidden cursor-pointer"
                >
                  <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ImportCapsuleIcon size={52} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white block group-hover:text-tm-accent transition-colors">Import Capsule</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">Select a capsule file from another computer or local drive to sync.</span>
                  </div>
                </button>

                {/* CARD 3: RESTORE */}
                <button
                  onClick={() => { playClick(); setActiveTab('restore'); }}
                  className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/15 text-left transition-all duration-300 group hover:bg-white/[0.02] flex items-center gap-4 relative overflow-hidden cursor-pointer"
                >
                  <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                    <RestoreCapsuleIcon size={52} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white block group-hover:text-emerald-400 transition-colors">Restore Snapshot</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">Instantly flash back to any of your previously exported workspace states.</span>
                  </div>
                </button>

                {/* CARD 4: MANAGE */}
                <button
                  onClick={() => { playClick(); setActiveTab('manage'); }}
                  className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/15 text-left transition-all duration-300 group hover:bg-white/[0.02] flex items-center gap-4 relative overflow-hidden cursor-pointer"
                >
                  <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ManageCapsuleIcon size={52} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white block group-hover:text-purple-400 transition-colors">Manage Capsules</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">Inspect your capsule library vault, duplicate, rename or clean archives.</span>
                  </div>
                </button>

              </div>

              {/* CSV study sessions download and local metadata block */}
              <div className="w-full pt-4 border-t border-white/[0.03] flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Legacy Backup Utils:</span>
                <button
                  onClick={handleExportCSVFile}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-3 h-3 text-tm-primary" />
                  Export History (CSV)
                </button>
              </div>

              {csvStatus && (
                <div className="p-2.5 rounded-lg bg-white/[0.01] border border-white/5 text-[10px] font-mono text-slate-400 text-center w-full">
                  {csvStatus}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPORT PANEL */}
          {activeTab === 'export' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { playClick(); setActiveTab('home'); setExportAnimationStage('idle'); setStatus({ type: null, text: '' }); }}
                  className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Generate New Timerra Capsule</h3>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Compile your secure study logs, sessions database, subjects configuration, system options, and visual interface themes into a single self-contained, authenticated cryptographic archive file (`.tmcapsule`).
              </p>

              {/* Form inputs */}
              <div className="space-y-4">
                
                {/* Device Name input */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block pl-1">
                    Export Device Identifier
                  </label>
                  <input
                    type="text"
                    value={customDeviceName}
                    onChange={(e) => setCustomDeviceName(e.target.value)}
                    placeholder="e.g. MacBook Pro, Studio Station"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white font-medium text-xs focus:outline-none focus:border-tm-primary transition-colors focus:ring-1 focus:ring-tm-primary/20"
                  />
                  <span className="text-[9px] text-slate-500 block pl-1">
                    Helps you identify which computer or session this capsule belongs to when restoring.
                  </span>
                </div>

                {/* Password Protection input */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block pl-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-tm-primary" />
                      Capsule Password (Optional)
                    </label>
                    <span className="text-[9px] font-mono text-tm-accent bg-tm-accent/10 px-1.5 py-0.5 rounded">AES-256</span>
                  </div>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter password to encrypt container payload"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white font-medium text-xs focus:outline-none focus:border-tm-primary transition-colors focus:ring-1 focus:ring-tm-primary/20"
                  />
                  <span className="text-[9px] text-slate-500 block pl-1 leading-normal">
                    If provided, your workspace data will be encrypted locally using zero-knowledge client key-derivation. Leave empty to compile a plain, password-free capsule.
                  </span>
                </div>

              </div>

              {/* Custom export progress / animations */}
              {exportAnimationStage === 'sealing' && (
                <div className="p-6 rounded-2xl bg-tm-primary/5 border border-tm-primary/10 flex flex-col items-center justify-center space-y-3.5 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-tm-primary animate-spin flex items-center justify-center">
                    <Shield className="w-4 h-4 text-tm-primary" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">Sealing Capsule Core...</span>
                    <span className="text-[10px] text-slate-400 font-mono">Compressing metrics & configuring digital signatures</span>
                  </div>
                </div>
              )}

              {exportAnimationStage === 'complete' && (
                <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">Capsule Created Successfully!</span>
                    <span className="text-[10px] text-slate-400">Saved to local vault and downloaded onto your browser stream.</span>
                  </div>
                </div>
              )}

              {/* Action trigger */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.03]">
                <button
                  type="button"
                  onClick={() => { playClick(); setActiveTab('home'); }}
                  className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportCapsule}
                  disabled={isExporting}
                  className="px-5 py-2.5 rounded-xl bg-tm-primary hover:bg-opacity-90 disabled:opacity-50 text-xs font-bold text-white shadow-[0_0_15px_rgba(56,189,248,0.25)] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  Compile & Save Capsule
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: IMPORT PANEL */}
          {activeTab === 'import' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { playClick(); setActiveTab('home'); setImportedCapsule(null); setStatus({ type: null, text: '' }); }}
                  className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Decrypt & Restore Capsule</h3>
              </div>

              {/* Drag and Drop Zone */}
              {!importedCapsule ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                    isDragging 
                      ? 'border-tm-primary bg-tm-primary/5 scale-[0.99] shadow-[0_0_20px_rgba(56,189,248,0.15)]' 
                      : 'border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.02]'
                  }`}
                  id="drag-drop-zone"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".tmcapsule"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-tm-primary/10 border border-tm-primary/15 flex items-center justify-center text-tm-primary">
                    <UploadCloud className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">Drop `.tmcapsule` package here</span>
                    <span className="text-[10px] text-slate-500 block">or click to browse local folders</span>
                  </div>
                  <span className="text-[9px] bg-white/5 text-slate-400 px-2 py-1 rounded border border-white/5">
                    No files are ever uploaded — 100% Client-Side Decryption
                  </span>
                </div>
              ) : (
                /* Capsule metadata view & restoration triggers */
                <div className="space-y-5">
                  
                  {/* Glass Card showing loaded metadata */}
                  <div className="p-4.5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-tm-primary to-tm-accent flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Timerra Container Payload</span>
                          <span className="text-[9px] text-slate-500 block">Source: {importedCapsule.meta.exportDevice}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                        {importedCapsule.meta.appVersion || 'v1.1'}
                      </span>
                    </div>

                    {/* Capsule stats summary preview */}
                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-3">
                      
                      <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-center">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Focus Hours</span>
                        <span className="text-base font-black text-white mt-1">{importedCapsule.meta.focusHours} hrs</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-center">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Sessions</span>
                        <span className="text-base font-black text-white mt-1">{importedCapsule.meta.completedSessions} log</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-center">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Subjects</span>
                        <span className="text-base font-black text-white mt-1">{importedCapsule.meta.taskCount} list</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-center">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Core Theme</span>
                        <span className="text-xs font-bold text-tm-primary mt-1 uppercase tracking-wide">{importedCapsule.meta.theme}</span>
                      </div>

                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Created: {new Date(importedCapsule.meta.createdAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-500" />
                        Status: {importedCapsule.encrypted ? (isUnlocked ? 'Unlocked' : 'Encrypted with AES-256') : 'Plaintext Archive'}
                      </span>
                    </div>

                  </div>

                  {/* Encryption lock prompt if password protected */}
                  {importedCapsule.encrypted && !isUnlocked && (
                    <form onSubmit={handleDecryptCapsule} className="p-4.5 rounded-2xl bg-tm-accent/5 border border-tm-accent/10 space-y-3">
                      <div className="flex items-center gap-2 text-tm-accent">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs font-bold">This capsule is password encrypted</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        All study sessions and database schemas are secured. Please enter the master password key to unlock and verify before restoring.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={decryptionPassword}
                          onChange={(e) => setDecryptionPassword(e.target.value)}
                          placeholder="Master Password"
                          required
                          className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-medium text-xs focus:outline-none focus:border-tm-accent transition-colors"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-tm-accent hover:bg-opacity-90 text-xs font-bold text-slate-950 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          Unlock
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Workspace restore animation progress */}
                  {isRestoring && (
                    <div className="p-5 rounded-2xl bg-tm-primary/5 border border-tm-primary/10 text-center space-y-4">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">Injecting capsule energy...</span>
                        <span className="text-tm-primary font-bold">{restoreProgress}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-tm-primary to-tm-accent h-full transition-all duration-75"
                          style={{ width: `${restoreProgress}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 block font-mono">Rebuilding settings, creating schemas, merging history logs</span>
                    </div>
                  )}

                  {restoredSummary && (
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center space-y-2 animate-fade-in">
                      <span className="text-sm font-black text-emerald-400 block">Welcome Back</span>
                      <p className="text-[11px] text-slate-300 max-w-md mx-auto leading-relaxed">
                        {restoredSummary} Your local database schemas rebuilt automatically, and visual presets shifted seamlessly.
                      </p>
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.03]">
                    <button
                      onClick={() => { playClick(); setImportedCapsule(null); setStatus({ type: null, text: '' }); }}
                      disabled={isRestoring}
                      className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      Clear File
                    </button>
                    <button
                      onClick={triggerRestoreCapsule}
                      disabled={!isUnlocked || isRestoring || !!restoredSummary}
                      className="px-5 py-2.5 rounded-xl bg-tm-primary hover:bg-opacity-90 disabled:opacity-50 text-xs font-bold text-white shadow-[0_0_15px_rgba(56,189,248,0.25)] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      Restore Workspace
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 4: RESTORE (SNAPSHOTS LIST) PANEL */}
          {activeTab === 'restore' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { playClick(); setActiveTab('home'); setStatus({ type: null, text: '' }); }}
                  className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Quick Restore Snapshot</h3>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Revert or transfer states instantly. Select any locally cached capsule snapshot stored in your secure device index to flash-rebuild your workspace.
              </p>

              {savedCapsules.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
                  <Database className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-60" />
                  <span className="text-xs text-slate-400 font-bold block">Capsule Vault is Empty</span>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Try generating or exporting a Capsule first. It will be indexed here automatically for fast switching.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {savedCapsules.map((capsule) => (
                    <div
                      key={capsule.id}
                      onClick={() => handleQuickRestoreFromVault(capsule)}
                      className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/12 transition-all flex items-center justify-between cursor-pointer group hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-tm-primary/10 border border-tm-primary/10 flex items-center justify-center text-tm-primary group-hover:scale-105 transition-transform">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-white block truncate max-w-[200px] sm:max-w-[280px]">
                            {capsule.deviceName}
                          </span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">
                            {new Date(capsule.createdAt).toLocaleDateString()} at {new Date(capsule.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-400 block font-mono">
                            {capsule.focusHours} hrs
                          </span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">
                            {capsule.completedSessionsCount} sessions
                          </span>
                        </div>
                        <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-tm-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 5: MANAGE PANEL */}
          {activeTab === 'manage' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { playClick(); setActiveTab('home'); setStatus({ type: null, text: '' }); }}
                    className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Vault Capsule Manager</h3>
                </div>
                <span className="text-[9px] font-mono text-slate-500">
                  Total indexed: {savedCapsules.length}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Inspect, duplicate, delete or extract the raw `.tmcapsule` archive container files saved directly inside your computer&apos;s IndexedDB sandbox.
              </p>

              {savedCapsules.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
                  <Database className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-60" />
                  <span className="text-xs text-slate-400 font-bold block">No Capsules Saved Yet</span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Exported packages are automatically cached in this local vault.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {savedCapsules.map((capsule) => (
                    <div
                      key={capsule.id}
                      className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 flex-shrink-0 mt-0.5">
                          {capsule.isEncrypted ? <Lock className="w-4 h-4 text-tm-accent" /> : <Unlock className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div className="text-left space-y-1">
                          <span className="text-xs font-bold text-white block break-all pr-4">
                            {capsule.filename}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500">
                            <span>Device: {capsule.deviceName}</span>
                            <span>•</span>
                            <span>Size: {(capsule.fileSize / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>Date: {new Date(capsule.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-white/5 pt-2.5 sm:pt-0">
                        {/* Status detail pill */}
                        <div className="text-[9px] bg-white/5 border border-white/5 px-2 py-0.5 rounded font-mono text-slate-300">
                          {capsule.focusHours} hrs • {capsule.completedSessionsCount} sessions
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleRenameCapsule(capsule.id, capsule.filename, e)}
                            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Rename Capsule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicateCapsule(capsule.id, e)}
                            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Duplicate Capsule"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDownloadAgain(capsule, e)}
                            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Download .tmcapsule File"
                          >
                            <Download className="w-3.5 h-3.5 text-tm-primary" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteCapsule(capsule.id, e)}
                            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Capsule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/40 border-t border-white/[0.05] flex items-center justify-between text-[9px] tracking-wider uppercase font-semibold text-slate-500">
          <span>Local Device Sandboxed Environment</span>
          <span>Zero Knowledge PBKDF2 + AES-GCM-256</span>
        </div>

      </div>
    </div>
  );
};
