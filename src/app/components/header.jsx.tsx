import React from "react";
import Cookies from "js-cookie";

import { styles } from "../../../fieldnotes-tmp/public/src/constants";
import { useUserContext } from "../contexts/useUserContext";

const Header = () => {
  const { user, logout } = useUserContext();

  return (
    <header style={styles.header}>
      <h1 style={{ margin: 0 }}>Field Notes by Datagotchi Labs</h1>
      <p style={styles.subtitle}>
        User: {user ? user.email : "Not logged in"}{" "}
        {user && (
          <a
            href=""
            onClick={async (e) => {
              e.preventDefault();
              await logout();
            }}
          >
            Logout
          </a>
        )}
      </p>
    </header>
  );
};

export default Header;
