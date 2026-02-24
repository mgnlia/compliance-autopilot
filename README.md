# Compliance Autopilot — GitLab Duo Agent

> SOC2/GDPR drift detection + audit evidence generation powered by Claude via Anthropic API.

Built for the [GitLab AI Hackathon](https://gitlab.com/gitlab-org/gitlab/-/issues) — $65K prize pool, deadline Mar 25.

## What it does

**Compliance Autopilot** is a GitLab Duo Agent that continuously monitors your GitLab project for compliance drift and auto-generates audit-ready evidence:

- 🔍 **Drift Detection** — scans MRs, pipelines, issues, and project settings for SOC2/GDPR violations
- 🤖 **Claude Analysis** — uses Claude (Anthropic API) to reason about compliance posture and surface risks
- 📋 **Audit Evidence** — generates structured evidence reports (Markdown + JSON) ready for auditors
- 🚨 **Real-time Alerts** — dashboard shows compliance score, open drift items, and remediation steps

## Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS (Vercel)
- **Backend:** FastAPI + Python (Railway / mock mode)
- **AI:** Claude via Anthropic API
- **Integration:** GitLab REST API v4

## Quick Start

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (mock mode — no API keys needed)
cd backend
uv sync
uv run uvicorn main:app --reload
```

## Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MOCK_MODE=true

# Backend (.env)
ANTHROPIC_API_KEY=your_key_here
GITLAB_TOKEN=your_token_here
MOCK_MODE=true
```

## Demo

Mock mode is enabled by default — no API keys required to run the demo.
