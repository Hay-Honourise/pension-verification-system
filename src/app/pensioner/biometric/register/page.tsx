'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, Loader2, ShieldCheck, Smartphone, UserCheck } from 'lucide-react';
import { isPlatformAuthenticatorAvailable } from '@/lib/biometric-client';

type BiometricType = 'FACE' | 'FINGERPRINT';

interface StatusMessage {
  tone: 'success' | 'error' | 'info';
  text: string;
}

const typeOptions: Array<{
  type: BiometricType;
  title: string;
  description: string;
  icon: JSX.Element;
}> = [
  {
    type: 'FACE',
    title: 'Face (Windows Hello / Face ID)',
    description: 'Use your webcam or device camera to store a passkey that syncs across your devices.',
    icon: <UserCheck className="h-6 w-6" />,
  },
  {
    type: 'FINGERPRINT',
    title: 'Fingerprint / Touch ID',
    description: 'Use the fingerprint sensor on your Windows laptop or Android device.',
    icon: <Fingerprint className="h-6 w-6" />,
  },
];

export default function RegisterBiometricPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<BiometricType | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [platformAvailable, setPlatformAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!storedToken) {
      router.push('/pensioner/login');
      return;
    }
    setToken(storedToken);

    isPlatformAuthenticatorAvailable()
      .then(setPlatformAvailable)
      .catch(() => setPlatformAvailable(false));
  }, [router]);

  const deviceWarning = useMemo(() => {
    if (platformAvailable === false) {
      return 'This device does not expose a platform authenticator. Try again on a phone or laptop with Windows Hello / Face ID / Touch ID enabled.';
    }
    return 'Ensure biometrics + device screen lock are enabled. PIN-only enrollment is blocked.';
  }, [platformAvailable]);

  const handleRegister = async (type: BiometricType) => {
    if (!token) return;
    if (!window.PublicKeyCredential) {
      setStatus({
        tone: 'error',
        text: 'This browser does not support passkeys. Please use Chrome, Edge, Safari, or Firefox on a secure device.',
      });
      return;
    }

    setLoading(type);
    setStatus({
      tone: 'info',
      text: 'When prompted, choose biometric authentication. Avoid selecting PIN.',
    });

    try {
      const res = await fetch(`/api/biometric/register?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || 'Unable to start registration.');
      }

      const { options } = payload;
      const attestation = await startRegistration(options);

      const verifyRes = await fetch('/api/biometric/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attestation, type }),
      });

      const verifyPayload = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        throw new Error(verifyPayload.message || 'Biometric registration failed.');
      }

      setStatus({
        tone: 'success',
        text: 'Passkey saved! It will sync to other devices that share this account (iCloud Keychain / Google Password Manager).',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete registration.';
      setStatus({ tone: 'error', text: message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Register a Discoverable Passkey</h1>
            <p className="text-slate-600">
              Register face or fingerprint once. Afterwards you can verify on any synced device using the same
              platform account (Windows Hello, Android, iOS).
            </p>
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-900">
              {deviceWarning}
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {typeOptions.map((option) => (
              <article key={option.type} className="rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 text-slate-900">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-700">{option.icon}</div>
                  <div>
                    <h2 className="text-lg font-semibold">{option.title}</h2>
                    <p className="text-sm text-slate-500">{option.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRegister(option.type)}
                  disabled={loading === option.type}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {loading === option.type ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                  {loading === option.type ? 'Waiting for biometric prompt…' : `Register ${option.type.toLowerCase()}`}
                </button>
              </article>
            ))}
          </div>

          {status && (
            <div
              className={`mt-8 rounded-xl border p-4 text-sm ${
                status.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : status.tone === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}
            >
              {status.text}
            </div>
          )}

          <footer className="mt-10 rounded-xl bg-slate-100 p-5 text-sm text-slate-600">
            <p className="font-semibold">Need to verify?</p>
            <p>
              After registration, head to the{' '}
              <button
                onClick={() => router.push('/pensioner/biometric/verify')}
                className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
              >
                biometric verification page
              </button>{' '}
              to run a passkey check.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

