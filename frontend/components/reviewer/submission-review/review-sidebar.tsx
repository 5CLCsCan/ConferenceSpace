"use client"

import type { SubmissionDetails } from "./types"

// =============================================================================
// Abstract Card Component
// =============================================================================

interface AbstractCardProps {
  submission: SubmissionDetails
}

export function AbstractCard({ submission }: AbstractCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h3 className="font-bold text-sm text-[#1B3C53] tracking-tight uppercase">Abstract</h3>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mb-6">{submission.abstract}</p>
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Keywords
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {submission.keywords.map((kw, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-md bg-slate-100 text-[10px] text-slate-600"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
        {submission.supplementaryMaterial && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Supplementary Material
            </span>
            <div className="mt-2">
              <a
                href="#"
                className="flex items-center gap-2 text-xs text-[#2563eb] hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">folder_zip</span>
                {submission.supplementaryMaterial.name} ({submission.supplementaryMaterial.size})
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// AI Assistant Card Component
// =============================================================================

export function AIAssistantCard() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined text-6xl text-indigo-600">auto_awesome</span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[11px] text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
            <span
              className="material-symbols-outlined text-indigo-600 text-[14px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              auto_awesome
            </span>
            AI Assistant
          </h3>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-200 text-indigo-800 uppercase">
            Beta
          </span>
        </div>
        <p className="text-[10px] text-indigo-800 mb-3 leading-relaxed">
          Pre-analyze the PDF for key contributions and potential issues.
        </p>
        <button className="w-full h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">analytics</span>
          Generate Analysis
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Review Guidelines Card Component
// =============================================================================

export function ReviewGuidelinesCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[14px]">info</span>
        Scoring Guide
      </h4>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          </div>
          <span className="text-[9px] text-slate-600">8-10: Strong contribution, recommend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#84cc16]" />
            <span className="w-2 h-2 rounded-full bg-[#a3a3a3]" />
          </div>
          <span className="text-[9px] text-slate-600">5-7: Acceptable with caveats</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
          </div>
          <span className="text-[9px] text-slate-600">1-4: Significant issues present</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <a href="#" className="text-[9px] text-[#2563eb] hover:underline font-medium">
          View full reviewer guide &rarr;
        </a>
      </div>
    </div>
  )
}
