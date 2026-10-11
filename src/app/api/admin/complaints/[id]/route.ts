import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Priority } from '@prisma/client';
import { sendWhatsAppAlert } from '@/lib/whatsapp';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      status,
      priority,
      actionSummary,
      note,
      isPublicNote,
    } = body;

    const existing = await prisma.complaint.findUnique({
      where: { id },
      include: { department: true, unit: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Complaint not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    const newActions: any[] = [];
    let statusChanged = false;

    if (status && status !== existing.status) {
      statusChanged = true;
      updateData.status = status as Status;
      if (status === Status.RESOLVED || status === Status.ACTION_TAKEN) {
        updateData.resolvedAt = new Date();
      }
      newActions.push({
        actionType: 'STATUS_CHANGE',
        description: `Status changed from ${existing.status} to ${status}.`,
        isPublic: true,
      });
    }

    if (priority && priority !== existing.priority) {
      updateData.priority = priority as Priority;
    }

    if (actionSummary !== undefined) {
      updateData.actionSummary = actionSummary;
    }

    if (note) {
      newActions.push({
        actionType: isPublicNote ? 'PUBLIC_UPDATE' : 'INTERNAL_NOTE',
        description: note,
        isPublic: Boolean(isPublicNote),
      });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        ...updateData,
        actions: {
          create: newActions,
        },
      },
      include: {
        department: true,
        unit: true,
        actions: { orderBy: { createdAt: 'desc' } },
        feedback: true,
      },
    });

    // Dispatch WhatsApp Status Update / Resolution Alert to Patient
    if (!existing.isAnonymous && existing.patientPhone) {
      const isResolved = status === 'RESOLVED' || status === 'ACTION_TAKEN';
      sendWhatsAppAlert({
        phone: existing.patientPhone,
        patientName: existing.patientName,
        trackingId: existing.trackingId,
        pin: existing.pin,
        status: status || existing.status,
        departmentName: existing.department.nameEn,
        unitName: existing.unit?.nameEn,
        actionSummary: actionSummary || existing.actionSummary,
        type: isResolved ? 'RESOLVED' : 'STATUS_UPDATE',
      }).catch((err) => console.error('WhatsApp dispatch error:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Complaint updated & WhatsApp alert dispatched successfully',
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update complaint' },
      { status: 500 }
    );
  }
}
