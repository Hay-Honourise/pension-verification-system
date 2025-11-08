'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

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

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    pensionId: '',
    fullName: '',
    nin: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    residentialAddress: '',
    pensionSchemeType: '',
    dateOfFirstAppointment: '',
    dateOfRetirement: '',
    pfNumber: '',
    lastPromotionDate: '',
    currentLevel: '',
    salary: '',
    maidenName: '',
    password: '',
    confirmPassword: '',
    appointmentLetter: null,
    idCard: null,
    retirementLetter: null,
    birthCertificate: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Upload states for each file type
  const [uploadStates, setUploadStates] = useState<{
    appointmentLetter: 'idle' | 'uploading' | 'success' | 'error';
    idCard: 'idle' | 'uploading' | 'success' | 'error';
    retirementLetter: 'idle' | 'uploading' | 'success' | 'error';
    birthCertificate: 'idle' | 'uploading' | 'success' | 'error';
  }>({
    appointmentLetter: 'idle',
    idCard: 'idle',
    retirementLetter: 'idle',
    birthCertificate: 'idle'
  });

  // Load saved data on component mount
  useEffect(() => {
    console.log('🔍 Checking for saved registration data...');
    const savedData = localStorage.getItem('pensionerRegistrationData');
    const savedStep = localStorage.getItem('pensionerRegistrationStep');
    const savedLastSaved = localStorage.getItem('pensionerRegistrationLastSaved');
    
    console.log('📊 Found saved data:', {
      hasData: !!savedData,
      hasStep: !!savedStep,
      hasLastSaved: !!savedLastSaved,
      stepValue: savedStep,
      lastSavedValue: savedLastSaved
    });
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('📝 Parsed saved data:', {
          pensionId: parsedData.pensionId,
          fullName: parsedData.fullName,
          email: parsedData.email,
          currentStep: parsedData.currentStep
        });
        
        setFormData(parsedData);
        console.log('✅ Loaded saved registration data');
        
        if (savedStep) {
          const stepNumber = parseInt(savedStep);
          setCurrentStep(stepNumber);
          console.log('✅ Restored to step:', stepNumber);
        }
        
        if (savedLastSaved) {
          const lastSavedDate = new Date(savedLastSaved);
          setLastSaved(lastSavedDate);
          console.log('✅ Last saved:', lastSavedDate.toLocaleString());
        }
      } catch (error) {
        console.error('❌ Error loading saved data:', error);
        // Clear corrupted data
        localStorage.removeItem('pensionerRegistrationData');
        localStorage.removeItem('pensionerRegistrationStep');
        localStorage.removeItem('pensionerRegistrationLastSaved');
      }
    } else {
      console.log('ℹ️ No saved data found, starting fresh');
    }
  }, []);

  // Manual save function
  const manualSave = () => {
    try {
      setIsAutoSaving(true);
      localStorage.setItem('pensionerRegistrationData', JSON.stringify(formData));
      localStorage.setItem('pensionerRegistrationStep', currentStep.toString());
      localStorage.setItem('pensionerRegistrationLastSaved', new Date().toISOString());
      setLastSaved(new Date());
      console.log('💾 Manual save completed');
    } catch (error) {
      console.error('❌ Manual save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Auto-save function
  const autoSave = useCallback(() => {
    try {
      setIsAutoSaving(true);
      localStorage.setItem('pensionerRegistrationData', JSON.stringify(formData));
      localStorage.setItem('pensionerRegistrationStep', currentStep.toString());
      localStorage.setItem('pensionerRegistrationLastSaved', new Date().toISOString());
      setLastSaved(new Date());
      console.log('💾 Auto-saved registration data');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData, currentStep]);

  // Auto-save with debouncing - only save if there's meaningful data
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only auto-save if there's meaningful data entered
      if (formData.pensionId || formData.fullName || formData.email || formData.phone) {
        console.log('🔄 Triggering auto-save due to form data change');
        autoSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData.pensionId, formData.fullName, formData.email, formData.phone, formData.nin, formData.gender, formData.dateOfBirth, formData.residentialAddress, formData.pensionSchemeType, formData.dateOfFirstAppointment, formData.dateOfRetirement, formData.pfNumber, formData.lastPromotionDate, formData.currentLevel, formData.salary, formData.maidenName, formData.password, formData.confirmPassword, autoSave]);

  // Save on step change
  useEffect(() => {
    console.log('🔄 Triggering auto-save due to step change');
    autoSave();
  }, [currentStep, autoSave]);

  // Clear saved data function
  const clearSavedData = () => {
    localStorage.removeItem('pensionerRegistrationData');
    localStorage.removeItem('pensionerRegistrationStep');
    localStorage.removeItem('pensionerRegistrationLastSaved');
    setLastSaved(null);
    console.log('🗑️ Cleared saved registration data');
  };

  // Debug function to check localStorage status
  const debugLocalStorage = () => {
    console.log('🔍 Debugging localStorage...');
    console.log('Current formData:', {
      pensionId: formData.pensionId,
      fullName: formData.fullName,
      email: formData.email,
      currentStep: currentStep
    });
    
    const savedData = localStorage.getItem('pensionerRegistrationData');
    const savedStep = localStorage.getItem('pensionerRegistrationStep');
    const savedLastSaved = localStorage.getItem('pensionerRegistrationLastSaved');
    
    console.log('localStorage contents:', {
      hasData: !!savedData,
      hasStep: !!savedStep,
      hasLastSaved: !!savedLastSaved,
      dataLength: savedData?.length || 0,
      stepValue: savedStep,
      lastSavedValue: savedLastSaved
    });
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log('Parsed saved data sample:', {
          pensionId: parsed.pensionId,
          fullName: parsed.fullName,
          email: parsed.email
        });
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.pensionId.trim()) newErrors.pensionId = 'Pension ID is required';
        if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
        if (!formData.nin.trim()) newErrors.nin = 'NIN is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of Birth is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        break;
      
      case 2:
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!formData.residentialAddress.trim()) newErrors.residentialAddress = 'Residential Address is required';
        break;
      
      case 3:
        if (!formData.pensionSchemeType) newErrors.pensionSchemeType = 'Pension Scheme Type is required';
        if (!formData.dateOfFirstAppointment) newErrors.dateOfFirstAppointment = 'Date of First Appointment is required';
        if (!formData.dateOfRetirement) newErrors.dateOfRetirement = 'Date of Retirement is required';
        if (!formData.pfNumber.trim()) newErrors.pfNumber = 'PF Number is required';
        if (!formData.lastPromotionDate) newErrors.lastPromotionDate = 'Date of Last Promotion is required';
        if (!formData.currentLevel.trim()) newErrors.currentLevel = 'Current Level is required';
        if (!formData.salary.trim()) newErrors.salary = 'Salary is required';
        else if (isNaN(Number(formData.salary.replace(/[₦,]/g, '')))) newErrors.salary = 'Salary must be a valid number';
        break;
      
      case 4:
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;
      
      case 5:
        // Files are optional since we're handling them separately
        // The user can proceed to verification page even without files
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = async (field: 'appointmentLetter' | 'idCard' | 'retirementLetter' | 'birthCertificate', file: File | null) => {
    if (!file) {
      updateFormData(field, null);
      setUploadStates(prev => ({ ...prev, [field]: 'idle' }));
      return;
    }

    // Set uploading state
    setUploadStates(prev => ({ ...prev, [field]: 'uploading' }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('fileType', field);
      uploadFormData.append('pensionId', formData.pensionId || 'temp');

      const response = await fetch('/api/pensioner/register/upload-document', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const result = await response.json();
        updateFormData(field, result.file);
        setUploadStates(prev => ({ ...prev, [field]: 'success' }));
      } else {
        const error = await response.json();
        console.error('Upload failed:', error.message);
        setUploadStates(prev => ({ ...prev, [field]: 'error' }));
        setErrors(prev => ({ ...prev, [field]: error.message }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStates(prev => ({ ...prev, [field]: 'error' }));
      setErrors(prev => ({ ...prev, [field]: 'Upload failed. Please try again.' }));
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called');
    
    if (!validateStep(5)) {
      console.log('Validation failed for step 5');
      return;
    }

    setIsSubmitting(true);
    console.log('Validation passed, proceeding to store data');

    // Store form data in session storage and redirect to verification page
    try {
      console.log('Storing data to session storage:', formData);
      sessionStorage.setItem('registrationData', JSON.stringify(formData));
      
      console.log('Redirecting to verification page');
      router.push('/pensioner/register/verification');
      // Don't set isSubmitting to false here as we're navigating away
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('An error occurred while preparing verification. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
              step < currentStep 
                ? 'bg-green-500 text-white' 
                : step === currentStep 
                ? 'bg-oyoGreen text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              {step < currentStep ? '✓' : step}
            </div>
            {step < 5 && (
              <div className={`w-6 sm:w-10 h-0.5 sm:h-1 mx-0.5 sm:mx-1 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600">
        Step {currentStep} of 5
      </div>
      
      {/* Auto-save status indicator - compact */}
      {(isAutoSaving || lastSaved) && (
        <div className="flex items-center justify-center mt-2 sm:mt-3">
          {isAutoSaving && (
            <div className="flex items-center text-blue-600 text-xs">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
              <span>Saving...</span>
            </div>
          )}
          
          {lastSaved && !isAutoSaving && (
            <div className="flex items-center text-green-600 text-xs">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Saved</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-2.5 sm:space-y-3">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Basic Identity Information</h3>
      
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Pension ID *</label>
        <input
          type="text"
          value={formData.pensionId}
          onChange={(e) => updateFormData('pensionId', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.pensionId ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your Pension ID"
        />
        {errors.pensionId && <p className="text-red-500 text-xs mt-0.5">{errors.pensionId}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Full Name *</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => updateFormData('fullName', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your full name"
        />
        {errors.fullName && <p className="text-red-500 text-xs mt-0.5">{errors.fullName}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">NIN (National Identification Number) *</label>
        <input
          type="text"
          value={formData.nin}
          onChange={(e) => updateFormData('nin', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.nin ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your NIN"
        />
        {errors.nin && <p className="text-red-500 text-xs mt-0.5">{errors.nin}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Date of Birth *</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.dateOfBirth && <p className="text-red-500 text-xs mt-0.5">{errors.dateOfBirth}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Gender *</label>
        <select
          value={formData.gender}
          onChange={(e) => updateFormData('gender', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.gender ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {errors.gender && <p className="text-red-500 text-xs mt-0.5">{errors.gender}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-2.5 sm:space-y-3">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Contact Information</h3>
      
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Email Address *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your email address"
        />
        {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Phone Number *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your phone number"
        />
        {errors.phone && <p className="text-red-500 text-xs mt-0.5">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Residential Address *</label>
        <textarea
          value={formData.residentialAddress}
          onChange={(e) => updateFormData('residentialAddress', e.target.value)}
          rows={3}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.residentialAddress ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your complete residential address"
        />
        {errors.residentialAddress && <p className="text-red-500 text-xs mt-0.5">{errors.residentialAddress}</p>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-2.5 sm:space-y-3">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Pension Information</h3>
      
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Pension Scheme Type *</label>
        <select
          value={formData.pensionSchemeType}
          onChange={(e) => updateFormData('pensionSchemeType', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.pensionSchemeType ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Pension Scheme Type</option>
          <option value="total">Total</option>
          <option value="contributory">Contributory</option>
        </select>
        {errors.pensionSchemeType && <p className="text-red-500 text-xs mt-0.5">{errors.pensionSchemeType}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">PF Number *</label>
        <input
          type="text"
          value={formData.pfNumber}
          onChange={(e) => updateFormData('pfNumber', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.pfNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your PF Number"
        />
        {errors.pfNumber && <p className="text-red-500 text-xs mt-0.5">{errors.pfNumber}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Date of First Appointment *</label>
        <input
          type="date"
          value={formData.dateOfFirstAppointment}
          onChange={(e) => updateFormData('dateOfFirstAppointment', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.dateOfFirstAppointment ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.dateOfFirstAppointment && <p className="text-red-500 text-xs mt-0.5">{errors.dateOfFirstAppointment}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Date of Last Promotion *</label>
        <input
          type="date"
          value={formData.lastPromotionDate}
          onChange={(e) => updateFormData('lastPromotionDate', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.lastPromotionDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.lastPromotionDate && <p className="text-red-500 text-xs mt-0.5">{errors.lastPromotionDate}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Current Level *</label>
        <input
          type="text"
          value={formData.currentLevel}
          onChange={(e) => updateFormData('currentLevel', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.currentLevel ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your current level (e.g., Level 12, Grade Level 10)"
        />
        {errors.currentLevel && <p className="text-red-500 text-xs mt-0.5">{errors.currentLevel}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Salary *</label>
        <div className="relative">
          <span className="absolute left-2.5 sm:left-3 top-1.5 sm:top-2 text-gray-600 text-sm">₦</span>
          <input
            type="text"
            value={formData.salary}
            onChange={(e) => {
              // Remove non-numeric characters except ₦ and comma
              const value = e.target.value.replace(/[^₦0-9,]/g, '');
              updateFormData('salary', value);
            }}
            className={`w-full pl-7 sm:pl-8 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
              errors.salary ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your salary"
          />
        </div>
        {errors.salary && <p className="text-red-500 text-xs mt-0.5">{errors.salary}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Date of Retirement *</label>
        <input
          type="date"
          value={formData.dateOfRetirement}
          onChange={(e) => updateFormData('dateOfRetirement', e.target.value)}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
            errors.dateOfRetirement ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.dateOfRetirement && <p className="text-red-500 text-xs mt-0.5">{errors.dateOfRetirement}</p>}
      </div>

      {formData.gender === 'female' && (
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Maiden Name</label>
          <input
            type="text"
            value={formData.maidenName}
            onChange={(e) => updateFormData('maidenName', e.target.value)}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange"
            placeholder="Enter your maiden name (optional)"
          />
          <p className="text-xs text-gray-500 mt-0.5">Optional field for female pensioners</p>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-2.5 sm:space-y-3">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Security</h3>
      
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Password *</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 pr-8 sm:pr-10 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Create a password (minimum 6 characters)"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-2 sm:right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">Confirm Password *</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => updateFormData('confirmPassword', e.target.value)}
            className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 pr-8 sm:pr-10 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-2 sm:right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-0.5">{errors.confirmPassword}</p>}
      </div>
    </div>
  );

  const renderFileUploadField = (field: 'appointmentLetter' | 'idCard' | 'retirementLetter' | 'birthCertificate', label: string, accept: string) => {
    const uploadState = uploadStates[field];
    const fileData = formData[field];
    const error = errors[field];

    return (
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1">{label} *</label>
        <input
          type="file"
          accept={accept}
          onChange={(e) => handleFileUpload(field, e.target.files?.[0] || null)}
          disabled={uploadState === 'uploading'}
          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-900 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-oyoOrange focus:border-oyoOrange disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        
        {/* Upload Status */}
        {uploadState === 'uploading' && (
          <div className="flex items-center mt-1.5 text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1.5"></div>
            <span className="text-xs">Uploading...</span>
          </div>
        )}
        
        {uploadState === 'success' && fileData && (
          <div className="flex items-center mt-1.5 text-green-600">
            <svg className="h-3 w-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs truncate">✓ {fileData.originalName}</span>
          </div>
        )}
        
        {uploadState === 'error' && (
          <div className="flex items-center mt-1.5 text-red-600">
            <svg className="h-3 w-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Upload failed. Please try again.</span>
          </div>
        )}
        
        {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
        <p className="text-xs text-gray-500 mt-0.5">Accepted: JPG, PNG, PDF (Max 10MB)</p>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-2.5 sm:space-y-3">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Document Upload</h3>
      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
        Please upload your documents. Files will be uploaded immediately when selected.
      </p>
      
      {renderFileUploadField('appointmentLetter', 'Appointment Letter', '.pdf,image/*')}
      {renderFileUploadField('idCard', 'ID Card', '.pdf,image/*')}
      {renderFileUploadField('retirementLetter', 'Retirement Letter', '.pdf,image/*')}
      {renderFileUploadField('birthCertificate', 'Birth Certificate', '.pdf,image/*')}
    </div>
  );


  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-3 sm:py-4 lg:py-6">
      <div className="max-w-lg mx-auto px-3 sm:px-4">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-oyoGreen mb-1 sm:mb-2">Pensioner Registration</h1>
          <p className="text-xs sm:text-sm text-gray-600">Complete your registration to access the pension verification system</p>
          <div className="mt-2 sm:mt-3">
            <p className="text-xs sm:text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/pensioner/login" className="text-oyoGreen hover:text-green-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {renderStepIndicator()}

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 lg:p-6">
          {renderCurrentStep()}

          <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 mt-4 sm:mt-6">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-oyoOrange transition"
              >
                ← Previous
              </button>
            )}
            
            <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 ${currentStep === 1 ? 'w-full' : 'w-full sm:w-auto sm:ml-auto'}`}>
              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 text-xs sm:text-sm bg-oyoGreen text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-oyoOrange transition font-medium"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 text-xs sm:text-sm bg-oyoGreen text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-oyoOrange disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {isSubmitting ? 'Processing...' : 'Review & Verify →'}
                </button>
              )}
              <Link
                href="/"
                className="w-full sm:w-auto text-center px-4 sm:px-5 py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-oyoOrange transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
