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
      <h1
        className={cn(
          "font-black uppercase tracking-wider text-[#C41E3A]",
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
      </h1>
      <p className={cn("text-[#64748b]", subtitleClassName)}>{subtitle}</p>
    </div>
  )
}
