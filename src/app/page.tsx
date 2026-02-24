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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Industry Skills" width={40} height={40} />
              <span className="font-bold text-xl">Assessment Platform</span>
            </div>
            <div className="flex items-center gap-4">
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
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
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
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors text-lg"
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
              icon={<Users className="h-8 w-8 text-red-600" />}
              title={t.home.featureRegistration}
              description={t.home.featureRegistrationDesc}
            />
            <FeatureCard
              icon={<ClipboardList className="h-8 w-8 text-red-600" />}
              title={t.home.featureImport}
              description={t.home.featureImportDesc}
            />
            <FeatureCard
              icon={<FileCheck className="h-8 w-8 text-red-600" />}
              title={t.home.featureScoring}
              description={t.home.featureScoringDesc}
            />
            <FeatureCard
              icon={<Award className="h-8 w-8 text-red-600" />}
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
      <section className="py-16 px-4 bg-red-600">
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
              className="bg-white text-red-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors text-lg inline-block"
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
              <h3 className="font-bold text-gray-900 mb-3">Assessment Platform</h3>
              <p className="text-gray-600 text-sm">
                {t.home.footerText}
              </p>
            </div>

            {/* IITB Contacts */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">
                {locale === "ru" ? "Контакты ИИТБ" : "IITB Contacts"}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  {locale === "ru"
                    ? "Санкт-Петербург, пр. Обуховской Обороны, д. 199, лит. Ж"
                    : "St. Petersburg, Obukhovsky Oborony Ave., 199, lit. Zh"}
                </p>
                <p>
                  <a href="tel:+78126776890" className="hover:text-red-600">
                    +7 (812) 677-68-90
                  </a>
                </p>
                <p>
                  <a href="mailto:info@iitb.ru" className="hover:text-red-600">
                    info@iitb.ru
                  </a>
                </p>
                <div className="flex gap-3 mt-3">
                  <a href="https://vk.com/iitb_official" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-600">
                    VK
                  </a>
                  <a href="https://t.me/iitb_official" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-600">
                    Telegram
                  </a>
                  <a href="https://youtube.com/@iitb_official" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-600">
                    YouTube
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
            <p>© 2026 Assessment Platform. {locale === "ru" ? "Все права защищены." : "All rights reserved."}</p>
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
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-xl mb-4">
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
    <div className="flex gap-6">
      <div className="flex-shrink-0 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}
