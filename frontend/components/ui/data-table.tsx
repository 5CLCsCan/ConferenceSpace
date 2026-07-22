"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { typography, spacing } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"
import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"

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
  emptyMessage,
  loadingMessage,
  errorMessage,
  getRowKey = (_, index) => index,
  onRowClick,
  className,
  mobileCardClassName,
  renderMobileCard,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const resolvedEmptyMessage = emptyMessage ?? t("common.dataTable.empty")
  const resolvedLoadingMessage = loadingMessage ?? t("common.dataTable.loading")
  // Desktop Table
  const desktopTable = (
    <div
      className={cn(
        "rounded-lg border border-border/50 shadow-sm overflow-hidden hidden md:block",
        "bg-card/50 backdrop-blur-sm",
        "transition-all duration-200",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <Table className="table-auto w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50 bg-muted/30">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.width || "w-auto",
                    column.className,
                    "text-foreground font-semibold py-4 px-6 overflow-hidden",
                    "first:pl-6 last:pr-6",
                    "transition-colors duration-150",
                  )}
                >
                  <div className="truncate text-sm font-medium text-muted-foreground">
                    {column.label}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <div className={cn(typography.body, "text-muted-foreground")}>
                      {resolvedLoadingMessage}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center py-12">
                  <div className={cn("text-destructive", typography.body)}>
                    {errorMessage || error}
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="text-4xl opacity-50">📊</div>
                    <div className={cn(typography.body, "text-muted-foreground")}>
                      {resolvedEmptyMessage}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => {
                const rowKey = getRowKey(item, index)
                return (
                  <TableRow
                    key={rowKey}
                    className={cn(
                      "border-b border-border/30 transition-all duration-150",
                      "hover:bg-muted/40 hover:shadow-sm",
                      "group",
                      onRowClick && "cursor-pointer",
                      index === data.length - 1 && "border-b-0",
                    )}
                    onClick={() => onRowClick?.(item, index)}
                  >
                    {columns.map((column) => {
                      const content = column.render
                        ? column.render(item, index)
                        : String(item[column.key as keyof T] || "")

                      return (
                        <TableCell
                          key={column.key}
                          className={cn(
                            column.width || "w-auto",
                            column.className,
                            "py-4 px-6 overflow-hidden",
                            "first:pl-6 last:pr-6",
                            "text-sm text-foreground",
                            "group-hover:text-foreground transition-colors duration-150",
                          )}
                        >
                          <div className="truncate">{content}</div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )

  // Mobile Cards
  const mobileCards = (
    <div className="md:hidden space-y-3">
      {loading ? (
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className={cn(typography.body, "text-muted-foreground")}>{resolvedLoadingMessage}</div>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className={cn("text-destructive", typography.body)}>{errorMessage || error}</div>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="text-4xl opacity-50">📊</div>
              <div className={cn(typography.body, "text-muted-foreground")}>{resolvedEmptyMessage}</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={cn("space-y-3", mobileCardClassName)}>
          {data.map((item, index, array) => {
            const rowKey = getRowKey(item, index)

            if (renderMobileCard) {
              return (
                <Card
                  key={rowKey}
                  className={cn(
                    "shadow-sm border-border/50 bg-card/50 backdrop-blur-sm",
                    "transition-all duration-150",
                    onRowClick && "hover:shadow-md hover:border-border cursor-pointer",
                  )}
                >
                  <CardContent className="p-0">{renderMobileCard(item, index)}</CardContent>
                </Card>
              )
            }

            return (
              <Card
                key={rowKey}
                className={cn(
                  "shadow-sm border-border/50 bg-card/50 backdrop-blur-sm",
                  "transition-all duration-150",
                  onRowClick && "hover:shadow-md hover:border-border cursor-pointer",
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                <CardContent className={cn(spacing.padding.card, "space-y-3")}>
                  {columns.map((column, colIndex) => {
                    const content = column.render
                      ? column.render(item, index)
                      : String(item[column.key as keyof T] || "")

                    if (colIndex === 0) {
                      return (
                        <div
                          key={column.key}
                          className={cn("font-semibold text-foreground", typography.bodyLarge)}
                        >
                          {content}
                        </div>
                      )
                    }

                    return (
                      <div
                        key={column.key}
                        className={cn(
                          "flex flex-col gap-1",
                          typography.body,
                          "text-muted-foreground",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-foreground min-w-fit">
                            {column.mobileLabel || column.label}:
                          </span>
                          <span className="text-muted-foreground break-words">{content}</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>
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
