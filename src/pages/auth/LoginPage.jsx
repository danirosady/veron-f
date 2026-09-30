import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Validation messages (Indonesian - default language)
const validationMessages = {
  id: {
    required: 'Field ini wajib diisi',
    email: 'Format email tidak valid',
    minLength: 'Minimal {{min}} karakter',
  },
  en: {
    required: 'This field is required',
    email: 'Invalid email address',
    minLength: 'Minimum {{min}} characters',
  },
};

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(i18n.language || 'id');

  // Listen for language changes
  useEffect(() => {
    const handleLangChange = (lng) => setLang(lng);
    i18n.on('languageChanged', handleLangChange);
    return () => i18n.off('languageChanged', handleLangChange);
  }, [i18n]);

  // Get messages for current language
  const msg = validationMessages[lang] || validationMessages.id;

  // Recreate schema when language changes
  const loginSchema = useMemo(() => z.object({
    email: z.string().min(1, msg.required).email(msg.email),
    password: z.string().min(1, msg.required).min(8, msg.minLength.replace('{{min}}', '8')),
  }), [lang, msg]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const newFieldErrors = {};
        backendErrors.forEach((fieldErr) => {
          newFieldErrors[fieldErr.field] = fieldErr.message;
        });
        setFieldErrors(newFieldErrors);
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        }
        setIsLoading(false);
        return;
      }

      const message = err.response?.data?.message || t('errors.connectionError');
      setError(message);
      setIsLoading(false);
    }
  };

  // Get error for a field (prioritize backend errors)
  const getFieldError = (field) => {
    return fieldErrors[field] || errors[field]?.message;
  };

  // Check if field is valid (no errors and touched)
  const isFieldValid = (field) => {
    return touchedFields[field] && !getFieldError(field);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlays */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.webp')" }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-900/85" />
      {/* Subtle radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent" />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        {/* Card wrapper - entrance animation via transform + scale, opacity fixed */}
        <div className={cn(
          "w-full max-w-md transition-all duration-700 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-100 -translate-y-8"
        )}>
          {/* Logo & Header */}
          <div className={cn(
            "text-center mb-8 transition-all duration-700 delay-100",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="inline-flex items-center justify-center w-64">
              <img
                src="/logo_type.png"
                alt="TMS Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_100px_rgba(255,255,255,0.8)]"
              />
            </div>
            <p className="text-gray-300 text-lg">Tyre Management Systems</p>
          </div>

          {/* Login Card - Glassmorphism */}
          <div className={cn(
            "relative rounded-2xl shadow-2xl overflow-hidden transition-all duration-700 delay-200 ease-out",
            mounted ? "scale-100" : "scale-95"
          )}>
            {/* Blur layer - backdrop-filter applied at card level, always visible */}
            <div className="absolute inset-0 backdrop-blur-xl" />
            {/* Semi-transparent background */}
            <div className="absolute inset-0 bg-white/10" />
            {/* Border */}
            <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 pointer-events-none" />
            {/* Card content */}
            <div className="relative p-8">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                {/* Error Alert */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/15 border border-red-500/30 rounded-xl backdrop-blur-sm animate-in slide-in-from-top-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">
                    {t('auth.label.email')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className={cn(
                        "w-5 h-5 transition-colors duration-200",
                        getFieldError('email') ? "text-red-400" : "text-gray-400"
                      )} />
                    </div>
                    <input
                      type="email"
                      placeholder="admin@company.com"
                      autoComplete="email"
                      className={cn(
                        "w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50",
                        getFieldError('email')
                          ? "border-red-500/50 bg-red-500/5"
                          : "border-white/10 hover:border-white/20",
                        isFieldValid('email') && "border-green-500/50 bg-green-500/5"
                      )}
                      {...register('email')}
                    />
                    {isFieldValid('email') && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                  </div>
                  {getFieldError('email') && (
                    <div className="flex items-center gap-2 text-red-400 animate-in slide-in-from-top-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-xs">{getFieldError('email')}</span>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">
                    {t('auth.label.password')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className={cn(
                        "w-5 h-5 transition-colors duration-200",
                        getFieldError('password') ? "text-red-400" : "text-gray-400"
                      )} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.placeholder.password')}
                      autoComplete="current-password"
                      className={cn(
                        "w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50",
                        getFieldError('password')
                          ? "border-red-500/50 bg-red-500/5"
                          : "border-white/10 hover:border-white/20",
                        isFieldValid('password') && "border-green-500/50 bg-green-500/5"
                      )}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {getFieldError('password') && (
                    <div className="flex items-center gap-2 text-red-400 animate-in slide-in-from-top-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-xs">{getFieldError('password')}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-6 h-12 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 shadow-lg shadow-primary-500/25 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  loading={isLoading}
                >
                  {t('auth.button.login')}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Secured with SSL encryption</span>
                </div>
              </div>
            </div>
          </div>

          {/* Version */}
          <p className={cn(
            "text-center text-xs text-gray-500 mt-6 transition-all duration-700 delay-300",
            mounted ? "opacity-100" : "opacity-0"
          )}>
            Tyre Management System v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
