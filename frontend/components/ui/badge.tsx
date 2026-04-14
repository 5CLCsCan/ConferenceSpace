import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "text-tiny-label inline-flex w-fit shrink-0 whitespace-nowrap items-center justify-center gap-[var(--space-micro)] overflow-hidden [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow]",
  {
    variants: {
      variant: {
        default: "badge-neutral",
        secondary: "badge-neutral",
        destructive: "badge-semantic-error",
        outline: "badge-neutral bg-transparent",
        success: "badge-semantic-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
