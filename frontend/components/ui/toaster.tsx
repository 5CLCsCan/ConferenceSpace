"use client"

import * as React from "react"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import type { ToastProps } from "@/components/ui/toast"

type ToastVariant = ToastProps["variant"]

const VARIANT_META: Record<
  NonNullable<ToastVariant>,
  { icon: React.ReactNode; progressColor: string }
> = {
  default: {
    icon: <Info className="h-4 w-4 text-[#1B3C53] mt-0.5 shrink-0" />,
    progressColor: "bg-[#1B3C53]",
  },
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />,
    progressColor: "bg-emerald-500",
  },
  destructive: {
    icon: <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />,
    progressColor: "bg-red-500",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />,
    progressColor: "bg-amber-500",
  },
}

const DURATION = 4000

function ToastWithProgress({
  id,
  title,
  description,
  action,
  variant = "default",
  ...props
}: {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
  variant?: ToastVariant
} & Omit<React.ComponentProps<typeof Toast>, "variant">) {
  const [progress, setProgress] = React.useState(100)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = React.useRef<number>(Date.now())

  const meta = VARIANT_META[variant ?? "default"]

  React.useEffect(() => {
    startRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100)
      setProgress(remaining)
      if (remaining === 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 50)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <Toast key={id} variant={variant} {...props}>
      {meta.icon}
      <div className="flex-1 min-w-0">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
        {action}
      </div>
      <ToastClose />
      {/* Progress bar */}
      <span
        className={`absolute bottom-0 left-0 h-[2px] rounded-b-xl transition-none ${meta.progressColor}`}
        style={{ width: `${progress}%`, opacity: 0.5 }}
      />
    </Toast>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={DURATION}>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <ToastWithProgress
          key={id}
          id={id}
          title={title}
          description={description}
          action={action}
          variant={variant}
          {...props}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
