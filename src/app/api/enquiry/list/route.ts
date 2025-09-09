import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
	try {
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

		return NextResponse.json({ success: true, total, rows });
	} catch (err: any) {
		console.error('List enquiries failed:', err);
		return NextResponse.json({ success: false, error: 'Failed to load enquiries' }, { status: 500 });
	}
}
