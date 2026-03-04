import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCurrentUser, logout as apiLogout } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await fetchCurrentUser();
    setUser(u);
    return u;
  }, []);

  const login = useCallback(async () => {
    // After magic link verification (redirect), re-fetch user
    return refreshUser();
  }, [refreshUser]);

  const handleLogout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout: handleLogout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
