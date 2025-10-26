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

    try {
      recentNotifications = await prisma.enquiry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          subject: true,
          message: true,
          createdAt: true
        }
      });
      console.log('Recent notifications:', recentNotifications.length);
    } catch (err) {
      console.error('Error fetching recent notifications:', err);
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

    // Format notifications
    const formattedNotifications = recentNotifications.map(notification => ({
      id: notification.id,
      type: 'enquiry',
      message: `${notification.subject}: ${notification.message.substring(0, 50)}...`,
      timestamp: getTimeAgo(notification.createdAt),
      read: false // Enquiry doesn't have status field in schema
    }));

    return NextResponse.json({
      metrics: {
        totalPensioners,
        verifiedPensioners,
        pendingReviews,
        flaggedAccounts
      },
      recentPensioners: formattedPensioners,
      notifications: formattedNotifications
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
