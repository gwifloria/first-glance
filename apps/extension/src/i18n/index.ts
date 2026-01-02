import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import locale resources
import zhCNCommon from './locales/zh-CN/common.json'
import zhCNSidebar from './locales/zh-CN/sidebar.json'
import zhCNTask from './locales/zh-CN/task.json'
import zhCNSettings from './locales/zh-CN/settings.json'
import zhCNOnboarding from './locales/zh-CN/onboarding.json'
import zhCNFocus from './locales/zh-CN/focus.json'

import enCommon from './locales/en/common.json'
import enSidebar from './locales/en/sidebar.json'
import enTask from './locales/en/task.json'
import enSettings from './locales/en/settings.json'
import enOnboarding from './locales/en/onboarding.json'
import enFocus from './locales/en/focus.json'

const resources = {
  'zh-CN': {
    common: zhCNCommon,
    sidebar: zhCNSidebar,
    task: zhCNTask,
    settings: zhCNSettings,
    onboarding: zhCNOnboarding,
    focus: zhCNFocus,
  },
  en: {
    common: enCommon,
    sidebar: enSidebar,
    task: enTask,
    settings: enSettings,
    onboarding: enOnboarding,
    focus: enFocus,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en'],

    detection: {
      order: ['navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    defaultNS: 'common',
    ns: ['common', 'sidebar', 'task', 'settings', 'onboarding', 'focus'],

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  })

export default i18n
