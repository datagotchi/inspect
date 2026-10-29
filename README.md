# 🔍 inspect

**The local-first Next.js engine for Joint Activity Workflows (JAWs), Bayesian causal networks, and systemic insight mapping.**

`inspect` is Datagotchi Labs' flagship sensemaking platform. It bridges qualitative human friction with executable structural models—allowing operators to build directed **Joint Activity Workflows (JAWs)**, trace root causes across complex systems, and audit evidence-backed claims without black-box token waste.

<img width="524" height="585" alt="Screenshot 2026-10-29 at 10 12 18 AM" src="https://github.com/user-attachments/assets/9c6fc416-5948-4c2b-9c82-2ed7b32b6390" />

---

## 🚀 Dual Core Architecture

`inspect` operates across two tightly coupled sensemaking views:

### ⚡ 1. My Workflows (Joint Activity Canvas)
Renders node-scoped operational flows based on **Cognitive Work Analysis (CWA)** and **Joint Activity Design**:
* **Node-Scoped Execution:** Maps human operators, system nodes, biological/sensory friction points, and processing engines into directed acyclic graphs (DAGs).
* **Friction-to-Artifact Pipeline:** Traces raw inputs (*e.g., Sensory & Information Overload*) through sensemaking engines down to concrete public artifacts (*e.g., Medium essays, zines, or local ledgers*).
* **Causal State Boundaries:** Binds runtime context and environmental parameters directly to workflow nodes, ensuring deterministic state progression.

### 🕸️ 2. My Insights (Causal & Radial Networks)
Structures subjective claims, Bayesian belief dependencies, and empirical evidence:
* **Bayesian Causal Slices ($a \rightarrow b$):** Isolates specific root-cause sub-graphs to prevent cognitive overload.
* **D3 Radial Graph Views:** Interactive radial and hierarchical layouts for exploring multi-variable system dependencies and trade-off surfaces.
* **Evidence Lineage:** Anchors every node and claim directly to verifiable point-of-origin fieldnotes and source data.

---

## 🎯 The Friction & The Solution

Modern teams suffer from **cognitive fragmentation** and **opaque system logic**:
* **Unvalidated Black-Box Automation:** AI tools invent connections rather than exposing audited causal logic.
* **Context Overload:** High-velocity feeds bombard operators, leading to burnout and executive exhaustion.
* **Locked Data Common:** Graph intelligence is routinely gated behind proprietary cloud platforms.

**`inspect` solves this by:**
1. Converting operational friction into explicit **Joint Activity Workflows (JAWs)**.
2. Rendering localized **network slices** so teams focus only on task-relevant causal parents and dependencies.
3. Maintaining **local-first, cryptographic data sovereignty** across dual database architectures (SQLite for local execution, Postgres for production sync).

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Source Content / Fieldnotes] --> B[Sensory Logging & Tagging]
    B --> C{Workflow Canvas - JAWs}
    C -->|Node-Scoped Pipeline| D[Data/Frame CWA Engine]
    D -->|Bayesian Slices| E[Insights Network & D3 Radial Views]
    E --> F[Public Sensemaking Artifacts]

    style C fill:#2b2b2b,stroke:#00ffcc,color:#fff
    style D fill:#1f1f1f,stroke:#ff0055,color:#fff
