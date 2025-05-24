// userStore.js - Optimized Global State
import { create } from 'zustand';
import { auth } from '../../firebase';
import { getData } from '../utils/BackendRequestHelper';

// Safe localStorage with error handling
const storage = {
  get: (key) => {
    try { return localStorage.getItem(key); } 
    catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, value); return true; } 
    catch { return false; }
  },
  remove: (key) => {
    try { localStorage.removeItem(key); return true; } 
    catch { return false; }
  }
};

export const useUserStore = create((set, get) => ({
  // State
  firebaseId: null,
  roleId: null,
  userId: null,
  isLoggedIn: false,
  profile: null,
  loading: false,
  authLoading: false,
  authHydrated: false,
  plaidConnected: false, // 🔥 New flag

  // Actions
  setLoading: (loading) => set({ loading }),
  setProfile: (profile) => set({ profile }),

  // NEW: Update Plaid connection status
  setPlaidConnected: (isConnected) => set({ plaidConnected: isConnected }),

  setUser: (firebaseId, roleId, userId) => {
    const normalizedRoleId = Number(roleId);
    storage.set('firebaseId', firebaseId);
    storage.set('roleId', String(normalizedRoleId));
    storage.set('userId', userId);

    set({
      firebaseId,
      roleId: normalizedRoleId,
      userId,
      isLoggedIn: true,
    });
  },

  clearUser: () => {
    storage.remove('firebaseId');
    storage.remove('roleId');
    storage.remove('userId');

    set({
      firebaseId: null,
      roleId: null,
      userId: null,
      isLoggedIn: false,
      profile: null,
      plaidConnected: false, // reset on logout
    });
  },

  listenAuthState: () => {
    set({ authHydrated: false, authLoading: true, isLoggedIn: false });

    return auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const [userData, profileData] = await Promise.all([
            getData(`/users/${user.uid}`),
            getData(`/profile`).catch(() => null),
          ]);

          if (!userData?.user_id || userData?.role_id === undefined) {
            get().clearUser();
          } else {
            get().setUser(user.uid, userData.role_id, userData.user_id);
            set({ profile: profileData || null });

            // NEW: check if Plaid is connected
            const banks = await getData("/plaid/banks").catch(() => []);
            set({ plaidConnected: Array.isArray(banks) && banks.length > 0 });
          }
        } else {
          get().clearUser();
        }
      } catch (err) {
        console.error("Auth listener error:", err);
        get().clearUser();
      } finally {
        set({ authLoading: false, authHydrated: true });
      }
    });
  },
}));
