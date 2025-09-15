'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PensionerVerificationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'PENDING_REVIEW' | 'ERROR'>('IDLE');
  const [history, setHistory] = useState<Array<{ id: number; method: string; status: string; verifiedAt: string | null; nextDueAt: string | null }>>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/pensioner/login');
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/pensioner/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setProfilePhoto(data?.pensioner?.photo || null);
          const logs = data?.pensioner?.verificationLogs || [];
          setHistory(logs);
        }
      } catch {}
    })();
  }, [router]);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch (e) {
      setMessage('Unable to access camera');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsCapturing(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setSnapshot(dataUrl);
  };

  const dataURLToBlob = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const verify = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/pensioner/login');
      return;
    }
    if (!snapshot) {
      setMessage('Please capture a photo first.');
      return;
    }
    setStatus('VERIFYING');
    setMessage('Verifying…');
    try {
      const blob = dataURLToBlob(snapshot);
      const form = new FormData();
      form.append('captured', new File([blob], 'captured.jpg', { type: 'image/jpeg' }));
      const res = await fetch('/api/verification/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setStatus('SUCCESS');
        setMessage(`Verification Successful ✅ Next Due: ${data?.nextDueAt ? new Date(data.nextDueAt).toLocaleDateString() : ''}`);
      } else if (data?.status === 'PENDING_REVIEW') {
        setStatus('PENDING_REVIEW');
        setMessage('Verification could not be completed automatically. A Verification Officer will review within 24 hours.');
      } else {
        setStatus('ERROR');
        setMessage(data?.message || 'Verification failed.');
      }
    } catch (e) {
      setStatus('ERROR');
      setMessage('An error occurred during verification.');
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Face Verification</h1>

        <div className="flex items-center space-x-4 mb-6">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Stored profile" className="w-16 h-16 rounded-full object-cover border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200" />
          )}
          <div className="text-sm text-gray-600">This is your stored profile photo used for matching.</div>
        </div>

        {!profilePhoto && (
          <div className="mb-6 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            <div className="font-medium">No stored profile photo on record</div>
            <div className="mt-1">Please upload a clear passport-style photo in your profile before starting verification.</div>
            <button
              onClick={() => router.push('/pensioner/dashboard')}
              className="mt-3 inline-flex items-center rounded bg-yellow-600 px-3 py-1.5 text-white hover:bg-yellow-700"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          {!isCapturing ? (
            <div className="flex items-center gap-3">
              <button
                onClick={startCamera}
                disabled={!profilePhoto}
                title={!profilePhoto ? 'Upload a profile photo first' : ''}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Start Verification
              </button>
              {!profilePhoto && (
                <button
                  onClick={() => router.push('/pensioner/dashboard')}
                  className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Upload Photo
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <video ref={videoRef} className="w-full rounded border" playsInline muted />
                  <div className="mt-2 flex space-x-2">
                    <button onClick={capture} className="px-3 py-2 bg-oyoGreen text-white rounded">Capture</button>
                    <button onClick={stopCamera} className="px-3 py-2 bg-gray-200 rounded">Stop</button>
                  </div>
                </div>
                <div>
                  <canvas ref={canvasRef} className="w-full rounded border" />
                  {snapshot && (
                    <div className="mt-2">
                      <img src={snapshot} alt="Captured" className="w-full rounded border" />
                      <button onClick={verify} className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Verify</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 text-sm" aria-live="polite">{message}</div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Recent Verification Activity</h2>
          <div className="space-y-2">
            {history.length === 0 && <div className="text-sm text-gray-500">No recent verification logs.</div>}
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between bg-white rounded border p-3">
                <div>
                  <div className="text-sm font-medium">{h.method}</div>
                  <div className="text-xs text-gray-600">{h.verifiedAt ? new Date(h.verifiedAt).toLocaleString() : '—'}</div>
                </div>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded ${h.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : h.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{h.status}</span>
                  {h.nextDueAt && <span className="ml-2 text-xs text-gray-500">Next due: {new Date(h.nextDueAt).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


