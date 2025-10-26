import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { uploadFile } from '@/lib/backblaze'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'])

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const token = verifyToken(bearer)
    if (!token?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const form = await request.formData()
    const pensionerIdRaw = form.get('pensionerId') as string | null
    const fileType = (form.get('fileType') as string | null) || 'unknown'
    const file = form.get('file') as File | null

    if (!pensionerIdRaw || !file) {
      return NextResponse.json({ message: 'Missing pensionerId or file' }, { status: 400 })
    }

    const pensionerId = Number(pensionerIdRaw)
    if (Number.isNaN(pensionerId)) return NextResponse.json({ message: 'Invalid pensionerId' }, { status: 400 })

    // Security: Only owner or ADMIN can upload for this pensioner
    const isOwner = Number(token.id) === pensionerId && token.role === 'pensioner'
    const isAdmin = token.role === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ message: 'Invalid file type' }, { status: 415 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ message: 'File too large (max 10MB)' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Backblaze B2
    const fileName = `pensioners/${pensionerId}/${fileType}-${Date.now()}.${file.name.split('.').pop()}`
    const uploadResult = await uploadFile(buffer, fileName, file.type)

    const url: string = `${process.env.S3_PUBLIC_BASE_URL || 'https://f003.backblazeb2.com/file/PensionerRegisgration'}/${fileName}`
    const publicId: string = uploadResult.fileId || ''
    const originalName: string = file.name || 'upload'

    const saved = await prisma.pensionerfile.create({
      data: {
        id: `file-${pensionerId}-${Date.now()}`,
        pensionerId,
        fileType,
        fileUrl: url,
        originalName,
        publicId: publicId || '',
        uploadedById: isOwner ? pensionerId : Number(token.id),
      },
    })

    return NextResponse.json({ success: true, file: saved })
  } catch (err: any) {
    console.error('[files/upload] error', err)
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 })
  }
}


