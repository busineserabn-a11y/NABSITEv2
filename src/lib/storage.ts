import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { withTimeout } from './firestoreUtils';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Validate image file size and MIME type
 */
export function validateImageFile(file: File, maxMb: number = 5): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file format. Please upload JPG, PNG, WEBP, or SVG.' };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File is too large. Maximum allowed size is ${maxMb}MB.` };
  }

  return { valid: true };
}

/**
 * Uploads a file to Firebase Storage under a designated path
 */
export async function uploadFile(
  file: File,
  storagePath: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized in this environment.');
  }

  const fileValidation = validateImageFile(file);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.error);
  }

  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(new Error(`Storage upload failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err: any) {
          reject(new Error(`Failed to retrieve download URL: ${err.message}`));
        }
      }
    );
  });
}

/**
 * Helper to upload company assets with scoped namespaces
 */
export async function uploadCompanyAsset(
  companyId: string,
  category: 'logo' | 'cover' | 'product' | 'gallery' | 'qr',
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const cleanCompId = companyId.replace(/[^a-zA-Z0-9_-]/g, '');
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop() || 'jpg';
  const sanitizedPath = `companies/${cleanCompId}/${category}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '')}`;

  return withTimeout(
    uploadFile(file, sanitizedPath, onProgress),
    30000,
    'Storage upload timed out. Please check your network and try again.'
  );
}
