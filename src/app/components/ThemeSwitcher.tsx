"use client";

import styles from "../../styles/components/theme-switcher.module.css";
import React, { useState, useEffect } from "react";

interface ThemeSwitcherProps {
  className?: string;
}

type ThemeState = {
  theme: string;
  spacing: string;
  radius: string;
  shadow: string;
  isOpen: boolean;
};
const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = "" }) => {
  const [themeState, setThemeState] = useState<ThemeState>(() => {
    // This function only runs once on the client during initialization
    if (typeof window === "undefined") {
      // Return a default state for server-side rendering
      return { theme: "", spacing: "", radius: "", shadow: "", isOpen: false };
    }
    return {
      theme: localStorage.getItem("theme") || "",
      spacing: localStorage.getItem("spacing") || "",
      radius: localStorage.getItem("radius") || "",
      shadow: localStorage.getItem("shadow") || "",
      isOpen: localStorage.getItem("themeSwitcherOpen") === "true",
    };
  });

  const themes = [
    { name: "Default (Blue)", class: "" },
    { name: "Blue", class: "theme-blue" },
    { name: "Green", class: "theme-green" },
    { name: "Purple", class: "theme-purple" },
    { name: "Orange", class: "theme-orange" },
    { name: "Red", class: "theme-red" },
    { name: "Teal", class: "theme-teal" },
    { name: "Dark", class: "theme-dark" },
  ];

  const spacingOptions = [
    { name: "Default", class: "" },
    { name: "Compact", class: "spacing-compact" },
    { name: "Relaxed", class: "spacing-relaxed" },
  ];

  const radiusOptions = [
    { name: "Default", class: "" },
    { name: "Sharp", class: "radius-sharp" },
    { name: "Rounded", class: "radius-rounded" },
    { name: "Pill", class: "radius-pill" },
  ];

  const shadowOptions = [
    { name: "Default", class: "" },
    { name: "Subtle", class: "shadow-subtle" },
    { name: "Bold", class: "shadow-bold" },
  ];

  const applyTheme = (
    theme: string,
    spacing: string,
    radius: string,
    shadow: string,
  ) => {
    const body = document.body;

    // Remove all theme classes
    body.classList.remove(
      "theme-blue",
      "theme-green",
      "theme-purple",
      "theme-orange",
      "theme-red",
      "theme-teal",
      "theme-dark",
      "spacing-compact",
      "spacing-relaxed",
      "radius-sharp",
      "radius-rounded",
      "radius-pill",
      "shadow-subtle",
      "shadow-bold",
    );

    // Add new theme classes (only if not empty string)
    if (theme && theme !== "") body.classList.add(theme);
    if (spacing && spacing !== "") body.classList.add(spacing);
    if (radius && radius !== "") body.classList.add(radius);
    if (shadow && shadow !== "") body.classList.add(shadow);
  };

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedTheme = localStorage.getItem("theme") || "";
    const savedSpacing = localStorage.getItem("spacing") || "";
    const savedRadius = localStorage.getItem("radius") || "";
    const savedShadow = localStorage.getItem("shadow") || "";
    const savedIsOpen =
      localStorage.getItem("themeSwitcherOpen") === "true" || false;

    setThemeState({
      theme: savedTheme,
      spacing: savedSpacing,
      radius: savedRadius,
      shadow: savedShadow,
      isOpen: savedIsOpen,
    });
  }, []);

  useEffect(() => {
    // Apply theme to body whenever it changes
    applyTheme(
      themeState.theme,
      themeState.spacing,
      themeState.radius,
      themeState.shadow,
    );
  }, [
    themeState.theme,
    themeState.spacing,
    themeState.radius,
    themeState.shadow,
  ]);

  const { theme, spacing, radius, shadow, isOpen } = themeState;

  const handleThemeChange = (themeClass: string) => {
    setThemeState((prevState) => ({ ...prevState, theme: themeClass }));
    localStorage.setItem("theme", themeClass);
  };

  const handleSpacingChange = (spacingClass: string) => {
    setThemeState((prevState) => ({ ...prevState, spacing: spacingClass }));
    localStorage.setItem("spacing", spacingClass);
  };

  const handleRadiusChange = (radiusClass: string) => {
    setThemeState((prevState) => ({ ...prevState, radius: radiusClass }));
    localStorage.setItem("radius", radiusClass);
  };

  const handleShadowChange = (shadowClass: string) => {
    setThemeState((prevState) => ({ ...prevState, shadow: shadowClass }));
    localStorage.setItem("shadow", shadowClass);
  };

  return (
    <div className={`${styles.themeSwitcher} ${className} relative`}>
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setThemeState((prevState) => ({ ...prevState, isOpen: newIsOpen }));
          localStorage.setItem("themeSwitcherOpen", newIsOpen.toString());
        }}
        className={styles.dropdownButton}
        aria-label="Theme Switcher"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6" />
          <path d="M12 1a11 11 0 0 0-11 11c0 6.075 4.925 11 11 11s11-4.925 11-11-4.925-11-11-11z" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Theme Switcher
          </h3>

          <div className="grid gap-4">
            {/* Color Themes */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Color Theme:
              </label>
              <div className="flex gap-2 flex-wrap">
                {themes.map((theme) => (
                  <button
                    key={theme.class}
                    onClick={() => handleThemeChange(theme.class)}
                    className={`btn btn-sm ${
                      themeState.theme === theme.class
                        ? "btn-primary"
                        : theme.class === "theme-dark"
                          ? "btn-secondary"
                          : "btn-ghost"
                    }`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Spacing:
              </label>
              <div className="flex gap-2 flex-wrap">
                {spacingOptions.map((option) => (
                  <button
                    key={option.class}
                    onClick={() => handleSpacingChange(option.class)}
                    className={`btn btn-sm ${
                      spacing === option.class ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Border Radius:
              </label>
              <div className="flex gap-2 flex-wrap">
                {radiusOptions.map((option) => (
                  <button
                    key={option.class}
                    onClick={() => handleRadiusChange(option.class)}
                    className={`btn btn-sm ${
                      radius === option.class ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Shadows */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Shadows:
              </label>
              <div className="flex gap-2 flex-wrap">
                {shadowOptions.map((option) => (
                  <button
                    key={option.class}
                    onClick={() => handleShadowChange(option.class)}
                    className={`btn btn-sm ${
                      shadow === option.class ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-secondary rounded-md">
            <p className="text-sm text-secondary">
              <strong>Current Theme:</strong>{" "}
              {themes.find((t) => t.class === theme)?.name || "Default"}
              {spacing &&
                ` + ${spacingOptions.find((s) => s.class === spacing)?.name}`}
              {radius &&
                ` + ${radiusOptions.find((r) => r.class === radius)?.name}`}
              {shadow &&
                ` + ${shadowOptions.find((sh) => sh.class === shadow)?.name}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
