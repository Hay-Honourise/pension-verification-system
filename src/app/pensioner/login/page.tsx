'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Lock, LogIn, ArrowLeft } from 'lucide-react';

interface LoginData {
  pensionId: string;
  password: string;
}

export default function PensionerLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginData>({
    pensionId: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateFormData = (field: keyof LoginData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pensionId.trim()) {
      newErrors.pensionId = 'Pension ID is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/pensioner-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pensionId: formData.pensionId,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Store token in localStorage or handle authentication
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        router.push('/pensioner/dashboard');
      } else {
        const error = await response.json();
        setErrors({ general: error.message || 'Login failed. Please check your credentials.' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred during login. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-oyoGreen/5 via-white to-oyoGreen/10 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Icon */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-oyoGreen/10 rounded-full">
              <User className="w-8 h-8 text-oyoGreen" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Pensioner Login</h1>
          <p className="text-sm text-gray-600">Sign in to access your pension verification dashboard</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2 text-gray-500" />
                Pension ID *
              </label>
              <input
                type="text"
                value={formData.pensionId}
                onChange={(e) => updateFormData('pensionId', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-oyoGreen focus:border-oyoGreen transition bg-white text-gray-900 ${
                  errors.pensionId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your Pension ID"
              />
              {errors.pensionId && <p className="text-red-500 text-xs mt-1">{errors.pensionId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2 text-gray-500" />
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-oyoGreen focus:border-oyoGreen transition bg-white text-gray-900 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-oyoGreen text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-oyoGreen focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/pensioner/register" className="text-oyoGreen hover:text-green-700 font-medium">
                  Register here
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
