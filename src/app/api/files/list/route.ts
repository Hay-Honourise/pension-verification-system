import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const token = verifyToken(bearer)
    if (!token?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const pensionerIdParam = searchParams.get('pensionerId')

    let pensionerId: number
    if (token.role === 'pensioner') {
      pensionerId = Number(token.id)
    } else if (token.role === 'ADMIN' || token.role === 'VERIFICATION_OFFICER') {
      if (!pensionerIdParam) return NextResponse.json({ message: 'pensionerId is required' }, { status: 400 })
      pensionerId = Number(pensionerIdParam)
    } else {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    if (Number.isNaN(pensionerId)) return NextResponse.json({ message: 'Invalid pensionerId' }, { status: 400 })

    const files = await prisma.pensionerFile.findMany({
      where: { pensionerId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ files })
  } catch (err) {
    console.error('[files/list] error', err)
    return NextResponse.json({ message: 'List failed' }, { status: 500 })
  }
}


