import type { TabProps } from "./types"
import { MemberAvatar } from "./components/member-avatar"

export function CommitteeTab({ conference }: TabProps) {
  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-2">
          Organizing Committee
        </h2>
        <p className="text-slate-500 text-sm mb-8">Meet the team behind {conference.name}.</p>

        {/* General Chairs */}
        <div className="mb-10">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            General Chairs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {conference.chair ? (
              <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors bg-slate-50/50 dark:bg-slate-800/50">
                <MemberAvatar
                  name={conference.chair}
                  email={String(conference.primary_contact || conference.chair)}
                  size="lg"
                />
                <div>
                  <div className="font-bold text-navy-900 dark:text-white text-lg">
                    {conference.chair}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    No organization
                  </div>
                  <a
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    href={`mailto:${conference.chair || ""}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">mail</span>{" "}
                    {conference.chair || "contact@conference.org"}
                  </a>
                </div>
              </div>
            ) : null}

            {conference.co_chairs?.map((co, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors bg-slate-50/50 dark:bg-slate-800/50"
              >
                <MemberAvatar name={co} email={`${co}@conf.org`} size="lg" />
                <div>
                  <div className="font-bold text-navy-900 dark:text-white text-lg">{co}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Conference Co-Chair
                  </div>
                  <a
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-[14px]">mail</span>{" "}
                    {co.toLowerCase().replace(" ", ".")}@conference.org
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Chairs */}
        <div className="mb-10">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            Program Chairs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["Alex Brown", "Emily Zhang", "Robert Klein"].map((name) => (
              <div
                key={name}
                className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
              >
                <MemberAvatar name={name} email={`${name}@ai.com`} />
                <div>
                  <div className="font-bold text-navy-900 dark:text-white">{name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Research & Peer Review
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Area Chairs */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            Area Chairs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "David Miller", track: "Reinforcement Learning" },
              { name: "Sarah Jenkins", track: "Computer Vision" },
              { name: "Wei Liu", track: "NLP & LLMs" },
              { name: "Carlos Mendez", track: "Generative Models" },
            ].map((chair) => (
              <div
                key={chair.name}
                className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all bg-white dark:bg-slate-900"
              >
                <div className="font-bold text-navy-900 dark:text-white text-sm">{chair.name}</div>
                <div className="text-xs text-slate-500 truncate">Academic Committee</div>
                <div className="mt-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wide">
                  {chair.track}
                </div>
              </div>
            ))}
            <div className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all bg-white dark:bg-slate-900 flex flex-col justify-center">
              <div className="font-bold text-navy-900 dark:text-white text-sm">More Members</div>
              <div className="text-xs text-slate-500">View full list</div>
              <div className="mt-2 flex">
                <span className="material-symbols-outlined text-slate-400 text-lg">
                  arrow_forward
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
