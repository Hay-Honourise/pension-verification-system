import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculatePension } from '@/lib/pension-calculator';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Recalculating pension values for all pensioners...');
    
    // Get all pensioners
    const pensioners = await prisma.pensioner.findMany({
      select: {
        id: true,
        pensionId: true,
        fullName: true,
        salary: true,
        dateOfFirstAppointment: true,
        dateOfRetirement: true,
        pensionSchemeType: true,
        currentLevel: true,
        gratuityRate: true,
        pensionRate: true,
        totalGratuity: true,
        monthlyPension: true,
        yearsOfService: true
      }
    });
    
    console.log(`📊 Found ${pensioners.length} pensioners to recalculate`);
    
    const results = [];
    
    for (const pensioner of pensioners) {
      try {
        // Calculate new pension values
        const pensionCalculation = calculatePension({
          salary: pensioner.salary,
          dateOfFirstAppointment: pensioner.dateOfFirstAppointment,
          dateOfRetirement: pensioner.dateOfRetirement,
          pensionSchemeType: pensioner.pensionSchemeType,
          currentLevel: pensioner.currentLevel
        });
        
        // Update pensioner with calculated values
        const updatedPensioner = await prisma.pensioner.update({
          where: { id: pensioner.id },
          data: {
            yearsOfService: pensionCalculation.yearsOfService,
            gratuityRate: pensionCalculation.gratuityRate,
            pensionRate: pensionCalculation.pensionRate,
            totalGratuity: pensionCalculation.totalGratuity,
            monthlyPension: pensionCalculation.monthlyPension,
            updatedAt: new Date()
          }
        });
        
        results.push({
          pensionId: pensioner.pensionId,
          fullName: pensioner.fullName,
          oldValues: {
            yearsOfService: pensioner.yearsOfService,
            gratuityRate: pensioner.gratuityRate,
            pensionRate: pensioner.pensionRate,
            totalGratuity: pensioner.totalGratuity,
            monthlyPension: pensioner.monthlyPension
          },
          newValues: {
            yearsOfService: pensionCalculation.yearsOfService,
            gratuityRate: pensionCalculation.gratuityRate,
            pensionRate: pensionCalculation.pensionRate,
            totalGratuity: pensionCalculation.totalGratuity,
            monthlyPension: pensionCalculation.monthlyPension
          }
        });
        
        console.log(`✅ Updated ${pensioner.fullName} (${pensioner.pensionId})`);
        
      } catch (error) {
        console.error(`❌ Failed to update ${pensioner.fullName}:`, error);
        results.push({
          pensionId: pensioner.pensionId,
          fullName: pensioner.fullName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log(`🎉 Recalculation complete! Updated ${results.filter(r => !r.error).length}/${pensioners.length} pensioners`);
    
    return NextResponse.json({
      success: true,
      message: `Recalculated pension values for ${results.filter(r => !r.error).length}/${pensioners.length} pensioners`,
      results
    });
    
  } catch (error) {
    console.error('❌ Recalculation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
