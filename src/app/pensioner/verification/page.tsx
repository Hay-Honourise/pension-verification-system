'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Fingerprint, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  History,
  HelpCircle,
  X,
  BookOpen
} from 'lucide-react';

interface BiometricCredential {
  id: string;
  type: 'FACE' | 'FINGERPRINT';
  registeredAt: string;
}

interface VerificationLog {
  id: number;
  method: string;
  status: string;
  verifiedAt: string | null;
  nextDueAt: string | null;
  officerName?: string;
}

export default function BiometricVerificationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [registeredCredentials, setRegisteredCredentials] = useState<BiometricCredential[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VerificationLog[]>([]);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
  const [isWindowsHelloSupported, setIsWindowsHelloSupported] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugCredentials, setDebugCredentials] = useState<Array<{id: string; type: string; credentialId: string; registeredAt: string}>>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/pensioner/login');
      return;
    }

    // Check WebAuthn support
    const webAuthnSupported = typeof window !== 'undefined' && 
      window.PublicKeyCredential && 
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
    
    setIsWebAuthnSupported(webAuthnSupported);

    if (webAuthnSupported) {
      // Check if Windows Hello is available
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsWindowsHelloSupported(available))
        .catch(() => setIsWindowsHelloSupported(false));
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Load registered credentials
      const credentialsRes = await fetch('/api/biometric/credentials', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (credentialsRes.ok) {
        const credentialsData = await credentialsRes.json();
        setRegisteredCredentials(credentialsData.credentials || []);
        // Store full credential data for debug panel
        setDebugCredentials(credentialsData.credentials || []);
      }

      // Load verification history
      const historyRes = await fetch('/api/verification/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setVerificationHistory(historyData.logs || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const registerBiometric = async (type: 'FACE' | 'FINGERPRINT') => {
    if (!isWebAuthnSupported) {
      showMessage('WebAuthn is not supported on this device', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Get challenge from server
      const token = localStorage.getItem('token');
      const challengeRes = await fetch(`/api/biometric/register?type=${type.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!challengeRes.ok) {
        const errorData = await challengeRes.json().catch(() => ({}));
        if (errorData.error === 'ALREADY_REGISTERED') {
          throw new Error(`${type} is already registered. Please delete it first if you want to re-register.`);
        }
        throw new Error(errorData.message || 'Failed to get registration challenge');
      }

      const challengeData = await challengeRes.json();
      
      // Create credential using WebAuthn
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(challengeData.challenge),
          rp: {
            name: "Oyo Pension Verification System",
            id: window.location.hostname
          },
          user: {
            id: new Uint8Array(challengeData.userId),
            name: challengeData.userName,
            displayName: challengeData.userDisplayName
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Send credential to server
      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialData = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          attestationObject: Array.from(new Uint8Array(response.attestationObject)),
          clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON))
        },
        type: credential.type
      };

      const registerRes = await fetch('/api/biometric/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          credential: credentialData
        })
      });

      const result = await registerRes.json();
      
      if (registerRes.ok && result.success) {
        showMessage(`${type} registration successful!`, 'success');
        loadData(); // Reload credentials
      } else {
        throw new Error(result.message || 'Registration failed');
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      showMessage(error.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyBiometric = async (type: 'FACE' | 'FINGERPRINT') => {
    if (!isWebAuthnSupported) {
      showMessage('WebAuthn is not supported on this device', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get verification challenge
      const challengeRes = await fetch(`/api/biometric/verify?type=${type.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!challengeRes.ok) {
        const errorData = await challengeRes.json().catch(() => ({}));
        if (errorData.error === 'NO_CREDENTIALS') {
          throw new Error(`No ${type} credentials registered. Please register ${type} first.`);
        }
        throw new Error(errorData.message || 'Failed to get verification challenge');
      }

      const challengeData = await challengeRes.json();
      
      // Helper to decode base64url string to Uint8Array
      const base64UrlToUint8Array = (base64url: string): Uint8Array => {
        // Convert base64url to base64
        let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        while (base64.length % 4) {
          base64 += '=';
        }
        // Convert to binary string then to Uint8Array
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      // Get credential for verification
      // The server sends credentialId as base64url string, we need to decode it
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(challengeData.challenge),
          allowCredentials: challengeData.allowCredentials.map((cred: any) => ({
            id: base64UrlToUint8Array(cred.id), // Decode base64url string to Uint8Array
            type: 'public-key',
            transports: ['internal']
          })),
          userVerification: "required",
          timeout: 60000
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Verification failed');
      }

      // Send verification result to server
      const response = credential.response as AuthenticatorAssertionResponse;
      const verificationData = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          authenticatorData: Array.from(new Uint8Array(response.authenticatorData)),
          clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
          signature: Array.from(new Uint8Array(response.signature))
        },
        type: credential.type
      };

      const verifyRes = await fetch('/api/biometric/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          credential: verificationData
        })
      });

      const result = await verifyRes.json();
      
      if (verifyRes.ok && result.success) {
        showMessage('Verification Successful! ✅', 'success');
        loadData(); // Reload history
      } else if (result.status === 'PENDING_REVIEW') {
        showMessage('Verification failed. Sent for officer review.', 'info');
        loadData();
      } else {
        throw new Error(result.message || 'Verification failed');
      }

    } catch (error: any) {
      console.error('Verification error:', error);
      showMessage(error.message || 'Verification failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isRegistered = (type: 'FACE' | 'FINGERPRINT') => {
    return registeredCredentials.some(cred => cred.type === type);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Biometric Registration & Verification</h1>
            <p className="text-gray-600">Register and verify using Windows Hello (Face or Fingerprint)</p>
          </div>
          
          <div className="flex gap-2">
            {/* Debug Panel Button (always visible, but only useful in dev) */}
            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Debug Info
            </button>
            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              How to Use
            </button>
          </div>
        </div>

        {/* Windows Hello Modality Info */}
        {isWebAuthnSupported && isWindowsHelloSupported && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">About Windows Hello Modality Selection</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Windows Hello chooses the biometric modality (face or fingerprint) based on your device settings and what's available. 
                  If you register "Face" but see a fingerprint prompt (or vice versa), this is normal Windows Hello behavior. 
                  The system stores separate credentials for each type, so make sure to register both if you want to use both modalities.
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  <strong>Tip:</strong> To ensure Face registration works, make sure Face is set up in Windows Settings → Accounts → Sign-in options → Windows Hello Face.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mb-6 bg-gray-900 text-white rounded-lg p-4 font-mono text-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Debug Information</h3>
              <button
                onClick={() => setShowDebugPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <strong>WebAuthn Supported:</strong> {isWebAuthnSupported ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Windows Hello Available:</strong> {isWindowsHelloSupported ? 'Yes' : 'No'}
              </div>
              <div className="mt-4">
                <strong>Registered Credentials:</strong>
                {debugCredentials.length === 0 ? (
                  <div className="text-gray-400 mt-1">None</div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {debugCredentials.map((cred: any, idx: number) => (
                      <div key={idx} className="bg-gray-800 p-2 rounded">
                        <div><strong>Type:</strong> {cred.type}</div>
                        <div><strong>Credential ID:</strong> {cred.credentialId || cred.credentialIdPreview || 'N/A'}</div>
                        <div><strong>Registered:</strong> {new Date(cred.registeredAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Support Detection */}
        {!isWebAuthnSupported && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">WebAuthn Not Supported</h3>
                <p className="text-sm text-red-700 mt-1">Your browser doesn't support WebAuthn. Please use a modern browser.</p>
              </div>
            </div>
          </div>
        )}

        {isWebAuthnSupported && !isWindowsHelloSupported && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Windows Hello Not Available</h3>
                <p className="text-sm text-yellow-700 mt-1">Windows Hello is not set up on this device. Please configure it in Windows Settings.</p>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mb-6 rounded-lg p-4 ${
            messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            messageType === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              {messageType === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
              {messageType === 'error' && <XCircle className="w-5 h-5 mr-2" />}
              {messageType === 'info' && <Clock className="w-5 h-5 mr-2" />}
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Face Registration & Verification */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Face Recognition</h2>
                <p className="text-sm text-gray-600">Register and verify using your face</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Registration */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Registration</h3>
                {isRegistered('FACE') ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm">Face registered successfully</span>
                  </div>
                ) : (
                  <button
                    onClick={() => registerBiometric('FACE')}
                    disabled={!isWebAuthnSupported || isLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                    Register Face
                  </button>
                )}
              </div>

              {/* Verification */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Verification</h3>
                <button
                  onClick={() => verifyBiometric('FACE')}
                  disabled={!isRegistered('FACE') || !isWebAuthnSupported || isLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Verify using Face
                </button>
              </div>
            </div>
          </div>

          {/* Fingerprint Registration & Verification */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-100 rounded-full mr-4">
                <Fingerprint className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Fingerprint Recognition</h2>
                <p className="text-sm text-gray-600">Register and verify using your fingerprint</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Registration */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Registration</h3>
                {isRegistered('FINGERPRINT') ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm">Fingerprint registered successfully</span>
                  </div>
                ) : (
                  <button
                    onClick={() => registerBiometric('FINGERPRINT')}
                    disabled={!isWebAuthnSupported || isLoading}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Fingerprint className="w-4 h-4 mr-2" />}
                    Register Fingerprint
                  </button>
                )}
              </div>

              {/* Verification */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Verification</h3>
                <button
                  onClick={() => verifyBiometric('FINGERPRINT')}
                  disabled={!isRegistered('FINGERPRINT') || !isWebAuthnSupported || isLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Verify using Fingerprint
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Verification History */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-6">
            <History className="w-6 h-6 text-gray-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Verification History</h2>
          </div>

          {verificationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No verification history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Officer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verificationHistory.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.verifiedAt ? new Date(log.verifiedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                          log.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.officerName || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.nextDueAt ? new Date(log.nextDueAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Support Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start">
            <HelpCircle className="w-6 h-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Windows Hello Setup:</strong> Go to Windows Settings → Accounts → Sign-in options → Windows Hello</p>
                <p><strong>Supported Devices:</strong> Windows 10/11 with compatible camera or fingerprint reader</p>
                <p><strong>Browser Requirements:</strong> Chrome, Edge, or Firefox with WebAuthn support</p>
                <p><strong>Security:</strong> Your biometric data is stored securely on your device and never transmitted</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Modal */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">How to Use Biometric Verification</h2>
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Prerequisites */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
                      Prerequisites
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li>• Windows 10 or 11 with Windows Hello enabled</li>
                        <li>• Compatible camera (for face recognition) or fingerprint reader</li>
                        <li>• Modern browser (Chrome, Edge, or Firefox)</li>
                        <li>• Windows Hello PIN or password set up</li>
                      </ul>
                    </div>
                  </div>

                  {/* Registration Steps */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Step 1: Register Your Biometrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Choose Your Biometric Type</h4>
                          <p className="text-sm text-gray-600 mt-1">Click "Register Face" or "Register Fingerprint" button</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Windows Hello Prompt</h4>
                          <p className="text-sm text-gray-600 mt-1">Windows will prompt you to authenticate using your face or fingerprint</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Complete Registration</h4>
                          <p className="text-sm text-gray-600 mt-1">Follow the on-screen instructions to complete the registration</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">4</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Confirmation</h4>
                          <p className="text-sm text-gray-600 mt-1">You'll see a success message when registration is complete</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Steps */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-green-600" />
                      Step 2: Verify Your Identity
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-green-600">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Click Verify Button</h4>
                          <p className="text-sm text-gray-600 mt-1">Click "Verify using Face" or "Verify using Fingerprint"</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-green-600">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Authenticate</h4>
                          <p className="text-sm text-gray-600 mt-1">Windows Hello will prompt you to authenticate with your registered biometric</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-green-600">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Verification Result</h4>
                          <p className="text-sm text-gray-600 mt-1">You'll see either "Verification Successful" or "Sent for officer review"</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <HelpCircle className="w-5 h-5 mr-2 text-yellow-600" />
                      Troubleshooting
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="space-y-3 text-sm text-yellow-800">
                        <div>
                          <strong>Windows Hello not working?</strong>
                          <p>Go to Windows Settings → Accounts → Sign-in options → Windows Hello and set it up</p>
                        </div>
                        <div>
                          <strong>Browser not supported?</strong>
                          <p>Use Chrome, Edge, or Firefox with the latest updates</p>
                        </div>
                        <div>
                          <strong>Registration failed?</strong>
                          <p>Make sure you have a compatible camera or fingerprint reader</p>
                        </div>
                        <div>
                          <strong>Verification failed?</strong>
                          <p>Try registering again or contact support if the issue persists</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-purple-600" />
                      Security & Privacy
                    </h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <ul className="space-y-2 text-sm text-purple-800">
                        <li>• Your biometric data never leaves your device</li>
                        <li>• Only encrypted credentials are stored on our servers</li>
                        <li>• Windows Hello provides enterprise-grade security</li>
                        <li>• All verification attempts are logged for audit purposes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


