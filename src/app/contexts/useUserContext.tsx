import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Cookies from "js-cookie";

import useAPI from "../hooks/useAPI";
import { User } from "../types";

interface UserContextType {
  user: User | undefined;
  setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  api: ReturnType<typeof useAPI>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export const UserProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);

  // Initialize API hook here, inside the provider
  const api = useAPI({ email: user?.email || "", token: user?.token || "" });

  // Load user from cookie on initial load
  useEffect(() => {
    try {
      const cookieUser = Cookies.get("token"); // js-cookie automatically parses JSON if set as an object
      if (cookieUser) {
        setUser(JSON.parse(cookieUser) as User);
      }
    } catch (error) {
      console.error("Failed to parse user cookie", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (user) {
      await api.logout(user.email); // Invalidate session on the backend
    }
    Cookies.remove("token"); // Remove the cookie from the browser
    setUser(undefined); // Clear user state in the app
    // Navigate to the home page to reset the UI state cleanly.
    window.location.href = "/";
  }, [api, user]);

  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated: !!user,
      logout,
      api,
    }),
    [user, loading, api, logout],
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
