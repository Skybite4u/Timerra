import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Drive app data scope (create/access files created by this app)
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('drive_access_token') : null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('drive_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem('drive_access_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem('drive_access_token');
};

/* ==========================================================================
   Google Drive API Helpers
   ========================================================================== */

/**
 * Searches for a file named "focus_timer_backup.json" in user's Drive.
 * Returns the fileId if found, null otherwise.
 */
export async function findBackupFile(token: string): Promise<string | null> {
  const query = encodeURIComponent("name = 'focus_timer_backup.json' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
        localStorage.removeItem('drive_access_token');
        throw new Error('UNAUTHORIZED_DRIVE_TOKEN');
      }
      const errText = await res.text();
      console.error('findBackupFile error response:', errText);
      throw new Error(`Drive search failed: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('findBackupFile exception:', error);
    throw error;
  }
}

/**
 * Downloads the content of a file from Google Drive.
 */
export async function downloadBackupFile(token: string, fileId: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
        localStorage.removeItem('drive_access_token');
        throw new Error('UNAUTHORIZED_DRIVE_TOKEN');
      }
      const errText = await res.text();
      console.error('downloadBackupFile error response:', errText);
      throw new Error(`Drive download failed: ${res.statusText}`);
    }

    return await res.text();
  } catch (error) {
    console.error('downloadBackupFile exception:', error);
    throw error;
  }
}

/**
 * Creates a new file "focus_timer_backup.json" with the provided content in Google Drive.
 * Returns the created file's ID.
 */
export async function createBackupFile(token: string, content: string): Promise<string> {
  const metaUrl = 'https://www.googleapis.com/drive/v3/files';
  
  try {
    // 1. Create file metadata
    const metaRes = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'focus_timer_backup.json',
        mimeType: 'application/json',
      }),
    });

    if (!metaRes.ok) {
      if (metaRes.status === 401) {
        cachedAccessToken = null;
        localStorage.removeItem('drive_access_token');
        throw new Error('UNAUTHORIZED_DRIVE_TOKEN');
      }
      const errText = await metaRes.text();
      console.error('createBackupFile metadata error response:', errText);
      throw new Error(`Drive file creation failed: ${metaRes.statusText}`);
    }

    const fileData = await metaRes.json();
    const fileId = fileData.id;

    // 2. Upload file content to the upload URL using PATCH
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: content,
    });

    if (!uploadRes.ok) {
      if (uploadRes.status === 401) {
        cachedAccessToken = null;
        localStorage.removeItem('drive_access_token');
        throw new Error('UNAUTHORIZED_DRIVE_TOKEN');
      }
      const errText = await uploadRes.text();
      console.error('createBackupFile upload error response:', errText);
      throw new Error(`Drive file upload failed: ${uploadRes.statusText}`);
    }

    return fileId;
  } catch (error) {
    console.error('createBackupFile exception:', error);
    throw error;
  }
}

/**
 * Updates an existing file's content in Google Drive.
 */
export async function updateBackupFile(token: string, fileId: string, content: string): Promise<void> {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: content,
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
        localStorage.removeItem('drive_access_token');
        throw new Error('UNAUTHORIZED_DRIVE_TOKEN');
      }
      const errText = await res.text();
      console.error('updateBackupFile error response:', errText);
      throw new Error(`Drive update failed: ${res.statusText}`);
    }
  } catch (error) {
    console.error('updateBackupFile exception:', error);
    throw error;
  }
}
