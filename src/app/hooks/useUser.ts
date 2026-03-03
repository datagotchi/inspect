"use client";

import { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

import CurrentUserContext from "../contexts/CurrentUserContext";

const useUser = () => {
  const [token, setToken] = useState<string | undefined>(undefined);
  const userDetails = useContext(CurrentUserContext);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const cookieToken = Cookies.get("token");
    if (cookieToken) {
      setToken(cookieToken);
      setLoggedIn(true);
    } else {
      setToken(undefined);
      setLoggedIn(false);
    }
  }, []);

  const exportedSetToken = (token: string) => {
    Cookies.set("token", token, { expires: 7, sameSite: "Lax" });
    setToken(token);
    setLoggedIn(true);
  };

  const logout = () => {
    Cookies.remove("token", { path: "/" });
    setLoggedIn(false);
    setToken(undefined);
  };

  return {
    loggedIn,
    logout,
    setLoggedIn,
    token,
    setToken: exportedSetToken,
    user_id: userDetails?.id,
    email: userDetails?.email,
    username: userDetails?.username,
  };
};

export default useUser;
