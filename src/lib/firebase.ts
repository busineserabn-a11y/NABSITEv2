import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  Auth,
} from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const metaEnv = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyDroAUS_-acMmG9JVMp25hTbzqf1KO7RAU",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "nabsite-master-specification.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "nabsite-master-specification",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "nabsite-master-specification.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "692759105114",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:692759105114:web:9f9aee4b7c790100ac9263",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "G-B8VDV8SRWP",
};

export const getFirebaseConfigStatus = () => {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.appId) missing.push('VITE_FIREBASE_APP_ID');
  return {
    configured: missing.length === 0,
    missingKeys: missing,
  };
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
};

// Safe initialization
let appInstance: FirebaseApp;
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig);
} else {
  appInstance = getApp();
}

export const app: FirebaseApp = appInstance;
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const databaseId = metaEnv.VITE_FIRESTORE_DATABASE_ID || "default";

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, databaseId);
} catch {
  firestoreInstance = getFirestore(app, databaseId);
}

export const db: Firestore = firestoreInstance;

let storageInstance: FirebaseStorage;
try {
  storageInstance = getStorage(app);
} catch {
  // Graceful fallback
  storageInstance = null as any;
}

export const storage: FirebaseStorage = storageInstance;

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
};
