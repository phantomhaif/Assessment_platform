"use client"

import Link from "next/link"
import Image from "next/image"
import { Award, Users, ClipboardList, FileCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export default function Home() {
  const { t, locale, setLocale } = useI18n()
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Image src="/logo.png" alt="Industry Skills" width={40} height={40} />
              <span className="truncate font-bold text-base sm:text-xl">INDUSTRY SKILLS Платформа оценивания</span>
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-4">
              <button
                onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {locale === "ru" ? "EN" : "RU"}
              </button>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                {locale === "ru" ? "Войти" : "Login"}
              </Link>
              <Link
                href="/register"
                className="bg-[#C41E3A] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#a01830] transition-colors"
              >
                {locale === "ru" ? "Регистрация" : "Sign up"}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t.home.heroTitle}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t.home.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-[#C41E3A] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#a01830] transition-colors text-lg"
            >
              {t.home.startButton}
            </Link>
            <Link
              href="/events"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-lg"
            >
              {t.home.eventsButton}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t.home.featuresTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t.home.howItWorksTitle}
          </h2>
          <div className="space-y-8">
            <Step
              number={1}
              title={t.home.step1Title}
              description={t.home.step1Desc}
            />
            <Step
              number={2}
              title={t.home.step2Title}
              description={t.home.step2Desc}
            />
            <Step
              number={3}
              title={t.home.step3Title}
              description={t.home.step3Desc}
            />
            <Step
              number={4}
              title={t.home.step4Title}
              description={t.home.step4Desc}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#C41E3A]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t.home.ctaTitle}
          </h2>
          <p className="text-red-100 mb-8 text-lg">
            {t.home.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-[#C41E3A] px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors text-lg inline-block"
            >
              {t.home.createAccount}
            </Link>
            <Link
              href="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors text-lg inline-block"
            >
              {t.home.loginAccount}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About Platform */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">INDUSTRY SKILLS</h3>
              <p className="text-gray-600 text-sm">
                {t.home.footerText}
              </p>
            </div>

            {/* IITB Contacts */}
            <div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-[#C41E3A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="h-5 w-5 text-[#C41E3A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+78126440126" className="hover:text-[#C41E3A] transition-colors">
                    +7 (812) 644-01-26
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#C41E3A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <a href="tel:+79812015823" className="hover:text-[#C41E3A] transition-colors">
                    +7 (981) 201-58-23
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#C41E3A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:info@iitb.ru" className="hover:text-[#C41E3A] transition-colors">
                    info@iitb.ru
                  </a>
                </div>
              </div>
            </div>

            {/* IITB Logo */}
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

          <div className="border-t border-gray-300 pt-6 text-center text-gray-500 text-sm">
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
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#C41E3A]/10 rounded-xl mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
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
      <div className="flex-shrink-0 w-10 h-10 bg-[#C41E3A] text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}
