import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!bearer) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const token = verifyToken(bearer);
        if (!token?.id || token.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
		const { searchParams } = new URL(req.url);
		const page = Math.max(1, Number(searchParams.get('page') || 1));
		const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize') || 50)));
		const subject = searchParams.get('subject') || undefined;
		const search = searchParams.get('search') || undefined;
		const email = searchParams.get('email') || undefined;

		// Build where clause
		const where: any = {};
		
		if (subject) {
			where.subject = { contains: subject, mode: 'insensitive' };
		}
		
		if (search) {
			where.OR = [
				{ subject: { contains: search, mode: 'insensitive' } },
				{ message: { contains: search, mode: 'insensitive' } },
				{ fullName: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
			];
		}
		
		if (email) {
			where.email = { contains: email, mode: 'insensitive' };
		}

		const [total, rows] = await Promise.all([
			prisma.enquiry.count({ where }),
			prisma.enquiry.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (page - 1) * pageSize,
				take: pageSize,
				select: {
					id: true,
					fullName: true,
					email: true,
					phone: true,
					subject: true,
					message: true,
					trackingId: true,
					createdAt: true,
				}
			})
		]);

		// Calculate statistics
		const now = new Date();
		const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		
		const [todayCount, weekCount, totalCount] = await Promise.all([
			prisma.enquiry.count({ where: { createdAt: { gte: oneDayAgo } } }),
			prisma.enquiry.count({ where: { createdAt: { gte: oneWeekAgo } } }),
			prisma.enquiry.count(),
		]);

        return NextResponse.json({ 
			success: true, 
			total, 
			rows: rows.map(row => ({
				...row,
				status: 'PENDING', // Default status since model doesn't have it
			})), 
			page, 
			pageSize,
			statistics: {
				today: todayCount,
				thisWeek: weekCount,
				total: totalCount,
			}
		});
	} catch (err: any) {
		console.error('List enquiries failed:', err);
		return NextResponse.json({ success: false, error: 'Failed to load enquiries' }, { status: 500 });
	}
}
