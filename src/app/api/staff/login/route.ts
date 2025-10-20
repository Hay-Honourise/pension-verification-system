import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    console.debug('[staff/login] route hit');
    const { email, password } = await req.json();
    console.debug('[staff/login] payload', { email, hasPassword: !!password });
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });

    const ok = await verifyPassword(password, user.password);
    if (!ok) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });

    const token = generateToken({ id: user.id, role: user.role, email: user.email });
    const redirectTo = user.role === 'ADMIN' ? '/admin-dashboard' : '/officer/dashboard';
    return NextResponse.json({ success: true, message: 'Login successful', token, user: { id: user.id, role: user.role, email: user.email, fullName: user.fullName }, redirectTo });
  } catch (err) {
    console.error('Staff login error', err);
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }
}


