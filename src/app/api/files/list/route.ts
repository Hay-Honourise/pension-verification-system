import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [files/list] Starting request...');
    
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!bearer) {
      console.log('❌ No bearer token found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    const token = verifyToken(bearer)
    if (!token?.id) {
      console.log('❌ Invalid token or missing ID');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    console.log('👤 Token ID:', token.id, 'Role:', token.role);

    const { searchParams } = new URL(request.url)
    const pensionerIdParam = searchParams.get('pensionerId')

    let pensionerId: number
    if (token.role === 'pensioner') {
      const parsed = Number(token.id)
      if (Number.isNaN(parsed)) {
        console.warn('⚠️ Pensioner token has non-numeric ID; cannot resolve own files. ID:', token.id)
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      pensionerId = parsed
      console.log('👤 Pensioner accessing own files, ID:', pensionerId);
    } else if (token.role === 'admin' || token.role === 'VERIFICATION_OFFICER') {
      if (!pensionerIdParam) {
        console.log('❌ Admin/Verification Officer missing pensionerId parameter');
        return NextResponse.json({ message: 'pensionerId is required' }, { status: 400 })
      }
      pensionerId = Number(pensionerIdParam)
      console.log('👤 Admin/Verification Officer accessing files for pensioner ID:', pensionerId);
    } else {
      console.log('❌ Invalid role:', token.role);
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    if (Number.isNaN(pensionerId)) {
      console.log('❌ Invalid pensionerId:', pensionerIdParam);
      return NextResponse.json({ message: 'Invalid pensionerId' }, { status: 400 })
    }

    console.log('🔍 Querying files for pensioner ID:', pensionerId);
    const files = await prisma.pensionerfile.findMany({
      where: { pensionerId },
      orderBy: { createdAt: 'desc' },
    })

    console.log('✅ Found', files.length, 'files for pensioner');
    return NextResponse.json({ files })
  } catch (err) {
    console.error('❌ [files/list] error:', err);
    return NextResponse.json({ message: 'List failed' }, { status: 500 })
  }
}


