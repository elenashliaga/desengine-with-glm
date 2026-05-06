import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center self-start justify-self-start rounded-sm border-0 font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-black/15 active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:scale-95 disabled:pointer-events-none disabled:bg-neutral-300 disabled:text-white/90 disabled:shadow-none aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: "bg-black !text-white shadow-xl shadow-black/30 hover:bg-black/90 hover:!text-white hover:shadow-2xl hover:shadow-black/35 active:shadow-md active:shadow-black/20 [&>a]:!text-white [&>span]:!text-white",
        outline: "bg-black !text-white shadow-xl shadow-black/30 hover:bg-black/90 hover:!text-white hover:shadow-2xl hover:shadow-black/35 active:shadow-md active:shadow-black/20 aria-expanded:bg-black aria-expanded:text-white [&>a]:!text-white [&>span]:!text-white",
        secondary: "bg-black !text-white shadow-xl shadow-black/30 hover:bg-black/90 hover:!text-white hover:shadow-2xl hover:shadow-black/35 active:shadow-md active:shadow-black/20 aria-expanded:bg-black aria-expanded:text-white [&>a]:!text-white [&>span]:!text-white",
        ghost: "bg-black !text-white shadow-xl shadow-black/30 hover:bg-black/90 hover:!text-white hover:shadow-2xl hover:shadow-black/35 active:shadow-md active:shadow-black/20 aria-expanded:bg-black aria-expanded:text-white [&>a]:!text-white [&>span]:!text-white",
        destructive: "bg-black !text-white shadow-xl shadow-black/30 hover:bg-black/90 hover:!text-white hover:shadow-2xl hover:shadow-black/35 active:shadow-md active:shadow-black/20 [&>a]:!text-white [&>span]:!text-white",
        link: "text-black underline underline-offset-4 hover:text-black/80",
      },
      size: {
        default: "min-h-9 gap-1.5 px-4 py-2",
        xs: "min-h-7 gap-1 px-3 py-1.5",
        sm: "min-h-8 gap-1.5 px-3.5 py-2",
        lg: "min-h-10 gap-1.5 px-5 py-2.5",
        icon: "size-8",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  const resolvedStyle =
    variant === "link"
      ? style
      : {
          color: "#ffffff",
          ...style,
        }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      style={resolvedStyle}
      {...props}
    />
  )
}

export { Button, buttonVariants }
