"use client"

import { ReactNode } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { spacing, iconSizes } from "@/lib/typography"

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
      className={`relative flex items-center ${spacing.gap.sm} border rounded-md bg-background ${className || ""}`}
    >
      <Search className={`absolute left-3 ${iconSizes.sm} text-muted-foreground`} />
      <div className={`flex-1 flex items-center ${spacing.gap.sm} pl-10 pr-2 py-2`}>
        {hasActiveFilters && activeFilters.length > 0 && (
          <div className={`flex items-center ${spacing.gap.sm} flex-wrap`}>
            {activeFilters.map((filter) => (
              <Badge key={filter.id} variant="secondary" className={spacing.gap.sm}>
                {filter.label}
                <button
                  onClick={filter.onRemove}
                  className="ml-1 hover:bg-muted rounded-full"
                  type="button"
                >
                  <X className={iconSizes.xs} />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Input
          placeholder={hasActiveFilters ? "" : searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="!border-0 focus-visible:!ring-0 focus-visible:!border-0 focus-visible:!ring-offset-0 !shadow-none h-auto p-0 flex-1 min-w-[120px]"
        />
      </div>
      {filterPopover && (
        <Popover open={filterOpen} onOpenChange={onFilterOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 mr-2 ${hasActiveFilters ? "text-primary" : ""}`}
              onClick={onFilterButtonClick}
            >
              <Filter className={iconSizes.sm} />
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
