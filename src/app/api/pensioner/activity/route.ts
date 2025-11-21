import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface ActivityItem {
  id: string;
  type: 'verification' | 'document' | 'registration' | 'login' | 'profile_update';
  title: string;
  description?: string;
  timestamp: Date;
  status?: string;
  color: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'pensioner') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const pensionerId = Number(token.id);
    if (Number.isNaN(pensionerId)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pensioner with related data
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: pensionerId },
      select: {
        id: true,
        createdAt: true,
        lastLogin: true,
        updatedAt: true,
        verificationlog: {
          orderBy: { verifiedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            method: true,
            status: true,
            verifiedAt: true,
            nextDueAt: true,
          },
        },
        pensionerfile: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            fileType: true,
            originalName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const activities: ActivityItem[] = [];

    // Add verification logs
    pensioner.verificationlog.forEach((log) => {
      if (log.verifiedAt) {
        const methodLabels: { [key: string]: string } = {
          'WINDOWS_HELLO_FACE': 'Face verification',
          'WINDOWS_HELLO_FINGERPRINT': 'Fingerprint verification',
          'WINDOWS_HELLO': 'Biometric verification',
          'ADMIN_REVIEW': 'Admin review',
          'MANUAL_REVIEW': 'Manual review',
        };

        const title = log.status === 'SUCCESS' || log.status === 'VERIFIED'
          ? 'Verification completed'
          : log.status === 'PENDING_REVIEW'
          ? 'Verification pending review'
          : 'Verification attempt';

        activities.push({
          id: `verification-${log.id}`,
          type: 'verification',
          title,
          description: methodLabels[log.method] || log.method,
          timestamp: log.verifiedAt,
          status: log.status,
          color: log.status === 'SUCCESS' || log.status === 'VERIFIED' 
            ? 'blue' 
            : log.status === 'PENDING_REVIEW' 
            ? 'yellow' 
            : 'gray',
        });
      }
    });

    // Add document uploads
    pensioner.pensionerfile.forEach((file) => {
      const typeLabels: { [key: string]: string } = {
        'idCard': 'ID Card',
        'birthCertificate': 'Birth Certificate',
        'appointmentLetter': 'Appointment Letter',
        'retirementLetter': 'Retirement Letter',
        'passportPhoto': 'Passport Photo',
      };

      activities.push({
        id: `document-${file.id}`,
        type: 'document',
        title: 'Document uploaded',
        description: typeLabels[file.fileType] || file.fileType,
        timestamp: file.createdAt,
        color: 'yellow',
      });
    });

    // Add account registration
    if (pensioner.createdAt) {
      activities.push({
        id: `registration-${pensioner.id}`,
        type: 'registration',
        title: 'Account created',
        description: 'Registration completed',
        timestamp: pensioner.createdAt,
        color: 'green',
      });
    }

    // Add last login
    if (pensioner.lastLogin) {
      activities.push({
        id: `login-${pensioner.id}-${pensioner.lastLogin.getTime()}`,
        type: 'login',
        title: 'Last login',
        description: 'Logged into account',
        timestamp: pensioner.lastLogin,
        color: 'blue',
      });
    }

    // Add profile update (if updatedAt is significantly different from createdAt)
    if (pensioner.updatedAt && pensioner.createdAt) {
      const timeDiff = pensioner.updatedAt.getTime() - pensioner.createdAt.getTime();
      // Only add if updated more than 1 hour after creation
      if (timeDiff > 3600000) {
        activities.push({
          id: `profile-${pensioner.id}-${pensioner.updatedAt.getTime()}`,
          type: 'profile_update',
          title: 'Profile updated',
          description: 'Contact information updated',
          timestamp: pensioner.updatedAt,
          color: 'purple',
        });
      }
    }

    // Sort activities by timestamp (most recent first) and limit to 10
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return NextResponse.json({
      activities: sortedActivities.map(activity => ({
        ...activity,
        timestamp: activity.timestamp.toISOString(),
      })),
    });

  } catch (err) {
    console.error('❌ [pensioner/activity] error:', err);
    return NextResponse.json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}

