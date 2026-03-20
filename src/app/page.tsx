"use client"

import Link from "next/link"
import Image from "next/image"
import { Award, Users, ClipboardList, FileCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { getPlatformName, getPlatformTitle } from "@/lib/brand"

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
              <div className="flex min-w-0 flex-col justify-between">
                <h1 className="font-black uppercase leading-tight tracking-wider text-[#C41E3A]" style={{ fontSize: "14px" }}>
                  INDUSTRY
                  <br />
                  SKILLS
                </h1>
                <p className="max-w-[240px] text-[10px] leading-tight text-[#64748b] sm:text-xs">
                  {platformName}
                </p>
              </div>
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
          <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
            {platformName}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
            {t.home.heroSubtitle}
          </p>
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
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            {t.home.featuresTitle}
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={<Users className="h-8 w-8 text-[#C41E3A]" />} title={t.home.featureRegistration} description={t.home.featureRegistrationDesc} />
            <FeatureCard icon={<ClipboardList className="h-8 w-8 text-[#C41E3A]" />} title={t.home.featureImport} description={t.home.featureImportDesc} />
            <FeatureCard icon={<FileCheck className="h-8 w-8 text-[#C41E3A]" />} title={t.home.featureScoring} description={t.home.featureScoringDesc} />
            <FeatureCard icon={<Award className="h-8 w-8 text-[#C41E3A]" />} title={t.home.featurePassport} description={t.home.featurePassportDesc} />
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            {t.home.howItWorksTitle}
          </h2>
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
          <h2 className="mb-4 text-3xl font-bold text-white">
            {t.home.ctaTitle}
          </h2>
          <p className="mb-8 text-lg text-red-100">
            {t.home.ctaSubtitle}
          </p>
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

      <footer className="border-t border-gray-200 bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-3 font-bold text-gray-900">INDUSTRY SKILLS</h3>
              <p className="text-sm text-gray-600">
                {getPlatformTitle(locale)}
              </p>
            </div>

            <div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#C41E3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-700">
                      {locale === "ru" ? "197046, Россия" : "197046, Russia"}
                    </p>
                    <p>
                      {locale === "ru"
                        ? "Санкт-Петербург, Петроградская набережная, д. 36A"
                        : "St. Petersburg, Petrogradskaya Embankment, 36A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-[#C41E3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+78126440126" className="transition-colors hover:text-[#C41E3A]">
                    +7 (812) 644-01-26
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-[#C41E3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <a href="tel:+79812015823" className="transition-colors hover:text-[#C41E3A]">
                    +7 (981) 201-58-23
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 text-[#C41E3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:industryskills@iitb.ru" className="transition-colors hover:text-[#C41E3A]">
                    industryskills@iitb.ru
                  </a>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white/70 p-4">
                  <p className="font-semibold text-gray-800">
                    {locale === "ru" ? "Марина Гладкова" : "Marina Gladkova"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {locale === "ru"
                      ? "Менеджер по организации соревнований профессионального мастерства Industry Skills"
                      : "Manager for organizing Industry Skills professional mastery competitions"}
                  </p>
                  <div className="mt-3 space-y-2">
                    <a href="mailto:gladkova.m@iitb.ru" className="block transition-colors hover:text-[#C41E3A]">
                      gladkova.m@iitb.ru
                    </a>
                    <a href="tel:+79111954745" className="block transition-colors hover:text-[#C41E3A]">
                      +7 (911) 195-47-45
                    </a>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white/70 p-4">
                  <p className="font-semibold text-gray-800">
                    {locale === "ru" ? "Тимур Белышев" : "Timur Belyshev"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {locale === "ru" ? "Технический эксперт" : "Technical Expert"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {locale === "ru"
                      ? "Инженер тренингового центра компетенций профессионального мастерства Industry Skills"
                      : "Engineer at the Industry Skills professional mastery competency training center"}
                  </p>
                  <div className="mt-3 space-y-2">
                    <a href="mailto:belyshev.t@iitb.ru" className="block transition-colors hover:text-[#C41E3A]">
                      belyshev.t@iitb.ru
                    </a>
                    <a href="tel:+78126440126" className="block transition-colors hover:text-[#C41E3A]">
                      +7 (812) 644-01-26
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-end">
              <Image
                src={locale === "ru" ? "/iitb-logo-ru.png" : "/iitb-logo-en.png"}
                alt="ИИТБ"
                width={200}
                height={60}
                className="object-contain"
              />
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-500">
            <p>© 2026 INDUSTRY SKILLS. {locale === "ru" ? "Все права защищены." : "All rights reserved."}</p>
          </div>
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
  icon: React.ReactNode
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
