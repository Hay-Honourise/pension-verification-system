'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    staffId: '',
    department: '',
    role: 'ADMIN',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/staff/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed');
      } else {
        router.push(data.redirectTo || '/');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-oyoGreen/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-oyoGreen">Register Staff</h1>
        <p className="text-gray-600 mt-1">Create an account for Admin or Verification Officer</p>

        <form className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div className="md:col-span-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input id="fullName" name="fullName" type="text" required value={form.fullName} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange" />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" name="email" type="email" required value={form.email} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange" />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" required value={form.password} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange" />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number (optional)</label>
            <input id="phone" name="phone" type="tel" value={form.phone} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange" />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="staffId" className="block text-sm font-medium text-gray-700">Staff ID / Employee Number (optional)</label>
            <input id="staffId" name="staffId" type="text" value={form.staffId} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange" />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department / Office (optional)</label>
            <input id="department" name="department" type="text" placeholder="TESCOM, Pension Board" value={form.department} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange" />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <select id="role" name="role" value={form.role} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange">
              <option value="ADMIN">Admin</option>
              <option value="VERIFICATION_OFFICER">Verification Officer</option>
            </select>
          </div>

          {error && (
            <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}

          <div className="md:col-span-2">
            <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center w-full md:w-auto px-6 py-2 bg-oyoGreen text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-oyoOrange focus:ring-offset-2 transition-all disabled:opacity-60">
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


