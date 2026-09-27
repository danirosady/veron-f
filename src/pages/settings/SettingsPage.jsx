import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import Card from '@/components/ui/Card'

const languages = [
  { code: 'id', label: 'Indonesia', flag: '🇮🇩', native: 'Bahasa Indonesia' },
  { code: 'en', label: 'English', flag: '🇬🇧', native: 'English' }
]

export default function SettingsPage() {
  const { t, i18n } = useTranslation()

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('i18nextLng', langCode)
    document.documentElement.lang = langCode
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.language.title')}</p>
      </div>

      {/* Language Settings Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('settings.language.title')}</h2>
            <p className="text-sm text-gray-500">{t('settings.language.description')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {languages.map((lang) => {
            const isActive = i18n.language === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className={`font-medium ${isActive ? 'text-primary-700' : 'text-gray-900'}`}>
                      {lang.label}
                    </p>
                    <p className="text-sm text-gray-500">{lang.native}</p>
                  </div>
                </div>
                {isActive && (
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {t('settings.language.current')}: <span className="font-medium text-gray-700">
              {languages.find(l => l.code === i18n.language)?.native}
            </span>
          </p>
        </div>
      </Card>

      {/* General Settings Info */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{t('settings.label.general')}</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">{t('settings.label.language')}</span>
            <span className="font-medium text-gray-900">
              {languages.find(l => l.code === i18n.language)?.native}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Version</span>
            <span className="font-medium text-gray-900">1.0.0</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
