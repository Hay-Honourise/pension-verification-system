import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.log('Admin dashboard API called by:', token);

    // Get dashboard metrics with error handling for each query
    let totalPensioners = 0;
    let verifiedPensioners = 0;
    let pendingReviews = 0;
    let flaggedAccounts = 0;
    let recentPensioners: any[] = [];
    let recentNotifications: any[] = [];

    try {
      totalPensioners = await prisma.pensioner.count();
      console.log('Total pensioners:', totalPensioners);
    } catch (err) {
      console.error('Error counting total pensioners:', err);
    }

    try {
      verifiedPensioners = await prisma.pensioner.count({
        where: { 
          status: {
            in: ['VERIFIED', 'APPROVED', 'COMPLETED']
          }
        }
      });
      console.log('Verified pensioners:', verifiedPensioners);
    } catch (err) {
      console.error('Error counting verified pensioners:', err);
    }

    try {
      pendingReviews = await prisma.verificationreview.count({
        where: { status: 'PENDING' }
      });
      console.log('Pending reviews:', pendingReviews);
    } catch (err) {
      console.error('Error counting pending reviews:', err);
    }

    try {
      flaggedAccounts = await prisma.pensioner.count({
        where: { 
          status: {
            in: ['FLAGGED', 'REJECTED', 'SUSPENDED']
          }
        }
      });
      console.log('Flagged accounts:', flaggedAccounts);
    } catch (err) {
      console.error('Error counting flagged accounts:', err);
    }

    try {
      recentPensioners = await prisma.pensioner.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          pensionId: true,
          fullName: true,
          status: true,
          pensionSchemeType: true,
          createdAt: true,
          pensionerfile: {
            select: {
              fileType: true,
              originalName: true
            }
          }
        }
      });
      console.log('Recent pensioners:', recentPensioners.length);
    } catch (err) {
      console.error('Error fetching recent pensioners:', err);
    }

    // Fetch all types of notifications
    const allNotifications: any[] = [];
    
    try {
      // 1. Enquiry notifications
      const enquiries = await prisma.enquiry.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          subject: true,
          message: true,
          fullName: true,
          email: true,
          createdAt: true
        }
      });
      
      enquiries.forEach(enquiry => {
        allNotifications.push({
          id: `enquiry-${enquiry.id}`,
          type: 'enquiry',
          title: 'New Enquiry',
          message: `${enquiry.fullName}: ${enquiry.subject}`,
          details: enquiry.message.substring(0, 100),
          timestamp: enquiry.createdAt,
          referenceId: enquiry.id
        });
      });
      
      console.log('Enquiry notifications:', enquiries.length);
    } catch (err) {
      console.error('Error fetching enquiry notifications:', err);
    }

    try {
      // 2. New pensioner registration notifications (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const newPensioners = await prisma.pensioner.findMany({
        where: {
          createdAt: {
            gte: oneDayAgo
          }
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          pensionId: true,
          fullName: true,
          email: true,
          status: true,
          pensionSchemeType: true,
          createdAt: true
        }
      });
      
      newPensioners.forEach(pensioner => {
        allNotifications.push({
          id: `pensioner-${pensioner.id}`,
          type: 'registration',
          title: 'New Pensioner Registration',
          message: `${pensioner.fullName} (${pensioner.pensionId}) completed registration`,
          details: `Status: ${pensioner.status} | Scheme: ${pensioner.pensionSchemeType || 'N/A'}`,
          timestamp: pensioner.createdAt,
          referenceId: pensioner.id,
          pensionId: pensioner.pensionId
        });
      });
      
      console.log('New pensioner notifications:', newPensioners.length);
    } catch (err) {
      console.error('Error fetching new pensioner notifications:', err);
    }

    try {
      // 3. Verification notifications (recent successful verifications)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const recentVerifications = await prisma.verificationlog.findMany({
        where: {
          status: 'SUCCESS',
          verifiedAt: {
            gte: oneDayAgo
          }
        },
        take: 10,
        orderBy: { verifiedAt: 'desc' },
        select: {
          id: true,
          pensionerId: true,
          method: true,
          verifiedAt: true,
          pensioner: {
            select: {
              fullName: true,
              pensionId: true
            }
          }
        }
      });
      
      recentVerifications.forEach(verification => {
        allNotifications.push({
          id: `verification-${verification.id}`,
          type: 'verification',
          title: 'Successful Verification',
          message: `${verification.pensioner.fullName} completed ${verification.method.replace(/_/g, ' ')} verification`,
          details: `Pension ID: ${verification.pensioner.pensionId}`,
          timestamp: verification.verifiedAt || verification.id,
          referenceId: verification.pensionerId
        });
      });
      
      console.log('Verification notifications:', recentVerifications.length);
    } catch (err) {
      console.error('Error fetching verification notifications:', err);
    }

    try {
      // 4. Pending review notifications
      const pendingReviews = await prisma.verificationreview.findMany({
        where: {
          status: 'PENDING'
        },
        take: 10,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          pensionerId: true,
          reviewedAt: true,
          pensioner: {
            select: {
              fullName: true,
              pensionId: true
            }
          }
        }
      });
      
      pendingReviews.forEach((review: {
        id: number;
        pensionerId: number;
        reviewedAt: Date | null;
        pensioner: {
          fullName: string;
          pensionId: string;
        };
      }) => {
        allNotifications.push({
          id: `review-${review.id}`,
          type: 'review',
          title: 'Pending Verification Review',
          message: `${review.pensioner.fullName} requires manual review`,
          details: `Pension ID: ${review.pensioner.pensionId}`,
          timestamp: review.reviewedAt || new Date(), // Use reviewedAt or current date as fallback
          referenceId: review.pensionerId
        });
      });
      
      console.log('Pending review notifications:', pendingReviews.length);
    } catch (err) {
      console.error('Error fetching pending review notifications:', err);
    }

    // Get monthly verification data for chart
    let monthlyVerifications: any[] = [];
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1); // Start of the month
      
      const verificationLogs = await prisma.verificationlog.findMany({
        where: {
          status: {
            in: ['SUCCESS', 'VERIFIED']
          },
          verifiedAt: {
            gte: sixMonthsAgo
          }
        },
        select: {
          verifiedAt: true
        }
      });

      // Group by month
      interface MonthlyData {
        count: number;
        label: string;
        sortKey: string;
      }
      
      const monthMap = new Map<string, MonthlyData>();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      verificationLogs.forEach(log => {
        if (log.verifiedAt) {
          const date = new Date(log.verifiedAt);
          const month = date.getMonth();
          const year = date.getFullYear();
          const monthKey = `${year}-${month}`;
          const monthLabel = `${monthNames[month]} ${year}`;
          
          if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, { count: 0, label: monthLabel, sortKey: monthKey });
          }
          const current = monthMap.get(monthKey);
          if (current) {
            current.count++;
            monthMap.set(monthKey, current);
          }
        }
      });

      // Convert to array and sort by date (ascending)
      monthlyVerifications = Array.from(monthMap.values()).sort((a, b) => 
        a.sortKey.localeCompare(b.sortKey)
      );
      console.log('Monthly verifications:', monthlyVerifications.length);
    } catch (err) {
      console.error('Error fetching monthly verifications:', err);
    }

    // Format recent pensioners data
    const formattedPensioners = recentPensioners.map(pensioner => ({
      id: pensioner.pensionId,
      name: pensioner.fullName,
      category: pensioner.pensionSchemeType || 'Unknown',
      status: pensioner.status,
      documents: pensioner.pensionerfile.map((file: { originalName: any; }) => file.originalName),
      lastLogin: 'N/A', // This field doesn't exist in the schema
      dateRegistered: new Date(pensioner.createdAt).toLocaleDateString()
    }));

    // Sort all notifications by timestamp (newest first) and take top 50
    const sortedNotifications = allNotifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    // Format notifications with proper timestamps
    const formattedNotifications = sortedNotifications.map(notification => ({
      id: notification.id,
      type: notification.type, // 'enquiry', 'registration', 'verification', 'review'
      title: notification.title,
      message: notification.message,
      details: notification.details,
      timestamp: getTimeAgo(new Date(notification.timestamp)),
      fullTimestamp: notification.timestamp,
      read: false,
      referenceId: notification.referenceId,
      pensionId: notification.pensionId || null
    }));

    return NextResponse.json({
      metrics: {
        totalPensioners,
        verifiedPensioners,
        pendingReviews,
        flaggedAccounts
      },
      recentPensioners: formattedPensioners,
      notifications: formattedNotifications,
      monthlyVerifications
    });

  } catch (err) {
    console.error('[admin/dashboard] error', err);
    console.error('Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined
    });
    return NextResponse.json({ 
      message: 'Server error', 
      error: err instanceof Error ? err.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? err : undefined
    }, { status: 500 });
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
