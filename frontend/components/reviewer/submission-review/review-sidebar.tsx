"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { GithubMarkdown } from "@/components/ui/github-markdown"
import type { SubmissionDetails } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

// =============================================================================
// Abstract Card Component
// =============================================================================

interface AbstractCardProps {
  submission: SubmissionDetails
}

export function AbstractCard({ submission }: AbstractCardProps) {
  const { t } = useTranslation()
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h3 className="font-bold text-sm text-[#1B3C53] tracking-tight uppercase">{t("runtime.components.reviewer.submission-review.review-sidebar.text_abstract")}</h3>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mb-6">{submission.abstract}</p>
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t("runtime.components.reviewer.submission-review.review-sidebar.text_keywords")}{" "}</span>
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
              {t("runtime.components.reviewer.submission-review.review-sidebar.text_supplementary_material")}{" "}</span>
            <div className="mt-2">
              <a
                href="#"
                className="flex items-center gap-2 text-xs text-[#2563eb] hover:underline"
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "16px",
                    width: "16px",
                    height: "16px",
                    maxWidth: "16px",
                    maxHeight: "16px",
                    minWidth: "16px",
                    minHeight: "16px",
                    lineHeight: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transform: "none",
                    boxSizing: "border-box",
                  }}
                >
                  folder_zip
                </span>
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
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showViewAnalysis, setShowViewAnalysis] = useState(false)
  const [analysisInput, setAnalysisInput] = useState("")
  const [analysisResult, setAnalysisResult] = useState("")

  useEffect(() => {
    if (isAnalyzing) {
      const timer = setTimeout(() => {
        setShowViewAnalysis(true)
        // Mock analysis result - replace with actual API call
        setAnalysisResult(
          `# Analysis Results\n\n## Key Contributions\n\n1. **Novel Methodology**: The paper introduces a new approach to solving the problem.\n2. **Experimental Validation**: Comprehensive experiments demonstrate the effectiveness.\n3. **Theoretical Analysis**: Strong theoretical foundation with proofs.\n\n## Potential Issues\n\n1. **Limited Dataset**: The evaluation uses a relatively small dataset.\n2. **Comparison**: Could benefit from more baseline comparisons.\n3. **Reproducibility**: Some implementation details are missing.\n\n## Overall Assessment\n\nThe paper presents a solid contribution with clear methodology and experimental validation. The main areas for improvement are dataset diversity and more comprehensive comparisons.`,
        )
      }, 5000)

      return () => clearTimeout(timer)
    } else {
      setShowViewAnalysis(false)
      setAnalysisResult("")
    }
  }, [isAnalyzing])

  const handleStartAnalysis = () => {
    if (!analysisInput.trim()) return
    setIsDialogOpen(false)
    setIsAnalyzing(true)
    // TODO: Start actual analysis process
  }

  const handleCancelAnalysis = () => {
    setIsAnalyzing(false)
    setAnalysisInput("")
    setShowViewAnalysis(false)
    setAnalysisResult("")
  }

  const handleCheckConfig = () => {
    setIsDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    if (!isAnalyzing) {
      setIsDialogOpen(open)
    }
  }

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="material-symbols-outlined text-6xl text-indigo-600">auto_awesome</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-[11px] text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
              <span
                className="material-symbols-outlined text-indigo-600"
                style={{
                  fontVariationSettings: '"FILL" 1',
                  fontSize: "16px",
                  width: "16px",
                  height: "16px",
                  maxWidth: "16px",
                  maxHeight: "16px",
                  minWidth: "16px",
                  minHeight: "16px",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: "none",
                  boxSizing: "border-box",
                }}
              >
                auto_awesome
              </span>
              {t("runtime.components.reviewer.submission-review.review-sidebar.text_ai_assistant")}{" "}</h3>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-200 text-indigo-800 uppercase">
              {t("runtime.components.reviewer.submission-review.review-sidebar.text_beta")}{" "}</span>
          </div>
          {!isAnalyzing ? (
            <>
              <p className="text-[10px] text-indigo-800 mb-3 leading-relaxed">
                {t("runtime.components.reviewer.submission-review.review-sidebar.text_pre_analyze_the_pdf_for_key")}{" "}</p>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="w-full h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "16px",
                    width: "16px",
                    height: "16px",
                    maxWidth: "16px",
                    maxHeight: "16px",
                    minWidth: "16px",
                    minHeight: "16px",
                    lineHeight: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transform: "none",
                    boxSizing: "border-box",
                  }}
                >
                  analytics
                </span>
                {t("runtime.components.reviewer.submission-review.review-sidebar.text_generate_analysis")}{" "}</button>
            </>
          ) : (
            <>
              <p className="text-[10px] text-indigo-800 mb-3 leading-relaxed">
                {showViewAnalysis ? "Analysis finished, please check the report" : "Analyzing..."}
              </p>
              <div className="space-y-2">
                {showViewAnalysis ? (
                  <button
                    onClick={() => setIsAnalysisDialogOpen(true)}
                    className="w-full h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "16px",
                        width: "16px",
                        height: "16px",
                        maxWidth: "16px",
                        maxHeight: "16px",
                        minWidth: "16px",
                        minHeight: "16px",
                        lineHeight: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transform: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      visibility
                    </span>
                    {t("runtime.components.reviewer.submission-review.review-sidebar.text_view_analysis")}{" "}</button>
                ) : (
                  <>
                    <button
                      onClick={handleCheckConfig}
                      className="w-full h-8 px-3 bg-indigo-300 hover:bg-indigo-400 text-white text-[10px] font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "16px",
                          width: "16px",
                          height: "16px",
                          maxWidth: "16px",
                          maxHeight: "16px",
                          minWidth: "16px",
                          minHeight: "16px",
                          lineHeight: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transform: "none",
                          boxSizing: "border-box",
                        }}
                      >
                        settings
                      </span>
                      {t("runtime.components.reviewer.submission-review.review-sidebar.text_check_config")}{" "}</button>
                    <button
                      onClick={handleCancelAnalysis}
                      className="w-full h-8 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      {t("runtime.components.reviewer.submission-review.review-sidebar.text_cancel")}{" "}</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("runtime.components.reviewer.submission-review.review-sidebar.text_ai_analysis_configuration")}</DialogTitle>
            <DialogDescription>
              {isAnalyzing
                ? "Analysis is in progress. You can view your configuration below."
                : "Enter your prompt or notes for the automated analysis process."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={analysisInput}
              onChange={(e) => setAnalysisInput(e.target.value)}
              placeholder={t("runtime.components.reviewer.submission-review.review-sidebar.placeholder_enter_your_analysis_prompt_or_notes")}
              className="min-h-[120px]"
              disabled={isAnalyzing}
            />
          </div>
          <DialogFooter>
            {isAnalyzing ? (
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                {t("runtime.components.reviewer.submission-review.review-sidebar.text_close")}{" "}</button>
            ) : (
              <>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  {t("runtime.components.reviewer.submission-review.review-sidebar.text_cancel")}{" "}</button>
                <button
                  onClick={handleStartAnalysis}
                  disabled={!analysisInput.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("runtime.components.reviewer.submission-review.review-sidebar.text_start")}{" "}</button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t("runtime.components.reviewer.submission-review.review-sidebar.text_ai_analysis_results")}</DialogTitle>
            <DialogDescription>
              {t("runtime.components.reviewer.submission-review.review-sidebar.text_analysis_based_on_your_input")}{analysisInput}{t("runtime.components.reviewer.submission-review.review-sidebar.text_text")}{" "}</DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-y-auto max-h-[60vh]">
            {analysisResult ? (
              <GithubMarkdown content={analysisResult} className="p-0" />
            ) : (
              <div className="text-slate-600 dark:text-slate-400 text-sm">
                {t("runtime.components.reviewer.submission-review.review-sidebar.text_analysis_is_still_processing")}{" "}</div>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsAnalysisDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              {t("runtime.components.reviewer.submission-review.review-sidebar.text_close")}{" "}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// =============================================================================
// Review Guidelines Card Component
// =============================================================================

export function ReviewGuidelinesCard() {
  const { t } = useTranslation()
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "16px",
            width: "16px",
            height: "16px",
            maxWidth: "16px",
            maxHeight: "16px",
            minWidth: "16px",
            minHeight: "16px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
        >
          info
        </span>
        {t("runtime.components.reviewer.submission-review.review-sidebar.text_scoring_guide")}{" "}</h4>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          </div>
          <span className="text-[9px] text-slate-600">{t("runtime.components.reviewer.submission-review.review-sidebar.text_8_10_strong_contribution_recommend")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#84cc16]" />
            <span className="w-2 h-2 rounded-full bg-[#a3a3a3]" />
          </div>
          <span className="text-[9px] text-slate-600">{t("runtime.components.reviewer.submission-review.review-sidebar.text_5_7_acceptable_with_caveats")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
          </div>
          <span className="text-[9px] text-slate-600">{t("runtime.components.reviewer.submission-review.review-sidebar.text_1_4_significant_issues_present")}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <a href="#" className="text-[9px] text-[#2563eb] hover:underline font-medium">
          {t("runtime.components.reviewer.submission-review.review-sidebar.text_view_full_reviewer_guide_rarr")}{" "}</a>
      </div>
    </div>
  )
}
