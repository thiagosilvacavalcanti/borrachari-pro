import React, { createContext, useContext, useState, useEffect } from 'react';
import { Shop } from '../types';

interface AuthContextType {
  shop: Shop | null;
  token: string | null;
  login: (shop: Shop, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedShop = localStorage.getItem('shop');
    const savedToken = localStorage.getItem('token');
    if (savedShop && savedToken) {
      setShop(JSON.parse(savedShop));
      setToken(savedToken);
    }
  }, []);

  const login = (shop: Shop, token: string) => {
    setShop(shop);
    setToken(token);
    localStorage.setItem('shop', JSON.stringify(shop));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setShop(null);
    setToken(null);
    localStorage.removeItem('shop');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ shop, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
