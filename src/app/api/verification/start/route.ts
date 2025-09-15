import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { detectFaceFromUrl, detectFaceFromBuffer, verifyFaces } from '@/lib/azureFace'
import path from 'path'
import fs from 'fs/promises'

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'])

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const token = verifyToken(bearer)
    if (!token?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const pensioner = await prisma.pensioner.findUnique({ where: { id: Number(token.id) } })
    if (!pensioner) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const formData = await request.formData()

    const captured = formData.get('captured') as File | null
    if (!captured) return NextResponse.json({ message: 'Captured image is required' }, { status: 400 })

    if (!ALLOWED_TYPES.has(captured.type)) {
      return NextResponse.json({ message: 'Invalid file type' }, { status: 415 })
    }
    if (captured.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ message: 'File too large (max 5MB)' }, { status: 413 })
    }

    // Ensure stored profile photo exists
    if (!pensioner.photo) {
      return NextResponse.json({ message: 'No stored profile photo on record' }, { status: 400 })
    }

    // Prepare stored photo faceId
    let storedFaceId: string | null = null
    if (/^https?:\/\//i.test(pensioner.photo)) {
      storedFaceId = await detectFaceFromUrl(pensioner.photo)
    } else {
      const abs = path.join(process.cwd(), 'public', pensioner.photo.replace(/^\/+/, ''))
      try {
        const buf = await fs.readFile(abs)
        storedFaceId = await detectFaceFromBuffer(buf)
      } catch (e) {
        console.error('Failed to read stored photo', e)
        return NextResponse.json({ message: 'Stored profile photo not accessible' }, { status: 500 })
      }
    }

    if (!storedFaceId) {
      return NextResponse.json({ message: 'No face detected in stored photo' }, { status: 422 })
    }

    // Save captured photo to disk first
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pensioners', String(pensioner.id))
    await fs.mkdir(uploadDir, { recursive: true })
    const ext = captured.type === 'image/png' ? '.png' : captured.type === 'application/pdf' ? '.pdf' : '.jpg'
    const fileName = `captured-${Date.now()}${ext}`
    const fullPath = path.join(uploadDir, fileName)
    const capturedBuffer = Buffer.from(await captured.arrayBuffer())
    await fs.writeFile(fullPath, capturedBuffer)
    const capturedUrl = `/uploads/pensioners/${pensioner.id}/${fileName}`

    // Detect face in captured
    const capturedFaceId = await detectFaceFromBuffer(capturedBuffer)
    if (!capturedFaceId) {
      // create review immediately
      await prisma.verificationReview.create({
        data: {
          pensionerId: pensioner.id,
          capturedPhoto: capturedUrl,
          status: 'PENDING',
        },
      })
      return NextResponse.json({ success: false, status: 'PENDING_REVIEW', message: 'No face detected, escalated to officer' }, { status: 202 })
    }

    // Verify
    const { isIdentical, confidence } = await verifyFaces(capturedFaceId, storedFaceId)
    const threshold = 0.6
    if (isIdentical && confidence >= threshold) {
      const nextDue = new Date()
      nextDue.setFullYear(nextDue.getFullYear() + 3)
      await prisma.verificationLog.create({
        data: {
          pensionerId: pensioner.id,
          method: 'AZURE_FACE_API',
          status: 'SUCCESS',
          verifiedAt: new Date(),
          nextDueAt: nextDue,
        },
      })
      return NextResponse.json({ success: true, status: 'SUCCESS', nextDueAt: nextDue })
    }

    // Low confidence or not identical → review
    await prisma.verificationReview.create({
      data: {
        pensionerId: pensioner.id,
        capturedPhoto: capturedUrl,
        status: 'PENDING',
      },
    })
    await prisma.verificationLog.create({
      data: {
        pensionerId: pensioner.id,
        method: 'AZURE_FACE_API',
        status: 'PENDING_REVIEW',
      },
    })

    return NextResponse.json({ success: false, status: 'PENDING_REVIEW', message: 'Escalated to Verification Officer', confidence })
  } catch (err: any) {
    console.error('[verification/start] error', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
