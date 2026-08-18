import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  db as firestoreDb,
} from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, Role, SubAdminPermission } from '../types';
import { setAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (email: string, password: string, fullName: string, role?: Role) => Promise<User>;
  ownerLogin: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
  hasPermission: (permission: SubAdminPermission) => boolean;
  canAccessCompany: (companyId: string) => boolean;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

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
              await setDoc(doc(firestoreDb, 'users', firebaseUser.uid), { role: 'OWNER' }, { merge: true });
            }
          } else {
            // Create user profile in Firestore
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: isPrimaryOwner ? 'OWNER' : 'ADMIN',
              assignedCompanyIds: [],
              permissions: ['all' as any],
              status: 'active',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            await setDoc(doc(firestoreDb, 'users', firebaseUser.uid), userData);
          }

          setUser(userData);
          setAuthToken(firebaseUser.uid);
          if (userData.assignedCompanyId) {
            setSelectedCompanyId(userData.assignedCompanyId);
          }
        } catch (err) {
          console.error('Error fetching Firestore user profile:', err);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Authenticated User',
            role: 'OWNER',
            assignedCompanyIds: [],
            permissions: [],
            status: 'active',
            createdAt: new Date().toISOString(),
          });
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
    if (!password) {
      throw new Error('Password is required');
    }
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const userDoc = await getDoc(doc(firestoreDb, 'users', cred.user.uid));
    if (userDoc.exists()) {
      return { id: cred.user.uid, ...userDoc.data() } as User;
    }
    const newUser: User = {
      id: cred.user.uid,
      email: cred.user.email || email,
      name: cred.user.email?.split('@')[0] || 'User',
      role: 'ADMIN',
      assignedCompanyIds: [],
      permissions: [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(firestoreDb, 'users', cred.user.uid), newUser);
    return newUser;
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    role: Role = 'ADMIN'
  ): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const newUser: User = {
      id: cred.user.uid,
      email: cred.user.email || email,
      name: fullName,
      role,
      assignedCompanyIds: [],
      permissions: [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(firestoreDb, 'users', cred.user.uid), newUser);
    setUser(newUser);
    return newUser;
  };

  const ownerLogin = async (email: string, password: string): Promise<User> => {
    return login(email, password);
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setAuthToken(null);
    setSelectedCompanyId(null);
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
    return user.permissions?.includes(permission) || user.permissions?.includes('all' as any);
  };

  const canAccessCompany = (companyId: string): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true;
    if (user.assignedCompanyId === companyId) return true;
    return user.assignedCompanyIds?.includes(companyId) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        ownerLogin,
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
