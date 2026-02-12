"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            className={cn(
              "h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500",
              error && "border-red-500",
              className
            )}
            {...props}
          />
        </div>
        {label && (
          <label
            htmlFor={inputId}
            className="ml-2 text-sm text-gray-600 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
