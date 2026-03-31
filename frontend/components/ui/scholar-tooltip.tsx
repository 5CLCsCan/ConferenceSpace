"use client"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function ScholarTooltip(props: React.ComponentProps<typeof Tooltip>) {
  return <Tooltip {...props} />
}

function ScholarTooltipTrigger(props: React.ComponentProps<typeof TooltipTrigger>) {
  return <TooltipTrigger {...props} />
}

function ScholarTooltipContent({
  className,
  sideOffset = 10,
  ...props
}: React.ComponentProps<typeof TooltipContent>) {
  return (
    <TooltipContent
      sideOffset={sideOffset}
      className={cn(
        "max-w-[30rem] rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-[10px] font-normal leading-relaxed text-slate-600 shadow-[0_16px_40px_rgba(15,23,42,0.12)] supports-[backdrop-filter]:bg-white/92 supports-[backdrop-filter]:backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  )
}

export { ScholarTooltip, ScholarTooltipTrigger, ScholarTooltipContent }
