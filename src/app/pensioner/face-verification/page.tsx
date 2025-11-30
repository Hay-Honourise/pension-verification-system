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
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PassportStatus {
  passportUploaded: boolean;
  passportUrl: string | null;
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

  // Check passport status and biometric verification status on mount
  useEffect(() => {
    checkPassportStatus();
    checkBiometricVerificationStatus();
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

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/pensioner/login');
        return;
      }

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

      const data = await response.json();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/pensioner/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Face Verification</h1>
          <p className="text-gray-600">
            Upload your passport and complete face verification to continue receiving pension
          </p>
        </div>

        {/* Status Card */}
        {passportStatus?.nextDueAt && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Next Verification Due</p>
                <p className="text-sm text-blue-700">{formatDate(passportStatus.nextDueAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Upload Passport */}
        {step === 'upload' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Step 1: Upload Passport Photo
            </h2>
            <p className="text-gray-600 mb-6">
              Please upload a clear photo of your passport. This will be used for face verification.
            </p>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              {passportImage ? (
                <div>
                  <img
                    src={passportImage}
                    alt="Passport"
                    className="max-w-full max-h-64 mx-auto rounded-lg mb-4"
                  />
                  <p className="text-sm text-gray-600">Passport uploaded successfully</p>
                </div>
              ) : (
                <div>
                  {uploading ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-700 mb-2">
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
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Face Capture
              </button>
            )}
          </div>
        )}

        {/* Step 2: Capture Live Face */}
        {step === 'capture' && !biometricAlreadyVerified && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Step 2: Capture Live Face
            </h2>
            <p className="text-gray-600 mb-6">
              Position your face in the camera frame and click the capture button when ready.
            </p>

            <div className="mb-6">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
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
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={captureLiveImage}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture & Verify
              </button>
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>

            {liveImage && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Captured Image:</p>
                <img
                  src={liveImage}
                  alt="Captured"
                  className="max-w-full max-h-64 rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Verifying */}
        {step === 'verifying' && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Face...</h2>
            <p className="text-gray-600">
              Please wait while we compare your face with your passport photo.
            </p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && verificationResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Successful!</h2>
              <p className="text-gray-600">
                Your face has been successfully verified with your passport photo.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Similarity Score:</span>
                  <span className="text-sm font-semibold text-green-700">
                    {verificationResult.similarityScore}%
                  </span>
                </div>
                {verificationResult.nextDueDate && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Next Verification Due:</span>
                    <span className="text-sm font-semibold text-green-700">
                      {formatDate(verificationResult.nextDueDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/pensioner/dashboard')}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Failed */}
        {step === 'failed' && verificationResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-4">
                {verificationResult.message || 'Face similarity is below the required threshold.'}
              </p>
            </div>

            {verificationResult.similarityScore && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Similarity Score:</span>
                  <span className="text-sm font-semibold text-red-700">
                    {verificationResult.similarityScore}%
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  Minimum required: 80%
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Tips for better verification:</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700">
                    <li>Ensure good lighting</li>
                    <li>Look directly at the camera</li>
                    <li>Remove glasses or hat if possible</li>
                    <li>Make sure your face is clearly visible</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={retryVerification}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/pensioner/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

