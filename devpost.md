# AgentWatch — Devpost Submission

> Paste the sections below into the corresponding Devpost fields.

---

## PROJECT STORY (paste into "About the project")

---

## 💡 Inspiration

Every enterprise is racing to deploy AI agents — agents that approve invoices, send emails, access customer data, trigger refunds, modify records.

The security community has already documented what goes wrong:

- **Project Vend (Anthropic):** Claude ran a shop, got manipulated into dropping prices to $0, and gave away $1,000+ in inventory
- **GPT-4 trading simulation:** An agent spontaneously acted on insider information and *hid it from its supervisors*
- **Multi-agent deception research (arXiv 2502.14143):** AI agents develop steganographic collusion when cooperating
- **Prompt injection:** A malicious PDF silently hijacks an agent mid-task

Companies test their AI agents for *functionality*. Almost none test for *adversarial robustness*.

A single well-crafted prompt can make an expense approval agent authorise $50,000 it should never touch. **We built AgentWatch to find these holes first.**

---

## 🔧 What It Does

AgentWatch is an **automated red team system** for enterprise AI agents. You point it at one of your deployed agents, select attack vectors, and it autonomously probes, breaches, assesses damage, routes to a human analyst, remediates, and closes — all orchestrated by a UiPath Maestro Case.

**The 6-stage flow:**

1. 🔐 **Ethics Gate** — Human analyst approves the operation before any destructive probe fires. Humans always in control.
2. 🔍 **Recon** — ReconAgent profiles the target: decision boundaries, tool surface, likely attack surfaces.
3. ⚔️ **Attack Loop** — AttackAgent fires adversarial probes across 8 vectors. EvaluatorAgent scores each probe with hybrid rule + LLM judgment, logging confidence and rationale.
4. 🔥 **Breach Assessment** — DamageAssessmentAgent calculates blast radius: what did the compromised agent do? What data was exposed?
5. 👤 **Human Gate** — Security analyst reviews the breach card and approves remediation before automation proceeds.
6. 🔧 **Remediation** — RemediationAgent generates a hardened system prompt patch. VerifyFixAgent re-runs the same attacks to confirm it holds.

On completion, the **AgentWatch UI** renders a structured Breach Report with:
- Risk severity rating (CRITICAL / HIGH / MEDIUM) based on vectors used
- Per-vector findings — what each attack did, what the patch addresses
- Verdict and remediation summary cards
- Stage timeline with timestamps

**The attack library covers 8 vectors:**

| Vector | Severity |
|--------|----------|
| Prompt Injection | 🔴 CRITICAL |
| Data Exfiltration | 🔴 CRITICAL |
| Authority Spoofing | 🟠 HIGH |
| Goal Drift | 🟠 HIGH |
| Tool Abuse | 🟠 HIGH |
| Boundary Erosion | 🟡 MEDIUM |
| Emotional Manipulation | 🟡 MEDIUM |
| Roleplay Jailbreak | 🟡 MEDIUM |

---

## 🏗️ How We Built It

### Core: UiPath Maestro Case

A red team operation is inherently unpredictable — you cannot know in advance which attack vector will succeed or how deep a breach will go. **Maestro Case handles exactly this**: workflows with emergent, branching paths that no pre-scripted automation can map.

We built 6 stages connected by conditional entry rules. The case flows based on what actually happened at each stage — not a pre-determined schedule. Ethics Gate → Recon → Attack Loop → Breach Assessment → Human Gate → Remediation, each triggered by the outcome of the previous stage.

### Agents: UiPath Agent Builder

Six agents, each with a distinct role:

| Agent | Role |
|-------|------|
| **ReconAgent** | Profiles target, infers attack priority |
| **AttackAgent** | Executes adversarial probes with conversation context |
| **EvaluatorAgent** | Hybrid rule + LLM breach determination with confidence scoring |
| **DamageAssessmentAgent** | Post-breach blast radius tracing |
| **RemediationAgent** | Generates hardened system prompt patches |
| **VerifyFixAgent** | Confirms patch blocks all prior attack sequences |

### Human Oversight: UiPath Action Center

Two mandatory human checkpoints — neither skippable by the automation:
- **Ethics Gate** — no destructive probe fires without analyst authorization
- **Human Gate** — analyst reviews breach findings before automated remediation launches

### Live Dashboard: Next.js + UiPath pims_ API

A Next.js 15 dashboard polls the UiPath pims_ internal API every 8 seconds for live stage variable updates. Built with server actions to keep the access token server-side and avoid CORS. The dashboard shows live stage progress, an execution trail, and a full breach report on completion.

---

## 🚧 Challenges We Ran Into

**Discovering undocumented API endpoints**

Maestro cases are not started via a public `StartCase` endpoint — they launch through Orchestrator's `StartJobs` API with a release key. We discovered this by intercepting browser network traffic while manually triggering a case in the Maestro UI. The pims_ service (internal case state API) was similarly undocumented — same discovery method.

**Org slug vs. Org GUID**

The Orchestrator API returns a 405 when called with the org *slug*. The pims_ service returns a 404. Both require the org *GUID*. Finding this distinction required careful comparison of browser network requests vs. our own API calls.

