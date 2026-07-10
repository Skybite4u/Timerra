import React, { useState, useRef } from 'react';
import { X, Lock, Unlock, FileDown, UploadCloud, CheckCircle, AlertTriangle, Key } from 'lucide-react';
import { encryptBackup, decryptBackup } from '../lib/crypto';
import { BackupPayload, EncryptedBackupFile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onGetBackupPayload: () => Promise<BackupPayload>;
  onImportPayload: (payload: BackupPayload) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onGetBackupPayload,
  onImportPayload,
}) => {
  const [passphrase, setPassphrase] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Decryption password state
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false);
  const [pendingFileToDecrypt, setPendingFileToDecrypt] = useState<EncryptedBackupFile | null>(null);
  const [decryptionPassword, setDecryptionPassword] = useState<string>('');

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    text: string;
  }>({ type: null, text: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setStatus({ type: 'info', text: 'Reading backup file...' });
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.app !== 'Timerra') {
          setStatus({
            type: 'error',
            text: 'Only Timerra backup JSON files (.json) are accepted.',
          });
          return;
        }

        if (parsed.encrypted) {
          // Encrypted file: Prompt for password
          setPendingFileToDecrypt(parsed as EncryptedBackupFile);
          setShowPasswordPrompt(true);
          setDecryptionPassword('');
          setStatus({ type: 'info', text: 'This backup is encrypted. Please enter your passcode.' });
        } else {
          // Plain file: Import immediately
          setIsImporting(true);
          await onImportPayload(parsed as BackupPayload);
          setIsImporting(false);
          setStatus({
            type: 'success',
            text: `Successfully imported plain backup! Restored setting profile, subjects, and sessions.`,
          });
        }
      } catch (err) {
        setIsImporting(false);
        setStatus({
          type: 'error',
          text: `Invalid backup file layout: ${err instanceof Error ? err.message : 'failed to parse JSON'}`,
        });
      }
    };
    reader.onerror = () => {
      setStatus({ type: 'error', text: 'Failed to read the file.' });
    };
    reader.readAsText(file);
  };

  const handleDecryptAndImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFileToDecrypt || !decryptionPassword) return;

    try {
      setStatus({ type: 'info', text: 'Deriving cryptographic keys and decrypting...' });
      setIsImporting(true);
      const decryptedPayload = await decryptBackup(pendingFileToDecrypt, decryptionPassword);
      await onImportPayload(decryptedPayload);
      
      setIsImporting(false);
      setShowPasswordPrompt(false);
      setPendingFileToDecrypt(null);
      setStatus({
        type: 'success',
        text: `Successfully decrypted and imported backup with zero-knowledge keys!`,
      });
    } catch (err) {
      setIsImporting(false);
      setStatus({
        type: 'error',
        text: `Decryption failed. Please check your passcode and try again.`,
      });
    }
  };

  const triggerDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPlain = async () => {
    try {
      setIsExporting(true);
      setStatus({ type: 'info', text: 'Generating plain text backup...' });
      const payload = await onGetBackupPayload();
      const filename = `timerra_backup_${Date.now()}.json`;
      triggerDownload(filename, JSON.stringify(payload, null, 2));
      setIsExporting(false);
      setStatus({
        type: 'success',
        text: `Successfully exported plain backup file: ${filename}`,
      });
    } catch (err) {
      setIsExporting(false);
      setStatus({
        type: 'error',
        text: `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  };

  const handleExportEncrypted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setStatus({ type: 'error', text: 'Please enter a passcode to encrypt your backup file.' });
      return;
    }

    try {
      setIsExporting(true);
      setStatus({ type: 'info', text: 'Generating AES-256 keys & encrypting...' });
      const payload = await onGetBackupPayload();
      const encryptedFile = await encryptBackup(payload, passphrase);
      const filename = `timerra_encrypted_backup_${Date.now()}.json`;
      triggerDownload(filename, JSON.stringify(encryptedFile, null, 2));
      setPassphrase('');
      setIsExporting(false);
      setStatus({
        type: 'success',
        text: `Exported AES-GCM Encrypted backup! Safely store your passcode.`,
      });
    } catch (err) {
      setIsExporting(false);
      setStatus({
        type: 'error',
        text: `Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-[32px] tm-glass-dense text-white shadow-2xl relative overflow-hidden flex flex-col">
        {/* Top visual gradient border */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-tm-primary to-tm-accent" />

        {/* Header bar */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-tm-primary" />
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-200">
              Backup Center
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-6">

          {/* Status logs block */}
          {status.type && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 border text-xs leading-relaxed transition-all ${
              status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              status.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              {status.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              {status.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
              {status.type === 'info' && <Key className="w-5 h-5 flex-shrink-0 animate-pulse" />}
              <div>{status.text}</div>
            </div>
          )}

          {/* Decryption Password Prompt */}
          {showPasswordPrompt && (
            <form onSubmit={handleDecryptAndImport} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-tm-primary uppercase tracking-wider">
                <Unlock className="w-4 h-4" />
                Decryption Password Required
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                This backup is encrypted with standard AES-256. Enter the passcode to restore data.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter decryption passcode..."
                  value={decryptionPassword}
                  onChange={(e) => setDecryptionPassword(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 font-mono text-xs focus:border-tm-primary/50 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-4 py-2 bg-tm-primary hover:bg-tm-primary/80 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Decrypt
                </button>
              </div>
            </form>
          )}

          {/* Import Drop Zone (Drag & Drop + File Selector) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Restore Local Data
            </h3>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-tm-primary bg-tm-primary/5 text-white'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.01] text-slate-300'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2 group-hover:text-tm-primary transition-colors" />
              <span className="text-xs font-bold">Drag & Drop backup file here</span>
              <span className="text-[10px] text-slate-500 mt-1">or click to browse timerra_backup.json</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Encrypted Export */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              E2E Encrypted Export 🔐
            </h3>
            <p className="text-[10px] text-slate-500 leading-normal">
              Encrypt your entire Pomodoro settings, customized subjects board, and historical session logs right inside the browser.
            </p>
            <form onSubmit={handleExportEncrypted} className="flex gap-2">
              <input
                type="password"
                placeholder="Choose a strong backup passcode..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 font-mono text-xs focus:border-tm-primary/50 focus:outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={isExporting}
                className="px-4 py-2.5 bg-tm-primary hover:bg-tm-primary/80 hover:shadow-[0_0_10px_var(--tm-glow)] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                Encrypt
              </button>
            </form>
          </div>

          {/* Plain export */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Plain Text Export</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Saves a standard .json file without passwords</span>
            </div>
            <button
              onClick={handleExportPlain}
              type="button"
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5 text-tm-primary" />
              Download
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-black/20 text-center">
          <span className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">
            Timerra End-to-End Cryptography Engine
          </span>
        </div>

      </div>
    </div>
  );
};
