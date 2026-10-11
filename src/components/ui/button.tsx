import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-body font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary to-primary-container text-primary-foreground shadow-[0_4px_12px_rgba(2,36,72,0.15)] hover:brightness-110 hover:shadow-[0_8px_24px_rgba(2,36,72,0.2)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/85 hover:shadow-md focus-visible:ring-destructive",
        outline:
          "border border-input/60 bg-card text-on-surface-variant hover:bg-background hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_2px_8px_rgba(2,36,72,0.06)] hover:bg-surface-variant",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "gap-1.5 px-3 py-1.5",
        lg: "gap-2.5 px-6 py-3",
        icon: "h-8 w-8 p-0",
        // Matches the 44px toolbar and form controls
        control: "h-11 rounded-xl px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
