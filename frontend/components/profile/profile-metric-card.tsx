export function ProfileMetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-slate-800 px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-bold text-[#1B3C53] dark:text-white mt-2 tracking-tight">
        {value}
      </div>
    </div>
  )
}
