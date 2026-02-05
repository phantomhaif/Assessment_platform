import Link from "next/link"
import { Award, Users, ClipboardList, FileCheck } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-red-600" />
              <span className="font-bold text-xl">Assessment Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Регистрация
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Платформа оценки соревнований профессионального мастерства
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Организуйте соревнования, проводите оценивание по стандартам WorldSkills
            и автоматически генерируйте Skill Passport для участников
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors text-lg"
            >
              Начать работу
            </Link>
            <Link
              href="/events"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-lg"
            >
              Мероприятия
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Возможности платформы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Users className="h-8 w-8 text-red-600" />}
              title="Регистрация участников"
              description="Удобная система подачи заявок и формирования команд"
            />
            <FeatureCard
              icon={<ClipboardList className="h-8 w-8 text-red-600" />}
              title="Импорт схем оценки"
              description="Загрузка Excel-шаблонов с критериями и привязкой к WSSS"
            />
            <FeatureCard
              icon={<FileCheck className="h-8 w-8 text-red-600" />}
              title="Онлайн-оценивание"
              description="Интуитивный интерфейс для экспертов с автосохранением"
            />
            <FeatureCard
              icon={<Award className="h-8 w-8 text-red-600" />}
              title="Skill Passport"
              description="Автоматическая генерация сертификатов в PDF"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Как это работает
          </h2>
          <div className="space-y-8">
            <Step
              number={1}
              title="Создайте мероприятие"
              description="Укажите название, даты, компетенцию и загрузите схему оценки из Excel"
            />
            <Step
              number={2}
              title="Соберите заявки"
              description="Участники регистрируются и подают заявки, вы формируете команды"
            />
            <Step
              number={3}
              title="Проведите оценивание"
              description="Эксперты выставляют оценки по критериям через удобный интерфейс"
            />
            <Step
              number={4}
              title="Опубликуйте результаты"
              description="Skill Passport автоматически генерируется и доступен участникам"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Готовы начать?
          </h2>
          <p className="text-red-100 mb-8 text-lg">
            Зарегистрируйтесь и создайте своё первое мероприятие
          </p>
          <Link
            href="/register"
            className="bg-white text-red-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors text-lg inline-block"
          >
            Создать аккаунт
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Assessment Platform - Платформа оценки соревнований профессионального мастерства</p>
          <p className="mt-2">Robotics Skills / Industry Skills</p>
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
