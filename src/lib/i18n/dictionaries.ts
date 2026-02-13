export const dictionaries = {
  ru: {
    // Common
    common: {
      loading: "Загрузка...",
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Редактировать",
      create: "Создать",
      search: "Поиск",
      filter: "Фильтр",
      actions: "Действия",
      back: "Назад",
      next: "Далее",
      submit: "Отправить",
      confirm: "Подтвердить",
      close: "Закрыть",
      yes: "Да",
      no: "Нет",
      all: "Все",
      none: "Нет",
      download: "Скачать",
      upload: "Загрузить",
      view: "Просмотр",
      details: "Подробнее",
      status: "Статус",
      date: "Дата",
      name: "Название",
      description: "Описание",
      email: "Email",
      password: "Пароль",
      phone: "Телефон",
      organization: "Организация",
      position: "Должность",
      role: "Роль",
      error: "Ошибка",
      success: "Успешно",
    },

    // Navigation
    nav: {
      dashboard: "Главная",
      events: "Мероприятия",
      myPassports: "Мои паспорта",
      profile: "Профиль",
      regulations: "Положения",
      admin: "Администрирование",
      users: "Пользователи",
      teams: "Команды",
      applications: "Заявки",
      documents: "Документы",
      scoring: "Оценивание",
      passports: "Паспорта",
      schemas: "Схемы оценки",
      logout: "Выйти",
      login: "Войти",
      register: "Регистрация",
    },

    // Auth
    auth: {
      loginTitle: "Вход в систему",
      registerTitle: "Регистрация",
      email: "Email",
      password: "Пароль",
      confirmPassword: "Подтвердите пароль",
      firstName: "Имя",
      lastName: "Фамилия",
      middleName: "Отчество",
      rememberMe: "Запомнить меня",
      forgotPassword: "Забыли пароль?",
      noAccount: "Нет аккаунта?",
      hasAccount: "Уже есть аккаунт?",
      loginButton: "Войти",
      registerButton: "Зарегистрироваться",
      invalidCredentials: "Неверный email или пароль",
      agreementRequired: "Необходимо согласие с условиями",
      agreeToTerms: "Я согласен с условиями использования",
      agreeToDataProcessing: "Я согласен на обработку персональных данных",
    },

    // Events
    events: {
      title: "Мероприятия",
      createEvent: "Создать мероприятие",
      editEvent: "Редактировать мероприятие",
      eventName: "Название мероприятия",
      competency: "Компетенция",
      registrationPeriod: "Период регистрации",
      eventPeriod: "Период проведения",
      registrationStart: "Начало регистрации",
      registrationEnd: "Конец регистрации",
      eventStart: "Начало мероприятия",
      eventEnd: "Конец мероприятия",
      teamSize: "Размер команды",
      minTeamSize: "Мин. участников",
      maxTeamSize: "Макс. участников",
      status: {
        draft: "Черновик",
        registration_open: "Регистрация открыта",
        registration_closed: "Регистрация закрыта",
        in_progress: "В процессе",
        scoring: "Оценивание",
        results_published: "Результаты опубликованы",
        archived: "Архив",
      },
      apply: "Подать заявку",
      applied: "Заявка подана",
      noEvents: "Нет доступных мероприятий",
    },

    // Teams
    teams: {
      title: "Команды",
      createTeam: "Создать команду",
      teamName: "Название команды",
      members: "Участники",
      addMember: "Добавить участника",
      removeMember: "Удалить участника",
      teamNumber: "Номер команды",
      totalScore: "Общий балл",
      rank: "Место",
      files: "Файлы команды",
      uploadFile: "Загрузить файл",
      noTeams: "Нет команд",
    },

    // Applications
    applications: {
      title: "Заявки",
      pending: "На рассмотрении",
      approved: "Одобрена",
      rejected: "Отклонена",
      withdrawn: "Отозвана",
      approve: "Одобрить",
      reject: "Отклонить",
      comment: "Комментарий",
      noApplications: "Нет заявок",
    },

    // Profile
    profile: {
      title: "Профиль",
      editProfile: "Редактировать профиль",
      changePhoto: "Изменить фото",
      personalInfo: "Личная информация",
      contactInfo: "Контактная информация",
      workInfo: "Рабочая информация",
      saveChanges: "Сохранить изменения",
    },

    // Passports
    passports: {
      title: "Паспорта компетенций",
      myPassports: "Мои паспорта",
      downloadPdf: "Скачать PDF",
      totalScore: "Общий балл",
      moduleScores: "Баллы по модулям",
      skillGroupScores: "Баллы по группам навыков",
      publishedAt: "Опубликован",
      noPassports: "Нет паспортов компетенций",
    },

    // Documents
    documents: {
      title: "Документы",
      uploadDocument: "Загрузить документ",
      documentName: "Название документа",
      documentType: "Тип документа",
      accessLevel: "Уровень доступа",
      version: "Версия",
      types: {
        regulation: "Положение",
        smp: "СМП",
        infrastructure: "Инфраструктура",
        schedule: "Расписание",
        other: "Другое",
      },
      access: {
        public: "Публичный",
        participants: "Участники",
        experts: "Эксперты",
        organizers: "Организаторы",
      },
    },

    // Scoring
    scoring: {
      title: "Оценивание",
      module: "Модуль",
      criterion: "Критерий",
      score: "Балл",
      maxScore: "Макс. балл",
      comment: "Комментарий",
      saveScore: "Сохранить оценку",
    },

    // Roles
    roles: {
      guest: "Гость",
      participant: "Участник",
      expert: "Эксперт",
      organizer: "Организатор",
      admin: "Администратор",
    },

    // Errors
    errors: {
      required: "Обязательное поле",
      invalidEmail: "Неверный формат email",
      passwordMismatch: "Пароли не совпадают",
      minLength: "Минимальная длина: {min} символов",
      maxLength: "Максимальная длина: {max} символов",
      serverError: "Ошибка сервера",
      notFound: "Не найдено",
      unauthorized: "Необходима авторизация",
      forbidden: "Доступ запрещен",
    },
  },

  en: {
    // Common
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      filter: "Filter",
      actions: "Actions",
      back: "Back",
      next: "Next",
      submit: "Submit",
      confirm: "Confirm",
      close: "Close",
      yes: "Yes",
      no: "No",
      all: "All",
      none: "None",
      download: "Download",
      upload: "Upload",
      view: "View",
      details: "Details",
      status: "Status",
      date: "Date",
      name: "Name",
      description: "Description",
      email: "Email",
      password: "Password",
      phone: "Phone",
      organization: "Organization",
      position: "Position",
      role: "Role",
      error: "Error",
      success: "Success",
    },

    // Navigation
    nav: {
      dashboard: "Dashboard",
      events: "Events",
      myPassports: "My Passports",
      profile: "Profile",
      regulations: "Regulations",
      admin: "Administration",
      users: "Users",
      teams: "Teams",
      applications: "Applications",
      documents: "Documents",
      scoring: "Scoring",
      passports: "Passports",
      schemas: "Assessment Schemas",
      logout: "Logout",
      login: "Login",
      register: "Register",
    },

    // Auth
    auth: {
      loginTitle: "Sign In",
      registerTitle: "Sign Up",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      firstName: "First Name",
      lastName: "Last Name",
      middleName: "Middle Name",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      loginButton: "Sign In",
      registerButton: "Sign Up",
      invalidCredentials: "Invalid email or password",
      agreementRequired: "Agreement is required",
      agreeToTerms: "I agree to the terms of service",
      agreeToDataProcessing: "I agree to the processing of personal data",
    },

    // Events
    events: {
      title: "Events",
      createEvent: "Create Event",
      editEvent: "Edit Event",
      eventName: "Event Name",
      competency: "Competency",
      registrationPeriod: "Registration Period",
      eventPeriod: "Event Period",
      registrationStart: "Registration Start",
      registrationEnd: "Registration End",
      eventStart: "Event Start",
      eventEnd: "Event End",
      teamSize: "Team Size",
      minTeamSize: "Min. members",
      maxTeamSize: "Max. members",
      status: {
        draft: "Draft",
        registration_open: "Registration Open",
        registration_closed: "Registration Closed",
        in_progress: "In Progress",
        scoring: "Scoring",
        results_published: "Results Published",
        archived: "Archived",
      },
      apply: "Apply",
      applied: "Applied",
      noEvents: "No events available",
    },

    // Teams
    teams: {
      title: "Teams",
      createTeam: "Create Team",
      teamName: "Team Name",
      members: "Members",
      addMember: "Add Member",
      removeMember: "Remove Member",
      teamNumber: "Team Number",
      totalScore: "Total Score",
      rank: "Rank",
      files: "Team Files",
      uploadFile: "Upload File",
      noTeams: "No teams",
    },

    // Applications
    applications: {
      title: "Applications",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
      approve: "Approve",
      reject: "Reject",
      comment: "Comment",
      noApplications: "No applications",
    },

    // Profile
    profile: {
      title: "Profile",
      editProfile: "Edit Profile",
      changePhoto: "Change Photo",
      personalInfo: "Personal Information",
      contactInfo: "Contact Information",
      workInfo: "Work Information",
      saveChanges: "Save Changes",
    },

    // Passports
    passports: {
      title: "Skill Passports",
      myPassports: "My Passports",
      downloadPdf: "Download PDF",
      totalScore: "Total Score",
      moduleScores: "Module Scores",
      skillGroupScores: "Skill Group Scores",
      publishedAt: "Published",
      noPassports: "No skill passports",
    },

    // Documents
    documents: {
      title: "Documents",
      uploadDocument: "Upload Document",
      documentName: "Document Name",
      documentType: "Document Type",
      accessLevel: "Access Level",
      version: "Version",
      types: {
        regulation: "Regulation",
        smp: "SMP",
        infrastructure: "Infrastructure",
        schedule: "Schedule",
        other: "Other",
      },
      access: {
        public: "Public",
        participants: "Participants",
        experts: "Experts",
        organizers: "Organizers",
      },
    },

    // Scoring
    scoring: {
      title: "Scoring",
      module: "Module",
      criterion: "Criterion",
      score: "Score",
      maxScore: "Max Score",
      comment: "Comment",
      saveScore: "Save Score",
    },

    // Roles
    roles: {
      guest: "Guest",
      participant: "Participant",
      expert: "Expert",
      organizer: "Organizer",
      admin: "Administrator",
    },

    // Errors
    errors: {
      required: "Required field",
      invalidEmail: "Invalid email format",
      passwordMismatch: "Passwords do not match",
      minLength: "Minimum length: {min} characters",
      maxLength: "Maximum length: {max} characters",
      serverError: "Server error",
      notFound: "Not found",
      unauthorized: "Authorization required",
      forbidden: "Access denied",
    },
  },
} as const

export type Locale = keyof typeof dictionaries

// Create a type that works for both locales
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string
}

export type Dictionary = DeepStringify<typeof dictionaries.ru>
