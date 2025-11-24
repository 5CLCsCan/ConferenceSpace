"use client"

import { Card, CardContent } from "@/components/ui/card"
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
  // Desktop Table
  const desktopTable = (
    <div
      className={cn(
        "rounded-md border shadow-sm overflow-hidden hidden md:block bg-card",
        className,
      )}
    >
      <Table className="table-auto">
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/50">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.width || "w-auto",
                  column.className,
                  "text-foreground font-semibold py-3 px-4 overflow-hidden",
                )}
              >
                <div className="truncate">{column.label}</div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className={typography.muted}>{loadingMessage}</div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className={cn("text-destructive", typography.body)}>
                  {errorMessage || error}
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className={typography.muted}>{emptyMessage}</div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => {
              const rowKey = getRowKey(item, index)
              return (
                <TableRow
                  key={rowKey}
                  className={cn(
                    "transition-colors hover:bg-muted/50",
                    onRowClick && "cursor-pointer",
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
                          "py-3 px-4 overflow-hidden",
                        )}
                      >
                        {content}
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
