# Amazon Agent Gatekeeper

**Student Enrolment Number:** `pgd202564257`  
**Application:** Autonomous AI Commerce Policy & Compliance Engine  
**Core Governance Standard:** "The Wells Fargo Rule" (Immediate Delegated AI Access Revocation)

---

## 🌟 Overview
**Amazon Agent Gatekeeper** is an enterprise single-page web application that safeguards autonomous AI shopping agents acting on behalf of Amazon customers. It strictly enforces customer consent, immediate revocation capabilities (The Wells Fargo Rule), and spending guardrails.

---

## 🚀 Key Features

### 1. Header & Identity
- **Branding:** Amazon dark navy & warm amber styling (`#131921`, `#232f3e`, `#ff9900`).
- **Student ID Display:** Prominently displays Student Enrolment Number **`pgd202564257`** in an elevated amber badge.
- **Live Status:** Real-time pulse indicator showing compliance status and autonomous order limit (₹5,000).

### 2. Agent Registration & Revocation Panel ("The Wells Fargo Rule")
- **Registration:** Register AI agents with Customer Name, Agent Name, and auto-generated timestamp.
- **Pre-Loaded Sample Agents:**
  - `Lipsa` &bull; `ShopBot` &bull; **ACTIVE**
  - `Lipsa` &bull; `OldAssistant` &bull; **REVOKED** (Timestamp recorded)
- **Immediate Revocation:** Clicking **"Revoke Access"** immediately transitions the agent to `REVOKED` and stamps the exact revocation date & time.
- **Reset Demo Agents:** 1-click restore to sample state for easy demo re-takes.

### 3. Request Simulator Panel & Gatekeeper Rule Engine
Evaluates AI agent purchase and inquiry requests in **strict hierarchical order**:
1. **Rule 1 (BLOCK):** Agent registered but status is `REVOKED` &rarr; *"Rule 1: Agent access was revoked on [timestamp]."*
2. **Rule 2 (BLOCK):** Agent not registered for that customer &rarr; *"Rule 2: Unknown/unregistered AI agent."*
3. **Rule 3 (ALLOW):** Action is `view order` &rarr; *"Rule 3: Read-only action allowed for active registered agent."*
4. **Rule 4 (ASK CUSTOMER):** Action is `place order` & Amount > ₹5,000 &rarr; *"Rule 4: Order exceeds ₹5,000 autonomous spending limit; customer confirmation required."*
5. **Rule 5 (ALLOW):** Action is `place order` & Amount ≤ ₹5,000 &rarr; *"Rule 5: Order is within ₹5,000 autonomous spending limit."*
6. **Rule 6 (ALLOW):** Action is `return` &rarr; *"Rule 6: Return request allowed for active registered agent."*
7. **Rule 7 (ASK CUSTOMER):** Action is `refund` &rarr; *"Rule 7: Refund requests always require customer confirmation."*

- **1-Click Demo Presets:** 7 preset scenario buttons allow instantly testing every single rule on camera without typing.
- **Color-Coded Verdict Badges:**
  - 🟢 **ALLOW** (Green)
  - 🟡 **ASK CUSTOMER** (Yellow/Orange)
  - 🔴 **BLOCK** (Red)

### 4. Audit Log Table & CSV Export
- Automatically logs all evaluations with timestamp, customer, agent, action, formatted amount (₹), color-coded decision badge, and triggered rule description.
- **Flash Animation:** Newly evaluated rows glow yellow briefly to highlight live logging during demo recordings.
- **Export Audit Log (CSV):** Generates and downloads a clean, RFC-compliant `.csv` file.

---

## 💻 How to Run
Simply double-click or open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave, Safari). No external build tools or backend server required.

```
project/
├── index.html       # Single-page application structure & UI
├── style.css        # Amazon design system styling & animations
├── script.js        # Rule engine, revocation logic & audit logging
└── README.md        # Documentation and walkthrough guide
```
