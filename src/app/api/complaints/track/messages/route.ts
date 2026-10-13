import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get('trackingId')?.trim();
    const pin = searchParams.get('pin')?.trim();

    if (!trackingId || !pin) {
      return NextResponse.json(
        { success: false, message: 'Tracking ID and Security PIN are required.' },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.findUnique({
      where: { trackingId },
      select: { id: true, pin: true },
    });

    if (!complaint || complaint.pin !== pin) {
      return NextResponse.json(
        { success: false, message: 'Invalid Tracking ID or Security PIN.' },
        { status: 401 }
      );
    }

    const messages = await prisma.complaintMessage.findMany({
      where: { complaintId: complaint.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderType: true,
        senderName: true,
        message: true,
        attachmentUrl: true,
        attachmentName: true,
        isRead: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error fetching patient messages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trackingId, pin, message, attachmentUrl, attachmentName } = body;

    if (!trackingId || !pin || !message?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Tracking ID, PIN, and Message content are required.' },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.findUnique({
      where: { trackingId: trackingId.trim() },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (!complaint || complaint.pin !== pin.trim()) {
      return NextResponse.json(
        { success: false, message: 'Invalid Tracking ID or Security PIN.' },
        { status: 401 }
      );
    }

    const senderDisplayName = complaint.isAnonymous
      ? 'Patient (Anonymous)'
      : complaint.patientName?.trim() || 'Patient';

    // 1. Create the Message
    const newMessage = await prisma.complaintMessage.create({
      data: {
        complaintId: complaint.id,
        senderType: 'PATIENT',
        senderName: senderDisplayName,
        message: message.trim(),
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
      },
    });

    // 2. Add an audit log entry (isPublic: true)
    await prisma.complaintAction.create({
      data: {
        complaintId: complaint.id,
        actionType: 'PUBLIC_UPDATE',
        description: `Patient replied: "${message.trim().slice(0, 100)}${message.trim().length > 100 ? '...' : ''}"`,
        isPublic: true,
      },
    });

    // 3. Notify the assigned officer (or Central Admin if unassigned)
    await prisma.notification.create({
      data: {
        complaintId: complaint.id,
        userId: complaint.assignedToId || null,
        title: `💬 New Reply: ${complaint.trackingId}`,
        message: `${senderDisplayName} replied: "${message.trim().slice(0, 90)}${message.trim().length > 90 ? '...' : ''}"`,
        type: 'PATIENT_MESSAGE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage,
    });
  } catch (error) {
    console.error('Error posting patient message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
