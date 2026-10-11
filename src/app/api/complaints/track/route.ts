import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get('trackingId')?.trim();
    const pin = searchParams.get('pin')?.trim();
    const phone = searchParams.get('phone')?.trim();

    if (!trackingId) {
      return NextResponse.json(
        { success: false, message: 'Tracking ID is required' },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.findUnique({
      where: { trackingId },
      include: {
        department: {
          select: { nameEn: true, nameNp: true, code: true, slaHours: true },
        },
        actions: {
          where: { isPublic: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            actionType: true,
            description: true,
            createdAt: true,
          },
        },
        feedback: {
          select: { rating: true, comments: true, createdAt: true },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { success: false, message: 'Complaint not found. Please check your Tracking ID.' },
        { status: 404 }
      );
    }

    // Verify PIN or phone if provided
    if (pin && complaint.pin !== pin) {
      return NextResponse.json(
        { success: false, message: 'Invalid 4-digit Security PIN' },
        { status: 401 }
      );
    }

    if (phone && complaint.patientPhone && complaint.patientPhone !== phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number does not match record' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      complaint: {
        id: complaint.id,
        trackingId: complaint.trackingId,
        isAnonymous: complaint.isAnonymous,
        patientName: complaint.isAnonymous ? 'Anonymous' : complaint.patientName,
        category: complaint.category,
        department: complaint.department,
        subject: complaint.subject,
        description: complaint.description,
        status: complaint.status,
        priority: complaint.priority,
        incidentDate: complaint.incidentDate,
        location: complaint.location,
        targetPersonName: complaint.targetPersonName,
        targetPersonRole: complaint.targetPersonRole,
        actionSummary: complaint.actionSummary,
        resolvedAt: complaint.resolvedAt,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
        actions: complaint.actions,
        feedback: complaint.feedback,
      },
    });
  } catch (error) {
    console.error('Error tracking complaint:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve complaint status' },
      { status: 500 }
    );
  }
}
