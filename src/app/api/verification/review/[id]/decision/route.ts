import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const token = verifyToken(bearer)
    if (!token?.id || (token.role !== 'VERIFICATION_OFFICER' && token.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const id = Number(params.id)
    const body = await request.json()
    const decision = String(body?.decision || '').toUpperCase()
    const notes = String(body?.notes || '')

    const review = await prisma.verificationreview.findUnique({ where: { id } })
    if (!review) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      return NextResponse.json({ message: 'Invalid decision' }, { status: 400 })
    }

    if (decision === 'APPROVE') {
      const nextDue = new Date()
      nextDue.setFullYear(nextDue.getFullYear() + 3)
      await prisma.$transaction([
        prisma.verificationreview.update({ where: { id }, data: { status: 'VERIFIED', reviewedAt: new Date(), officerId: Number(token.id) } }),
        prisma.verificationlog.create({ data: { pensionerId: review.pensionerId, method: 'MANUAL_REVIEW', status: 'VERIFIED', verifiedAt: new Date(), nextDueAt: nextDue } }),
      ])
      return NextResponse.json({ success: true, status: 'VERIFIED', nextDueAt: nextDue })
    } else {
      await prisma.$transaction([
        prisma.verificationreview.update({ where: { id }, data: { status: 'REJECTED', reviewedAt: new Date(), officerId: Number(token.id) } }),
        prisma.verificationlog.create({ data: { pensionerId: review.pensionerId, method: 'MANUAL_REVIEW', status: 'REJECTED', verifiedAt: new Date() } }),
      ])
      return NextResponse.json({ success: true, status: 'REJECTED' })
    }
  } catch (err) {
    console.error('[review/decision] error', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
