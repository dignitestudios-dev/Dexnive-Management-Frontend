import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md focus-visible:ring-4 focus-visible:ring-primary-600/20",
        outline:
          "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-4 focus-visible:ring-gray-200",
        secondary:
          "bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:ring-4 focus-visible:ring-primary-100",
        ghost:
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:bg-gray-100",
        destructive:
          "bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-4 focus-visible:ring-red-500/20",
        link: "text-primary-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-2 px-3 py-1.5",
        xs: "h-7 gap-1 rounded-sm px-2 text-xs",
        sm: "h-8 gap-1.5 rounded-sm px-3 text-xs",
        lg: "h-10 gap-2 rounded-md px-6 text-base",
        icon: "size-9",
        "icon-xs": "size-7 rounded-sm",
        "icon-sm": "size-8 rounded-sm",
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
  isLoading,
  children,
  disabled,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { isLoading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
