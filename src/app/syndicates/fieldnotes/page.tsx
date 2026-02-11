"use client";

import React from "react";

import Header from "../../components/header";
import { styles } from "./constants";
import NoteCreator from "../../components/NoteCreator";
import Notes from "../../components/Notes";
import { useUserContext } from "../../contexts/useUserContext";
import FieldCloud from "../../components/FieldCloud";
// import { useFieldTransferContext } from "../../contexts/useFieldTransferContext";
import { UserProvider } from "../../contexts/useUserContext";
import { FieldTransferProvider } from "../../contexts/useFieldTransferContext";

const FieldnotesHomePage = () => {
  // const { setActiveSelection } = useFieldTransferContext();

  const { isAuthenticated, api, setUser } = useUserContext();

  return (
    <div style={styles.app}>
      <Header />

      <main style={styles.main}>
        {isAuthenticated && (
          <UserProvider>
            <FieldTransferProvider>
              <div style={styles.fieldsHeader}>
                <FieldCloud />
              </div>
              <NoteCreator />
              <Notes />
            </FieldTransferProvider>
          </UserProvider>
        )}
        {!isAuthenticated && (
          <>
            <h2>Login</h2>
            <form
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                maxWidth: 300,
                margin: "0 auto",
              }}
              onSubmit={async (e) => {
                e.preventDefault(); // Cast e.target to HTMLFormElement
                const form = e.target as HTMLFormElement;
                const email = (
                  form.elements.namedItem("email") as HTMLInputElement
                ).value;
                const password = (
                  form.elements.namedItem("password") as HTMLInputElement
                ).value;
                const loggedInUser = await api.login(email, password);
                if (loggedInUser) setUser(loggedInUser);
              }}
            >
              <label>
                Email:
                <input type="email" name="email" required />
              </label>
              <label>
                Password:
                <input type="password" name="password" required />
              </label>
              <button type="submit">Login</button>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  const email = prompt("Enter your email:");
                  const password = prompt("Enter your password:");
                  if (email && password) {
                    api
                      .register(email, password)
                      .then((registeredUser: string) => {
                        if (registeredUser) setUser(registeredUser);
                        else alert("Registration failed");
                      });
                  }
                }}
              >
                Register
              </button>
            </form>
          </>
        )}
      </main>

      <footer style={styles.footer}></footer>
    </div>
  );
};

export default FieldnotesHomePage;
