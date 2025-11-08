'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormData {
  // Step 1: Basic Identity
  pensionId: string;
  fullName: string;
  nin: string;
  dateOfBirth: string;
  gender: string;
  
  // Step 2: Contact Information
  email: string;
  phone: string;
  residentialAddress: string;
  
  // Step 3: Pension Information
  pensionSchemeType: string;
  dateOfFirstAppointment: string;
  dateOfRetirement: string;
  pfNumber: string;
  lastPromotionDate: string;
  currentLevel: string;
  salary: string;
  maidenName: string;
  
  // Step 4: Account Security
  password: string;
  confirmPassword: string;
  
  // Step 5: Document Upload (now stores file info instead of File objects)
  appointmentLetter: UploadedFile | null;
  idCard: UploadedFile | null;
  retirementLetter: UploadedFile | null;
  birthCertificate: UploadedFile | null;
}

interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

interface CalculatedBenefits {
  yearsOfService: number;
  totalGratuity: number;
  monthlyPension: number;
  gratuityRate: number;
  pensionRate: number;
}

export default function VerificationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [calculatedBenefits, setCalculatedBenefits] = useState<CalculatedBenefits | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  // Remove old file name state - we now get file info directly from formData

  useEffect(() => {
    console.log('Verification page useEffect running');
    
    // Get form data from session storage or URL params
    const storedData = sessionStorage.getItem('registrationData');
    console.log('Stored data from session storage:', storedData);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('Parsed data:', parsedData);
        setFormData(parsedData);
        calculateBenefits(parsedData);
      } catch (error) {
        console.error('Error parsing stored data:', error);
        setError('Invalid registration data. Please start over.');
      }
    } else {
      console.log('No stored data found');
      setError('No registration data found. Please start over.');
    }
  }, []);

  const validateFormData = (data: FormData): string[] => {
    const errors: string[] = [];
    
    if (!data.dateOfFirstAppointment) {
      errors.push('Date of First Appointment is required');
    }
    if (!data.salary || data.salary.trim() === '') {
      errors.push('Salary is required');
    }
    if (!data.pensionSchemeType) {
      errors.push('Pension Scheme Type is required');
    }
    
    // Validate dates
    if (data.dateOfFirstAppointment && data.dateOfRetirement) {
      const firstAppointment = new Date(data.dateOfFirstAppointment);
      const retirement = new Date(data.dateOfRetirement);
      
      if (retirement <= firstAppointment) {
        errors.push('Date of Retirement must be after Date of First Appointment');
      }
    }
    
    // Validate salary
    if (data.salary) {
      const cleanSalary = parseFloat(data.salary.replace(/[₦,]/g, ''));
      if (isNaN(cleanSalary) || cleanSalary <= 0) {
        errors.push('Salary must be a valid positive number');
      }
    }
    
    return errors;
  };

  const calculateBenefits = (data: FormData) => {
    console.log('calculateBenefits called with data:', data);
    
    try {
      // Validate form data first
      const validationErrors = validateFormData(data);
      console.log('Validation errors:', validationErrors);
      
      if (validationErrors.length > 0) {
        console.log('Validation failed, setting error');
        setError(`Validation errors: ${validationErrors.join(', ')}`);
        // Still try to calculate benefits even with validation errors for debugging
      }

      // Calculate years of service
      const firstAppointmentYear = new Date(data.dateOfFirstAppointment).getFullYear();
      const retirementYear = new Date(data.dateOfRetirement).getFullYear();
      const yearsOfService = retirementYear - firstAppointmentYear;
      
      console.log('Years of service calculated:', yearsOfService);

      // Clean salary value (remove currency symbols and commas)
      const cleanSalary = parseFloat(data.salary.replace(/[₦,]/g, '')) || 0;
      console.log('Clean salary:', cleanSalary);

      // Define rates based on pension scheme type
      let gratuityRate = 0.25; // Default 25%
      let pensionRate = 0.8; // Default 80%

      if (data.pensionSchemeType === 'contributory') {
        gratuityRate = 0.25; // 25% for contributory
        pensionRate = 0.8; // 80% for contributory
      } else if (data.pensionSchemeType === 'total') {
        gratuityRate = 0.3; // 30% for total
        pensionRate = 0.85; // 85% for total
      }

      // Calculate benefits
      const totalGratuity = cleanSalary * yearsOfService * gratuityRate;
      const monthlyPension = (cleanSalary * pensionRate) / 12;
      
      console.log('Calculated benefits:', {
        yearsOfService,
        totalGratuity,
        monthlyPension,
        gratuityRate,
        pensionRate
      });

      setCalculatedBenefits({
        yearsOfService,
        totalGratuity,
        monthlyPension,
        gratuityRate,
        pensionRate
      });
      
      console.log('Benefits set successfully');
      
      // Clear any previous errors
      setError('');
    } catch (error) {
      console.error('Error calculating benefits:', error);
      setError('Error calculating benefits. Please check your data.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const handleConfirm = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields including file URLs
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          if (key === 'appointmentLetter' || key === 'idCard' || key === 'retirementLetter' || key === 'birthCertificate') {
            // Send file info as JSON string
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      // Add calculated benefits
      if (calculatedBenefits) {
        formDataToSend.append('yearsOfService', calculatedBenefits.yearsOfService.toString());
        formDataToSend.append('totalGratuity', calculatedBenefits.totalGratuity.toString());
        formDataToSend.append('monthlyPension', calculatedBenefits.monthlyPension.toString());
        formDataToSend.append('gratuityRate', calculatedBenefits.gratuityRate.toString());
        formDataToSend.append('pensionRate', calculatedBenefits.pensionRate.toString());
      }

      const response = await fetch('/api/pensioner/register', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        // Clear session storage
        sessionStorage.removeItem('registrationData');
        // Clear localStorage data
        localStorage.removeItem('pensionerRegistrationData');
        localStorage.removeItem('pensionerRegistrationStep');
        localStorage.removeItem('pensionerRegistrationLastSaved');
        // Set flag to show success message on dashboard
        sessionStorage.setItem('registrationCompleted', 'true');
        alert('Registration successful! Please check your email for verification.');
        router.push('/pensioner/dashboard');
      } else {
        const error = await response.json();
        setError(`Registration failed: ${error.message}`);
      }
    } catch (error) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    // Save current data back to localStorage before going back
    if (formData) {
      localStorage.setItem('pensionerRegistrationData', JSON.stringify(formData));
      localStorage.setItem('pensionerRegistrationStep', '5'); // Go back to step 5 (documents)
      localStorage.setItem('pensionerRegistrationLastSaved', new Date().toISOString());
    }
    router.push('/pensioner/register');
  };

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
            <p className="text-red-700 mb-4">{error}</p>
            <Link
              href="/pensioner/register"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  // Show the page even if benefits calculation failed, but with a warning
  if (!calculatedBenefits) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Verification & Benefits Calculation</h1>
            <p className="mt-2 text-gray-600">Review your details and computed pension benefits</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>Warning:</strong> Benefits calculation failed. Please check your data and try again.
            </p>
            {error && <p className="text-yellow-700 mt-2">Error: {error}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information Review */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Basic Identity</h3>
                  <div className="space-y-2 text-sm text-gray-900">
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Pension ID:</span> <span className="text-gray-900">{formData.pensionId}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Full Name:</span> <span className="text-gray-900">{formData.fullName}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">NIN:</span> <span className="text-gray-900">{formData.nin}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Date of Birth:</span> <span className="text-gray-900">{formData.dateOfBirth}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Gender:</span> <span className="text-gray-900">{formData.gender}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm text-gray-900">
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Email:</span> <span className="text-gray-900">{formData.email}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Phone:</span> <span className="text-gray-900">{formData.phone}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Address:</span> <span className="text-gray-900">{formData.residentialAddress}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Employment Details</h3>
                  <div className="space-y-2 text-sm text-gray-900">
                    <div className="text-gray-900"><span className="font-medium text-gray-900">PF Number:</span> <span className="text-gray-900">{formData.pfNumber}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Scheme Type:</span> <span className="text-gray-900">{formData.pensionSchemeType}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">First Appointment:</span> <span className="text-gray-900">{formData.dateOfFirstAppointment}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Last Promotion:</span> <span className="text-gray-900">{formData.lastPromotionDate}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Current Level:</span> <span className="text-gray-900">{formData.currentLevel}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Salary:</span> <span className="text-gray-900">{formData.salary}</span></div>
                    {formData.gender === 'female' && formData.maidenName && (
                      <div className="text-gray-900"><span className="font-medium text-gray-900">Maiden Name:</span> <span className="text-gray-900">{formData.maidenName}</span></div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Uploaded Documents</h3>
                  <div className="space-y-2 text-sm text-gray-900">
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Appointment Letter:</span> <span className="text-gray-900">{formData.appointmentLetter ? formData.appointmentLetter.originalName : 'Not uploaded'}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">ID Card:</span> <span className="text-gray-900">{formData.idCard ? formData.idCard.originalName : 'Not uploaded'}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Retirement Letter:</span> <span className="text-gray-900">{formData.retirementLetter ? formData.retirementLetter.originalName : 'Not uploaded'}</span></div>
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Birth Certificate:</span> <span className="text-gray-900">{formData.birthCertificate ? formData.birthCertificate.originalName : 'Not uploaded'}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Calculation Error */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Benefits Calculation</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Calculation Failed</h3>
                <p className="text-red-700">
                  Unable to calculate pension benefits. Please check your data and try again.
                </p>
                {error && (
                  <div className="mt-3">
                    <p className="text-sm text-red-600 font-medium">Error Details:</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoBack}
              className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              ← Go Back & Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verification & Benefits Calculation</h1>
          <p className="mt-2 text-gray-600">Review your details and computed pension benefits</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information Review */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Basic Identity</h3>
                <div className="space-y-2 text-sm text-gray-900">
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Pension ID:</span> <span className="text-gray-900">{formData.pensionId}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Full Name:</span> <span className="text-gray-900">{formData.fullName}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">NIN:</span> <span className="text-gray-900">{formData.nin}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Date of Birth:</span> <span className="text-gray-900">{formData.dateOfBirth}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Gender:</span> <span className="text-gray-900">{formData.gender}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2 text-sm text-gray-900">
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Email:</span> <span className="text-gray-900">{formData.email}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Phone:</span> <span className="text-gray-900">{formData.phone}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Address:</span> <span className="text-gray-900">{formData.residentialAddress}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Employment Details</h3>
                <div className="space-y-2 text-sm text-gray-900">
                  <div className="text-gray-900"><span className="font-medium text-gray-900">PF Number:</span> <span className="text-gray-900">{formData.pfNumber}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Scheme Type:</span> <span className="text-gray-900">{formData.pensionSchemeType}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">First Appointment:</span> <span className="text-gray-900">{formData.dateOfFirstAppointment}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Last Promotion:</span> <span className="text-gray-900">{formData.lastPromotionDate}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Current Level:</span> <span className="text-gray-900">{formData.currentLevel}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Salary:</span> <span className="text-gray-900">{formatCurrency(parseFloat(formData.salary.replace(/[₦,]/g, '')))}</span></div>
                  {formData.gender === 'female' && formData.maidenName && (
                    <div className="text-gray-900"><span className="font-medium text-gray-900">Maiden Name:</span> <span className="text-gray-900">{formData.maidenName}</span></div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Uploaded Documents</h3>
                <div className="space-y-2 text-sm text-gray-900">
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Appointment Letter:</span> <span className="text-gray-900">{formData.appointmentLetter ? formData.appointmentLetter.originalName : 'Not uploaded'}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">ID Card:</span> <span className="text-gray-900">{formData.idCard ? formData.idCard.originalName : 'Not uploaded'}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Retirement Letter:</span> <span className="text-gray-900">{formData.retirementLetter ? formData.retirementLetter.originalName : 'Not uploaded'}</span></div>
                  <div className="text-gray-900"><span className="font-medium text-gray-900">Birth Certificate:</span> <span className="text-gray-900">{formData.birthCertificate ? formData.birthCertificate.originalName : 'Not uploaded'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Calculation */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Computed Benefits</h2>
            
            <div className="space-y-6">
              {/* Service Years */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Years of Service</h3>
                <div className="text-2xl font-bold text-blue-900">{calculatedBenefits.yearsOfService} years</div>
                <p className="text-sm text-blue-700 mt-1">
                  From {new Date(formData.dateOfFirstAppointment).getFullYear()} to {new Date(formData.dateOfRetirement).getFullYear()}
                </p>
              </div>

              {/* Gratuity Calculation */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Total Gratuity</h3>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(calculatedBenefits.totalGratuity)}
                </div>
                <div className="text-sm text-green-700 mt-2">
                  <div>Calculation: Last Salary × Years of Service × Gratuity Rate</div>
                  <div>{formatCurrency(parseFloat(formData.salary.replace(/[₦,]/g, '')))} × {calculatedBenefits.yearsOfService} × {formatPercentage(calculatedBenefits.gratuityRate)}</div>
                </div>
              </div>

              {/* Monthly Pension */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">Monthly Pension</h3>
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(calculatedBenefits.monthlyPension)}
                </div>
                <div className="text-sm text-purple-700 mt-2">
                  <div>Calculation: Last Salary × Pension Rate ÷ 12</div>
                  <div>{formatCurrency(parseFloat(formData.salary.replace(/[₦,]/g, '')))} × {formatPercentage(calculatedBenefits.pensionRate)} ÷ 12</div>
                </div>
              </div>

              {/* Scheme Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Pension Scheme Details</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <div><span className="font-medium">Scheme Type:</span> {formData.pensionSchemeType.charAt(0).toUpperCase() + formData.pensionSchemeType.slice(1)}</div>
                  <div><span className="font-medium">Gratuity Rate:</span> {formatPercentage(calculatedBenefits.gratuityRate)}</div>
                  <div><span className="font-medium">Pension Rate:</span> {formatPercentage(calculatedBenefits.pensionRate)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            ← Go Back & Edit
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Confirming...
              </>
            ) : (
              <>
                ✅ Confirm & Submit
              </>
            )}
          </button>
        </div>

        {/* Important Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please review all information carefully before confirming. Once submitted, your registration will be processed and you will receive a confirmation email. 
                  The calculated benefits are estimates based on the information provided and may be subject to verification and adjustment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
