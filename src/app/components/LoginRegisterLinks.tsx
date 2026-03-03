"use client";

import styles from "../../styles/components/login-register-links.module.css";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import useUser from "../hooks/useUser";

const LoginRegisterLinks = ({
  loggedIn,
}: {
  loggedIn: boolean;
}): React.JSX.Element => {
  const { logout } = useUser();
  const path = usePathname();

  if (loggedIn) {
    return (
      <div className={styles.loginRegisterContainer}>
        <button
          onClick={() => {
            logout();
            window.location.href = path || "/";
          }}
          className={styles.logoutButton}
        >
          Log Out
        </button>
        <Link href="/insights" className={styles.myInsightsButton}>
          My Insights
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.loginRegisterContainer}>
      <li className={path === "/login" ? "active" : ""}>
        <Link href={`/login?return=${path}`} className={styles.loginButton}>
          Login
        </Link>
      </li>
      <li className={path === "/register" ? "active" : ""}>
        <Link
          href={`/register?return=${path}`}
          className={styles.registerButton}
        >
          Register
        </Link>
      </li>
    </div>
  );
};

export default LoginRegisterLinks;