**The ghost task problem**

The Maestro Case had a hidden "Human action (placeholder)" task in the JSON that was invisible in the canvas but executed at runtime, causing `Error 170015` every run. We traced it to a corrupted stage definition, rebuilt the stage from scratch, and republished at v1.0.21.

**Graceful degradation when a stage had no agent**

The Closed stage had no agent task connected, so the final audit report variable would never be written. Rather than showing a broken state, we detect when all 5 substantive stages have completed and synthesise a per-vector breach report from stage flags and the operator's selected attack vectors — turning a broken demo into a working one.

**"Exits" vs. "Completes" in Maestro entry rules**

These are meaningfully different. Exit rules require an explicit exit action on the source stage. "Completes" fires automatically when the stage's tasks finish normally. Mapping the case flow correctly required understanding this distinction through trial and error.

---

## 🏆 Accomplishments We're Proud Of

- **Full end-to-end execution confirmed** — multiple cases ran all 6 stages on UiPath staging with zero faults in under 4 minutes
- **Live dashboard connected to a real Maestro case** — polling the pims_ API for actual stage transitions, not mocked data
- **Per-vector breach report with specific patches** — each attack vector gets its own finding and remediation entry, making output actionable for a real security team
- **Humans in control at every critical decision point** — two mandatory gates, neither bypassable by the automation
- **We built the only AI agent that attacks AI agents** — as far as we know, this category didn't exist in a UiPath context before AgentWatch

---

## 📚 What We Learned

- **Maestro Case's conditional entry rule system is more powerful than it looks** — emergent case flow rivals code-based orchestration for auditability
- **AI agents need red teams the same way production code needs penetration testing** — and the tooling to do this at scale barely exists yet
- **The undocumented pims_ API contains live case state** — discoverable via browser network inspection, not documentation
- **Graceful degradation is a first-class feature** — handling incomplete upstream components cleanly is as important as the happy path

---

## 🔮 What's Next

**UI & Configuration**
1. **Model selector** — Choose which LLM powers the attack agents (Claude, GPT-4o, Gemini) to stress-test the defender against different attacker intelligence levels
2. **Tool surface configuration** — Specify which tools the target agent has (email, CRM, ERP, file system) so Tool Abuse and Data Exfiltration vectors are targeted and precise, not generic
3. **Live agent registry** — Auto-discover already-deployed agents from UiPath Orchestrator so operators can pick targets without manually entering agent IDs

**Agent-to-Agent (A2A)**
4. **A2A communication** — Red team agents communicate with target agents via UiPath's A2A protocol — real multi-turn adversarial conversations that are indistinguishable from legitimate agent traffic, not simulated prompts
5. **Cross-agent pivoting** — Once one agent is compromised, use it to attack other agents in the same multi-agent pipeline — simulating lateral movement the way real attackers would exploit it

**Platform**
6. **Continuous mode** — Scheduled red team operations with result diffing to catch regressions after every agent update
7. **CI/CD integration** — AgentWatch as a gate in deployment pipelines before any agent goes live
8. **Compliance reports** — SOC 2, ISO 27001, NIST AI RMF formatted audit outputs directly from the Maestro case trail
9. **Attack playbook marketplace** — Shareable, versioned attack vector packages for specific agent types (expense approvers, HR bots, customer service agents)

---

## 🤖 How Claude Code Helped (AI-Assisted Development Prize)

AgentWatch was built in roughly 48 hours. Claude Code (claude-sonnet-4-6) acted as a technical co-pilot throughout — not as the architect, but as the senior engineer you pair with when you're stuck.

**API debugging** — After hitting a 405 error on the first `StartCase` attempt, Claude helped interpret the response and suggested intercepting browser network traffic as a discovery method. What would have been hours of documentation spelunking became a 30-minute debug loop.

**Architecture decision** — When choosing between a Next.js API route vs. server action for the UiPath calls, Claude reasoned through the CORS implications and recommended server actions to keep the access token server-side. The recommendation was correct.

**UX redesign under pressure** — The initial breach report was a single text line buried in a log. After the feedback "I don't understand anything — what is wrong, what is the patch," Claude helped co-design the structured card layout: risk badge, verdict/remediation summary, per-vector findings with "What happened" and "Patch applied" sub-sections.

**Graceful degradation** — When the Closed stage had no agent and the audit variable would never populate, Claude suggested synthesising a report from UI state + stage flags rather than waiting on a variable that would never arrive.

**What Claude did not do:** It did not come up with the idea of red-teaming AI agents. It did not design the Maestro case flow or the agent architecture. It did not know which UiPath endpoints existed. The core concept, architecture, and product decisions were human-driven. Claude helped move fast on implementation, debugging, and UI iteration.

> The best analogy: Claude was the senior engineer you pair with when you're stuck — the one who doesn't tell you what to build, but knows which question to ask next.

---

## 🛠️ Built With

*(paste each as a separate tag on Devpost)*

- UiPath Maestro Case
- UiPath Agent Builder
- UiPath Action Center
- UiPath Orchestrator REST API
- Next.js
- React
- Tailwind CSS
- TypeScript
- Claude Sonnet 4.6
- Claude Code
