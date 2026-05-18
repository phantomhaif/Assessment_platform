import type { Locale } from "@/lib/i18n/dictionaries"
import { cn } from "@/lib/utils"

interface BrandLockupProps {
  locale: Locale
  subtitle: string
  className?: string
  titleClassName?: string
  subtitleClassName?: string
}

export function BrandLockup({
  locale,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
}: BrandLockupProps) {
  const isRussian = locale === "ru"

  return (
    <div className={cn("flex min-w-0 flex-col justify-between", className)}>
      <div
        className={cn(
          "font-black uppercase tracking-wider text-[#f3314f]",
          isRussian ? "whitespace-nowrap leading-none" : "leading-tight",
          titleClassName
        )}
      >
        {isRussian ? (
          "INDUSTRY SKILLS"
        ) : (
          <>
            INDUSTRY
            <br />
            SKILLS
          </>
        )}
      </div>
      <p className={cn("text-[#7d8da1]", subtitleClassName)}>{subtitle}</p>
    </div>
  )
}
