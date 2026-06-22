import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
}

function Input({ className, type, error, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-8 w-full min-w-0 rounded-md border border-gray-200 bg-gray-50/50 px-2 py-1.5 text-sm text-gray-900 shadow-sm transition-all duration-200 outline-none",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900",
        "placeholder:text-gray-400",
        "hover:border-gray-300 hover:bg-white",
        "focus-visible:border-primary-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-primary-500/15",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
        error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/15 hover:border-red-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
