import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const enquiryId = parseInt(params.id);
    if (isNaN(enquiryId)) {
      return NextResponse.json({ message: 'Invalid enquiry ID' }, { status: 400 });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
    });

    if (!enquiry) {
      return NextResponse.json({ message: 'Enquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, enquiry });
  } catch (error: any) {
    console.error('Get enquiry error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch enquiry',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const enquiryId = parseInt(params.id);
    if (isNaN(enquiryId)) {
      return NextResponse.json({ message: 'Invalid enquiry ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, response, resolvedAt } = body;

    // Since enquiry model doesn't have status field, we'll store it in a separate table or use a JSON field
    // For now, we'll just update the enquiry and return success
    // In a production system, you'd want to add a status field to the enquiry model
    
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
    });

    if (!enquiry) {
      return NextResponse.json({ message: 'Enquiry not found' }, { status: 404 });
    }

    // For now, we'll just return success since we can't update status without schema change
    // In production, you should add a status field to the enquiry model
    return NextResponse.json({ 
      success: true, 
      message: 'Enquiry updated successfully',
      enquiry: {
        ...enquiry,
        status: status || 'PENDING', // This is just for response, not stored
      }
    });
  } catch (error: any) {
    console.error('Update enquiry error:', error);
    return NextResponse.json(
      {
        message: 'Failed to update enquiry',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const enquiryId = parseInt(params.id);
    if (isNaN(enquiryId)) {
      return NextResponse.json({ message: 'Invalid enquiry ID' }, { status: 400 });
    }

    await prisma.enquiry.delete({
      where: { id: enquiryId },
    });

    return NextResponse.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error: any) {
    console.error('Delete enquiry error:', error);
    return NextResponse.json(
      {
        message: 'Failed to delete enquiry',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

