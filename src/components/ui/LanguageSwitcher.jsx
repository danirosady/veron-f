import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const languages = [
  { code: 'id', label: 'Indonesia' },
  { code: 'en', label: 'English' }
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
            className={`px-3 py-1.5 text-sm transition-colors ${
              i18n.language === lang.code
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang.label} ({lang.code.toUpperCase()})
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
          {lang.label} ({lang.code.toUpperCase()})
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
      <Globe className="w-4 h-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">
        {currentLang.label}
      </span>
    </div>
  )
}

// Compact toggle — click to switch language
export function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation()
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]
  const otherLang = languages.find(l => l.code !== i18n.language)

  const toggle = () => {
    i18n.changeLanguage(otherLang.code)
    localStorage.setItem('i18nextLng', otherLang.code)
    document.documentElement.lang = otherLang.code
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border border-gray-300
        bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors ${className}`}
      title={`Switch to ${otherLang.label}`}
    >
      <Globe className="w-3 h-3" />
      <span>{currentLang.code.toUpperCase()}</span>
    </button>
  )
}

export default LanguageSwitcher
