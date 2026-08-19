import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  db as firestoreDb,
  isFirebaseConfigured,
  getFirebaseConfigStatus,
} from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User, Role, SubAdminPermission } from '../types';
import { setAuthToken } from '../lib/api';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  missingConfigKeys: string[];
  login: (email: string, password?: string) => Promise<User>;
  ownerLogin: (email: string, password?: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
  hasPermission: (permission: SubAdminPermission) => boolean;
  canAccessCompany: (companyId: string) => boolean;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const formatFirebaseAuthError = (err: any): string => {
  if (!err) return 'An unexpected authentication error occurred.';
  const code = err.code || '';
  const message = err.message || '';

  if (code === 'auth/api-key-not-valid' || message.includes('api-key-not-valid') || code === 'auth/invalid-api-key') {
    return 'NABSITE Firebase Authentication configuration is missing or invalid. Please configure VITE_FIREBASE_API_KEY and other Firebase variables in your environment deployment settings.';
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (code === 'auth/user-disabled') {
    return 'This NABSITE account has been disabled. Please contact the platform administrator.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Access temporarily restricted due to many failed attempts. Please try again later or reset your password.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  if (code === 'auth/invalid-email') {
    return 'The provided email address is improperly formatted.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email address already exists.';
  }
  if (code === 'auth/weak-password') {
    return 'The password is too weak. Please use at least 6 characters.';
  }
  return err.message || 'Authentication failed. Please verify your credentials.';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const configStatus = getFirebaseConfigStatus();

  // Sync user profile from Firestore upon Firebase Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(firestoreDb, 'users', firebaseUser.uid));
          let userData: User;

          const isPrimaryOwner =
            firebaseUser.email?.toLowerCase() === 'busineser.abn@gmail.com' ||
            firebaseUser.email?.toLowerCase() === 'abenezarofficial1@gmail.com' ||
            firebaseUser.email?.toLowerCase() === 'owner@nabsite.io';

          if (userDoc.exists()) {
            userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
            if (isPrimaryOwner && userData.role !== 'OWNER') {
              userData.role = 'OWNER';
              await updateDoc(doc(firestoreDb, 'users', firebaseUser.uid), { role: 'OWNER' });
            }
          } else {
            // Auto-provision initial record for primary owner or authorized user
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: isPrimaryOwner ? 'OWNER' : 'ADMIN',
              assignedCompanyIds: [],
              permissions: isPrimaryOwner ? ['all' as any] : [],
              status: 'active',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            await setDoc(doc(firestoreDb, 'users', firebaseUser.uid), userData, { merge: true });
          }

          if (userData.status === 'disabled' || userData.status === 'suspended') {
            await signOut(auth);
            setUser(null);
            setAuthToken(null);
            setSelectedCompanyId(null);
          } else {
            setUser(userData);
            setAuthToken(firebaseUser.uid);
            if (userData.assignedCompanyId) {
              setSelectedCompanyId(userData.assignedCompanyId);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
          const isPrimaryOwner =
            firebaseUser.email?.toLowerCase() === 'busineser.abn@gmail.com' ||
            firebaseUser.email?.toLowerCase() === 'abenezarofficial1@gmail.com';

          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: isPrimaryOwner ? 'OWNER' : 'ADMIN',
            assignedCompanyIds: [],
            permissions: [],
            status: 'active',
            createdAt: new Date().toISOString(),
          });
          setAuthToken(firebaseUser.uid);
        }
      } else {
        setUser(null);
        setAuthToken(null);
        setSelectedCompanyId(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    if (!isFirebaseConfigured()) {
      throw new Error(
        'Firebase Authentication is not configured. Please configure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in your environment deployment settings.'
      );
    }
    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      // Fetch role & status from Firestore
      const userRef = doc(firestoreDb, 'users', uid);
      const userSnap = await getDoc(userRef);

      const isPrimaryOwner =
        cred.user.email?.toLowerCase() === 'busineser.abn@gmail.com' ||
        cred.user.email?.toLowerCase() === 'abenezarofficial1@gmail.com' ||
        cred.user.email?.toLowerCase() === 'owner@nabsite.io';

      let userData: User;

      if (userSnap.exists()) {
        userData = { id: uid, ...userSnap.data() } as User;
        if (isPrimaryOwner && userData.role !== 'OWNER') {
          userData.role = 'OWNER';
          await updateDoc(userRef, { role: 'OWNER' });
        }
      } else {
        userData = {
          id: uid,
          email: cred.user.email || email.trim(),
          name: cred.user.displayName || email.split('@')[0],
          role: isPrimaryOwner ? 'OWNER' : 'ADMIN',
          assignedCompanyIds: [],
          permissions: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await setDoc(userRef, userData, { merge: true });
      }

      if (userData.status === 'disabled' || userData.status === 'suspended') {
        await signOut(auth);
        throw new Error('This NABSITE account has been suspended. Please contact platform management.');
      }

      setUser(userData);
      setAuthToken(uid);
      return userData;
    } catch (err: any) {
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const ownerLogin = async (email: string, password?: string): Promise<User> => {
    const loggedUser = await login(email, password);
    const isPrimaryOwner =
      email.trim().toLowerCase() === 'busineser.abn@gmail.com' ||
      email.trim().toLowerCase() === 'abenezarofficial1@gmail.com' ||
      email.trim().toLowerCase() === 'owner@nabsite.io';

    if (loggedUser.role !== 'OWNER' && !isPrimaryOwner) {
      await signOut(auth);
      setUser(null);
      setAuthToken(null);
      throw new Error('Access Denied: This account is not authorized for NABSITE Platform Access.');
    }
    return loggedUser;
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!isFirebaseConfigured()) {
      throw new Error(
        'Firebase Authentication is not configured. Please configure VITE_FIREBASE_API_KEY in your environment.'
      );
    }
    if (!email || !email.trim()) {
      throw new Error('Please enter your account email address.');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } finally {
      setUser(null);
      setAuthToken(null);
      setSelectedCompanyId(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(firestoreDb, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUser({ id: auth.currentUser.uid, ...userDoc.data() } as User);
      }
    }
  };

  const hasRole = (roles: Role[]): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER') return true;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: SubAdminPermission): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true;
    return Boolean(user.permissions && user.permissions.includes(permission));
  };

  const canAccessCompany = (companyId: string): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true;
    if (user.assignedCompanyId === companyId) return true;
    return Boolean(user.assignedCompanyIds && user.assignedCompanyIds.includes(companyId));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConfigured: configStatus.configured,
        missingConfigKeys: configStatus.missingKeys,
        login,
        ownerLogin,
        resetPassword,
        logout,
        hasRole,
        hasPermission,
        canAccessCompany,
        selectedCompanyId,
        setSelectedCompanyId,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
