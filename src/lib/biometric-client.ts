/**
 * Client-side biometric helper utilities
 */

/**
 * Check if platform authenticator (Windows Hello, Touch ID, etc.) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  if (!window.PublicKeyCredential || 
      !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Detect modality support (best-effort)
 * Note: We cannot reliably detect face vs fingerprint on all devices,
 * so this provides best-effort heuristics
 */
export interface ModalitySupport {
  face: 'available' | 'unavailable' | 'unknown';
  fingerprint: 'available' | 'unavailable' | 'unknown';
  platform: 'available' | 'unavailable';
  deviceType: 'windows' | 'ios' | 'android' | 'other';
}

export async function detectModalitySupport(): Promise<ModalitySupport> {
  const support: ModalitySupport = {
    face: 'unknown',
    fingerprint: 'unknown',
    platform: 'unavailable',
    deviceType: 'other'
  };

  if (typeof window === 'undefined') return support;

  // Check platform authenticator availability
  support.platform = await isPlatformAuthenticatorAvailable() ? 'available' : 'unavailable';

  if (!support.platform) {
    return support;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  // Windows detection
  if (userAgent.includes('windows') || platform.includes('win')) {
    support.deviceType = 'windows';
    // Windows Hello can support both face and fingerprint, but we can't detect which
    // Assume both are available if platform authenticator is available
    // User will need to configure Windows Hello with their preferred modality
    support.face = 'available';
    support.fingerprint = 'available';
  }
  // iOS detection
  else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    support.deviceType = 'ios';
    // iPhone X and later have Face ID, older devices have Touch ID
    // We can't reliably detect which, so mark both as available if platform authenticator is available
    // The device will use the appropriate one
    if (support.platform === 'available') {
      // Best guess: newer iPhones have Face ID, older have Touch ID
      // But we'll mark both as available and let the device decide
      support.face = 'available';
      support.fingerprint = 'available';
    }
  }
  // Android detection
  else if (userAgent.includes('android')) {
    support.deviceType = 'android';
    // Android devices typically have fingerprint, some newer ones have face unlock
    // We can't reliably detect which, so mark fingerprint as available
    if (support.platform === 'available') {
      support.fingerprint = 'available';
      support.face = 'unknown'; // Some Android devices have face unlock, but it's not standardized
    }
  }

  return support;
}

/**
 * Get user-friendly message for modality support
 */
export function getModalitySupportMessage(support: ModalitySupport): string {
  if (support.platform === 'unavailable') {
    return 'Your device doesn\'t support platform biometric authentication. Please use a biometric-capable device.';
  }

  const available: string[] = [];
  if (support.face === 'available') available.push('face');
  if (support.fingerprint === 'available') available.push('fingerprint');

  if (available.length === 0) {
    return 'Biometric authentication may not be fully supported on this device.';
  }

  if (available.length === 2) {
    return 'Your device supports both face and fingerprint authentication.';
  }

  return `Your device supports ${available[0]} authentication (best-effort detection).`;
}

/**
 * Convert ArrayBuffer to base64url string
 */
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert base64url string to ArrayBuffer
 */
export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  // Convert base64url to base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  // Convert to binary string then to ArrayBuffer
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

