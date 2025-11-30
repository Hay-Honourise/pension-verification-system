import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get verification trends for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const dateFilter = startDate && endDate
      ? {
          verifiedAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }
      : {
          verifiedAt: {
            gte: sixMonthsAgo,
          },
        };

    // Get all verification logs for trend analysis
    const verificationLogs = await prisma.verificationlog.findMany({
      where: {
        ...dateFilter,
        verifiedAt: { not: null },
      },
      select: {
        verifiedAt: true,
        status: true,
        method: true,
      },
      orderBy: {
        verifiedAt: 'desc',
      },
    });

    // Group by month for trend chart
    const monthlyData: { [key: string]: { verified: number; flagged: number } } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    verificationLogs.forEach((log) => {
      if (!log.verifiedAt) return;
      const date = new Date(log.verifiedAt);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { verified: 0, flagged: 0 };
      }
      
      if (log.status === 'VERIFIED') {
        monthlyData[monthKey].verified++;
      } else if (log.status === 'REJECTED' || log.status === 'FAILED') {
        monthlyData[monthKey].flagged++;
      }
    });

    // Get last 6 months of data
    const verificationTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      verificationTrends.push({
        month: monthNames[date.getMonth()],
        verified: monthlyData[monthKey]?.verified || 0,
        flagged: monthlyData[monthKey]?.flagged || 0,
      });
    }

    // Get scheme breakdown from pensioners
    const pensioners = await prisma.pensioner.findMany({
      select: {
        pensionSchemeType: true,
        status: true,
      },
    });

    const schemeCounts: { [key: string]: number } = {};
    pensioners.forEach((p) => {
      const scheme = p.pensionSchemeType || 'Unknown';
      schemeCounts[scheme] = (schemeCounts[scheme] || 0) + 1;
    });

    const totalPensioners = pensioners.length;
    const schemeBreakdown = Object.entries(schemeCounts)
      .map(([name, count]) => ({
        name,
        value: totalPensioners > 0 ? Math.round((count / totalPensioners) * 100) : 0,
        count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 schemes

    // Get department performance (if we have department data)
    // For now, we'll use a placeholder since department might not be in pensioner model
    // But we can calculate based on verification logs and pensioner data
    const verifiedPensioners = await prisma.pensioner.findMany({
      where: {
        status: 'VERIFIED',
      },
      select: {
        id: true,
      },
    });

    const totalVerified = verifiedPensioners.length;
    const totalPensionersCount = await prisma.pensioner.count();
    const completionRate = totalPensionersCount > 0 
      ? Math.round((totalVerified / totalPensionersCount) * 100) 
      : 0;

    // Get verification methods breakdown
    const methodCounts: { [key: string]: number } = {};
    verificationLogs.forEach((log) => {
      if (log.status === 'VERIFIED') {
        const method = log.method || 'Unknown';
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      }
    });

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const recentVerifications = await prisma.verificationlog.count({
      where: {
        verifiedAt: {
          gte: thirtyDaysAgo,
        },
        status: 'VERIFIED',
      },
    });

    const recentFlags = await prisma.verificationlog.count({
      where: {
        verifiedAt: {
          gte: thirtyDaysAgo,
        },
        status: {
          in: ['REJECTED', 'FAILED'],
        },
      },
    });

    // Get pending reviews count
    const pendingReviews = await prisma.verificationreview.count({
      where: {
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      verificationTrends,
      schemeBreakdown,
      departmentPerformance: {
        totalPensioners: totalPensionersCount,
        verifiedPensioners: totalVerified,
        completionRate,
        pendingReviews,
      },
      methodBreakdown: Object.entries(methodCounts).map(([method, count]) => ({
        method,
        count,
      })),
      recentActivity: {
        verifications: recentVerifications,
        flags: recentFlags,
      },
      summary: {
        totalPensioners: totalPensionersCount,
        verifiedPensioners: totalVerified,
        pendingReviews,
        completionRate,
      },
    });
  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch reports data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

