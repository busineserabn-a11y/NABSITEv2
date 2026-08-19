import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  register: (email: string, password?: string, name?: string, role?: Role) => Promise<User>;
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
    return 'NABSITE Firebase Authentication configuration is missing or invalid. Please check your Firebase settings.';
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
    return 'An account with this email address already exists. Please sign in instead.';
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

  // Fast helper for primary owner check
  const checkIsOwner = (emailStr?: string | null): boolean => {
    if (!emailStr) return false;
    const lower = emailStr.toLowerCase().trim();
    return (
      lower === 'abenezarofficial1@gmail.com' ||
      lower === 'busineser.abn@gmail.com' ||
      lower === 'owner@nabsite.io' ||
      lower === 'owner@nabsite.et'
    );
  };

  // Sync user profile upon Firebase Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isOwner = checkIsOwner(firebaseUser.email);
        const fallbackProfile: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || (isOwner ? 'Abenezar (Mastermind)' : firebaseUser.email?.split('@')[0] || 'User'),
          role: isOwner ? 'OWNER' : 'ADMIN',
          assignedCompanyIds: [],
          permissions: isOwner ? (['all'] as any) : [],
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        // Instantly establish authentication session
        setUser(fallbackProfile);
        setAuthToken(firebaseUser.uid);
        setIsLoading(false);

        // Async sync from Firestore in background
        try {
          const userRef = doc(firestoreDb, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            const updatedUser: User = { ...fallbackProfile, ...data, id: firebaseUser.uid };
            if (isOwner && updatedUser.role !== 'OWNER') {
              updatedUser.role = 'OWNER';
              updateDoc(userRef, { role: 'OWNER' }).catch(() => {});
            }
            if (updatedUser.status === 'disabled' || updatedUser.status === 'suspended') {
              await signOut(auth);
              setUser(null);
              setAuthToken(null);
              setSelectedCompanyId(null);
              return;
            }
            setUser(updatedUser);
            if (updatedUser.assignedCompanyId) {
              setSelectedCompanyId(updatedUser.assignedCompanyId);
            }
          } else {
            // Background create user doc in Firestore
            setDoc(userRef, fallbackProfile, { merge: true }).catch(() => {});
          }
        } catch (e) {
          console.warn('Background Firestore profile sync notice:', e);
        }
      } else {
        setUser(null);
        setAuthToken(null);
        setSelectedCompanyId(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    if (!isFirebaseConfigured()) {
      throw new Error(
        'Firebase Authentication is not configured. Please configure your Firebase environment variables.'
      );
    }
    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const isOwner = checkIsOwner(trimmedEmail);

    try {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } catch (signInErr: any) {
        // If this is an authorized platform owner logging in for the first time in a new project
        if (
          isOwner &&
          (signInErr.code === 'auth/user-not-found' ||
            signInErr.code === 'auth/invalid-credential' ||
            signInErr.message?.includes('user-not-found') ||
            signInErr.message?.includes('invalid-credential'))
        ) {
          try {
            cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          } catch {
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }

      const uid = cred.user.uid;
      const userData: User = {
        id: uid,
        email: cred.user.email || trimmedEmail,
        name: isOwner ? 'Abenezar (Mastermind)' : cred.user.displayName || trimmedEmail.split('@')[0],
        role: isOwner ? 'OWNER' : 'ADMIN',
        assignedCompanyIds: [],
        permissions: isOwner ? (['all'] as any) : [],
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Set state immediately for ultra-fast login
      setUser(userData);
      setAuthToken(uid);

      // Background Firestore save/sync
      const userRef = doc(firestoreDb, 'users', uid);
      getDoc(userRef)
        .then(async (snap) => {
          if (snap.exists()) {
            const data = snap.data() as User;
            const updated = { ...userData, ...data, id: uid };
            if (isOwner && updated.role !== 'OWNER') {
              updated.role = 'OWNER';
              updateDoc(userRef, { role: 'OWNER' }).catch(() => {});
            }
            if (updated.status === 'disabled' || updated.status === 'suspended') {
              await signOut(auth);
              setUser(null);
              setAuthToken(null);
              return;
            }
            setUser(updated);
            if (updated.assignedCompanyId) {
              setSelectedCompanyId(updated.assignedCompanyId);
            }
          } else {
            setDoc(userRef, userData, { merge: true }).catch(() => {});
          }
        })
        .catch((e) => console.warn('Background profile sync notice:', e));

      return userData;
    } catch (err: any) {
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const register = async (email: string, password?: string, name?: string, role?: Role): Promise<User> => {
    if (!isFirebaseConfigured()) {
      throw new Error(
        'Firebase Authentication is not configured. Please configure your Firebase settings.'
      );
    }
    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const trimmedEmail = email.trim().toLowerCase();
    const isOwner = checkIsOwner(trimmedEmail);
    const assignedRole: Role = isOwner ? 'OWNER' : role || 'SUB_ADMIN';

    try {
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          // If already created, sign in directly
          cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } else {
          throw createErr;
        }
      }

      const uid = cred.user.uid;
      const userData: User = {
        id: uid,
        email: trimmedEmail,
        name: name?.trim() || (isOwner ? 'Abenezar (Mastermind)' : trimmedEmail.split('@')[0]),
        role: assignedRole,
        assignedCompanyIds: [],
        permissions: assignedRole === 'OWNER' || assignedRole === 'ADMIN' ? (['all'] as any) : ['manage_products', 'edit_website'],
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Set user immediately for instant registration response
      setUser(userData);
      setAuthToken(uid);

      // Async write user doc to Firestore
      setDoc(doc(firestoreDb, 'users', uid), userData, { merge: true }).catch((e) =>
        console.warn('Background user doc save notice:', e)
      );

      return userData;
    } catch (err: any) {
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const ownerLogin = async (email: string, password?: string): Promise<User> => {
    const loggedUser = await login(email, password);
    const isOwner = checkIsOwner(email);

    if (loggedUser.role !== 'OWNER' && !isOwner) {
      await signOut(auth);
      setUser(null);
      setAuthToken(null);
      throw new Error('Access Denied: This account is not authorized for NABSITE Platform Access.');
    }
    return loggedUser;
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase Authentication is not configured.');
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
        register,
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
