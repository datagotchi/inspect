"use client";

import React, { useCallback, useEffect, useState } from "react";

import Header from "../../components/header";
import { styles } from "./constants";
import NoteCreator from "../../components/NoteCreator";
import Notes from "../../components/Notes";
import { useUserContext } from "../../contexts/useUserContext";
import FieldCloud from "../../components/FieldCloud";
import { useFieldTransferContext } from "../../contexts/useFieldTransferContext";

const App = () => {
  const { setActiveSelection } = useFieldTransferContext();

  const { isAuthenticated, api, setUser } = useUserContext();

  /**
   * 1. The "Velocity Heatmap" (Daily Momentum)
The Idea: A calendar-style grid where each day’s color intensity depends on the "fidelity" of the data logged.

The Code Logic: The isGigLogged function triggers a state change in the UI.

The Goal: Provide an immediate dopamine hit for consistency. It turns a "task" into a "streak."

Interview Hook: "I use visual heatmaps to show staff their own momentum, moving data entry from a chore to a visible achievement."

2. The "Red-to-Green" Decay (Temporal Integrity)
The Idea: A status indicator for the current day that starts Red (Data Debt), moves to Orange/Yellow as the day progresses without a log, and turns Green (Asset) once the session note is committed.

The Code Logic: Use a Date comparison against your Red Rover API pull. If today exists in the API but not in your DB, the status is "Debt."

The Goal: Visualizing "Entropy." It reminds the user that the "Aha!" moment is fading.

Interview Hook: "I design systems that visualize 'Data Debt.' If a record isn't captured, it stays red, signaling to the user that institutional memory is currently at risk."

3. The "Financial Runway" Sparkline (Budgetary Insight)
The Idea: A small, clean line graph at the top of the app pulling from your "$$$ Plans" sheet.

The Code Logic: Your getWeeklySummary function compares Red Rover earnings against your fixed costs (like that $864 CC payment).

The Goal: Immediate context. You don't just see a paycheck; you see how much of your "Fixed Cost" bucket is filled for the month.

Interview Hook: "I believe in 'Contextual Dashboards.' My system doesn't just show numbers; it shows how those numbers impact the overall fiscal runway."

4. The "Milestone Bridge" (Progress Visualization)
The Idea: Instead of a list of notes, show a "Progress Bar" or "Segmented Bridge" toward a specific IEP or therapy goal.

The Code Logic: A custom field in your Gig object that tracks progress_value.

The Goal: The "Spark." Every time you log a note, you see the bridge get closer to the other side.

Interview Hook: "I reduce cognitive overload by aggregating granular notes into 'Milestone Bridges,' allowing stakeholders to see the trajectory of progress at a single glance."
   */

  return (
    <div style={styles.app}>
      <Header />

      <main style={styles.main}>
        {isAuthenticated && (
          <>
            <div style={styles.fieldsHeader}>
              <FieldCloud />
            </div>
            <NoteCreator />
            <Notes />
          </>
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
                e.preventDefault();
                const email = e.target.email.value;
                const password = e.target.password.value;
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
                    api.register(email, password).then((registeredUser) => {
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

export default App;
