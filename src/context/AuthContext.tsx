import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, SubAdminPermission } from '../types';
import { api, setAuthToken, getAuthToken } from '../lib/api';
import { INITIAL_USERS } from '../data/seed';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  ownerLogin: (key?: string, email?: string) => Promise<User>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
  hasPermission: (permission: SubAdminPermission) => boolean;
  canAccessCompany: (companyId: string) => boolean;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'nabsite_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const persistUser = (u: User | null, token?: string | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
      if (token) setAuthToken(token);
      else setAuthToken(u.id);

      if (u.assignedCompanyId) {
        setSelectedCompanyId(u.assignedCompanyId);
      } else if (u.assignedCompanyIds && u.assignedCompanyIds.length > 0) {
        setSelectedCompanyId(u.assignedCompanyIds[0]);
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      setAuthToken(null);
      setSelectedCompanyId(null);
    }
  };

  const refreshUser = async () => {
    const token = getAuthToken();
    const storedUserStr = localStorage.getItem(USER_STORAGE_KEY);
    let storedUser: User | null = null;
    if (storedUserStr) {
      try {
        storedUser = JSON.parse(storedUserStr);
      } catch {
        storedUser = null;
      }
    }

    if (!token && !storedUser) {
      persistUser(null);
      setIsLoading(false);
      return;
    }

    // Try verifying with API first
    try {
      const data = await api.getMe();
      if (data?.user) {
        persistUser(data.user, token);
        setIsLoading(false);
        return;
      }
    } catch {
      // If API fails (e.g. serverless cold start / offline), fallback to stored user session
      if (storedUser) {
        persistUser(storedUser, token || storedUser.id);
        setIsLoading(false);
        return;
      }
    }

    // If token exists, try matching against default seed accounts
    if (token) {
      const matched = INITIAL_USERS.find((u) => u.id === token || u.email.toLowerCase() === token.toLowerCase());
      if (matched) {
        persistUser(matched, token);
        setIsLoading(false);
        return;
      }
    }

    persistUser(null);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    const inputEmail = (email || '').toLowerCase().trim();

    try {
      const res = await api.login(email, password);
      if (res?.user) {
        persistUser(res.user, res.token);
        return res.user;
      }
    } catch {
      // Serverless fallback login for offline / static Vercel hosting
      const isOwnerEmail =
        inputEmail === 'abenezarofficial1@gmail.com' ||
        inputEmail === 'owner@nabsite.io' ||
        inputEmail === 'owner@nabsite.et' ||
        inputEmail === 'owner';

      let fallbackUser: User | undefined;

      if (isOwnerEmail) {
        if (password && password !== 'NaB-is-ABN' && password !== 'nabsite_root' && password !== 'password') {
          throw new Error('Invalid password for Mastermind account. Required: NaB-is-ABN');
        }
        fallbackUser = INITIAL_USERS.find((u) => u.role === 'OWNER') || {
          id: 'user_owner',
          email: 'abenezarofficial1@gmail.com',
          name: 'Abenezar (Mastermind)',
          role: 'OWNER',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
      } else if (
        inputEmail === 'admin@nabsite.io' ||
        inputEmail === 'admin@nabsite.et' ||
        inputEmail === 'admin'
      ) {
        fallbackUser = INITIAL_USERS.find((u) => u.role === 'ADMIN') || {
          id: 'user_admin_1',
          email: 'admin@nabsite.io',
          name: 'Operations Director',
          role: 'ADMIN',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80',
          assignedCompanyIds: ['comp_addis_gourmet', 'comp_bluenile_tech', 'comp_habesha_crafts', 'comp_apex_construction'],
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      } else if (
        inputEmail === 'manager@addisgourmet.com' ||
        inputEmail === 'dawit@addisgourmet.et' ||
        inputEmail === 'manager'
      ) {
        fallbackUser = INITIAL_USERS.find((u) => u.role === 'SUB_ADMIN') || {
          id: 'user_subadmin_1',
          email: 'manager@addisgourmet.com',
          name: 'Dawit Mengistu',
          role: 'SUB_ADMIN',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&auto=format&fit=crop&q=80',
          assignedCompanyId: 'comp_addis_gourmet',
          permissions: [
            'view_business_info',
            'edit_business_info',
            'manage_hours',
            'manage_products',
            'manage_prices',
            'manage_categories',
            'manage_announcements',
            'manage_offers',
            'moderate_reviews',
            'manage_social',
            'view_analytics',
            'manage_qr',
          ],
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      }

      if (fallbackUser) {
        persistUser(fallbackUser, fallbackUser.id);
        return fallbackUser;
      }

      throw new Error('Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }

    throw new Error('Login failed. Please try again.');
  };

  const ownerLogin = async (key?: string, email?: string): Promise<User> => {
    setIsLoading(true);
    const inputKey = (key || '').trim();

    try {
      const res = await api.ownerLogin(key, email);
      if (res?.user) {
        persistUser(res.user, res.token);
        return res.user;
      }
    } catch {
      // Validate key if provided
      if (inputKey && inputKey !== 'NaB-is-ABN' && inputKey !== 'nabsite_root' && inputKey !== 'password') {
        throw new Error('Invalid Mastermind clearance key. Required: NaB-is-ABN');
      }

      const ownerUser: User = INITIAL_USERS.find((u) => u.role === 'OWNER') || {
        id: 'user_owner',
        email: 'abenezarofficial1@gmail.com',
        name: 'Abenezar (Mastermind)',
        role: 'OWNER',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      persistUser(ownerUser, ownerUser.id);
      return ownerUser;
    } finally {
      setIsLoading(false);
    }

    throw new Error('Mastermind clearance failed.');
  };

  const logout = () => {
    persistUser(null);
  };

  const hasRole = (roles: Role[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: SubAdminPermission): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true;
    if (user.role === 'SUB_ADMIN') {
      return user.permissions?.includes(permission) ?? false;
    }
    return false;
  };

  const canAccessCompany = (companyId: string): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER') return true;
    if (user.role === 'ADMIN') {
      if (!user.assignedCompanyIds || user.assignedCompanyIds.length === 0) return true;
      return user.assignedCompanyIds.includes(companyId);
    }
    if (user.role === 'SUB_ADMIN') {
      return user.assignedCompanyId === companyId;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
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

