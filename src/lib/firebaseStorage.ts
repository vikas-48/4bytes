import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://demo.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
};

let storage: any;

try {
  const app = initializeApp(firebaseConfig);
  storage = getStorage(app);
} catch (e) {
  console.warn('Firebase Storage initialization failed', e);
}

/**
 * Upload a PDF buffer to Firebase Storage and return public download URL
 */
export const uploadPdfToFirebase = async (
  pdfBuffer: Buffer,
  fileName: string
): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const timestamp = Date.now();
    const safeName = `bills/${timestamp}_${fileName}`;
    const fileRef = ref(storage, safeName);

    // Upload the file
    await uploadBytes(fileRef, pdfBuffer, { contentType: 'application/pdf' });

    // Get public download URL (non-expiring)
    const downloadUrl = await getDownloadURL(fileRef);
    console.log('PDF uploaded to Firebase Storage:', downloadUrl);

    return downloadUrl;
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw error;
  }
};
