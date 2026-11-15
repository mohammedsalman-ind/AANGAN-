import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Circle, SafeMember } from '@aangan/shared';
import { api } from '../api/client.js';

interface AuthContextType {
  circle: Circle | null;
  currentMember: SafeMember | null;
  loading: boolean;
  setCircle: (circle: Circle | null) => void;
  setCurrentMember: (member: SafeMember | null) => void;
  loginWithPin: (memberId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [circle, setCircle] = useState<Circle | null>(null);
  const [currentMember, setCurrentMember] = useState<SafeMember | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const res = await api.getMe();
      setCircle(res.circle);
      setCurrentMember(res.member);
    } catch {
      setCircle(null);
      setCurrentMember(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const loginWithPin = async (memberId: string, pin: string) => {
    const res = await api.loginWithPin(memberId, pin);
    setCircle(res.circle);
    setCurrentMember(res.member);
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setCurrentMember(null);
  };

  return (
    <AuthContext.Provider
      value={{
        circle,
        currentMember,
        loading,
        setCircle,
        setCurrentMember,
        loginWithPin,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
