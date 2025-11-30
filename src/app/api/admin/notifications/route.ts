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
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
    const type = searchParams.get('type'); // 'all', 'pending', 'flagged', 'system', etc.

    const allNotifications: any[] = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Pending Verification Reviews
    try {
      const pendingReviews = await prisma.verificationreview.findMany({
        where: {
          status: 'PENDING',
        },
        orderBy: { reviewedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          pensionerId: true,
          status: true,
          reviewedAt: true,
          pensioner: {
            select: {
              fullName: true,
              pensionId: true,
            },
          },
        },
      });

      pendingReviews.forEach((review) => {
        allNotifications.push({
          id: `pending-review-${review.id}`,
          type: 'pending_verification',
          priority: 'high',
          title: 'Pending Verification Review',
          message: `${review.pensioner.fullName} (${review.pensioner.pensionId}) requires verification review`,
          timestamp: review.reviewedAt || new Date(),
          read: false,
          actionUrl: `/admin/dashboard?pensionerId=${review.pensionerId}`,
          icon: 'UserCheck',
        });
      });
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
    }

    // 2. New Pensioner Registrations (last 7 days)
    try {
      const newRegistrations = await prisma.pensioner.findMany({
        where: {
          createdAt: {
            gte: oneWeekAgo,
          },
          status: 'PENDING_VERIFICATION',
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          pensionId: true,
          fullName: true,
          createdAt: true,
        },
      });

      newRegistrations.forEach((pensioner) => {
        allNotifications.push({
          id: `new-registration-${pensioner.id}`,
          type: 'new_registration',
          priority: 'medium',
          title: 'New Pensioner Registration',
          message: `${pensioner.fullName} (${pensioner.pensionId}) has registered`,
          timestamp: pensioner.createdAt,
          read: false,
          actionUrl: `/admin/dashboard?pensionerId=${pensioner.id}`,
          icon: 'UserPlus',
        });
      });
    } catch (err) {
      console.error('Error fetching new registrations:', err);
    }

    // 3. Flagged/Rejected Accounts
    try {
      const flaggedAccounts = await prisma.pensioner.findMany({
        where: {
          status: {
            in: ['REJECTED', 'FLAGGED', 'SUSPENDED'],
          },
          updatedAt: {
            gte: oneWeekAgo,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 15,
        select: {
          id: true,
          pensionId: true,
          fullName: true,
          status: true,
          updatedAt: true,
        },
      });

      flaggedAccounts.forEach((pensioner) => {
        allNotifications.push({
          id: `flagged-${pensioner.id}`,
          type: 'flagged_account',
          priority: 'high',
          title: `Account ${pensioner.status}`,
          message: `${pensioner.fullName} (${pensioner.pensionId}) account is ${pensioner.status.toLowerCase()}`,
          timestamp: pensioner.updatedAt,
          read: false,
          actionUrl: `/admin/dashboard?pensionerId=${pensioner.id}`,
          icon: 'AlertTriangle',
        });
      });
    } catch (err) {
      console.error('Error fetching flagged accounts:', err);
    }

    // 4. Failed Verification Attempts (last 24 hours)
    try {
      const failedVerifications = await prisma.verificationlog.findMany({
        where: {
          status: 'FAILED',
          verifiedAt: {
            gte: oneDayAgo,
          },
        },
        orderBy: { verifiedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          pensionerId: true,
          method: true,
          verifiedAt: true,
          pensioner: {
            select: {
              fullName: true,
              pensionId: true,
            },
          },
        },
      });

      failedVerifications.forEach((log) => {
        allNotifications.push({
          id: `failed-verification-${log.id}`,
          type: 'failed_verification',
          priority: 'medium',
          title: 'Failed Verification Attempt',
          message: `${log.pensioner.fullName} failed ${log.method || 'verification'}`,
          timestamp: log.verifiedAt || new Date(),
          read: false,
          actionUrl: `/admin/dashboard?pensionerId=${log.pensionerId}`,
          icon: 'X',
        });
      });
    } catch (err) {
      console.error('Error fetching failed verifications:', err);
    }

    // 5. Verification Due Soon (next 7 days)
    try {
      const dueSoon = await prisma.pensioner.findMany({
        where: {
          nextDueAt: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: 'VERIFIED',
        },
        orderBy: { nextDueAt: 'asc' },
        take: 10,
        select: {
          id: true,
          pensionId: true,
          fullName: true,
          nextDueAt: true,
        },
      });

      dueSoon.forEach((pensioner) => {
        if (pensioner.nextDueAt) {
          allNotifications.push({
            id: `due-soon-${pensioner.id}`,
            type: 'verification_due',
            priority: 'medium',
            title: 'Verification Due Soon',
            message: `${pensioner.fullName} verification is due on ${new Date(pensioner.nextDueAt).toLocaleDateString()}`,
            timestamp: new Date(),
            read: false,
            actionUrl: `/admin/dashboard?pensionerId=${pensioner.id}`,
            icon: 'Calendar',
          });
        }
      });
    } catch (err) {
      console.error('Error fetching due soon verifications:', err);
    }

    // 6. Enquiries (last 7 days)
    try {
      const enquiries = await prisma.enquiry.findMany({
        where: {
          createdAt: {
            gte: oneWeekAgo,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          subject: true,
          fullName: true,
          email: true,
          createdAt: true,
        },
      });

      enquiries.forEach((enquiry) => {
        allNotifications.push({
          id: `enquiry-${enquiry.id}`,
          type: 'enquiry',
          priority: 'low',
          title: 'New Enquiry',
          message: `${enquiry.fullName}: ${enquiry.subject}`,
          timestamp: enquiry.createdAt,
          read: false,
          actionUrl: `/admin/dashboard?enquiryId=${enquiry.id}`,
          icon: 'Mail',
        });
      });
    } catch (err) {
      console.error('Error fetching enquiries:', err);
    }

    // 7. System Alerts (High verification failure rate, etc.)
    try {
      const recentFailures = await prisma.verificationlog.count({
        where: {
          status: 'FAILED',
          verifiedAt: {
            gte: oneDayAgo,
          },
        },
      });

      const recentSuccesses = await prisma.verificationlog.count({
        where: {
          status: 'VERIFIED',
          verifiedAt: {
            gte: oneDayAgo,
          },
        },
      });

      const totalRecent = recentFailures + recentSuccesses;
      if (totalRecent > 10 && recentFailures / totalRecent > 0.3) {
        allNotifications.push({
          id: 'system-alert-high-failure-rate',
          type: 'system_alert',
          priority: 'high',
          title: 'High Failure Rate Alert',
          message: `${((recentFailures / totalRecent) * 100).toFixed(1)}% of verifications failed in the last 24 hours`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/admin/dashboard?page=reports',
          icon: 'AlertCircle',
        });
      }
    } catch (err) {
      console.error('Error calculating system alerts:', err);
    }

    // Sort by timestamp (newest first) and priority
    allNotifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                          (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Filter by type if specified
    let filteredNotifications = allNotifications;
    if (type && type !== 'all') {
      filteredNotifications = allNotifications.filter(n => n.type === type);
    }

    // Limit results
    const limitedNotifications = filteredNotifications.slice(0, limit);

    return NextResponse.json({
      notifications: limitedNotifications,
      total: filteredNotifications.length,
      unread: limitedNotifications.filter(n => !n.read).length,
    });
  } catch (error: any) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
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

    const { notificationId, read } = await request.json();

    // In a real system, you'd store read status in a database
    // For now, we'll just return success
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mark notification error:', error);
    return NextResponse.json(
      {
        message: 'Failed to update notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

