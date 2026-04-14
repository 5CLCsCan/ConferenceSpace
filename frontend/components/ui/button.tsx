import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-[var(--space-tight)] whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "button-primary control-standard px-[var(--space-card)]",
        destructive:
          "button-secondary control-standard px-[var(--space-card)] border-[var(--color-error-border)] bg-[var(--color-error-fill)] text-[var(--color-error-text)] hover:bg-[var(--color-error-fill)]/80",
        outline: "button-secondary control-standard px-[var(--space-card)]",
        secondary: "button-secondary control-standard px-[var(--space-card)]",
        ghost: "button-header bg-transparent border-transparent px-[var(--space-standard)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "control-dense px-[var(--space-standard)]",
        lg: "control-standard px-[var(--space-major)]",
        icon: "control-dense h-9 w-9 px-0",
        "icon-sm": "button-header h-8 w-8 px-0",
        "icon-lg": "control-standard h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
