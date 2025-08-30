'use client';

import React, { useState } from 'react';
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
  expectedRetirementDate: string;
  maidenName: string;
  
  // Step 4: Account Security
  password: string;
  confirmPassword: string;
  
  // Step 5: Document Upload
  passportPhoto: File | null;
  retirementLetter: File | null;
  idCard: File | null;
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
    expectedRetirementDate: '',
    maidenName: '',
    password: '',
    confirmPassword: '',
    passportPhoto: null,
    retirementLetter: null,
    idCard: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (!formData.expectedRetirementDate) newErrors.expectedRetirementDate = 'Expected Date of Retirement is required';
        break;
      
      case 4:
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;
      
      case 5:
        if (!formData.passportPhoto) newErrors.passportPhoto = 'Passport Photo is required';
        if (!formData.retirementLetter) newErrors.retirementLetter = 'Retirement Letter is required';
        if (!formData.idCard) newErrors.idCard = 'ID Card is required';
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

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    updateFormData(field, file);
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataToSend.append(key, value);
        }
      });

      const response = await fetch('/api/register', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        alert('Registration successful! Please check your email for verification.');
        router.push('/pensioner/login');
      } else {
        const error = await response.json();
        alert(`Registration failed: ${error.message}`);
      }
    } catch (error) {
      alert('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step < currentStep 
                ? 'bg-green-500 text-white' 
                : step === currentStep 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              {step < currentStep ? '✓' : step}
            </div>
            {step < 5 && (
              <div className={`w-16 h-1 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-2 text-sm text-gray-600">
        Step {currentStep} of 5
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Basic Identity Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pension ID *</label>
        <input
          type="text"
          value={formData.pensionId}
          onChange={(e) => updateFormData('pensionId', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.pensionId ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your Pension ID"
        />
        {errors.pensionId && <p className="text-red-500 text-sm mt-1">{errors.pensionId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => updateFormData('fullName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your full name"
        />
        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">NIN (National Identification Number) *</label>
        <input
          type="text"
          value={formData.nin}
          onChange={(e) => updateFormData('nin', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.nin ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your NIN"
        />
        {errors.nin && <p className="text-red-500 text-sm mt-1">{errors.nin}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
        <select
          value={formData.gender}
          onChange={(e) => updateFormData('gender', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.gender ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Contact Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your email address"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your phone number"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Residential Address *</label>
        <textarea
          value={formData.residentialAddress}
          onChange={(e) => updateFormData('residentialAddress', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.residentialAddress ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your complete residential address"
        />
        {errors.residentialAddress && <p className="text-red-500 text-sm mt-1">{errors.residentialAddress}</p>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Pension Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pension Scheme Type *</label>
        <select
          value={formData.pensionSchemeType}
          onChange={(e) => updateFormData('pensionSchemeType', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.pensionSchemeType ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Pension Scheme Type</option>
          <option value="total">Total</option>
          <option value="contributory">Contributory</option>
        </select>
        {errors.pensionSchemeType && <p className="text-red-500 text-sm mt-1">{errors.pensionSchemeType}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">PF Number *</label>
        <input
          type="text"
          value={formData.pfNumber}
          onChange={(e) => updateFormData('pfNumber', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.pfNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your PF Number"
        />
        {errors.pfNumber && <p className="text-red-500 text-sm mt-1">{errors.pfNumber}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date of First Appointment *</label>
        <input
          type="date"
          value={formData.dateOfFirstAppointment}
          onChange={(e) => updateFormData('dateOfFirstAppointment', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.dateOfFirstAppointment ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.dateOfFirstAppointment && <p className="text-red-500 text-sm mt-1">{errors.dateOfFirstAppointment}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Last Promotion *</label>
        <input
          type="date"
          value={formData.lastPromotionDate}
          onChange={(e) => updateFormData('lastPromotionDate', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.lastPromotionDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.lastPromotionDate && <p className="text-red-500 text-sm mt-1">{errors.lastPromotionDate}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Level *</label>
        <input
          type="text"
          value={formData.currentLevel}
          onChange={(e) => updateFormData('currentLevel', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.currentLevel ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your current level (e.g., Level 12, Grade Level 10)"
        />
        {errors.currentLevel && <p className="text-red-500 text-sm mt-1">{errors.currentLevel}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Salary *</label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">₦</span>
          <input
            type="text"
            value={formData.salary}
            onChange={(e) => {
              // Remove non-numeric characters except ₦ and comma
              const value = e.target.value.replace(/[^₦0-9,]/g, '');
              updateFormData('salary', value);
            }}
            className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.salary ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your salary"
          />
        </div>
        {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Expected Date of Retirement *</label>
        <input
          type="date"
          value={formData.expectedRetirementDate}
          onChange={(e) => updateFormData('expectedRetirementDate', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.expectedRetirementDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.expectedRetirementDate && <p className="text-red-500 text-sm mt-1">{errors.expectedRetirementDate}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Retirement *</label>
        <input
          type="date"
          value={formData.dateOfRetirement}
          onChange={(e) => updateFormData('dateOfRetirement', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.dateOfRetirement ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.dateOfRetirement && <p className="text-red-500 text-sm mt-1">{errors.dateOfRetirement}</p>}
      </div>

      {formData.gender === 'female' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Maiden Name</label>
          <input
            type="text"
            value={formData.maidenName}
            onChange={(e) => updateFormData('maidenName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your maiden name (optional)"
          />
          <p className="text-xs text-gray-500 mt-1">Optional field for female pensioners</p>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Account Security</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Create a password (minimum 6 characters)"
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Document Upload</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Passport Photo *</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileChange('passportPhoto', e.target.files?.[0] || null)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.passportPhoto ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.passportPhoto && <p className="text-red-500 text-sm mt-1">{errors.passportPhoto}</p>}
        <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG, PDF</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Retirement Letter *</label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => handleFileChange('retirementLetter', e.target.files?.[0] || null)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.retirementLetter ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.retirementLetter && <p className="text-red-500 text-sm mt-1">{errors.retirementLetter}</p>}
        <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ID Card *</label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => handleFileChange('idCard', e.target.files?.[0] || null)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.idCard ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.idCard && <p className="text-red-500 text-sm mt-1">{errors.idCard}</p>}
        <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG</p>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Review Your Information</h3>
      
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Basic Identity</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Pension ID:</span> {formData.pensionId}</div>
            <div><span className="font-medium">Full Name:</span> {formData.fullName}</div>
            <div><span className="font-medium">NIN:</span> {formData.nin}</div>
            <div><span className="font-medium">Date of Birth:</span> {formData.dateOfBirth}</div>
            <div><span className="font-medium">Gender:</span> {formData.gender}</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Email:</span> {formData.email}</div>
            <div><span className="font-medium">Phone:</span> {formData.phone}</div>
            <div className="md:col-span-2"><span className="font-medium">Address:</span> {formData.residentialAddress}</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Pension Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Scheme Type:</span> {formData.pensionSchemeType}</div>
            <div><span className="font-medium">PF Number:</span> {formData.pfNumber}</div>
            <div><span className="font-medium">First Appointment:</span> {formData.dateOfFirstAppointment}</div>
            <div><span className="font-medium">Last Promotion:</span> {formData.lastPromotionDate}</div>
            <div><span className="font-medium">Current Level:</span> {formData.currentLevel}</div>
            <div><span className="font-medium">Salary:</span> ₦{formData.salary}</div>
            <div><span className="font-medium">Expected Retirement:</span> {formData.expectedRetirementDate}</div>
            <div><span className="font-medium">Retirement Date:</span> {formData.dateOfRetirement}</div>
            {formData.gender === 'female' && formData.maidenName && (
              <div><span className="font-medium">Maiden Name:</span> {formData.maidenName}</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Documents</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Passport Photo:</span> {formData.passportPhoto?.name || 'Not uploaded'}</div>
            <div><span className="font-medium">Retirement Letter:</span> {formData.retirementLetter?.name || 'Not uploaded'}</div>
            <div><span className="font-medium">ID Card:</span> {formData.idCard?.name || 'Not uploaded'}</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Important:</strong> Please review all information carefully before submitting. 
          You will receive a confirmation email once your registration is processed.
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderConfirmation();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pensioner Registration</h1>
          <p className="mt-2 text-gray-600">Complete your registration to access the pension verification system</p>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/pensioner/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {renderStepIndicator()}

        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {renderCurrentStep()}

          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Previous
              </button>
            )}
            
            <div className="ml-auto flex space-x-3">
              {currentStep < 6 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentStep === 5 ? 'Review & Submit' : 'Next'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              )}
              <Link
                href="/"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
