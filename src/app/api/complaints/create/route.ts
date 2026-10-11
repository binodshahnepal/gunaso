import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Category, Priority } from '@prisma/client';
import { sendWhatsAppAlert } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      isAnonymous,
      patientName,
      patientPhone,
      patientEmail,
      mrnNumber,
      category,
      departmentId,
      unitId,
      targetPersonName,
      targetPersonRole,
      incidentDate,
      location,
      subject,
      description,
      priority,
    } = body;

    // Validation
    if (!departmentId || !location || !subject || !description) {
      return NextResponse.json(
        { success: false, message: 'Required fields missing' },
        { status: 400 }
      );
    }

    if (!isAnonymous && !patientPhone) {
      return NextResponse.json(
        { success: false, message: 'Contact number is required for identified mode' },
        { status: 400 }
      );
    }

    // Generate Tracking ID and 4-digit PIN
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `GN-${new Date().getFullYear()}-${randomNum}`;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    // Determine Priority based on category if not explicitly provided
    let calculatedPriority: Priority = priority || Priority.MEDIUM;
    if (category === Category.MEDICAL_CARE) calculatedPriority = Priority.HIGH;

    const complaint = await prisma.complaint.create({
      data: {
        trackingId,
        pin,
        isAnonymous: Boolean(isAnonymous),
        patientName: isAnonymous ? null : patientName,
        patientPhone: isAnonymous ? null : patientPhone,
        patientEmail: isAnonymous ? null : patientEmail,
        mrnNumber: isAnonymous ? null : mrnNumber,
        category: (category as Category) || Category.OTHER,
        departmentId,
        unitId: unitId || null,
        targetPersonName: targetPersonName || null,
        targetPersonRole: targetPersonRole || null,
        incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
        location,
        subject,
        description,
        priority: calculatedPriority,
        status: 'SUBMITTED',
        actions: {
          create: {
            actionType: 'STATUS_CHANGE',
            description: 'Grievance submitted by patient.',
            isPublic: true,
          },
        },
      },
      include: {
        department: true,
        unit: true,
      },
    });

    // Dispatch WhatsApp Ticket Creation Alert
    if (!isAnonymous && patientPhone) {
      sendWhatsAppAlert({
        phone: patientPhone,
        patientName,
        trackingId,
        pin,
        status: 'SUBMITTED',
        departmentName: complaint.department.nameEn,
        unitName: complaint.unit?.nameEn,
        type: 'CREATED',
      }).catch((err) => console.error('WhatsApp dispatch error:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Complaint lodged successfully',
      data: {
        trackingId: complaint.trackingId,
        pin: complaint.pin,
        departmentName: complaint.department.nameEn,
        unitName: complaint.unit ? complaint.unit.nameEn : null,
        createdAt: complaint.createdAt,
      },
    });
  } catch (error) {
    console.error('Error lodging complaint:', error);
    return NextResponse.json(
      { success: false, message: 'Server error lodging complaint' },
      { status: 500 }
    );
  }
}
