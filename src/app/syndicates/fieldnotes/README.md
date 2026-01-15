# FieldNotes by Datagotchi Labs

**High-Fidelity Sensemaking for the 7th Era.**

FieldNotes is a local-first, high-integrity data capture tool designed for "Stewards" operating in complex, high-stakes environments (Education, Healthcare, and Community Organizing).

## 🛡️ Sovereign Infrastructure

FieldNotes is built on the principle of **Protective Stewardship**. Unlike traditional "extractive" cloud tools, FieldNotes prioritizes:

- **Local-First Data:** Utilizing **LibSQL/SQLite** for offline-capability and user-owned data sovereignty.
- **Cognitive Ergonomics:** UI components (like our custom "Pill UI") designed around **Visual Salience** to reduce cognitive load in the field.
- **Deterministic Logic:** High-reliability state transitions to ensure data integrity during "in-situ" event logging.

## 🔐 Privacy & Security Roadmap

We are architecting for "Zero-Trust" field environments:

- **E2EE:** End-to-end encryption for all synchronized metadata.
- **Biometric Guarding:** Planned integration for **FaceID/TouchID** via WebAuthn.
- **Hardware Sovereignty:** Support for **Physical Security Keys (FIDO2/Yubikey)** to ensure identity integrity.

## 🏗️ Technical Architecture & Roadmap

- **The Migration:** Transitioning from a centralized PostgreSQL backbone to a distributed, local-first **LibSQL** framework.
- **The Integration:** We are architecting a secure bridge to import E2EE data from **FieldNotes** into **Inspect Insights**.
- **The Inference Engine:** This allows for the summarization of field data while maintaining a strict chain of evidence—allowing the system to "cite" encrypted source data to support high-level insights.
- **Architectural Evolution:** While this prototype is currently Node.js/Express + React, I am planning a merge into my larger full-stack **Next.js** platform, **[Inspect](https://github.com/datagotchi/inspect)**. This includes building an inference bridge to summarize E2EE data from FieldNotes and cite it as primary evidence—leveraging an Nginx HTTPS/TLS proxy and PostgreSQL backbone.

## ⚖️ License

Copyright (C) 2026 Bob Stark / Datagotchi Labs. Distributed under the **GNU General Public License v3.0**.
