import React, { useState, useRef } from 'react';
import { 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  HelpCircle, 
  ArrowUpFromLine, 
  ArrowDownToLine, 
  Check, 
  WifiOff, 
  FileJson, 
  Info,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { encryptData, decryptData } from '../utils/crypto';
import { StudyLog, BackupData } from '../types';

interface AuthModalProps {
  logs: StudyLog[];
  earnedAchievements: string[];
  pomodoroGoal: number;
  syncPassword: string;
  autoSync: boolean;
  onSetSyncPassword: (password: string) => void;
  onToggleAutoSync: (val: boolean) => void;
  onLocalExport: () => void;
  onLocalImport: (fileContent: string) => void;
  onClearLogs?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  logs,
  earnedAchievements,
  pomodoroGoal,
  syncPassword,
  autoSync,
  onSetSyncPassword,
  onToggleAutoSync,
  onLocalExport,
  onLocalImport,
  onClearLogs,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPassInfo, setShowPassInfo] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  
  // Selected backup file state for preview / comparison
  const [backupPreview, setBackupPreview] = useState<{
    rawContent: string;
    isEncrypted: boolean;
    decryptedData: BackupData | null;
    fileName: string;
    fileSizeStr: string;
  } | null>(null);

  const [enteredPassphrase, setEnteredPassphrase] = useState('');
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get formatted file size
  const getFileSizeString = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Handler for parsing raw file content
  const handleFileContentLoaded = (text: string, name: string, size: number) => {
    const trimmed = text.trim();
    const isEncrypted = trimmed.includes(':') && !trimmed.startsWith('{');
    const sizeStr = getFileSizeString(size);

    setDragError(null);
    setDecryptionError(null);
    setEnteredPassphrase('');

    if (!isEncrypted) {
      try {
        const parsed: BackupData = JSON.parse(trimmed);
        if (!parsed || !Array.isArray(parsed.logs)) {
          setDragError('Invalid backup file: file does not contain a valid session log history.');
          return;
        }
        setBackupPreview({
          rawContent: trimmed,
          isEncrypted: false,
          decryptedData: parsed,
          fileName: name,
          fileSizeStr: sizeStr
        });
      } catch (e) {
        setDragError('Invalid backup file: File could not be parsed as JSON.');
      }
    } else {
      // Is encrypted, wait for passphrase entry
      setBackupPreview({
        rawContent: trimmed,
        isEncrypted: true,
        decryptedData: null,
        fileName: name,
        fileSizeStr: sizeStr
      });
    }
  };

  // Handle decryption of a pending backup file
  const handleDecryptFile = () => {
    if (!backupPreview || !backupPreview.isEncrypted) return;
    setDecryptionError(null);

    const keyToUse = enteredPassphrase.trim() || syncPassword;
    if (!keyToUse) {
      setDecryptionError('Please enter a decryption passphrase.');
      return;
    }

    try {
      const decrypted = decryptData(backupPreview.rawContent, keyToUse);
      const parsed: BackupData = JSON.parse(decrypted);
      
      if (!parsed || !Array.isArray(parsed.logs)) {
        setDecryptionError('Incorrect decryption key or corrupted backup structure.');
        return;
      }

      setBackupPreview(prev => prev ? {
        ...prev,
        decryptedData: parsed
      } : null);
      setDecryptionError(null);
    } catch (err) {
      setDecryptionError('Decryption failed. Check the passphrase and try again.');
    }
  };

  // Execute merge import
  const triggerMergeImport = () => {
    if (!backupPreview || !backupPreview.decryptedData) return;
    
    const backupData = backupPreview.decryptedData;
    const mergedLogs = [...logs];
    let addedCount = 0;

    backupData.logs.forEach((bLog) => {
      if (!mergedLogs.some(local => local.id === bLog.id)) {
        mergedLogs.push(bLog);
        addedCount++;
      }
    });

    const mergedAchievements = Array.from(new Set([
      ...earnedAchievements, 
      ...(backupData.earnedAchievements || [])
    ]));

    const mergedGoal = Math.max(pomodoroGoal, backupData.pomodoroGoal || 4);

    const mergedPayload: BackupData = {
      logs: mergedLogs,
      earnedAchievements: mergedAchievements,
      pomodoroGoal: mergedGoal,
      completedToday: backupData.completedToday || 0,
      updatedAt: Date.now(),
      streak: Math.max(backupData.streak || 0)
    };

    onLocalImport(JSON.stringify(mergedPayload));
    setBackupPreview(null);
  };

  // Execute full overwrite
  const triggerOverwriteImport = () => {
    if (!backupPreview || !backupPreview.decryptedData) return;
    
    const confirmOverwrite = window.confirm(
      '⚠️ WARNING: Overwriting will erase all your current device study history and achievements and replace them with the backup file data. Are you sure?'
    );

    if (confirmOverwrite) {
      onLocalImport(JSON.stringify(backupPreview.decryptedData));
      setBackupPreview(null);
    }
  };

  // Handle Drag Events
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
    setDragError(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setDragError('Only Zenith backup JSON files (.json) are accepted.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          handleFileContentLoaded(text, file.name, file.size);
        }
      };
      reader.readAsText(file);
    }
  };

  // File Selector Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          handleFileContentLoaded(text, file.name, file.size);
        }
      };
      reader.readAsText(file);
      e.target.value = ''; // clear
    }
  };

  // Local backup strength meter
  const getPasswordStrength = () => {
    if (!syncPassword) return { label: '🔓 Unencrypted Backup (Plaintext JSON)', color: 'text-amber-500' };
    if (syncPassword.length < 6) return { label: '⚠️ Weak Passphrase (Needs 6+ characters)', color: 'text-yellow-500' };
    return { label: '🔐 Highly Secure (Zero-Knowledge E2EE)', color: 'text-emerald-400' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-3xl glossy-panel glossy-panel-hover relative overflow-hidden">
      {/* Visual background ambient glow */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Database size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Offline Backup & Sync Hub</h3>
            <p className="text-[10px] text-slate-500">Dual-Layer Local Database (No login required)</p>
          </div>
        </div>

        {/* Offline Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/5 rounded-full text-[10px] font-mono text-slate-400">
          <WifiOff size={10} className="text-emerald-400" />
          Local-First Secured
        </div>
      </div>

      {/* Database Resiliency Status */}
      <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col gap-1">
        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
          <Check size={11} /> Dual-Layer Redundancy Active
        </span>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Your configurations and logs are mirrored on both <strong>IndexedDB</strong> and <strong>LocalStorage</strong>. Even if your browser clears cookie/cache data on exit, our dual-layer auto-heals your database instantly on refresh.
        </p>
      </div>

      {/* Toggle transfer guidelines */}
      <div>
        <button
          id="btn-toggle-guide"
          onClick={() => setShowGuide(!showGuide)}
          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Info size={12} /> {showGuide ? 'Hide Multi-Device Transfer Guide' : 'How do I transfer data to another device?'}
        </button>
        {showGuide && (
          <div className="mt-2.5 p-3.5 bg-black/40 border border-white/5 rounded-2xl text-[10.5px] text-slate-300 space-y-2 leading-relaxed">
            <p className="font-semibold text-slate-200">🔄 Transfering data is simple and fast:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
              <li>Set a <strong>Security Key</strong> below to encrypt your study logs.</li>
              <li>Click <strong>Export backup File</strong> to download your <code className="text-slate-200">.json</code> backup.</li>
              <li>Send this file to your phone, tablet, or other laptop.</li>
              <li>Open Zenith Focus on that device, drop the file in the area below, and select <strong>Merge Backup</strong>!</li>
            </ol>
          </div>
        )}
      </div>

      {/* 1. Passphrase / Zero Knowledge configuration */}
      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lock size={13} className="text-blue-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security & Encryption Key</span>
          </div>
          <button
            id="btn-toggle-pass-info"
            onClick={() => setShowPassInfo(!showPassInfo)}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <HelpCircle size={13} />
          </button>
        </div>

        {showPassInfo && (
          <p className="text-[10px] text-slate-400 leading-relaxed bg-black/40 p-2.5 border border-white/5 rounded-xl">
            Setting a passphrase utilizes robust AES-like local stream-cipher cryptography. Your backups are fully encrypted in your browser before downloading, protecting your studies with complete client-side security.
          </p>
        )}

        <div className="flex items-center gap-2 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="No password (Plain JSON export)..."
            value={syncPassword}
            onChange={(e) => onSetSyncPassword(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors pr-10"
          />
          <button
            id="btn-toggle-passwd"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            {showPassword ? <Unlock size={14} /> : <Lock size={14} />}
          </button>
        </div>

        <div className={`text-[10px] font-medium font-mono ${strength.color}`}>
          {strength.label}
        </div>
      </div>

      {/* 2. Drag & Drop Backup Receiver & Comparer */}
      {backupPreview === null ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Import & Sync Backups</span>
            <span className="text-[9px] text-slate-500 font-mono">Accepts .json backups</span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer select-none text-center ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                : 'border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.03]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileJson size={28} className={`mb-2.5 transition-colors duration-300 ${isDragging ? 'text-blue-400 animate-bounce' : 'text-slate-500'}`} />
            <span className="text-xs font-semibold text-slate-300">
              {isDragging ? 'Drop your backup file here!' : 'Drag & drop backup file here'}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              or click to browse local files
            </span>
          </div>

          {dragError && (
            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[10px] text-rose-400 flex items-center gap-1.5 leading-relaxed">
              <ShieldAlert size={12} className="flex-shrink-0" />
              {dragError}
            </div>
          )}

          {/* Export Action */}
          <button
            id="btn-local-export"
            onClick={onLocalExport}
            className="flex items-center justify-center gap-2 py-3 rounded-xl glossy-button text-white text-xs font-bold cursor-pointer"
          >
            <ArrowUpFromLine size={14} />
            Export Backup File
          </button>
        </div>
      ) : (
        /* File Loaded - Preview / Decrypt & Comparison Dashboard */
        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
              <FileJson size={12} /> Target Backup Detected
            </span>
            <button
              id="btn-cancel-preview"
              onClick={() => setBackupPreview(null)}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* File Metadata info */}
          <div className="flex flex-col gap-0.5 border-b border-white/5 pb-2.5">
            <div className="text-xs font-bold text-slate-200 truncate">{backupPreview.fileName}</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
              <span>{backupPreview.fileSizeStr}</span>
              <span>•</span>
              <span>{backupPreview.isEncrypted ? '🔐 Password Encrypted' : '🔓 Plaintext Backup'}</span>
            </div>
          </div>

          {backupPreview.isEncrypted && !backupPreview.decryptedData ? (
            /* Passphrase input for decryption */
            <div className="flex flex-col gap-3">
              <div className="text-[10px] text-slate-400 leading-relaxed">
                This file is encrypted. Enter the key/password used when creating this backup file to decrypt and view its contents.
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter decryption password..."
                  value={enteredPassphrase}
                  onChange={(e) => setEnteredPassphrase(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDecryptFile(); }}
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  id="btn-decrypt-submit"
                  onClick={handleDecryptFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Decrypt
                </button>
              </div>
              {decryptionError && (
                <div className="text-[10px] text-rose-400 flex items-center gap-1">
                  <ShieldAlert size={11} />
                  {decryptionError}
                </div>
              )}
            </div>
          ) : (
            /* Decrypted Data - Side-by-Side Comparison */
            backupPreview.decryptedData && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Visual stats comparison table */}
                <div className="space-y-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Data Summary Comparison:
                  </div>

                  <div className="grid grid-cols-3 text-[10px] text-slate-500 font-bold border-b border-white/5 pb-1 uppercase tracking-wider">
                    <span>Metric</span>
                    <span className="text-center">This Device</span>
                    <span className="text-right">Backup File</span>
                  </div>

                  {/* Sessions Count */}
                  <div className="grid grid-cols-3 text-xs py-1 border-b border-white/5 font-mono">
                    <span className="text-slate-400 font-sans">Focus Sessions</span>
                    <span className="text-slate-300 text-center font-bold">{logs.length}</span>
                    <span className="text-emerald-400 text-right font-bold">{backupPreview.decryptedData.logs.length}</span>
                  </div>

                  {/* Achievements Count */}
                  <div className="grid grid-cols-3 text-xs py-1 border-b border-white/5 font-mono">
                    <span className="text-slate-400 font-sans">Achievements</span>
                    <span className="text-slate-300 text-center font-bold">{earnedAchievements.length}</span>
                    <span className="text-emerald-400 text-right font-bold">{(backupPreview.decryptedData.earnedAchievements || []).length}</span>
                  </div>

                  {/* Daily Goal */}
                  <div className="grid grid-cols-3 text-xs py-1 border-b border-white/5 font-mono">
                    <span className="text-slate-400 font-sans">Daily Goal</span>
                    <span className="text-slate-300 text-center">{pomodoroGoal}</span>
                    <span className="text-emerald-400 text-right">{backupPreview.decryptedData.pomodoroGoal || 'N/A'}</span>
                  </div>

                  {/* Last backup timestamp */}
                  <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono pt-1">
                    <span>Backup Saved On:</span>
                    <span className="text-slate-300 font-semibold">
                      {backupPreview.decryptedData.updatedAt
                        ? new Date(backupPreview.decryptedData.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Unknown Date'}
                    </span>
                  </div>
                </div>

                {/* Import Buttons */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <button
                    id="btn-import-merge"
                    onClick={triggerMergeImport}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl glossy-button text-white text-xs font-bold cursor-pointer"
                  >
                    <Check size={13} />
                    Merge Backup (Keep Both Histories)
                  </button>

                  <button
                    id="btn-import-overwrite"
                    onClick={triggerOverwriteImport}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl glossy-button-danger text-white text-xs font-bold cursor-pointer"
                  >
                    <ShieldAlert size={13} />
                    Overwrite Device Data (Replace All)
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Auto Backup to File & Clear Data Settings */}
      <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Advanced Safety Tools</span>
          <span className="text-[9px] text-slate-500 font-mono">Offline Automation</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Custom iOS style glossy switch for Auto-Sync */}
          <div className="flex items-start justify-between gap-4 p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="flex flex-col gap-1 max-w-[80%]">
              <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                Auto-Backup on Focus Completion
              </span>
              <span className="text-[10px] text-slate-500 leading-relaxed">
                Automatically triggers a local encrypted backup file download after completing 5 focus sessions. Keeps your data safe offline.
              </span>
            </div>

            <button
              type="button"
              id="toggle-autosync"
              onClick={() => onToggleAutoSync(!autoSync)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                autoSync 
                  ? 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.3)]' 
                  : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                  autoSync ? 'translate-x-5 bg-white' : 'translate-x-0 bg-slate-400'
                }`}
              />
            </button>
          </div>

          {onClearLogs && (
            <button
              id="btn-hub-clear-data"
              onClick={onClearLogs}
              className="w-fit flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-rose-400 font-semibold transition-colors cursor-pointer pl-0.5"
            >
              <Trash2 size={11} />
              Reset & Wipe All Device Storage
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
