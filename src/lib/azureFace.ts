import { NextRequest } from 'next/server';

const FACE_ENDPOINT = process.env.AZURE_FACE_ENDPOINT || '';
const FACE_KEY = process.env.AZURE_FACE_KEY || '';
const USE_AZURE_MOCK = (process.env.USE_AZURE_MOCK || '').toLowerCase() === 'true';

type DetectResult = { faceId: string }[];

export async function detectFaceFromUrl(url: string): Promise<string | null> {
  if (USE_AZURE_MOCK) {
    return 'mock-face-id-url';
  }
  const endpoint = `${FACE_ENDPOINT.replace(/\/$/, '')}/face/v1.0/detect?returnFaceId=true`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': FACE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) return null;
  const data: DetectResult = await res.json();
  return data?.[0]?.faceId || null;
}

export async function detectFaceFromBuffer(buffer: Buffer): Promise<string | null> {
  if (USE_AZURE_MOCK) {
    return 'mock-face-id-buffer';
  }
  const endpoint = `${FACE_ENDPOINT.replace(/\/$/, '')}/face/v1.0/detect?returnFaceId=true`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': FACE_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });
  if (!res.ok) return null;
  const data: DetectResult = await res.json();
  return data?.[0]?.faceId || null;
}

export async function verifyFaces(faceId1: string, faceId2: string): Promise<{ isIdentical: boolean; confidence: number }> {
  if (USE_AZURE_MOCK) {
    // Simple mock: 70% pass
    const pass = Math.random() < 0.7;
    return { isIdentical: pass, confidence: pass ? 0.85 : 0.42 };
  }
  const endpoint = `${FACE_ENDPOINT.replace(/\/$/, '')}/face/v1.0/verify`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': FACE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ faceId: faceId1, faceId2 }),
  });
  if (!res.ok) throw new Error(`Azure verify failed: ${res.status}`);
  const data = await res.json();
  return { isIdentical: !!data?.isIdentical, confidence: Number(data?.confidence || 0) };
}


