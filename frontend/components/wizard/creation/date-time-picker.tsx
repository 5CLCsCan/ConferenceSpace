"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"

interface DateTimePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  className?: string
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Pick a date and time",
  disabled = false,
  minDate,
  className,
}: DateTimePickerProps) {
  const { t } = useTranslation()
  const [time, setTime] = React.useState<string>(() => {
    if (date) {
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      return `${hours}:${minutes}`
    }
    return "00:00"
  })

  // Sync time state when date prop changes externally
  React.useEffect(() => {
    if (date) {
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      setTime(`${hours}:${minutes}`)
    }
  }, [date])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onDateChange(undefined)
      return
    }

    // Combine selected date with current time
    const [hours, minutes] = time.split(":").map(Number)
    const newDate = new Date(selectedDate)
    newDate.setHours(hours, minutes, 0, 0)
    onDateChange(newDate)
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    if (date) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      onDateChange(newDate)
    } else {
      // If no date selected, create a date with today's date and the selected time
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDate = new Date()
      newDate.setHours(hours, minutes, 0, 0)
      onDateChange(newDate)
    }
  }

  const displayValue = date ? `${format(date, "PPP")} ${format(date, "HH:mm")}` : placeholder

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full h-10 text-xs font-normal py-2 pl-[34px] pr-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all cursor-pointer text-left relative",
            !date && "text-slate-400",
            disabled && "opacity-50 cursor-not-allowed",
            className,
          )}
        >
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 text-slate-400"
            style={{
              fontSize: "14px",
              width: "14px",
              height: "14px",
              maxWidth: "14px",
              maxHeight: "14px",
              minWidth: "14px",
              minHeight: "14px",
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: "translateY(-50%)",
              boxSizing: "border-box",
            }}
          >
            event
          </span>
          {displayValue}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={disabled}
            {...(minDate && { fromDate: minDate })}
          />
          <div className="p-3 border-t border-slate-200 dark:border-slate-700">
            <label className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest mb-2 block">
              {t("runtime.components.wizard.creation.date-time-picker.text_time")}{" "}
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full h-8 text-xs font-normal px-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              style={{
                WebkitAppearance: "none",
                MozAppearance: "textfield",
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
