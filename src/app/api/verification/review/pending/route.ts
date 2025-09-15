import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const token = verifyToken(bearer)
    if (!token?.id || (token.role !== 'VERIFICATION_OFFICER' && token.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = Number(searchParams.get('page') || 1)
    const pageSize = Math.min(50, Number(searchParams.get('pageSize') || 20))

    const where: any = { status }

    const [items, total] = await Promise.all([
      prisma.verificationReview.findMany({
        where,
        orderBy: { id: 'desc' },
        include: { pensioner: { select: { id: true, fullName: true, pensionId: true, photo: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.verificationReview.count({ where }),
    ])

    return NextResponse.json({ items, total, page, pageSize })
  } catch (err) {
    console.error('[review/pending] error', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
