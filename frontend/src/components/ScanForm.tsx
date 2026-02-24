"use client";

import { useState } from "react";

interface Props {
  onScan: (url: string) => void;
  loading: boolean;
}

export default function ScanForm({ onScan, loading }: Props) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onScan(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://gitlab.com/your-org/your-project"
        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading ? "Scanning…" : "🔍 Scan Project"}
      </button>
    </form>
  );
}
