"use client";

import { useState } from "react";

interface Props {
  onScan: (url: string, token?: string) => void;
  loading: boolean;
}

export default function ScanForm({ onScan, loading }: Props) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onScan(url.trim(), token.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://gitlab.com/your-org/your-project"
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? "Scanning…" : "🔍 Scan Project"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type={showToken ? "text" : "password"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="GitLab Personal Access Token (optional — enables full API scan)"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all text-sm"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
          >
            {showToken ? "hide" : "show"}
          </button>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          🔒 Token stays in your browser
        </span>
      </div>

      <p className="text-xs text-gray-600">
        Without a token: Claude analyzes publicly visible project data. With a token (read_api scope): full scan of branch protection, MR approvals, CI variables, and audit events.
      </p>
    </form>
  );
}
