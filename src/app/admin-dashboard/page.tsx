'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'pensioners', name: 'Pensioners', icon: '👥' },
    { id: 'verification-queue', name: 'Verification Queue', icon: '⏳' },
    { id: 'uploaded-documents', name: 'Uploaded Documents', icon: '📁' },
    { id: 'reports', name: 'Reports', icon: '📈' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  const handleLogout = () => {
    // TODO: Implement logout logic
    router.push('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Total Pensioners</h3>
                <p className="text-3xl font-bold text-green-600">1,247</p>
                <p className="text-sm text-gray-500">+12% from last month</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Pending Verifications</h3>
                <p className="text-3xl font-bold text-orange-600">89</p>
                <p className="text-sm text-gray-500">Requires attention</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Verified This Month</h3>
                <p className="text-3xl font-bold text-blue-600">156</p>
                <p className="text-sm text-gray-500">+8% from last month</p>
              </div>
            </div>
          </div>
        );
      case 'pensioners':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Pensioners Management</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Pensioners list and management interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'verification-queue':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Verification Queue</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Verification queue management interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'uploaded-documents':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Uploaded Documents</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Document management interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Reports and analytics interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">System configuration interface will be implemented here.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* <div className="flex items-center">
              <h1 className="text-xl font-bold">Oyo Pension Verification</h1>
            </div> */}
            <button
              onClick={handleLogout}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
