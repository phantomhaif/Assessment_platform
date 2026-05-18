"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Languages,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { getPlatformName } from "@/lib/brand"
import { BrandLockup } from "@/components/layout/brand-lockup"
import { ContactsSection } from "@/components/layout/contacts-section"

export default function Home() {
  const { t, locale, setLocale } = useI18n()
  const platformName = getPlatformName(locale)
  const [isNavScrolled, setIsNavScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setIsNavScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .stagger"))
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("in"))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16 }
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [locale])

  const features = useMemo(
    () => [
      {
        icon: Users,
        title: t.home.featureRegistration,
        description: t.home.featureRegistrationDesc,
      },
      {
        icon: Upload,
        title: t.home.featureImport,
        description: t.home.featureImportDesc,
      },
      {
        icon: ClipboardList,
        title: t.home.featureScoring,
        description: t.home.featureScoringDesc,
      },
      {
        icon: Award,
        title: t.home.featurePassport,
        description: t.home.featurePassportDesc,
      },
    ],
    [t]
  )

  const steps = [
    { number: "01", title: t.home.step1Title, description: t.home.step1Desc, icon: CalendarDays },
    { number: "02", title: t.home.step2Title, description: t.home.step2Desc, icon: Users },
    { number: "03", title: t.home.step3Title, description: t.home.step3Desc, icon: ClipboardList },
    { number: "04", title: t.home.step4Title, description: t.home.step4Desc, icon: Award },
  ]

  const trustLine = locale === "ru"
    ? "WorldSkills Standard · ИИТБ · Industry Skills"
    : "WorldSkills Standard · IITB · Industry Skills"

  return (
    <div className="home-scale min-h-screen overflow-hidden bg-[#08090e] text-[#dce4f0]">
      <nav
        className={`fixed inset-x-0 top-0 z-40 border-b px-4 transition-all duration-300 ${
          isNavScrolled
            ? "border-[#C41E3A]/30 bg-[#08090e]/90 shadow-[0_6px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            : "border-white/[0.07] bg-[#08090e]/72 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex min-h-[70px] max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image src="/logo.png" alt="Industry Skills" width={48} height={48} className="shrink-0" priority />
            <BrandLockup
              locale={locale}
              subtitle={platformName}
              titleClassName="text-[14px]"
              subtitleClassName="max-w-[220px] text-[10px] uppercase tracking-[0.22em]"
            />
          </Link>

          <div className="hidden items-center gap-8 text-sm font-semibold text-[#8ea0b5] md:flex">
            <a className="nav-link" href="#features">{locale === "ru" ? "Возможности" : "Features"}</a>
            <a className="nav-link" href="#process">{locale === "ru" ? "Как работает" : "Workflow"}</a>
            <a className="nav-link" href="#contacts">{locale === "ru" ? "Контакты" : "Contacts"}</a>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
              className="inline-flex h-10 items-center gap-2 rounded border border-white/10 bg-white/[0.035] px-3 text-sm font-bold text-[#dce4f0] transition-colors hover:border-[#C41E3A]/50 hover:bg-[#C41E3A]/10"
              aria-label={locale === "ru" ? "Switch to English" : "Switch to Russian"}
            >
              <Languages className="h-4 w-4" />
              {locale === "ru" ? "EN" : "RU"}
            </button>
            <Link href="/login" className="cta-secondary h-10 px-4 text-sm">
              {locale === "ru" ? "Войти" : "Login"}
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section ref={heroRef} className="relative min-h-[720px] px-4 pb-16 pt-28 sm:pt-32 lg:min-h-[780px]">
          <div className="absolute inset-0 bg-[var(--grid-pattern)] opacity-100" />
          <div className="absolute left-[42%] top-[-120px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(196,30,58,0.32),transparent_70%)] blur-[60px]" />
          <div className="absolute bottom-[-100px] left-[8%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(120,90,255,0.18),transparent_70%)] blur-[60px]" />
          <div className="scan" />
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C41E3A] to-transparent" />

          <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.85fr)] lg:items-center">
            <div className="max-w-3xl pt-8 sm:pt-14">
              <div className="mono mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C41E3A]">
                <span className="h-px w-8 bg-[#C41E3A]" />
                KNOWLEDGE ASSESSMENT
              </div>
              <h1 className="text-[clamp(2.45rem,7vw,5.8rem)] font-extrabold leading-[0.95] tracking-0 text-[#f5f7fb]">
                {locale === "ru" ? (
                  <>
                    Платформа оценки знаний
                    <span className="block bg-gradient-to-r from-[#ff8da3] via-[#C41E3A] to-[#ff4d6d] bg-clip-text text-transparent">
                      профессионального мастерства
                    </span>
                  </>
                ) : (
                  <>
                    Professional skills
                    <span className="block bg-gradient-to-r from-[#ff8da3] via-[#C41E3A] to-[#ff4d6d] bg-clip-text text-transparent">
                      assessment platform
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#8ea0b5] sm:text-lg">
                {t.home.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="cta-primary min-h-12 px-7 text-base">
                  {t.home.startButton}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/events" className="cta-secondary min-h-12 px-7 text-base">
                  {t.home.eventsButton}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-[#7d8da1]">
                {trustLine.split(" · ").map((item) => (
                  <span key={item} className="rounded border border-white/[0.09] bg-white/[0.035] px-3 py-2">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <HeroStage />
          </div>
        </section>

        <section id="features" className="relative border-t border-white/[0.07] px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              kicker={locale === "ru" ? "features" : "features"}
              title={t.home.featuresTitle}
              description={
                locale === "ru"
                  ? "Ключевые рабочие сценарии сведены в плотный интерфейс для участников, экспертов и организаторов."
                  : "Core workflows are organized into a dense interface for participants, experts and organizers."
              }
            />
            <div className="stagger mt-10 grid gap-px overflow-hidden rounded-lg border border-white/[0.09] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  index={index + 1}
                  moreLabel={locale === "ru" ? "Подробнее" : "Details"}
                  {...feature}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="relative border-t border-white/[0.07] px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              kicker={locale === "ru" ? "process" : "process"}
              title={t.home.howItWorksTitle}
              description={
                locale === "ru"
                  ? "Четыре шага от создания мероприятия до публикации результатов и паспортов."
                  : "Four steps from event setup to published results and passports."
              }
            />
            <div className="stagger relative mt-12 grid gap-4 lg:grid-cols-4">
              <div className="absolute left-8 right-8 top-[27px] hidden h-px bg-gradient-to-r from-[#C41E3A] via-[#C41E3A]/35 to-transparent lg:block" />
              {steps.map((step) => (
                <StepCard key={step.number} {...step} />
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/[0.07] px-4 py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.75fr)] lg:items-center">
            <div className="reveal">
              <div className="mono mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C41E3A]">
                <span className="h-px w-8 bg-[#C41E3A]" />
                skill passport
              </div>
              <h2 className="max-w-2xl text-3xl font-extrabold text-[#f5f7fb] sm:text-4xl">
                {locale === "ru" ? "Прозрачное оценивание без ручной сборки документов" : "Transparent scoring without manual document assembly"}
              </h2>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <MiniPoint icon={<BarChart3 className="h-4 w-4" />} title={locale === "ru" ? "Автоматический расчёт" : "Automatic calculation"} />
                <MiniPoint icon={<FileCheck2 className="h-4 w-4" />} title={locale === "ru" ? "PDF на двух языках" : "Bilingual PDF"} />
                <MiniPoint icon={<ShieldCheck className="h-4 w-4" />} title={locale === "ru" ? "Контроль ролей" : "Role control"} />
                <MiniPoint icon={<CheckCircle2 className="h-4 w-4" />} title={locale === "ru" ? "Публикация результатов" : "Published results"} />
              </div>
            </div>

            <div className="reveal self-end lg:mt-16 rounded-lg border border-white/[0.09] bg-white/[0.04] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.2em] text-[#7d8da1]">Skill Passport</p>
                  <h3 className="mt-1 text-xl font-bold text-[#f5f7fb]">Industry Skills 2026</h3>
                </div>
                <Image src="/logo.png" alt="Industry Skills" width={46} height={46} />
              </div>
              <div className="space-y-4">
                {[
                  [locale === "ru" ? "Модуль A" : "Module A", 88, "#C41E3A"],
                  [locale === "ru" ? "Модуль B" : "Module B", 76, "#60a5fa"],
                  [locale === "ru" ? "Модуль C" : "Module C", 92, "#34d07a"],
                ].map(([label, value, color]) => (
                  <div key={label as string}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold text-[#dce4f0]">{label}</span>
                      <span className="mono text-[#8ea0b5]">{value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color as string }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/[0.07] px-4 py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(196,30,58,0.16),transparent_58%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-extrabold text-[#f5f7fb] sm:text-4xl">{t.home.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#8ea0b5]">{t.home.ctaSubtitle}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className="cta-primary min-h-12 px-7 text-base">
                {t.home.createAccount}
              </Link>
              <Link href="/login" className="cta-secondary min-h-12 px-7 text-base">
                {t.home.loginAccount}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer id="contacts" className="border-t border-white/[0.07] px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <ContactsSection locale={locale} />
        </div>
      </footer>
    </div>
  )
}

function HeroStage() {
  return (
    <div className="relative mx-auto flex h-[360px] w-full max-w-[420px] items-center justify-center sm:h-[430px]">
      <div className="absolute h-[320px] w-[320px] rounded-full border border-dashed border-[#C41E3A]/35 [animation:rotate-slow_30s_linear_infinite] sm:h-[390px] sm:w-[390px]" />
      <div className="absolute h-[230px] w-[230px] rounded-full border border-dotted border-[#C41E3A]/45 [animation:rotate-rev_22s_linear_infinite] sm:h-[290px] sm:w-[290px]" />
      <div className="absolute h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(196,30,58,0.18),transparent_70%)] sm:h-[340px] sm:w-[340px]" />
      <div className="absolute left-6 top-6 h-7 w-7 border-l-2 border-t-2 border-[#C41E3A]" />
      <div className="absolute right-6 top-6 h-7 w-7 border-r-2 border-t-2 border-[#C41E3A]" />
      <div className="absolute bottom-6 left-6 h-7 w-7 border-b-2 border-l-2 border-[#C41E3A]" />
      <div className="absolute bottom-6 right-6 h-7 w-7 border-b-2 border-r-2 border-[#C41E3A]" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 origin-[0_-150px] rounded-full bg-[#C41E3A] shadow-[0_0_14px_#C41E3A] [animation:rotate-slow_18s_linear_infinite]" />
      <div className="relative rounded-lg border border-[#C41E3A]/25 bg-[#C41E3A]/[0.07] p-10 shadow-[0_4px_32px_rgba(196,30,58,0.16)] [animation:float-y_4.5s_ease-in-out_infinite]">
        <Image src="/logo.png" alt="Industry Skills" width={128} height={128} priority />
      </div>
    </div>
  )
}

function SectionHeading({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return (
    <div className="reveal max-w-3xl">
      <div className="mono mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C41E3A]">
        <span className="h-px w-8 bg-[#C41E3A]" />
        {kicker}
      </div>
      <h2 className="text-3xl font-extrabold text-[#f5f7fb] sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8ea0b5] sm:text-base">{description}</p>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
  moreLabel,
}: {
  icon: LucideIcon
  title: string
  description: string
  index: number
  moreLabel: string
}) {
  return (
    <article className="group relative min-h-[240px] bg-[#0c0f1a] p-6 transition-all duration-300 hover:bg-white/[0.055]">
      <div className="mono absolute right-5 top-4 text-[11px] text-[#C41E3A]/45">0{index}</div>
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-md border border-[#C41E3A]/35 bg-[#C41E3A]/10 text-[#ff8da3] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold text-[#f5f7fb]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#8ea0b5]">{description}</p>
      <div className="mt-4 flex translate-x-[-6px] items-center gap-2 text-xs font-semibold text-[#C41E3A] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        {moreLabel} <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </article>
  )
}

function StepCard({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <article className="relative rounded-lg border border-white/[0.09] bg-white/[0.04] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-md border-2 border-[#C41E3A] bg-[#08090e] text-[#C41E3A] transition-all duration-300">
          <Icon className="h-5 w-5" />
        </div>
        <span className="mono text-xs font-semibold text-[#C41E3A]">{number}</span>
      </div>
      <h3 className="text-lg font-bold text-[#f5f7fb]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#8ea0b5]">{description}</p>
    </article>
  )
}

function MiniPoint({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.09] bg-white/[0.04] p-4 text-sm font-semibold text-[#dce4f0]">
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#C41E3A]/30 bg-[#C41E3A]/10 text-[#ff8da3]">
        {icon}
      </span>
      {title}
    </div>
  )
}
