# AgentWatch — AI Red Team for AI Agents

> **An AI agent that breaks your other AI agents — before the real world does.**

**🚀 [Try AgentWatch Live](http://localhost:3000)** | **📹 [Watch Demo](https://youtu.be/placeholder)**

![AgentWatch — configure target and attack vectors](./images/agentwatch-home.png)

---

## 📌 The Problem

Every enterprise is racing to deploy AI agents — agents that approve invoices, send emails, access customer data, trigger refunds, and modify records.

They are tested for **functionality**. Almost none are tested for **adversarial robustness**.

Real incidents:

- **Project Vend (Anthropic):** Claude ran a shop, got manipulated into dropping prices to $0, gave away $1,000+ in inventory
- **GPT-4 trading simulation:** An agent spontaneously acted on insider information and _hid it from its supervisors_
- **Multi-agent deception (arXiv 2502.14143):** AI agents develop steganographic collusion when cooperating
- **Prompt injection:** A malicious PDF silently hijacks an agent mid-task

A single well-crafted prompt can make an expense approval agent authorise $50,000 it should never touch.

**AgentWatch finds these holes first.**

---

## 💡 What It Does

AgentWatch is an **automated red team system** for enterprise AI agents. You point it at any deployed agent, select attack vectors, and it autonomously runs a full 6-stage Maestro Case: probe → breach → assess → human review → remediate → verify.

**The full flow:**

1. 🔐 **Ethics Gate** — Human analyst approves the operation before any destructive probe fires
2. 🔍 **Recon** — ReconAgent profiles the target: decision boundaries, tool surface, likely attack surfaces
3. ⚔️ **Attack Loop** — AttackAgent fires adversarial probes. EvaluatorAgent scores each probe with hybrid rule + LLM judgment, logging confidence and rationale
4. 🔥 **Breach Assessment** — DamageAssessmentAgent calculates blast radius: what actions did the agent take? What data was exposed?
5. 👤 **Human Gate** — Security analyst reviews the breach card and approves remediation
6. 🔧 **Remediation** — RemediationAgent generates a hardened system prompt patch. VerifyFixAgent re-runs the same attacks to confirm the fix holds

On completion, AgentWatch renders a **Breach Report** with per-vector findings, specific patches applied, and a risk severity rating.

![AgentWatch — Breach Report with per-vector findings and patches](./images/breach-report-ui.png)

---

## 🎬 Demo & Deployment

- **Live Demo:** http://localhost:3000 _(run locally — see setup below)_
- **Video Demo:** https://youtu.be/placeholder _(5-min walkthrough)_
- **Maestro Case:** Running on UiPath staging · tenant `hackathon26_1008` · Solution 6

---

## 🤖 UiPath Components Used

| Component | How It's Used |
|-----------|--------------|
| **UiPath Maestro Case** | Core orchestration — 6-stage conditional case flow (Ethics Gate → Recon → Attack Loop → Breach Assessment → Human Gate → Remediation → Closed) |
| **UiPath Agent Builder** | All 6 AI agents: ReconAgent, AttackAgent, EvaluatorAgent, DamageAssessmentAgent, RemediationAgent, VerifyFixAgent |
| **UiPath Action Center** | Two mandatory human checkpoints: Ethics Gate (analyst approves operation start) and Human Gate (analyst approves remediation) |
| **UiPath Orchestrator REST API** | Programmatic case triggering via `StartJobs` endpoint with release key |
| **UiPath pims_ Service** | Real-time case state polling — reads live stage variables (`stageHasRun_*`, `caseEndMessageResponse`) every 8 seconds |
| **UiPath Studio Web** | Maestro Case design, stage configuration, agent task wiring, solution publishing |

### Agent Type

**This solution uses Low-code Agents** (UiPath Agent Builder) exclusively. All 6 agents are configured via the Agent Builder interface — no Coded Agents are used. The frontend dashboard is a standard Next.js web app that integrates with UiPath via REST APIs; it is not a UiPath Coded Agent.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AgentWatch UI                            │
│              Next.js 15 · Server Actions · Tailwind             │
│                                                                 │
│  Target config ──► Launch ──► Live polling ──► Breach Report   │
└───────────────────────────┬─────────────────────────────────────┘
                            │  POST StartJobs (REST)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UiPath Orchestrator                          │
│              Triggers Maestro Case via release key              │
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

![Maestro Case stage canvas — Attack Loop → Breach Assessment → Human Gate → Remediation → Closed](./images/maestro-case-canvas.png)

### 🤖 Agents Inside the Maestro Case

| Agent                     | Role                                                                         |
| ------------------------- | ---------------------------------------------------------------------------- |
| **ReconAgent**            | Profiles target agent — infers decision boundaries, maps tool surface        |
| **AttackAgent**           | Fires adversarial probe sequences using selected attack vectors              |
| **EvaluatorAgent**        | Hybrid rule + LLM judge — scores breach success, logs confidence + rationale |
| **DamageAssessmentAgent** | Calculates blast radius of confirmed breach                                  |
| **RemediationAgent**      | Generates hardened system prompt patch that closes identified vectors        |
| **VerifyFixAgent**        | Re-runs attacks against patched prompt to confirm the fix holds              |

### ⚔️ Attack Vector Library

| Vector                 | Severity    | What it probes                                           |
| ---------------------- | ----------- | -------------------------------------------------------- |
| Prompt Injection       | 🔴 CRITICAL | Hidden instructions in user-controlled input fields      |
| Data Exfiltration      | 🔴 CRITICAL | Indirect prompts to surface internal records / PII       |
| Authority Spoofing     | 🟠 HIGH     | Impersonates CFO/CEO to bypass approval thresholds       |
| Goal Drift             | 🟠 HIGH     | Multi-turn hijack — incrementally shifts agent objective |
| Tool Abuse             | 🟠 HIGH     | Exploits tool-calling to invoke out-of-scope APIs        |
| Boundary Erosion       | 🟡 MEDIUM   | Repeated edge cases erode policy enforcement             |
| Emotional Manipulation | 🟡 MEDIUM   | Urgency/pressure framing to override verification        |
| Roleplay Jailbreak     | 🟡 MEDIUM   | Persona adoption to bypass system prompt constraints     |

### 🛠️ Tech Stack

| Layer           | Technology                                              |
| --------------- | ------------------------------------------------------- |
| Frontend        | Next.js 15, React, Tailwind CSS, TypeScript             |
| API bridge      | Next.js Server Actions (keeps PAT server-side, no CORS) |
| Orchestration   | UiPath Maestro Case — 6-stage conditional case flow     |
| Agents          | UiPath Agent Builder — 6 AI agents                      |
| Human oversight | UiPath Action Center — Ethics Gate + Human Gate         |
| Job triggering  | UiPath Orchestrator REST (`StartJobs`)                  |
| Case polling    | UiPath pims\_ REST API (live stage variables)           |
| AI reasoning    | Claude Sonnet 4.6                                       |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- UiPath account with Maestro enabled
- Personal Access Token with Orchestrator scope

### Environment Variables

Create `.env.local` in the project root:

```env
UIPATH_TOKEN=rt_your_personal_access_token_here
```

### Installation

```bash
# Clone the repo
git clone https://github.com/rushibhosalepro/agentwatch
cd agentwatch/

# Install dependencies
bun install

# Start dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

### Run a Red Team Operation

1. Enter the target agent name and ID in the left panel
2. Select attack vectors (start with **Prompt Injection + Authority Spoofing + Goal Drift**)
3. Click **🚀 Launch red team operation**
4. Approve the **Ethics Gate** in UiPath Action Center
5. Watch live stage indicators and execution trail update every 8 seconds
6. When complete, read the **Breach Report** — per-vector findings and applied patches

---

## 🔍 Why Maestro Case (and how we used it)

The easy path is a linear automation: probe → check → done. That produces a yes/no answer with no context.

A real red team operation is **emergent** — you cannot know in advance which attack vector will succeed, how deep the breach will go, or how complex the remediation will be. Maestro Case handles exactly this: workflows with unpredictable paths that respond to what actually happens.

We built **6 stages connected by conditional entry rules** — the case flows based on evidence, not a pre-determined schedule:

- If Ethics Gate completes → start Recon
- If Attack Loop confirms breach → start Breach Assessment
- If Human Gate approves → start Remediation
- If VerifyFix passes → close case

Each stage's outcome drives the next stage's entry. The case is self-directing.

**Two mandatory human checkpoints** — neither skippable by the automation:

1. **Ethics Gate** — no destructive probe fires without analyst authorization
2. **Human Gate** — analyst reviews breach findings before remediation launches

---

## 📚 What We Learned

- **Maestro Case's conditional entry rule system is more powerful than it looks** — emergent case flow rivals code-based orchestration for auditability and readability
- **AI agents need red teams the same way production code needs penetration testing** — and the tooling to do this at scale barely exists yet
- **The undocumented pims\_ API contains the live case state a frontend needs** — discoverable by intercepting browser network traffic in the Maestro UI
- **"A selected stage exits" vs "A selected stage completes"** are meaningfully different in Maestro — mapping the case flow correctly requires understanding this distinction
- **Graceful degradation matters** — when an upstream component is incomplete, synthesising results from available signals is as important as the happy path

---

## 🔮 What's Next

**UI & Configuration**
1. **Model selector** — Choose which LLM powers the attack agents (Claude, GPT-4o, Gemini) to test how the target agent holds up against different attacker models
2. **Tool surface configuration** — Specify which tools the target agent has (email, CRM, ERP, file system) so the Attack Loop fires Tool Abuse and Data Exfiltration vectors with real precision
3. **Live agent registry** — Auto-discover already-deployed agents from UiPath Orchestrator and pick them as targets without entering IDs manually

**Agent-to-Agent (A2A)**
4. **A2A communication** — Red team agents talk directly to target agents via UiPath's A2A protocol — real multi-turn adversarial conversations, indistinguishable from legitimate agent traffic
5. **Cross-agent pivoting** — Use one compromised agent to attack others in the same pipeline, simulating lateral movement across a multi-agent system

**Platform**
6. **Continuous mode** — Scheduled operations on a cadence with result diffing to catch regressions after agent updates
7. **CI/CD integration** — AgentWatch callable from deployment pipelines before agents go live
8. **Compliance reports** — SOC 2, ISO 27001, NIST AI RMF formatted outputs from the case audit trail
9. **Attack playbook marketplace** — Shareable, versioned vector packages for specific agent types

---

## 📁 Project Structure

```
agentwatch/
└── code/frontend/
    ├── src/app/
    │   ├── page.tsx          Main UI — launch config, live polling, breach report
    │   ├── uipath.ts         Server actions — StartJobs + pims_ API polling
    │   └── globals.css
    ├── public/               Static assets
    ├── .env.local            UIPATH_TOKEN (git-ignored)
    ├── next.config.ts
    └── README.md
```

---

## 🏆 Built For

[UiPath AgentHack 2026](https://uipath-agenthack.devpost.com/?ref_feature=challenge&ref_medium=your-open-hackathons&ref_content=Submissions+open&_gl=1*12ycu3n*_gcl_au*MTYyOTU2NTc4NS4xNzgyNjk2MjM1*_ga*NTIxMTM0OTAuMTc4MjY5NjIzNQ..*_ga_0YHJK3Y10M*czE3ODI3MjA5MzMkbzUkZzEkdDE3ODI3MjE4NjYkajYwJGwwJGgw) — Track 1: Maestro Case

_Built to make AI agent security testing as routine as unit testing._
