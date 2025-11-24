import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!bearer) {
      return NextResponse.json({ show: false }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id) {
      return NextResponse.json({ show: false }, { status: 401 });
    }

    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(token.id) },
      select: { 
        nextDueAt: true, 
        hasSeenDueNotification: true 
      }
    });

    if (!pensioner || !pensioner.nextDueAt) {
      return NextResponse.json({ show: false });
    }

    const now = new Date();
    const dueDate = new Date(pensioner.nextDueAt);

    // If due AND they have not seen popup yet
    const shouldShow = now >= dueDate && !pensioner.hasSeenDueNotification;

    return NextResponse.json({ 
      show: shouldShow, 
      nextDueAt: pensioner.nextDueAt 
    });
  } catch (error: any) {
    console.error('[pensioner/due-notification] GET error:', error);
    return NextResponse.json({ 
      show: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!bearer) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // Mark as seen
    await prisma.pensioner.update({
      where: { id: Number(token.id) },
      data: { hasSeenDueNotification: true }
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[pensioner/due-notification] POST error:', error);
    return NextResponse.json({ 
      ok: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

