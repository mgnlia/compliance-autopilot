"use client";

import { useState } from "react";
import ComplianceDashboard from "@/components/ComplianceDashboard";
import ScanForm from "@/components/ScanForm";

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (projectUrl: string, gitlabToken?: string) => {
    setLoading(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_url: projectUrl, gitlab_token: gitlabToken }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch {
      setScanResult(null);
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
              Claude-powered GitLab compliance agent · SOC2 / GDPR drift detection · Real GitLab API data
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
              GitLab AI Hackathon
            </span>
            <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Powered by Claude
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
            <p className="text-sm">Claude agents scanning your GitLab project via API…</p>
          </div>
        )}

        {scanResult && <ComplianceDashboard result={scanResult} />}

        {!scanResult && !loading && <DemoPreview onScan={handleScan} />}
      </div>
    </main>
  );
}

function DemoPreview({ onScan }: { onScan: (url: string, token?: string) => void }) {
  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { icon: "🔍", title: "Real GitLab API Scan", desc: "Calls GitLab REST API v4 to fetch branch protection, MR approvals, CI variables, and audit events." },
        { icon: "🤖", title: "Claude Analysis", desc: "4 specialized agents (Planner, Scanner, Analyzer, Reporter) analyze real project data for SOC2/GDPR violations." },
        { icon: "📋", title: "Audit Evidence", desc: "Generates structured Markdown evidence reports based on actual findings — ready for auditors." },
      ].map((f) => (
        <div key={f.title} className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="text-3xl mb-3">{f.icon}</div>
          <h3 className="font-semibold text-white mb-1">{f.title}</h3>
          <p className="text-gray-400 text-sm">{f.desc}</p>
        </div>
      ))}
      <div className="md:col-span-3 rounded-2xl bg-white/5 border border-white/10 p-6 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">Try with a public GitLab project</p>
          <p className="text-gray-400 text-sm">Scans real public project data via GitLab API · No token required for public repos</p>
        </div>
        <button
          onClick={() => onScan("https://gitlab.com/gitlab-org/gitlab-runner")}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Scan gitlab-runner →
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
  data_source?: string;
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
