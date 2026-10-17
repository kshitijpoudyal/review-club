import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-full bg-gradient-to-r from-secondary via-muted to-secondary bg-[length:200%_100%] animate-shimmer", className)}
      {...props}
    />
  )
}

export { Skeleton }
