import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { deleteFile } from '@/lib/backblaze'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const token = verifyToken(bearer)
    if (!token?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const fileId = String(body?.fileId || '')
    if (!fileId) return NextResponse.json({ message: 'fileId is required' }, { status: 400 })

    const file = await prisma.pensionerfile.findUnique({ where: { id: fileId } })
    if (!file) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const isOwner = token.role === 'pensioner' && Number(token.id) === file.pensionerId
    const isAdmin = token.role === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Delete from Backblaze B2
    await deleteFile(file.publicId, file.fileUrl.split('/').pop() || '')

    await prisma.pensionerfile.delete({ where: { id: fileId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[files/delete] error', err)
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 })
  }
}


