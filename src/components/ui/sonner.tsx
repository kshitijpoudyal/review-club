import { Toaster as Sonner } from "sonner"

import { useTheme } from "@/hooks/useTheme"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-2xl !border-0 !font-sans !text-sm !font-semibold !shadow-navy-lg",
          default: "!bg-primary !text-primary-foreground",
          success: "!bg-brand !text-brand-foreground",
          error: "!bg-destructive !text-destructive-foreground",
          info: "!bg-primary !text-primary-foreground",
          loading: "!bg-primary !text-primary-foreground",
          description: "group-[.toast]:opacity-80",
          actionButton:
            "group-[.toast]:bg-background group-[.toast]:text-foreground",
          cancelButton:
            "group-[.toast]:bg-background/15",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
