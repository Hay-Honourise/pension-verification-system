'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';
import { CalendarCheck, Fingerprint, Loader2, Shield } from 'lucide-react';

type BiometricType = 'FACE' | 'FINGERPRINT';

interface VerificationResult {
  success: boolean;
  nextDueAt?: string;
  message?: string;
}

export default function VerifyBiometricPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<BiometricType | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!storedToken) {
      router.push('/pensioner/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  const startVerify = async (type: BiometricType) => {
    if (!token) return;
    if (!window.PublicKeyCredential) {
      setError('Passkeys are not supported in this browser.');
      return;
    }

    setLoading(type);
    setError(null);
    setResult(null);

    try {
      const optionsRes = await fetch(`/api/biometric/verify?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const optionsPayload = await optionsRes.json().catch(() => ({}));

      if (!optionsRes.ok) {
        throw new Error(
          optionsPayload.message ||
            `Unable to start verification. ${
              optionsRes.status === 404 ? 'Register this biometric first.' : ''
            }`,
        );
      }

      const { options } = optionsPayload;
      const assertion = await startAuthentication(options);

      const verifyRes = await fetch('/api/biometric/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assertion, type }),
      });

      const verifyPayload: VerificationResult = await verifyRes.json().catch(() => ({ success: false }));
      if (!verifyRes.ok) {
        throw new Error(verifyPayload.message || 'Verification failed. Please try again.');
      }

      setResult(verifyPayload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to verify biometric credential.';
      setError(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Verify with Passkey</h1>
            <p className="text-slate-600">
              Use your stored passkey (face or fingerprint). Discoverable credentials mean you can complete this on any
              synced device.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {(['FACE', 'FINGERPRINT'] as BiometricType[]).map((type) => (
              <article key={type} className="rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 text-slate-900">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                    {type === 'FACE' ? <Shield className="h-6 w-6" /> : <Fingerprint className="h-6 w-6" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {type === 'FACE' ? 'Face (Windows Hello / Face ID)' : 'Fingerprint / Touch ID'}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Follow your device prompt. If you see “No passkeys on this device”, register first or ensure your
                      account syncs passkeys (Google/iCloud).
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => startVerify(type)}
                  disabled={loading === type}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
                >
                  {loading === type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : type === 'FACE' ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <Fingerprint className="h-4 w-4" />
                  )}
                  {loading === type ? 'Waiting for biometric prompt…' : `Verify ${type.toLowerCase()}`}
                </button>
              </article>
            ))}
          </div>

          {result?.success && (
            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CalendarCheck className="h-4 w-4" />
                Verification successful
              </p>
              {result.nextDueAt && (
                <p className="text-sm">
                  Next verification due:{' '}
                  <span className="font-semibold">{new Date(result.nextDueAt).toLocaleString()}</span>
                </p>
              )}
            </div>
          )}

          {error && (
          <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm">
            {error}
          </div>
          )}

          <footer className="mt-10 rounded-xl bg-slate-100 p-5 text-sm text-slate-600">
            <p>
              Need to register a new device?{' '}
              <button
                onClick={() => router.push('/pensioner/biometric/register')}
                className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
              >
                Go to biometric registration
              </button>
              .
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

