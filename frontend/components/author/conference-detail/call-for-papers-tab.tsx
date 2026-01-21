import type { TabProps } from "./types"

export function CallForPapersTab({ conference }: TabProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="w-full space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Call for Papers</h2>
              {conference.submission_deadline && (
                <p className="text-slate-500 text-sm mt-1">
                  Submission Deadline:{" "}
                  {new Date(conference.submission_deadline).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                className="text-slate-500 hover:text-navy-900 p-2 rounded hover:bg-slate-100 transition-colors"
                title="Print"
              >
                <span className="material-symbols-outlined">print</span>
              </button>
              <button
                className="text-slate-500 hover:text-navy-900 p-2 rounded hover:bg-slate-100 transition-colors"
                title="Download PDF"
              >
                <span className="material-symbols-outlined">picture_as_pdf</span>
              </button>
              <button
                className="text-slate-500 hover:text-navy-900 p-2 rounded hover:bg-slate-100 transition-colors"
                title="Share"
              >
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
            {conference.call_for_paper_text ? (
              <div dangerouslySetInnerHTML={{ __html: conference.call_for_paper_text }} />
            ) : (
              <p className="mb-4 leading-relaxed">
                The {conference.name} promotes research and fosters scientific exchange between
                researchers, practitioners, scientists, students, and engineers. The conference will
                have a diverse technical track, student abstracts, poster sessions, invited
                speakers, tutorials, workshops, and exhibit and competition programs, all selected
                according to the highest reviewing standards.
              </p>
            )}

            {conference.configurations?.submission_format && (
              <>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mt-8 mb-4">
                  Submission Guidelines
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-5 mb-6">
                  <h4 className="font-bold text-navy-900 dark:text-white mb-2 text-sm uppercase tracking-wide">
                    Key Requirements
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {conference.configurations.maximum_pages && (
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-600 text-lg">
                          check_circle
                        </span>
                        <span>
                          Papers must be no longer than {conference.configurations.maximum_pages}{" "}
                          pages.
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-600 text-lg">
                        check_circle
                      </span>
                      <span>
                        Submissions must be in {conference.configurations.submission_format} format.
                      </span>
                    </li>
                    {conference.configurations.review_type === "double_blind" && (
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-red-500 text-lg">
                          cancel
                        </span>
                        <span>
                          Do not include author names or affiliations (double-blind review).
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Author Resources</h3>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <li>
              <a
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group h-full"
                href="#"
              >
                <div className="bg-blue-50 text-blue-600 p-2 rounded-md">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-900 dark:text-white group-hover:text-blue-700">
                    LaTeX Template
                  </p>
                  <p className="text-xs text-slate-500">Official style file</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-600">
                  download
                </span>
              </a>
            </li>
            <li>
              <a
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group h-full"
                href="#"
              >
                <div className="bg-red-50 text-red-600 p-2 rounded-md">
                  <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-900 dark:text-white group-hover:text-red-700">
                    Word Template
                  </p>
                  <p className="text-xs text-slate-500">.docx format</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-red-600">
                  download
                </span>
              </a>
            </li>
            <li>
              <a
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group h-full"
                href="#"
              >
                <div className="bg-green-50 text-green-600 p-2 rounded-md">
                  <span className="material-symbols-outlined text-xl">link</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-900 dark:text-white group-hover:text-green-700">
                    Submission Portal
                  </p>
                  <p className="text-xs text-slate-500">External CMT Link</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-green-600">
                  open_in_new
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
