import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = verifyToken(bearer);
    if (!token?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type')?.toUpperCase();
    
    if (!type || !['FACE', 'FINGERPRINT'].includes(type)) {
      return NextResponse.json({ message: 'Invalid biometric type' }, { status: 400 });
    }

    // Get pensioner info
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(token.id) },
      select: { id: true, fullName: true, email: true }
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    // Check if already registered
    const existingCredential = await prisma.biometriccredential.findFirst({
      where: {
        pensionerId: pensioner.id,
        type: type as 'FACE' | 'FINGERPRINT'
      }
    });

    if (existingCredential) {
      return NextResponse.json({ message: `${type} already registered` }, { status: 400 });
    }

    // Generate challenge
    const challenge = randomBytes(32);
    const userId = new TextEncoder().encode(pensioner.id.toString());
    const userName = pensioner.email;
    const userDisplayName = pensioner.fullName;

    return NextResponse.json({
      challenge: Array.from(challenge),
      userId: Array.from(userId),
      userName,
      userDisplayName,
      rpId: process.env.RP_ID || 'localhost'
    });

  } catch (err) {
    console.error('[biometric/register] GET error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = verifyToken(bearer);
    if (!token?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, credential } = body;

    if (!type || !credential) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!['FACE', 'FINGERPRINT'].includes(type)) {
      return NextResponse.json({ message: 'Invalid biometric type' }, { status: 400 });
    }

    // Get pensioner
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(token.id) }
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    // Check if already registered
    const existingCredential = await prisma.biometriccredential.findFirst({
      where: {
        pensionerId: pensioner.id,
        type: type as 'FACE' | 'FINGERPRINT'
      }
    });

    if (existingCredential) {
      return NextResponse.json({ message: `${type} already registered` }, { status: 400 });
    }

    // Store the credential
    await prisma.biometriccredential.create({
      data: {
        pensionerId: pensioner.id,
        type: type as 'FACE' | 'FINGERPRINT',
        credentialId: credential.id,
        publicKey: JSON.stringify(credential.response),
        registeredAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `${type} registered successfully` 
    });

  } catch (err) {
    console.error('[biometric/register] POST error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
