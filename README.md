# Compliance Autopilot — GitLab Duo Agent

> SOC2/GDPR drift detection + audit evidence generation powered by Claude via Anthropic API.

Built for the [GitLab AI Hackathon](https://gitlab.com/gitlab-org/gitlab/-/issues) — $65K prize pool, deadline Mar 25.

## 🚀 Live Demo

**[https://compliance-autopilot-five.vercel.app](https://compliance-autopilot-five.vercel.app)**

No API keys needed — mock mode runs a full demo scan out of the box.

## What it does

**Compliance Autopilot** is a GitLab Duo Agent that continuously monitors your GitLab project for compliance drift and auto-generates audit-ready evidence:

- 🔍 **Drift Detection** — scans MRs, pipelines, issues, and project settings for SOC2/GDPR violations
- 🤖 **Claude Analysis** — uses Claude (Anthropic API) to reason about compliance posture and surface risks via a 4-agent pipeline (Planner → Scanner → Analyzer → Reporter)
- 📋 **Audit Evidence** — generates structured evidence reports (Markdown + JSON) ready for auditors — one click download
- 🚨 **Real-time Dashboard** — compliance score, grade, open drift items, and remediation steps

## Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 14 + TypeScript + Tailwind CSS (Vercel) |
| **Backend** | FastAPI + Python + `uv` |
| **AI** | Claude via Anthropic API |
| **Integration** | GitLab REST API v4 |

## Architecture

```
User → Next.js UI → /api/scan (Next.js API route)
                         │
                    Anthropic API
                    ┌────────────────────────────────┐
                    │  PlannerAgent  → surfaces list  │
                    │  ScannerAgent  → findings JSON  │
                    │  AnalyzerAgent → score + grade  │
                    │  ReporterAgent → evidence .md   │
                    └────────────────────────────────┘
```

## Quick Start

```bash
# Frontend (mock mode — no API keys needed)
cd frontend
npm install
npm run dev
# → http://localhost:3000

# Backend (optional — for real GitLab API calls)
cd backend
uv sync
uv run uvicorn main:app --reload
```

## Environment Variables

```env
# Frontend (.env.local) — optional, falls back to mock
ANTHROPIC_API_KEY=your_key_here

# Backend (.env) — optional
ANTHROPIC_API_KEY=your_key_here
GITLAB_TOKEN=your_token_here
MOCK_MODE=true
```

## Demo

Mock mode is enabled by default — no API keys required. Click **"Run Demo Scan"** on the homepage or enter any GitLab project URL to see:

1. 4 Claude agents spin up (animated)
2. Compliance findings with severity, framework, and control references
3. Downloadable audit evidence Markdown report
4. Score card with grade (A–F)

## Agent Pipeline

| Agent | Role |
|-------|------|
| **PlannerAgent** | Enumerates compliance surfaces (MRs, pipelines, issues, settings) |
| **ScannerAgent** | Scans each surface for SOC2/GDPR violations, returns structured findings |
| **AnalyzerAgent** | Cross-references findings against control frameworks, calculates risk score |
| **ReporterAgent** | Generates audit-ready evidence bundle (Markdown + JSON) |

## Compliance Frameworks

- **SOC2 Trust Services Criteria** — CC6.1 (access control), CC7.2 (change management), CC8.1 (risk assessment)
- **GDPR** — Art. 5 (data minimization), Art. 30 (records of processing), Art. 32 (security measures)
- **HIPAA** — §164.308 (administrative safeguards) *(roadmap)*

## Repo Structure

```
compliance-autopilot/
├── frontend/          # Next.js 14 app (deployed to Vercel)
│   ├── src/app/       # App router pages + API routes
│   └── src/components/# ComplianceDashboard, ScanForm
├── backend/           # FastAPI backend (optional)
│   └── main.py
└── agent/             # GitLab Duo Agent scaffold
```
