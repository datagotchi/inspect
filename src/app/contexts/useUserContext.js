import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import Cookies from "js-cookie";

import useAPI from "../hooks/useAPI";

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);

  // Initialize API hook here, inside the provider
  const api = useAPI(user);

  // Load user from cookie on initial load
  useEffect(() => {
    try {
      const cookieUser = Cookies.get("token"); // js-cookie automatically parses JSON if set as an object
      if (cookieUser) {
        setUser(cookieUser);
      }
    } catch (error) {
      console.error("Failed to parse user cookie", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    if (user) {
      await api.logout(user.email); // Invalidate session on the backend
    }
    Cookies.remove("token"); // Remove the cookie from the browser
    setUser(undefined); // Clear user state in the app
    // Navigate to the home page to reset the UI state cleanly.
    window.location.href = "/";
  };

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
