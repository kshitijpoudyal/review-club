import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Press feedback lands on pointer-down (`active:`) and is instant; release
// eases back. Hover tints only apply on devices that can hover.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-body font-medium transition-[transform,background-color,color,box-shadow,opacity] duration-150 ease-out active:scale-[0.97] active:duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(var(--shadow-color)/0.12)] hover:bg-primary/90 active:bg-primary/85",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/85 focus-visible:ring-destructive",
        outline:
          "border border-input/60 bg-card text-foreground hover:bg-secondary/70 active:bg-secondary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-variant active:bg-surface-variant",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground active:bg-secondary",
        link: "text-brand underline-offset-4 hover:underline active:scale-100 active:opacity-70",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 gap-1.5 px-3 text-label",
        lg: "h-12 gap-2.5 px-6 text-[1.0625rem]",
        icon: "h-8 w-8 p-0",
        // Matches the 44px toolbar and form controls (Apple's minimum hit target)
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
