"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { Award, Users, ClipboardList, FileCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { getPlatformName } from "@/lib/brand"
import { BrandLockup } from "@/components/layout/brand-lockup"
import { ContactsSection } from "@/components/layout/contacts-section"

export default function Home() {
  const { t, locale, setLocale } = useI18n()
  const platformName = getPlatformName(locale)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Image src="/logo.png" alt="Industry Skills" width={52} height={52} className="flex-shrink-0" />
              <BrandLockup
                locale={locale}
                subtitle={platformName}
                titleClassName="text-[14px]"
                subtitleClassName="max-w-[240px] text-[10px] leading-tight sm:text-xs"
              />
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-4">
              <button
                onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
                className="rounded border border-gray-300 px-3 py-1 text-sm transition-colors hover:bg-gray-50"
              >
                {locale === "ru" ? "EN" : "RU"}
              </button>
              <Link href="/login" className="font-medium text-gray-600 hover:text-gray-900">
                {locale === "ru" ? "Войти" : "Login"}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[#C41E3A] px-4 py-2 font-medium text-white transition-colors hover:bg-[#a01830]"
              >
                {locale === "ru" ? "Регистрация" : "Sign up"}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">{platformName}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">{t.home.heroSubtitle}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-lg bg-[#C41E3A] px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-[#a01830]"
            >
              {t.home.startButton}
            </Link>
            <Link
              href="/events"
              className="rounded-lg border border-gray-300 px-8 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t.home.eventsButton}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">{t.home.featuresTitle}</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Users className="h-8 w-8 text-[#C41E3A]" />}
              title={t.home.featureRegistration}
              description={t.home.featureRegistrationDesc}
            />
            <FeatureCard
              icon={<ClipboardList className="h-8 w-8 text-[#C41E3A]" />}
              title={t.home.featureImport}
              description={t.home.featureImportDesc}
            />
            <FeatureCard
              icon={<FileCheck className="h-8 w-8 text-[#C41E3A]" />}
              title={t.home.featureScoring}
              description={t.home.featureScoringDesc}
            />
            <FeatureCard
              icon={<Award className="h-8 w-8 text-[#C41E3A]" />}
              title={t.home.featurePassport}
              description={t.home.featurePassportDesc}
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">{t.home.howItWorksTitle}</h2>
          <div className="space-y-8">
            <Step number={1} title={t.home.step1Title} description={t.home.step1Desc} />
            <Step number={2} title={t.home.step2Title} description={t.home.step2Desc} />
            <Step number={3} title={t.home.step3Title} description={t.home.step3Desc} />
            <Step number={4} title={t.home.step4Title} description={t.home.step4Desc} />
          </div>
        </div>
      </section>

      <section className="bg-[#C41E3A] px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">{t.home.ctaTitle}</h2>
          <p className="mb-8 text-lg text-red-100">{t.home.ctaSubtitle}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-block rounded-lg bg-white px-8 py-3 text-lg font-medium text-[#C41E3A] transition-colors hover:bg-gray-100"
            >
              {t.home.createAccount}
            </Link>
            <Link
              href="/login"
              className="inline-block rounded-lg border-2 border-white bg-transparent px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-white/10"
            >
              {t.home.loginAccount}
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <ContactsSection locale={locale} />
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-[#C41E3A]/10">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4 sm:gap-6">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#C41E3A] font-bold text-white">
        {number}
      </div>
      <div>
        <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}
