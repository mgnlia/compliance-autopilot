"""Repository analyzer — fetches and structures repo content for compliance scanning."""

from __future__ import annotations

import base64
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import gitlab
from gitlab.v4.objects import Project


@dataclass
class RepoFile:
    """Represents a file in the repository."""

    path: str
    content: str
    size: int = 0
    last_modified: str = ""


@dataclass
class MergeRequestInfo:
    """Summarized MR data for compliance analysis."""

    iid: int
    title: str
    author: str
    approvers: list[str]
    approver_count: int
    merged_at: str | None
    has_ci_passed: bool
    source_branch: str
    target_branch: str


@dataclass
class RepoSnapshot:
    """Complete snapshot of a repository for compliance analysis."""

    project_path: str
    default_branch: str
    files: dict[str, RepoFile] = field(default_factory=dict)
    ci_config: dict[str, Any] = field(default_factory=dict)
    recent_mrs: list[MergeRequestInfo] = field(default_factory=list)
    branch_rules: dict[str, Any] = field(default_factory=dict)
    project_settings: dict[str, Any] = field(default_factory=dict)
    scanned_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def get_file_content(self, path: str) -> str | None:
        """Return file content or None if not found."""
        f = self.files.get(path)
        return f.content if f else None

    def has_file(self, path: str) -> bool:
        """Check if a file exists (exact or glob-style)."""
        if path in self.files:
            return True
        # Simple wildcard: check if any file matches pattern
        if "*" in path:
            prefix = path.split("*")[0]
            return any(p.startswith(prefix) for p in self.files)
        return False

    def search_content(self, pattern: str, file_extensions: list[str] | None = None) -> list[tuple[str, int, str]]:
        """Search for a regex pattern across repo files.

        Returns list of (file_path, line_number, line_content).
        """
        results: list[tuple[str, int, str]] = []
        regex = re.compile(pattern, re.IGNORECASE)
        for path, repo_file in self.files.items():
            if file_extensions:
                if not any(path.endswith(ext) for ext in file_extensions):
                    continue
            for i, line in enumerate(repo_file.content.splitlines(), start=1):
                if regex.search(line):
                    results.append((path, i, line.strip()))
        return results


