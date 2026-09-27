import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇬🇧' }
]

export function LanguageSwitcher({ variant = 'dropdown', className = '' }) {
  const { i18n } = useTranslation()
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  const handleChange = (e) => {
    const lang = e.target.value
    i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang)
    document.documentElement.lang = lang
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => {
              i18n.changeLanguage(lang.code)
              localStorage.setItem('i18nextLng', lang.code)
              document.documentElement.lang = lang.code
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              i18n.language === lang.code
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    )
  }

  // Default: dropdown variant
  return (
    <select
      value={i18n.language}
      onChange={handleChange}
      className={`px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white
        hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500
        focus:border-transparent transition-all cursor-pointer ${className}`}
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  )
}

// Simple badge variant for compact spaces
export function LanguageBadge({ className = '' }) {
  const { i18n, t } = useTranslation()
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-lg">{currentLang.flag}</span>
      <span className="text-sm font-medium text-gray-700">
        {currentLang.label}
      </span>
    </div>
  )
}

export default LanguageSwitcher
