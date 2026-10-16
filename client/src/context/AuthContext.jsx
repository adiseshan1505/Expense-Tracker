import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler, tokenStore } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(() => !tokenStore.get());
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      setUser(null);
      toast.error(message || 'Your session has ended. Please log in again.');
    });
  }, [toast]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then(setUser)
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, []);

  const startSession = useCallback(({ user: nextUser, token }) => {
    tokenStore.set(token);
    setUser(nextUser);
    setLoggedOut(false);
  }, []);

  const login = useCallback(async (credentials) => startSession(await authApi.login(credentials)), [startSession]);

  const register = useCallback(async (details) => startSession(await authApi.register(details)), [startSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* the token is dropped locally either way */
    }
    tokenStore.clear();
    setLoggedOut(true);
    setUser(null);
  }, []);

  const endSession = useCallback(() => {
    tokenStore.clear();
    setLoggedOut(true);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, loggedOut, login, register, logout, startSession, endSession, setUser }),
    [user, ready, loggedOut, login, register, logout, startSession, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
