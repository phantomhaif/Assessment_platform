"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[4px] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090e] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "cta-primary bg-[#C41E3A] text-white shadow-[0_8px_28px_rgba(196,30,58,0.22)] hover:bg-[#9e1830] active:translate-y-0",
        destructive: "bg-[#cf2e2e] text-white shadow-sm hover:bg-[#b52828]",
        outline: "cta-secondary border border-[#C41E3A]/70 bg-transparent text-[#f5f7fb] hover:bg-[#C41E3A]/10 hover:text-white",
        secondary: "border border-white/10 bg-white/[0.055] text-[#dce4f0] hover:bg-white/[0.09] hover:text-white",
        ghost: "text-[#b8c5d5] hover:bg-white/[0.06] hover:text-white",
        link: "text-[#C41E3A] underline-offset-4 hover:underline p-0 h-auto",
        success: "bg-[#16894d] text-white shadow-sm hover:bg-[#11713f]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-8 text-base rounded-md",
        icon: "h-9 w-9 p-0",
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
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
