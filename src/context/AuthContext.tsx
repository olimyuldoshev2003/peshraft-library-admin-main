// ============================================================
// AUTH CONTEXT - Manages who is logged in across the whole app
// ============================================================
// Think of this like a "global memory" that remembers if
// the admin is logged in or not.
// ============================================================
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebase/config";
import { getCurrentAdminProfile } from "../firebase/services";

interface AuthContextType {
  currentUser: User | null;
  adminProfile: any | null;
  loading: boolean;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  adminProfile: null,
  loading: true,
  refreshProfile: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (user: User) => {
    const profile = await getCurrentAdminProfile(user.uid);
    setAdminProfile(profile);
  };

  const refreshProfile = () => {
    if (currentUser) loadProfile(currentUser);
  };

  useEffect(() => {
    // Firebase automatically tells us when login state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadProfile(user);
      } else {
        setAdminProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup when component unmounts
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, adminProfile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
