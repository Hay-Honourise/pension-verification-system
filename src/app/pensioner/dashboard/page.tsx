'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  pensionId: string;
  fullName: string;
  status: string;
  email: string;
  // Calculated benefits
  yearsOfService?: number;
  totalGratuity?: number;
  monthlyPension?: number;
  gratuityRate?: number;
  pensionRate?: number;
  salary?: number;
  pensionSchemeType?: string;
  currentLevel?: string;
  dateOfFirstAppointment?: string;
  expectedRetirementDate?: string;
}

export default function PensionerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/pensioner/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/pensioner/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Pension Verification Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.fullName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Status</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                user.status === 'VERIFIED' ? 'bg-green-500' : 
                user.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                user.status === 'VERIFIED' ? 'text-green-600' : 
                user.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {user.status === 'VERIFIED' ? 'Verified' : 
                 user.status === 'REJECTED' ? 'Rejected' : 'Pending Verification'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {user.status === 'VERIFIED' ? 'Your pension verification has been completed successfully.' :
               user.status === 'REJECTED' ? 'Your verification was not approved. Please contact support.' :
               'Your application is currently under review. You will be notified once verified.'}
            </p>
          </div>

          {/* Personal Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Pension ID:</span>
                <span className="ml-2 text-gray-900">{user.pensionId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Full Name:</span>
                <span className="ml-2 text-gray-900">{user.fullName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{user.email}</span>
              </div>
              {user.currentLevel && (
                <div>
                  <span className="font-medium text-gray-700">Current Level:</span>
                  <span className="ml-2 text-gray-900">{user.currentLevel}</span>
                </div>
              )}
              {user.salary && (
                <div>
                  <span className="font-medium text-gray-700">Last Salary:</span>
                  <span className="ml-2 text-gray-900">{formatCurrency(user.salary)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                View Documents
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                Download Certificate
              </button>
              <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        {user.yearsOfService && user.totalGratuity && user.monthlyPension && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pension Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Years of Service */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-800 mb-2">Years of Service</h3>
                <div className="text-3xl font-bold text-blue-900">{user.yearsOfService}</div>
                <p className="text-sm text-blue-700 mt-1">years</p>
                {user.dateOfFirstAppointment && user.expectedRetirementDate && (
                  <p className="text-xs text-blue-600 mt-2">
                    From {new Date(user.dateOfFirstAppointment).getFullYear()} to {new Date(user.expectedRetirementDate).getFullYear()}
                  </p>
                )}
              </div>

              {/* Total Gratuity */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-2">Total Gratuity</h3>
                <div className="text-3xl font-bold text-green-900">
                  {formatCurrency(user.totalGratuity)}
                </div>
                <p className="text-sm text-green-700 mt-1">one-time payment</p>
                {user.gratuityRate && (
                  <p className="text-xs text-green-600 mt-2">
                    Rate: {formatPercentage(user.gratuityRate)}
                  </p>
                )}
              </div>

              {/* Monthly Pension */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-800 mb-2">Monthly Pension</h3>
                <div className="text-3xl font-bold text-purple-900">
                  {formatCurrency(user.monthlyPension)}
                </div>
                <p className="text-sm text-purple-700 mt-1">per month</p>
                {user.pensionRate && (
                  <p className="text-xs text-purple-600 mt-2">
                    Rate: {formatPercentage(user.pensionRate)}
                  </p>
                )}
              </div>
            </div>

            {/* Scheme Information */}
            {user.pensionSchemeType && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Pension Scheme Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Scheme Type:</span>
                    <span className="ml-2 text-gray-900 capitalize">{user.pensionSchemeType}</span>
                  </div>
                  {user.gratuityRate && (
                    <div>
                      <span className="font-medium text-gray-700">Gratuity Rate:</span>
                      <span className="ml-2 text-gray-900">{formatPercentage(user.gratuityRate)}</span>
                    </div>
                  )}
                  {user.pensionRate && (
                    <div>
                      <span className="font-medium text-gray-700">Pension Rate:</span>
                      <span className="ml-2 text-gray-900">{formatPercentage(user.pensionRate)}</span>
                    </div>
                  )}
                  {user.salary && (
                    <div>
                      <span className="font-medium text-gray-700">Last Salary:</span>
                      <span className="ml-2 text-gray-900">{formatCurrency(user.salary)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Registration completed</p>
                  <p className="text-xs text-gray-500">Today at 10:30 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Documents uploaded</p>
                  <p className="text-xs text-gray-500">Today at 10:25 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Account created</p>
                  <p className="text-xs text-gray-500">Today at 10:20 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
