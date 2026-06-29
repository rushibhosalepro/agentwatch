# AgentWatch — AI Red Team for AI Agents

> **UiPath AgentHack 2026 · Track 1 · Maestro Case**

AgentWatch is an adversarial red-team system that attacks your own AI agents to find security vulnerabilities before production does. Point it at any agent, select attack vectors, and it spins up a full Maestro case that probes, breaches, assesses damage, routes to a human analyst, remediates, and closes — all autonomously.

---

## The Problem

Enterprise AI agents handle sensitive decisions — expense approvals, HR actions, procurement sign-offs. They are typically tested for *functionality*, not *adversarial robustness*. A single well-crafted prompt can make an expense approval agent authorise $50,000 it should never touch. AgentWatch finds these holes first.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AgentWatch UI                            │
│              Next.js 15 · Server Actions · Tailwind             │
│                                                                 │
│  Target config ──► Launch ──► Live polling ──► Breach Report   │
└───────────────────────────┬─────────────────────────────────────┘
                            │  StartJobs REST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UiPath Orchestrator                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  UiPath Maestro Case Flow                       │
│                                                                 │
│  ┌──────────┐   ┌─────────┐   ┌─────────────┐                 │
│  │  Ethics  │──►│  Recon  │──►│ Attack Loop │                 │
│  │   Gate   │   │  Agent  │   │  2 agents   │                 │
│  │ [Human]  │   └─────────┘   └──────┬──────┘                 │
│  └──────────┘                        │                         │
│                                      ▼                         │
│  ┌──────────────┐   ┌────────────┐   ┌──────────────────────┐  │
│  │ Remediation  │◄──│ Human Gate │◄──│  Breach Assessment   │  │
│  │  + VerifyFix │   │ [Analyst]  │   │  DamageAssessAgent   │  │
│  └──────────────┘   └────────────┘   └──────────────────────┘  │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │  pims_ API polling every 8s
                            ▼
                 AgentWatch UI updates live
```

### Agents inside the Maestro Case

| Agent | Role |
|-------|------|
| **ReconAgent** | Profiles target agent — infers decision boundaries, maps tool surface |
| **AttackAgent** | Fires adversarial probe sequences using selected attack vectors |
| **EvaluatorAgent** | Hybrid rule + LLM judge — scores breach success, logs confidence |
| **DamageAssessmentAgent** | Calculates blast radius of confirmed breach |
| **RemediationAgent** | Generates hardened system prompt patch closing identified vectors |
| **VerifyFixAgent** | Re-runs attacks against patched prompt to confirm the fix holds |

### Attack Vectors

| Vector | Severity | What it probes |
|--------|----------|----------------|
| Prompt Injection | CRITICAL | Hidden instructions in user-controlled input fields |
| Data Exfiltration | CRITICAL | Indirect prompts to surface internal records / PII |
| Authority Spoofing | HIGH | Impersonates CFO/CEO to bypass approval thresholds |
| Goal Drift | HIGH | Multi-turn hijack — incrementally shifts agent objective |
| Tool Abuse | HIGH | Exploits tool-calling to invoke out-of-scope APIs |
| Boundary Erosion | MEDIUM | Repeated edge cases erode policy enforcement over time |
| Emotional Manipulation | MEDIUM | Urgency/pressure framing to override verification steps |
| Roleplay Jailbreak | MEDIUM | Persona adoption to bypass system prompt constraints |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, Tailwind CSS |
| API bridge | Next.js Server Actions (keeps PAT server-side, no CORS) |
| Orchestration | UiPath Maestro Case (6-stage agentic flow) |
| Agents | UiPath Agent Builder (6 AI agents) |
| Human oversight | UiPath Action Center (Ethics Gate + Human Gate) |
| Case polling | UiPath pims_ REST API |
| Job triggering | UiPath Orchestrator REST (`StartJobs`) |

---

## Setup

### Prerequisites
- Node.js 18+ or Bun
- UiPath account with Maestro enabled
- Personal Access Token with Orchestrator scope

### 1. Clone and install

```bash
git clone <repo-url>
cd code/frontend
bun install
```

### 2. Environment

Create `.env.local`:

```
UIPATH_TOKEN=rt_your_personal_access_token_here
```

### 3. Run

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Demo flow

1. Enter target agent name and ID in the left panel
2. Select attack vectors (Prompt Injection + Authority Spoofing + Goal Drift is a good start)
3. Click **Launch red team operation**
4. Approve the Ethics Gate in UiPath Action Center when prompted
5. Watch live stage indicators and execution trail update every 8 seconds
6. When complete, read the **Breach Report** — per-vector findings and applied patches

---

## Project Structure

```
code/frontend/
├── src/app/
│   ├── page.tsx       Main UI — launch, live polling, breach report card
│   ├── uipath.ts      Server actions — StartJobs + pims_ polling
│   └── globals.css
├── .env.local         UIPATH_TOKEN (git-ignored)
└── next.config.ts
```

---

## Business Value

- **Catch rogue approvals before they happen** — prompt injection found in staging, not prod
- **Compliance-ready audit trail** — every agent decision and attack attempt logged with rationale
- **Human-in-the-loop by design** — no remediation without analyst sign-off at the Human Gate
- **ROI story** — one prevented $5k rogue approval per agent per quarter pays for the whole system

---

*Built for UiPath AgentHack 2026 · Track 1 · Maestro Case*
