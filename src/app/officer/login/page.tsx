'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfficerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Invalid credentials');
      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      router.push('/officer/dashboard');
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-oyoGreen/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-oyoGreen">Verification Officer Login</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 focus:ring-oyoOrange focus:border-oyoOrange" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center px-4 py-2 bg-oyoGreen text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-oyoOrange focus:ring-offset-2 transition-all disabled:opacity-60">
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}



