"use client";

import { useState } from "react";

export default function ProposalSection({ 
  projectId, 
  initialProposal 
}: { 
  projectId: string; 
  initialProposal: string | null;
}) {
  const [proposal, setProposal] = useState(initialProposal || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/generate-proposal`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate proposal");
      }

      setProposal(data.proposalText);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate proposal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">AI Project Proposal</h2>
          <p className="text-sm text-slate-500 mt-1">Generate a professional pitch for this client instantly.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition cursor-pointer flex items-center gap-2"
        >
          {loading ? "✨ Generating..." : "✨ Generate AI Proposal"}
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <div className="relative">
        <textarea
          readOnly
          value={proposal}
          placeholder="Your AI-generated proposal will appear here..."
          className="w-full h-64 p-4 text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none resize-none leading-relaxed"
        />
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
            <span className="text-indigo-600 font-medium animate-pulse">Consulting Gemini LLM...</span>
          </div>
        )}
      </div>
    </div>
  );
}
