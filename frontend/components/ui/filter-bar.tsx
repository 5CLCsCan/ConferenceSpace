"use client"

import { ReactNode } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { spacing, iconSizes } from "@/lib/typography"
import { cn } from "@/lib/utils"

export interface ActiveFilter {
  id: string
  label: string
  onRemove: () => void
}

export interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  activeFilters?: ActiveFilter[]
  filterPopover?: ReactNode
  hasActiveFilters?: boolean
  className?: string
  filterOpen?: boolean
  onFilterOpenChange?: (open: boolean) => void
  onFilterButtonClick?: () => void
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  activeFilters = [],
  filterPopover,
  hasActiveFilters: hasActiveFiltersProp,
  className,
  filterOpen,
  onFilterOpenChange,
  onFilterButtonClick,
}: FilterBarProps) {
  const hasActiveFilters = hasActiveFiltersProp ?? activeFilters.length > 0
  const isControlled = filterOpen !== undefined && onFilterOpenChange !== undefined

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-lg border bg-background/50 backdrop-blur-sm",
        "transition-all duration-200 ease-in-out",
        "hover:border-primary/50 hover:shadow-sm",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-md",
        className,
      )}
    >
      <Search
        className={cn(
          "absolute left-3.5 text-muted-foreground transition-colors duration-200",
          "group-focus-within:text-primary",
          iconSizes.sm,
        )}
      />
      <div className="flex flex-1 items-center gap-2 pl-10 pr-2 py-2.5">
        {hasActiveFilters && activeFilters.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.id}
                variant="secondary"
                className={cn(
                  "group/badge inline-flex items-center gap-1 px-2 py-0.5 pr-1",
                  "bg-primary/10 text-primary border-primary/20",
                  "transition-all duration-200 ease-in-out",
                  "hover:bg-primary/15 hover:border-primary/30",
                  "animate-in fade-in slide-in-from-left-2",
                )}
              >
                <span className="text-xs font-medium">{filter.label}</span>
                <button
                  onClick={filter.onRemove}
                  className={cn(
                    "ml-0.5 rounded-full p-0.5 transition-all duration-150 cursor-pointer",
                    "hover:bg-primary/20 hover:text-primary",
                    "focus:outline-none focus:ring-1 focus:ring-primary/50 focus:ring-offset-1",
                  )}
                  type="button"
                  aria-label={`Remove filter ${filter.label}`}
                >
                  <X className={cn("h-3 w-3", iconSizes.xs)} />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Input
          placeholder={hasActiveFilters ? "" : searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "!border-0 !shadow-none h-auto p-0 flex-1 min-w-[120px]",
            "focus-visible:!ring-0 focus-visible:!border-0 focus-visible:!ring-offset-0",
            "placeholder:text-muted-foreground/60",
            "bg-transparent",
          )}
        />
      </div>
      {filterPopover && (
        <Popover open={filterOpen} onOpenChange={onFilterOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 mr-2 rounded-md transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary",
                "focus-visible:ring-2 focus-visible:ring-primary/50",
                hasActiveFilters && "text-primary bg-primary/5",
              )}
              onClick={onFilterButtonClick}
            >
              <Filter
                className={cn(
                  iconSizes.sm,
                  "transition-transform duration-200",
                  filterOpen && "rotate-90",
                )}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            {filterPopover}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
