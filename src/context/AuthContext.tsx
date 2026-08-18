import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, SubAdminPermission } from '../types';
import { api, setAuthToken, getAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  ownerLogin: (email: string, password?: string) => Promise<User>;
  logout: () => void;
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

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      if (data.user?.assignedCompanyId) {
        setSelectedCompanyId(data.user.assignedCompanyId);
      } else if (data.user?.assignedCompanyIds && data.user.assignedCompanyIds.length > 0) {
        setSelectedCompanyId(data.user.assignedCompanyIds[0]);
      }
    } catch (err) {
      console.warn('Authentication token expired or invalid');
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setAuthToken(res.token);
      setUser(res.user);
      if (res.user?.assignedCompanyId) {
        setSelectedCompanyId(res.user.assignedCompanyId);
      } else if (res.user?.assignedCompanyIds && res.user.assignedCompanyIds.length > 0) {
        setSelectedCompanyId(res.user.assignedCompanyIds[0]);
      }
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const ownerLogin = async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.ownerLogin(email, password);
      setAuthToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setSelectedCompanyId(null);
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
