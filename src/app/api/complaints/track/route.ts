import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get('trackingId')?.trim();
    const pin = searchParams.get('pin')?.trim();
    const phone = searchParams.get('phone')?.trim();

    if (!trackingId && !phone) {
      return NextResponse.json(
        { success: false, message: 'Please provide either a Tracking ID or a Mobile Number.' },
        { status: 400 }
      );
    }

    // 1. If only phone number is provided (Search complaints by mobile number)
    if (!trackingId && phone) {
      const complaints = await prisma.complaint.findMany({
        where: {
          patientPhone: { contains: phone },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          department: {
            select: { nameEn: true, nameNp: true, code: true, slaHours: true },
          },
          unit: {
            select: { nameEn: true, nameNp: true, code: true },
          },
          actions: {
            where: { isPublic: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
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

      if (complaints.length === 0) {
        return NextResponse.json(
          { success: false, message: `No complaints found registered with mobile number ${phone}.` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        count: complaints.length,
        isMulti: true,
        complaints: complaints.map((c) => ({
          id: c.id,
          trackingId: c.trackingId,
          pin: c.pin,
          isAnonymous: c.isAnonymous,
          patientName: c.isAnonymous ? 'Anonymous' : c.patientName,
          patientPhone: c.patientPhone,
          category: c.category,
          department: c.department,
          unit: c.unit,
          subject: c.subject,
          description: c.description,
          status: c.status,
          priority: c.priority,
          incidentDate: c.incidentDate,
          location: c.location,
          targetPersonName: c.targetPersonName,
          targetPersonRole: c.targetPersonRole,
          actionSummary: c.actionSummary,
          resolvedAt: c.resolvedAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          actions: c.actions,
          feedback: c.feedback,
        })),
      });
    }

    // 2. Search by unique Tracking ID
    const complaint = await prisma.complaint.findUnique({
      where: { trackingId: trackingId! },
      include: {
        department: {
          select: { nameEn: true, nameNp: true, code: true, slaHours: true },
        },
        unit: {
          select: { nameEn: true, nameNp: true, code: true },
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

    if (phone && complaint.patientPhone && !complaint.patientPhone.includes(phone)) {
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
        pin: complaint.pin,
        isAnonymous: complaint.isAnonymous,
        patientName: complaint.isAnonymous ? 'Anonymous' : complaint.patientName,
        patientPhone: complaint.patientPhone,
        category: complaint.category,
        department: complaint.department,
        unit: complaint.unit,
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
