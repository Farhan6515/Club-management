import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { showPointsToast } from '../utils/pointsToast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      const stored = localStorage.getItem('user');
      if (!token) {
        setLoading(false);
        return;
      }

      // Use stored user immediately for snappy UX, then verify with server
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          /* ignore */
        }
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.loginReward && !data.loginReward.alreadyClaimed) {
      showPointsToast({
        points: data.loginReward.stats?.points !== undefined ? 5 : 0,
        action: 'DAILY_LOGIN',
        streak: data.loginReward.streak,
        streakBonus: data.loginReward.streakBonus,
        leveledUp: data.loginReward.leveledUp,
        levelName: data.loginReward.levelName,
        newBadges: data.loginReward.newBadges,
      });
    }
    return data.user;
  };

  const signup = async (formData) => {
    const { data } = await api.post('/auth/signup', formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.loginReward && !data.loginReward.alreadyClaimed) {
      showPointsToast({
        points: 5,
        action: 'DAILY_LOGIN',
        streak: data.loginReward.streak,
        streakBonus: data.loginReward.streakBonus,
        leveledUp: data.loginReward.leveledUp,
        levelName: data.loginReward.levelName,
        newBadges: data.loginReward.newBadges,
      });
    }
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updates) => {
    const next = { ...user, ...updates };
    setUser(next);
    localStorage.setItem('user', JSON.stringify(next));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, loginWithGoogle, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
