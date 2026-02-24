"""Pydantic models for Compliance Autopilot."""

from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field


class ScanRequest(BaseModel):
    project_path: str = Field(..., description="GitLab project path, e.g. 'myorg/myrepo'")
    frameworks: list[str] = Field(default=["soc2", "gdpr"], description="Compliance frameworks to scan")
    gitlab_url: str | None = Field(None, description="GitLab instance URL (defaults to env GITLAB_URL)")
    gitlab_token: str | None = Field(None, description="GitLab PAT (defaults to env GITLAB_TOKEN)")


class ControlFinding(BaseModel):
    control_id: str
    control_name: str
    framework: str
    severity: Literal["HIGH", "MEDIUM", "LOW", "INFO"]
    status: Literal["PASS", "FAIL", "PARTIAL", "UNKNOWN"]
    description: str
    evidence: list[str] = []
    remediation: str = ""
    effort: Literal["LOW", "MEDIUM", "HIGH"] = "MEDIUM"


class FrameworkResult(BaseModel):
    framework: str
    framework_name: str
    score: float  # 0-100
    pass_count: int
    fail_count: int
    partial_count: int
    findings: list[ControlFinding]


class AIAnalysis(BaseModel):
    summary: str
    critical_gaps: list[str]
    quick_wins: list[str]
    estimated_remediation_days: int
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


class ScanResult(BaseModel):
    scan_id: str
    project_path: str
    scanned_at: str
    overall_score: float
    overall_risk: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    frameworks: list[FrameworkResult]
    ai_analysis: AIAnalysis
    total_findings: int
    critical_count: int
    high_count: int


class ControlStatus(BaseModel):
    control_id: str
    status: Literal["PASS", "FAIL", "PARTIAL", "UNKNOWN"]
    evidence: list[str] = []
    notes: str = ""
