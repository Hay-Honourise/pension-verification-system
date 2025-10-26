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
		const pageSize = Math.max(1, Math.min(50, Number(searchParams.get('pageSize') || 10)));
		const subject = searchParams.get('subject') || undefined;

		const where = subject ? { subject } : {};
		const [total, rows] = await Promise.all([
			prisma.enquiry.count({ where }),
			prisma.enquiry.findMany({
				where,
				orderBy: { id: 'desc' },
				skip: (page - 1) * pageSize,
				take: pageSize,
			})
		]);

        return NextResponse.json({ success: true, total, rows, page, pageSize });
	} catch (err: any) {
		console.error('List enquiries failed:', err);
		return NextResponse.json({ success: false, error: 'Failed to load enquiries' }, { status: 500 });
	}
}
