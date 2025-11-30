'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Webcam from 'react-webcam';
import {
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  AlertCircle,
  User,
  Calendar,
  History,
  HelpCircle,
  Info,
  Shield,
  Clock,
  CheckCircle2,
  XCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Phone,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PassportStatus {
  passportUploaded: boolean;
  passportUrl: string | null;
  nextDueAt: string | null;
}

interface VerificationLog {
  id: number;
  method: string;
  status: string;
  verifiedAt: string | null;
  nextDueAt: string | null;
}

export default function FaceVerificationPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  
  const [step, setStep] = useState<'upload' | 'capture' | 'verifying' | 'success' | 'failed'>('upload');
  const [passportStatus, setPassportStatus] = useState<PassportStatus | null>(null);
  const [passportImage, setPassportImage] = useState<string | null>(null);
  const [liveImage, setLiveImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    similarityScore?: string;
    nextDueDate?: string;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricAlreadyVerified, setBiometricAlreadyVerified] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Check passport status and biometric verification status on mount
  useEffect(() => {
    checkPassportStatus();
    checkBiometricVerificationStatus();
    loadVerificationHistory();
  }, []);

  const checkPassportStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/pensioner/login');
        return;
      }

      const response = await fetch('/api/pensioner/passport/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPassportStatus(data);
        
        if (data.passportUploaded && data.passportUrl) {
          setPassportImage(data.passportUrl);
          if (!biometricAlreadyVerified) {
            setStep('capture');
          }
        }
      }
    } catch (error) {
      console.error('Error checking passport status:', error);
      toast.error('Failed to load passport status');
    } finally {
      setLoading(false);
    }
  };

  const checkBiometricVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/pensioner/login');
        return;
      }

      const response = await fetch('/api/pensioner/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.biometricVerificationStatus === 'VERIFIED') {
          setBiometricAlreadyVerified(true);
          setStep('success');
          if (data.biometricVerificationDueDate) {
            setVerificationResult({
              success: true,
              nextDueDate: data.biometricVerificationDueDate,
              message: 'Biometric verification already completed',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking biometric verification status:', error);
    }
  };

  const loadVerificationHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/verification/logs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationHistory(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading verification history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle passport file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/pensioner/login');
        return;
      }

      // Read file as data URL for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pensioner/passport/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Passport uploaded successfully');
        setPassportStatus({
          passportUploaded: true,
          passportUrl: data.passportUrl,
          nextDueAt: null,
        });
        setStep('capture');
        loadVerificationHistory();
      } else {
        toast.error(data.message || 'Failed to upload passport');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload passport');
    } finally {
      setUploading(false);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
    maxFiles: 1,
    disabled: uploading || passportStatus?.passportUploaded,
  });

  // Capture live image from webcam
  const captureLiveImage = useCallback(() => {
    if (!webcamRef.current) {
      toast.error('Camera not available');
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setLiveImage(imageSrc);
      setStep('verifying');
      verifyFace(imageSrc);
    } else {
      toast.error('Failed to capture image');
    }
  }, []);

  // Verify face using AWS Rekognition
  const verifyFace = async (capturedImage: string) => {
    // Prevent verification if already completed
    if (biometricAlreadyVerified) {
      toast.error('Biometric verification has already been completed. You cannot verify again.');
      return;
    }

    setVerifying(true);
    setDebugInfo({
      timestamp: new Date().toISOString(),
      step: 'verifying',
      imageSize: capturedImage.length,
    });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/pensioner/login');
        return;
      }

      const startTime = Date.now();
      const response = await fetch('/api/pensioner/verify-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          liveImage: capturedImage,
        }),
      });

      const endTime = Date.now();
      const data = await response.json();

      setDebugInfo({
        ...debugInfo,
        responseTime: `${endTime - startTime}ms`,
        responseStatus: response.status,
        responseData: data,
        success: response.ok && data.success,
      });

      if (response.ok && data.success) {
        setVerificationResult({
          success: true,
          similarityScore: data.similarityScore,
          nextDueDate: data.nextDueDate,
          message: data.message,
        });
        setStep('success');
        toast.success('Verification successful!');
        
        // Update passport status
        if (data.nextDueDate) {
          setPassportStatus((prev) => ({
            ...prev!,
            nextDueAt: data.nextDueDate,
          }));
        }
        
        // Reload history
        loadVerificationHistory();
      } else {
        setVerificationResult({
          success: false,
          similarityScore: data.similarityScore,
          message: data.message || 'Verification failed',
        });
        setStep('failed');
        toast.error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setDebugInfo({
        ...debugInfo,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setVerificationResult({
        success: false,
        message: 'An error occurred during verification',
      });
      setStep('failed');
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  // Retry verification
  const retryVerification = () => {
    setLiveImage(null);
    setVerificationResult(null);
    setDebugInfo(null);
    setStep('capture');
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { bg: string; text: string; icon: any } } = {
      VERIFIED: {
        bg: 'bg-green-100 text-green-800',
        text: 'Verified',
        icon: CheckCircle2,
      },
      FAILED: {
        bg: 'bg-red-100 text-red-800',
        text: 'Failed',
        icon: XCircle2,
      },
      PENDING: {
        bg: 'bg-yellow-100 text-yellow-800',
        text: 'Pending',
        icon: Clock,
      },
      REJECTED: {
        bg: 'bg-red-100 text-red-800',
        text: 'Rejected',
        icon: XCircle2,
      },
    };

    const config = statusConfig[status] || {
      bg: 'bg-gray-100 text-gray-800',
      text: status,
      icon: Info,
    };

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${config.bg}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading verification system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/pensioner/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Shield className="w-10 h-10 text-blue-600" />
                Face Verification
              </h1>
              <p className="text-gray-600 text-lg">
                Complete your biometric verification using AWS Rekognition face matching technology
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Info className="w-4 h-4" />
                {showDebugInfo ? 'Hide' : 'Show'} Debug
              </button>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                {showHelp ? 'Hide' : 'Need'} Help?
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info Panel */}
        {showDebugInfo && (
          <div className="bg-gray-900 text-gray-100 rounded-xl shadow-lg p-6 mb-6 font-mono text-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="w-5 h-5" />
                Debug Information
              </h3>
              <button
                onClick={() => setShowDebugInfo(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Step:</span>
                  <span className="ml-2 text-green-400">{step}</span>
                </div>
                <div>
                  <span className="text-gray-400">Passport Uploaded:</span>
                  <span className="ml-2">{passportStatus?.passportUploaded ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Biometric Verified:</span>
                  <span className="ml-2">{biometricAlreadyVerified ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Camera Available:</span>
                  <span className="ml-2">{webcamRef.current ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {debugInfo && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="space-y-1">
                    {Object.entries(debugInfo).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-400">{key}:</span>
                        <span className="ml-2 text-yellow-300">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Panel */}
        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                How to Use Face Verification
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-blue-800">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Step 1: Upload Passport Photo
                </h4>
                <p className="ml-6 text-blue-700">
                  Upload a clear, high-quality photo of your passport. Make sure your face is clearly visible and the image is well-lit.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Step 2: Capture Live Face
                </h4>
                <p className="ml-6 text-blue-700">
                  Position yourself in front of your camera. Ensure good lighting, look directly at the camera, and click "Capture & Verify" when ready.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Tips for Best Results
                </h4>
                <ul className="ml-6 list-disc list-inside space-y-1 text-blue-700">
                  <li>Use natural lighting or a well-lit room</li>
                  <li>Remove glasses, hat, or mask if possible</li>
                  <li>Look directly at the camera</li>
                  <li>Keep your face centered in the frame</li>
                  <li>Ensure your face matches the passport photo</li>
                </ul>
              </div>
              <div className="pt-4 border-t border-blue-200">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Need More Help?
                </h4>
                <p className="ml-6 text-blue-700">
                  Contact support at <a href="mailto:support@pension.gov.ng" className="underline font-medium">support@pension.gov.ng</a> or call our helpline for assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Card */}
        {passportStatus?.nextDueAt && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Next Verification Due</p>
                  <p className="text-lg font-bold text-blue-700">{formatDate(passportStatus.nextDueAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Already Verified Message */}
        {biometricAlreadyVerified && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-2 border-green-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Biometric Verification Already Completed</h2>
              <p className="text-gray-600">
                Your biometric verification has already been completed. You cannot verify again.
              </p>
            </div>
            {verificationResult?.nextDueDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Next Verification Due</p>
                    <p className="text-sm text-blue-700">{formatDate(verificationResult.nextDueDate)}</p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => router.push('/pensioner/dashboard')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {/* Main Verification Steps */}
        {!biometricAlreadyVerified && (
          <>
            {/* Step 1: Upload Passport */}
            {step === 'upload' && (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold">
                      1
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Upload Passport Photo</h2>
                  </div>
                  <p className="text-gray-600 ml-13">
                    Upload a clear photo of your passport. This will be used for face verification using AWS Rekognition.
                  </p>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  {passportImage ? (
                    <div>
                      <img
                        src={passportImage}
                        alt="Passport"
                        className="max-w-full max-h-80 mx-auto rounded-lg mb-4 shadow-md"
                      />
                      <p className="text-sm text-green-600 font-medium">✓ Passport uploaded successfully</p>
                    </div>
                  ) : (
                    <div>
                      {uploading ? (
                        <>
                          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                            <Upload className="w-10 h-10 text-blue-600" />
                          </div>
                          <p className="text-lg font-medium text-gray-700 mb-2">
                            {isDragActive
                              ? 'Drop the file here'
                              : 'Drag and drop your passport image here, or click to select'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Supports: JPG, PNG (Max 5MB)
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {passportImage && (
                  <button
                    onClick={() => setStep('capture')}
                    className="mt-6 w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-all font-medium text-lg shadow-md hover:shadow-lg"
                  >
                    Continue to Face Capture →
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Capture Live Face */}
            {step === 'capture' && (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold">
                      2
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Capture Live Face</h2>
                  </div>
                  <p className="text-gray-600 ml-13">
                    Position your face in the camera frame and click the capture button when ready.
                  </p>
                </div>

                <div className="mb-6">
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: 1280,
                        height: 720,
                        facingMode: 'user',
                      }}
                      className="w-full"
                    />
                    <div className="absolute inset-0 border-4 border-blue-500 border-dashed pointer-events-none" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={captureLiveImage}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-all font-medium text-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Capture & Verify
                  </button>
                  <button
                    onClick={() => setStep('upload')}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    ← Back
                  </button>
                </div>

                {liveImage && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Captured Image Preview:</p>
                    <img
                      src={liveImage}
                      alt="Captured"
                      className="max-w-full max-h-64 rounded-lg border-2 border-gray-200 shadow-md"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Verifying */}
            {step === 'verifying' && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
                <Loader2 className="w-20 h-20 animate-spin text-blue-600 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Verifying Face...</h2>
                <p className="text-gray-600 text-lg">
                  Please wait while we compare your face with your passport photo using AWS Rekognition.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure verification in progress</span>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 'success' && verificationResult && (
              <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-200">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Verification Successful!</h2>
                  <p className="text-gray-600 text-lg">
                    Your face has been successfully verified with your passport photo.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Similarity Score:</span>
                      <span className="text-lg font-bold text-green-700">
                        {verificationResult.similarityScore}%
                      </span>
                    </div>
                    {verificationResult.nextDueDate && (
                      <div className="flex justify-between items-center pt-3 border-t border-green-200">
                        <span className="text-sm font-medium text-gray-700">Next Verification Due:</span>
                        <span className="text-lg font-bold text-green-700">
                          {formatDate(verificationResult.nextDueDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => router.push('/pensioner/dashboard')}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-all font-medium text-lg shadow-md hover:shadow-lg"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {/* Step 5: Failed */}
            {step === 'failed' && verificationResult && (
              <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-red-200">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                  <p className="text-gray-600 text-lg mb-4">
                    {verificationResult.message || 'Face similarity is below the required threshold.'}
                  </p>
                </div>

                {verificationResult.similarityScore && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Similarity Score:</span>
                      <span className="text-lg font-bold text-red-700">
                        {verificationResult.similarityScore}%
                      </span>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      Minimum required: 80%
                    </p>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-2">Tips for better verification:</p>
                      <ul className="list-disc list-inside space-y-1 text-yellow-700">
                        <li>Ensure good lighting - natural light is best</li>
                        <li>Look directly at the camera</li>
                        <li>Remove glasses or hat if possible</li>
                        <li>Make sure your face is clearly visible</li>
                        <li>Ensure your face matches the passport photo</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={retryVerification}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-all font-medium text-lg shadow-md hover:shadow-lg"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/pensioner/dashboard')}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Verification History */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Verification History</h2>
            </div>
            <button
              onClick={loadVerificationHistory}
              disabled={historyLoading}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Loader2 className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading verification history...</p>
            </div>
          ) : verificationHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No verification history found</p>
              <p className="text-sm text-gray-500 mt-2">Your verification attempts will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Next Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verificationHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(log.verifiedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.nextDueAt ? formatDate(log.nextDueAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
