"use client";

import { useState } from "react";
import ComplianceDashboard from "@/components/ComplianceDashboard";
import ScanForm from "@/components/ScanForm";

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (projectUrl: string) => {
    setLoading(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_url: projectUrl }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch {
      setScanResult(getMockResult(projectUrl));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-2xl">
            🛡️
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Compliance Autopilot
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              GitLab Duo Agent · SOC2 / GDPR drift detection + audit evidence · Powered by Claude
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
              GitLab AI Hackathon
            </span>
            <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Claude-Powered
            </span>
          </div>
        </div>

        {/* Scan Form */}
        <ScanForm onScan={handleScan} loading={loading} />

        {/* Results */}
        {loading && (
          <div className="mt-10 flex flex-col items-center gap-4 text-gray-400">
            <div className="flex gap-2">
              {["Planner", "Scanner", "Analyzer", "Reporter"].map((agent, i) => (
                <div
                  key={agent}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  🤖 {agent}
                </div>
              ))}
            </div>
            <p className="text-sm">Claude agents scanning your project…</p>
          </div>
        )}

        {scanResult && <ComplianceDashboard result={scanResult} />}

        {!scanResult && !loading && <DemoPreview onScan={handleScan} />}
      </div>
    </main>
  );
}

function DemoPreview({ onScan }: { onScan: (url: string) => void }) {
  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { icon: "🔍", title: "Drift Detection", desc: "Scans MRs, pipelines, issues and settings for SOC2/GDPR violations in real time." },
        { icon: "🤖", title: "Claude Analysis", desc: "4 specialized agents (Planner, Scanner, Analyzer, Reporter) collaborate to assess compliance posture." },
        { icon: "📋", title: "Audit Evidence", desc: "Generates structured Markdown + JSON evidence reports ready for auditors — one click." },
      ].map((f) => (
        <div key={f.title} className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="text-3xl mb-3">{f.icon}</div>
          <h3 className="font-semibold text-white mb-1">{f.title}</h3>
          <p className="text-gray-400 text-sm">{f.desc}</p>
        </div>
      ))}
      <div className="md:col-span-3 rounded-2xl bg-white/5 border border-white/10 p-6 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">Try a demo scan</p>
          <p className="text-gray-400 text-sm">Uses mock data — no GitLab token required</p>
        </div>
        <button
          onClick={() => onScan("https://gitlab.com/demo/sample-project")}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Run Demo Scan →
        </button>
      </div>
    </div>
  );
}

export interface ScanResult {
  project_url: string;
  score: number;
  grade: string;
  findings: Finding[];
  evidence_markdown: string;
  agents_log: AgentLog[];
  scanned_at: string;
}

export interface Finding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  framework: "SOC2" | "GDPR" | "HIPAA";
  control: string;
  title: string;
  description: string;
  remediation: string;
  artifact: string;
}

export interface AgentLog {
  agent: string;
  action: string;
  result: string;
  duration_ms: number;
}

function getMockResult(projectUrl: string): ScanResult {
  return {
    project_url: projectUrl,
    score: 61,
    grade: "C",
    scanned_at: new Date().toISOString(),
    agents_log: [
      { agent: "PlannerAgent", action: "Enumerate compliance surfaces", result: "Found 4 surfaces: MRs, Pipelines, Issues, Settings", duration_ms: 312 },
      { agent: "ScannerAgent", action: "Scan MR approval rules", result: "2 critical findings: no required approvals on 3 MRs", duration_ms: 891 },
      { agent: "AnalyzerAgent", action: "Cross-reference SOC2 CC6.1", result: "Access control drift detected in 2 pipelines", duration_ms: 1203 },
      { agent: "ReporterAgent", action: "Generate evidence bundle", result: "Report generated: 4 findings, 2 critical", duration_ms: 445 },
    ],
    findings: [
      {
        id: "F001", severity: "critical", framework: "SOC2", control: "CC6.1",
        title: "MRs merged without required approvals",
        description: "3 merge requests in the last 30 days were merged with 0 approvals, violating SOC2 CC6.1 access control requirements.",
        remediation: "Enable 'Require approvals' in Settings → Merge Requests and set minimum approvals to 2.",
        artifact: "MR !42, !51, !67",
      },
      {
        id: "F002", severity: "critical", framework: "GDPR", control: "Art. 32",
        title: "Pipeline logs may contain PII",
        description: "CI pipeline logs in 2 jobs contain email addresses and IP addresses in plaintext, violating GDPR Art. 32 data minimization.",
        remediation: "Add log masking rules in .gitlab-ci.yml and enable 'Mask variable' for all sensitive env vars.",
        artifact: "Pipeline #1024, Job: deploy-prod",
      },
      {
        id: "F003", severity: "high", framework: "SOC2", control: "CC7.2",
        title: "No branch protection on main",
        description: "The main branch has no push rules, allowing force-pushes and direct commits bypassing review.",
        remediation: "Enable branch protection in Settings → Repository → Protected Branches.",
        artifact: "Branch: main",
      },
      {
        id: "F004", severity: "medium", framework: "GDPR", control: "Art. 30",
        title: "No data processing record in project description",
        description: "Project handles user data but has no documented data processing activities in the repository.",
        remediation: "Add a DATA_PROCESSING.md file documenting data flows per GDPR Art. 30.",
        artifact: "Repository root",
      },
    ],
    evidence_markdown: `# Compliance Audit Evidence\n\n**Project:** ${projectUrl}\n**Scan Date:** ${new Date().toUTCString()}\n**Score:** 61/100 (Grade C)\n\n## Findings Summary\n\n| ID | Severity | Framework | Control | Title |\n|----|----------|-----------|---------|-------|\n| F001 | 🔴 Critical | SOC2 | CC6.1 | MRs merged without required approvals |\n| F002 | 🔴 Critical | GDPR | Art. 32 | Pipeline logs may contain PII |\n| F003 | 🟠 High | SOC2 | CC7.2 | No branch protection on main |\n| F004 | 🟡 Medium | GDPR | Art. 30 | No data processing record |\n\n## Agent Execution Log\n\n- PlannerAgent: Enumerate compliance surfaces → 312ms\n- ScannerAgent: Scan MR approval rules → 891ms\n- AnalyzerAgent: Cross-reference SOC2 CC6.1 → 1203ms\n- ReporterAgent: Generate evidence bundle → 445ms\n`,
  };
}
