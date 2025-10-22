import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const tokenPayload = bearer ? verifyToken(bearer) : null;

    const body = await request.json();
    const { id, phone, address, email } = body || {};

    if (!id || !phone || !address || !email) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Security: if token provided, ensure it matches the target id
    if (tokenPayload && tokenPayload.id && Number(tokenPayload.id) !== Number(id)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Map incoming fields to schema
    const updateData: Record<string, any> = {
      email,
      phone,
      residentialAddress: address,
    };
    // Note: bankDetails is not present in current Prisma schema; ignoring to avoid errors

    const updated = await prisma.pensioner.update({
      where: { id: Number(id) },
      data: updateData,
      select: { id: true, email: true, phone: true, residentialAddress: true },
    });

    return NextResponse.json({ message: 'Profile updated', pensioner: updated }, { status: 200 });
  } catch (err: any) {
    console.error('[update-profile] error', err);
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}


