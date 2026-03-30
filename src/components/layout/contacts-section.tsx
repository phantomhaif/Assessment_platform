import Image from "next/image"
import { getPlatformTitle } from "@/lib/brand"
import type { Locale } from "@/lib/i18n/dictionaries"
import { cn } from "@/lib/utils"

interface ContactsSectionProps {
  locale: Locale
  className?: string
}

const contacts = {
  ru: {
    title: "Контакты",
    subtitle: "Организационные и технические вопросы по платформе и соревнованиям.",
    rights: "Все права защищены.",
    platformLabel: "Платформа оценки знаний",
    instituteLabel: "Институт Инновационных Технологий в Бизнесе",
    addressLabel: "Адрес",
    phoneLabel: "Телефоны",
    emailLabel: "Почта",
    addressCountry: "197046, Россия",
    addressLine: "Санкт-Петербург, Петроградская набережная, д. 36А",
    people: [
      {
        name: "Марина Гладкова",
        role: "Менеджер по организации соревнований профессионального мастерства Industry Skills",
        email: "gladkova.m@iitb.ru",
        phone: "+7 (911) 195-47-45",
      },
      {
        name: "Тимур Белышев",
        role: "Технический эксперт",
        description: "Инженер тренингового центра компетенций профессионального мастерства Industry Skills",
        email: "belyshev.t@iitb.ru",
        phone: "+7 (812) 644-01-26",
      },
    ],
  },
  en: {
    title: "Contacts",
    subtitle: "Organizational and technical contacts for the platform and competitions.",
    rights: "All rights reserved.",
    platformLabel: "Knowledge Assessment Platform",
    instituteLabel: "Institute of Innovations in Business Technologies",
    addressLabel: "Address",
    phoneLabel: "Phones",
    emailLabel: "Email",
    addressCountry: "197046, Russia",
    addressLine: "St. Petersburg, Petrogradskaya Embankment, 36A",
    people: [
      {
        name: "Marina Gladkova",
        role: "Manager for organizing Industry Skills professional mastery competitions",
        email: "gladkova.m@iitb.ru",
        phone: "+7 (911) 195-47-45",
      },
      {
        name: "Timur Belyshev",
        role: "Technical Expert",
        description: "Engineer at the Industry Skills professional mastery competency training center",
        email: "belyshev.t@iitb.ru",
        phone: "+7 (812) 644-01-26",
      },
    ],
  },
} as const

export function ContactsSection({ locale, className }: ContactsSectionProps) {
  const copy = contacts[locale]

  return (
    <section className={cn("rounded-[32px] border border-slate-200 bg-slate-50/80 p-6 shadow-sm sm:p-8", className)}>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C41E3A]">Industry Skills</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">{copy.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{copy.subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {copy.people.map((person) => (
          <article
            key={person.email}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.45)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Industry Skills</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">{person.name}</h3>
            <p className="mt-3 text-sm font-medium text-slate-700">{person.role}</p>
            {"description" in person && person.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">{person.description}</p>
            ) : null}
            <div className="mt-6 space-y-2 text-sm">
              <a className="block text-slate-700 transition-colors hover:text-[#C41E3A]" href={`mailto:${person.email}`}>
                {person.email}
              </a>
              <a className="block text-slate-700 transition-colors hover:text-[#C41E3A]" href={`tel:${person.phone.replace(/[^\d+]/g, "")}`}>
                {person.phone}
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.25)] sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-start">
          <div className="self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">{copy.platformLabel}</p>
            <p className="mt-2 max-w-xl text-2xl font-semibold leading-tight text-slate-950">{getPlatformTitle(locale)}</p>
            <p className="mt-3 text-sm text-slate-600">{copy.instituteLabel}</p>
          </div>

          <div className="grid gap-5 self-start sm:grid-cols-3 lg:grid-cols-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{copy.addressLabel}</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{copy.addressCountry}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{copy.addressLine}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{copy.phoneLabel}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <a className="block transition-colors hover:text-[#C41E3A]" href="tel:+78126440126">
                  +7 (812) 644-01-26
                </a>
                <a className="block transition-colors hover:text-[#C41E3A]" href="tel:+79812015823">
                  +7 (981) 201-58-23
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{copy.emailLabel}</p>
              <a className="mt-2 block text-sm text-slate-700 transition-colors hover:text-[#C41E3A]" href="mailto:industryskills@iitb.ru">
                industryskills@iitb.ru
              </a>
            </div>
          </div>

          <div className="flex self-start justify-start lg:justify-end">
            <Image
              src={locale === "ru" ? "/iitb-logo-ru.png" : "/iitb-logo-en.png"}
              alt="IITB"
              width={220}
              height={72}
              className="h-auto w-[180px] object-contain sm:w-[220px]"
            />
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500">
          © 2026 INDUSTRY SKILLS. {copy.rights}
        </div>
      </div>
    </section>
  )
}