class RepoAnalyzer:
    """Fetches repository data from GitLab for compliance scanning."""

    # File paths to always fetch
    PRIORITY_FILES = [
        "README.md",
        "SECURITY.md",
        ".github/SECURITY.md",
        "CODE_OF_CONDUCT.md",
        "CONTRIBUTING.md",
        "CHANGELOG.md",
        "PRIVACY.md",
        "LICENSE",
        ".gitlab-ci.yml",
        ".gitlab/ci/",
        "docker-compose.yml",
        "Dockerfile",
        "renovate.json",
        ".dependabot/config.yml",
        ".dependabot/dependabot.yml",
        "sonar-project.properties",
        "SBOM.json",
        "docs/",
        "compliance/",
        "infrastructure/",
    ]

    # Max file size to fetch (50KB)
    MAX_FILE_SIZE = 50_000

    def __init__(self, gl: gitlab.Gitlab, project_path: str) -> None:
        self.gl = gl
        self.project_path = project_path
        self._project: Project | None = None

    @property
    def project(self) -> Project:
        if self._project is None:
            self._project = self.gl.projects.get(self.project_path)
        return self._project

    def analyze(self, max_files: int = 200) -> RepoSnapshot:
        """Build a complete repo snapshot for compliance analysis."""
        snapshot = RepoSnapshot(
            project_path=self.project_path,
            default_branch=self.project.default_branch or "main",
        )

        # Fetch project settings
        snapshot.project_settings = self._get_project_settings()

        # Fetch branch protection rules
        snapshot.branch_rules = self._get_branch_rules(snapshot.default_branch)

        # Fetch repository files
        self._fetch_files(snapshot, max_files)

        # Fetch recent MRs
        snapshot.recent_mrs = self._get_recent_mrs(limit=50)

        return snapshot

    def _get_project_settings(self) -> dict[str, Any]:
        """Extract relevant project settings."""
        p = self.project
        return {
            "visibility": p.visibility,
            "merge_method": p.merge_method,
            "only_allow_merge_if_pipeline_succeeds": p.only_allow_merge_if_pipeline_succeeds,
            "only_allow_merge_if_all_discussions_are_resolved": p.only_allow_merge_if_all_discussions_are_resolved,
            "approvals_before_merge": getattr(p, "approvals_before_merge", 0),
            "security_and_compliance_enabled": getattr(p, "security_and_compliance_enabled", False),
            "container_registry_enabled": getattr(p, "container_registry_enabled", False),
            "packages_enabled": getattr(p, "packages_enabled", False),
        }

    def _get_branch_rules(self, branch: str) -> dict[str, Any]:
        """Get branch protection rules for the default branch."""
        try:
            protected = self.project.protectedbranches.get(branch)
            return {
                "name": protected.name,
                "push_access_levels": protected.push_access_levels,
                "merge_access_levels": protected.merge_access_levels,
                "allow_force_push": protected.allow_force_push,
                "code_owner_approval_required": getattr(protected, "code_owner_approval_required", False),
            }
        except Exception:
            return {"name": branch, "protected": False}

    def _fetch_files(self, snapshot: RepoSnapshot, max_files: int) -> None:
        """Fetch relevant files from the repository."""
        try:
            all_items = self.project.repository_tree(
                recursive=True,
                all=True,
                per_page=500,
            )
        except Exception:
            return

        # Score files by relevance
        scored: list[tuple[float, str]] = []
        for item in all_items:
            if item["type"] != "blob":
                continue
            path = item["path"]
            score = self._relevance_score(path)
            if score > 0:
                scored.append((score, path))

        scored.sort(reverse=True)

        for _, path in scored[:max_files]:
            content = self._fetch_file(path)
            if content is not None:
                snapshot.files[path] = RepoFile(
                    path=path,
                    content=content,
                    size=len(content),
                )

    def _relevance_score(self, path: str) -> float:
        """Score a file path by compliance relevance (higher = more relevant)."""
        path_lower = path.lower()

        # Skip binary/build artifacts
        skip_extensions = [".png", ".jpg", ".gif", ".ico", ".woff", ".ttf", ".eot", ".svg",
                           ".min.js", ".min.css", ".lock", ".sum", ".mod"]
        if any(path_lower.endswith(ext) for ext in skip_extensions):
            return 0.0

        score = 0.1  # Base score for any text file

        # High-value compliance files
        high_value = [
            "security", "privacy", "compliance", "gdpr", "soc2", "audit",
            "incident", "breach", "dpia", "ropa", "governance", "policy",
            ".gitlab-ci", "ci.yml", "pipeline", "workflow",
            "dockerfile", "docker-compose",
            "changelog", "code_of_conduct", "contributing",
            "renovate", "dependabot",
        ]
        for keyword in high_value:
            if keyword in path_lower:
                score += 2.0
                break

        # Infrastructure and config
        infra_keywords = ["infrastructure", "terraform", "ansible", "helm", "k8s", "kubernetes",
                          "iam", "rbac", "access", "auth", "tls", "ssl", "cert"]
        for keyword in infra_keywords:
            if keyword in path_lower:
                score += 1.5
                break

        # Documentation
        if path_lower.startswith("docs/") or path_lower.endswith(".md"):
            score += 0.5

        # Root-level files are important
        if "/" not in path:
            score += 1.0

        return score

    def _fetch_file(self, path: str) -> str | None:
        """Fetch a single file's content."""
        try:
            f = self.project.files.get(file_path=path, ref=self.project.default_branch)
            if f.size > self.MAX_FILE_SIZE:
                return f"[File too large: {f.size} bytes — truncated]\n" + base64.b64decode(f.content).decode("utf-8", errors="replace")[:2000]
            return base64.b64decode(f.content).decode("utf-8", errors="replace")
        except Exception:
            return None

    def _get_recent_mrs(self, limit: int = 50) -> list[MergeRequestInfo]:
        """Fetch recent merged MRs with approval data."""
        mrs = []
        try:
            recent = self.project.mergerequests.list(
                state="merged",
                order_by="updated_at",
                sort="desc",
                per_page=limit,
            )
            for mr in recent:
                try:
                    approvals = mr.approvals.get()
                    approved_by = [a["user"]["username"] for a in approvals.approved_by]
                except Exception:
                    approved_by = []

                mrs.append(MergeRequestInfo(
                    iid=mr.iid,
                    title=mr.title,
                    author=mr.author["username"],
                    approvers=approved_by,
                    approver_count=len(approved_by),
                    merged_at=mr.merged_at,
                    has_ci_passed=True,  # If merged, CI likely passed
                    source_branch=mr.source_branch,
                    target_branch=mr.target_branch,
                ))
        except Exception:
            pass
        return mrs
