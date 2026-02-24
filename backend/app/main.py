"""
Compliance Autopilot — FastAPI Backend
GitLab Duo Agent Hackathon submission
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.scanner import ComplianceScanner
from app.models import ScanRequest, ScanResult, ControlStatus

app = FastAPI(
    title="Compliance Autopilot",
    description="GitLab Duo Agent for SOC2/GDPR compliance drift detection",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory scan store (use Redis/DB in production)
_scans: dict[str, dict[str, Any]] = {}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "compliance-autopilot",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/")
async def root():
    return {
        "service": "Compliance Autopilot",
        "description": "GitLab Duo Agent for SOC2/GDPR compliance drift detection",
        "endpoints": ["/health", "/scan", "/scans/{scan_id}", "/frameworks"],
    }


@app.get("/frameworks")
async def list_frameworks():
    """List supported compliance frameworks."""
    return {
        "frameworks": [
            {
                "id": "soc2",
                "name": "SOC2 Type II",
                "description": "Trust Services Criteria — CC6, CC7, CC8, CC9, A1",
                "controls_count": 15,
            },
            {
                "id": "gdpr",
                "name": "GDPR",
                "description": "General Data Protection Regulation — Articles 5, 13, 17, 25, 32, 33",
                "controls_count": 12,
            },
        ]
    }


@app.post("/scan")
async def start_scan(req: ScanRequest, background_tasks: BackgroundTasks):
    """Start a compliance scan for a GitLab project."""
    scan_id = str(uuid.uuid4())[:8]
    _scans[scan_id] = {
        "scan_id": scan_id,
        "status": "running",
        "project_path": req.project_path,
        "frameworks": req.frameworks,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "result": None,
    }

    background_tasks.add_task(_run_scan, scan_id, req)
    return {"scan_id": scan_id, "status": "running", "message": f"Scan started for {req.project_path}"}


async def _run_scan(scan_id: str, req: ScanRequest):
    """Background task: run the full compliance scan."""
    try:
        scanner = ComplianceScanner(
            gitlab_url=req.gitlab_url or os.getenv("GITLAB_URL", "https://gitlab.com"),
            gitlab_token=req.gitlab_token or os.getenv("GITLAB_TOKEN", ""),
            anthropic_key=os.getenv("ANTHROPIC_API_KEY", ""),
            use_mock=os.getenv("USE_MOCK", "true").lower() == "true",
        )
        result = await scanner.scan(
            project_path=req.project_path,
            frameworks=req.frameworks,
        )
        _scans[scan_id]["status"] = "completed"
        _scans[scan_id]["result"] = result
        _scans[scan_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
    except Exception as e:
        _scans[scan_id]["status"] = "failed"
        _scans[scan_id]["error"] = str(e)
        _scans[scan_id]["completed_at"] = datetime.now(timezone.utc).isoformat()


@app.get("/scans/{scan_id}")
async def get_scan(scan_id: str):
    """Get scan result by ID."""
    if scan_id not in _scans:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    return _scans[scan_id]


@app.get("/scans")
async def list_scans():
    """List all scans."""
    return {"scans": list(_scans.values())}


@app.post("/demo-scan")
async def demo_scan():
    """Run a demo scan with mock data — no credentials required."""
    scanner = ComplianceScanner(
        gitlab_url="https://gitlab.com",
        gitlab_token="",
        anthropic_key="",
        use_mock=True,
    )
    result = await scanner.scan(
        project_path="demo/example-project",
        frameworks=["soc2", "gdpr"],
    )
    return result
