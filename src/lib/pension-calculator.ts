// Pension calculation utilities
export interface PensionCalculationInput {
  salary: number;
  dateOfFirstAppointment: Date;
  dateOfRetirement: Date;
  pensionSchemeType: string;
  currentLevel: string;
}

export interface PensionCalculationResult {
  yearsOfService: number;
  gratuityRate: number;
  pensionRate: number;
  totalGratuity: number;
  monthlyPension: number;
}

export function calculatePension(input: PensionCalculationInput): PensionCalculationResult {
  const { salary, dateOfFirstAppointment, dateOfRetirement, pensionSchemeType, currentLevel } = input;
  
  // Calculate years of service
  const yearsOfService = Math.floor(
    (dateOfRetirement.getTime() - dateOfFirstAppointment.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  
  // Determine rates based on pension scheme type and level
  let gratuityRate: number;
  let pensionRate: number;
  
  if (pensionSchemeType.toLowerCase() === 'total') {
    // Total pension scheme
    gratuityRate = 0.25; // 25% of salary
    pensionRate = 0.80;  // 80% of salary
  } else if (pensionSchemeType.toLowerCase() === 'partial') {
    // Partial pension scheme
    gratuityRate = 0.20; // 20% of salary
    pensionRate = 0.60;  // 60% of salary
  } else {
    // Default rates
    gratuityRate = 0.25;
    pensionRate = 0.80;
  }
  
  // Adjust rates based on years of service
  if (yearsOfService >= 35) {
    gratuityRate = Math.min(gratuityRate + 0.05, 0.30); // Cap at 30%
    pensionRate = Math.min(pensionRate + 0.10, 0.90);  // Cap at 90%
  } else if (yearsOfService >= 30) {
    gratuityRate = Math.min(gratuityRate + 0.03, 0.28);
    pensionRate = Math.min(pensionRate + 0.05, 0.85);
  } else if (yearsOfService < 10) {
    gratuityRate = Math.max(gratuityRate - 0.05, 0.15); // Minimum 15%
    pensionRate = Math.max(pensionRate - 0.10, 0.50);  // Minimum 50%
  }
  
  // Calculate total gratuity (one-time payment)
  const totalGratuity = salary * gratuityRate;
  
  // Calculate monthly pension
  const monthlyPension = (salary * pensionRate) / 12;
  
  return {
    yearsOfService,
    gratuityRate,
    pensionRate,
    totalGratuity,
    monthlyPension
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
