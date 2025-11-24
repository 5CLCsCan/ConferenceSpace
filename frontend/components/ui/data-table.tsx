"use client"

import { Card, CardContent } from "@/components/ui/card"
import { typography, spacing } from "@/lib/typography"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface DataTableColumn<T = any> {
  key: string
  label: string | ReactNode
  width?: string
  className?: string
  render?: (item: T, index: number) => ReactNode
  mobileLabel?: string | ReactNode
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string | ReactNode
  loadingMessage?: string | ReactNode
  errorMessage?: string | ReactNode
  getRowKey?: (item: T, index: number) => string | number
  onRowClick?: (item: T, index: number) => void
  className?: string
  mobileCardClassName?: string
  renderMobileCard?: (item: T, index: number) => ReactNode
}

export function DataTable<T = any>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = "No data available",
  loadingMessage = "Loading...",
  errorMessage,
  getRowKey = (_, index) => index,
  onRowClick,
  className,
  mobileCardClassName,
  renderMobileCard,
}: DataTableProps<T>) {
  const primaryColumn = columns[0]
  const otherColumns = columns.slice(1)

  // Desktop Table
  const desktopTable = (
    <Card className={cn("shadow-sm overflow-hidden hidden md:block p-0", className)}>
      {/* Header row */}
      <div
        className={cn(
          "flex items-center",
          spacing.gap.md,
          "py-3 px-4 bg-muted/50 border-b",
          typography.body,
          typography.semibold,
          "text-foreground",
        )}
      >
        <div className="flex-1 min-w-0">{primaryColumn.label}</div>
        <div className={cn("flex items-center", spacing.gap.md, "ml-auto")}>
          {otherColumns.map((column) => (
            <div key={column.key} className={cn(column.width || "w-auto", column.className)}>
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 px-4 text-center">
          <div className={typography.muted}>{loadingMessage}</div>
        </div>
      ) : error ? (
        <div className="py-12 px-4 text-center">
          <div className={cn("text-destructive", typography.body)}>{errorMessage || error}</div>
        </div>
      ) : data.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className={typography.muted}>{emptyMessage}</div>
        </div>
      ) : (
        <div>
          {data.map((item, index, array) => {
            const rowKey = getRowKey(item, index)
            const primaryContent = primaryColumn.render
              ? primaryColumn.render(item, index)
              : String(item[primaryColumn.key as keyof T] || "")

            return (
              <div
                key={rowKey}
                className={cn(
                  "flex flex-col md:flex-row md:items-center",
                  spacing.gap.md,
                  "py-3 px-4",
                  index !== array.length - 1 && "border-b border-border",
                  "hover:bg-muted/50 transition-colors",
                  onRowClick && "cursor-pointer",
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                <div className="flex-1 min-w-0">{primaryContent}</div>
                <div
                  className={cn(
                    "flex flex-col md:flex-row items-start md:items-center",
                    spacing.gap.md,
                    typography.body,
                    "text-muted-foreground ml-auto",
                  )}
                >
                  {otherColumns.map((column) => {
                    const content = column.render
                      ? column.render(item, index)
                      : String(item[column.key as keyof T] || "")

                    return (
                      <div
                        key={column.key}
                        className={cn(
                          column.width ? `md:${column.width}` : "md:w-auto",
                          column.className,
                        )}
                      >
                        {content}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )

  // Mobile Cards
  const mobileCards = (
    <div className="md:hidden">
      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <div className={typography.muted}>{loadingMessage}</div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <div className={cn("text-destructive", typography.body)}>{errorMessage || error}</div>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <div className={typography.muted}>{emptyMessage}</div>
          </CardContent>
        </Card>
      ) : (
        <Card className={cn("shadow-sm", mobileCardClassName)}>
          <CardContent className="p-0">
            {data.map((item, index, array) => {
              const rowKey = getRowKey(item, index)

              if (renderMobileCard) {
                return (
                  <div key={rowKey} className={index !== array.length - 1 ? "border-b" : ""}>
                    {renderMobileCard(item, index)}
                  </div>
                )
              }

              return (
                <div
                  key={rowKey}
                  className={cn(
                    spacing.padding.card,
                    index !== array.length - 1 && "border-b",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {columns.map((column, colIndex) => {
                    const content = column.render
                      ? column.render(item, index)
                      : String(item[column.key as keyof T] || "")

                    if (colIndex === 0) {
                      return (
                        <div key={column.key} className="mb-2">
                          {content}
                        </div>
                      )
                    }

                    return (
                      <div
                        key={column.key}
                        className={cn(
                          "flex flex-col",
                          spacing.gap.sm,
                          typography.body,
                          "text-muted-foreground",
                        )}
                      >
                        <div>
                          <span className="font-medium">{column.mobileLabel || column.label}:</span>{" "}
                          {content}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <>
      {desktopTable}
      {mobileCards}
    </>
  )
}
