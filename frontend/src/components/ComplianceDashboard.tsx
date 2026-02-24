"use client";

import { useState } from "react";
import type { ScanResult, Finding, AgentLog } from "@/app/page";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low: "text-green-400 bg-green-500/10 border-green-500/30",
};

const SEVERITY_ICON: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
};

function gradeColor(grade: string) {
  if (grade === "A") return "text-green-400";
  if (grade === "B") return "text-lime-400";
  if (grade === "C") return "text-yellow-400";
  if (grade === "D") return "text-orange-400";
  return "text-red-400";
}

export default function ComplianceDashboard({ result }: { result: ScanResult }) {
  const [tab, setTab] = useState<"findings" | "agents" | "evidence">("findings");
  const [expanded, setExpanded] = useState<string | null>(null);

  const critCount = result.findings.filter((f) => f.severity === "critical").length;
  const highCount = result.findings.filter((f) => f.severity === "high").length;

  return (
    <div className="mt-10 space-y-6">
      {/* Score Card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-white/10 bg-white/5 shrink-0">
          <span className={`text-5xl font-bold ${gradeColor(result.grade)}`}>{result.grade}</span>
          <span className="text-gray-400 text-sm">{result.score}/100</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-lg mb-1 break-all">{result.project_url}</p>
          <p className="text-gray-400 text-sm mb-4">Scanned {new Date(result.scanned_at).toLocaleString()}</p>
          <div className="flex gap-3 flex-wrap">
            <Pill label={`${critCount} Critical`} color="bg-red-500/20 text-red-400 border-red-500/30" />
            <Pill label={`${highCount} High`} color="bg-orange-500/20 text-orange-400 border-orange-500/30" />
            <Pill label={`${result.findings.length} Total Findings`} color="bg-white/10 text-gray-300 border-white/10" />
            <Pill label={`${result.agents_log.length} Agents Run`} color="bg-purple-500/20 text-purple-400 border-purple-500/30" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {(["findings", "agents", "evidence"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${
              tab === t
                ? "bg-white/10 text-white border-b-2 border-orange-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "findings" && `🔍 Findings (${result.findings.length})`}
            {t === "agents" && `🤖 Agent Log`}
            {t === "evidence" && `📋 Evidence`}
          </button>
        ))}
      </div>

      {/* Findings Tab */}
      {tab === "findings" && (
        <div className="space-y-3">
          {result.findings.map((f) => (
            <div
              key={f.id}
              className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-xl">{SEVERITY_ICON[f.severity]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLOR[f.severity]}`}>
                      {f.severity.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10">
                      {f.framework} · {f.control}
                    </span>
                  </div>
                  <p className="text-white font-medium mt-1 truncate">{f.title}</p>
                </div>
                <span className="text-gray-500 text-lg">{expanded === f.id ? "▲" : "▼"}</span>
              </button>
              {expanded === f.id && (
                <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-gray-300 text-sm">{f.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Remediation</p>
                    <p className="text-gray-300 text-sm">{f.remediation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Artifact</p>
                    <code className="text-xs bg-white/10 px-2 py-1 rounded text-orange-300">{f.artifact}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Agent Log Tab */}
      {tab === "agents" && (
        <div className="space-y-3">
          {result.agents_log.map((log, i) => (
            <AgentCard key={i} log={log} index={i} />
          ))}
        </div>
      )}

      {/* Evidence Tab */}
      {tab === "evidence" && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-white font-medium">Audit Evidence Report</p>
            <button
              onClick={() => {
                const blob = new Blob([result.evidence_markdown], { type: "text/markdown" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "compliance-evidence.md";
                a.click();
              }}
              className="px-4 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm hover:bg-orange-500/30 transition-colors"
            >
              ⬇ Download .md
            </button>
          </div>
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-4 overflow-auto max-h-96">
            {result.evidence_markdown}
          </pre>
        </div>
      )}
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs border ${color}`}>{label}</span>
  );
}

function AgentCard({ log, index }: { log: AgentLog; index: number }) {
  const icons = ["🧠", "🔍", "⚖️", "📝"];
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex gap-4 items-start">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
        {icons[index % icons.length]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-medium text-sm">{log.agent}</span>
          <span className="text-xs text-gray-500">{log.duration_ms}ms</span>
        </div>
        <p className="text-gray-400 text-xs mt-0.5">{log.action}</p>
        <p className="text-gray-300 text-sm mt-1">{log.result}</p>
      </div>
    </div>
  );
}
