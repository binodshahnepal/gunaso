import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { sendWhatsAppAlert } from '@/lib/whatsapp';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('gunaso_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [{ id }, { trackingId: id }],
      },
      select: { id: true },
    });

    if (!complaint) {
      return NextResponse.json(
        { success: false, message: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Mark any unread patient messages as read
    await prisma.complaintMessage.updateMany({
      where: {
        complaintId: complaint.id,
        senderType: 'PATIENT',
        isRead: false,
      },
      data: { isRead: true },
    });

    const messages = await prisma.complaintMessage.findMany({
      where: { complaintId: complaint.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('gunaso_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(token);
    } catch {
      try {
        parsed = JSON.parse(decodeURIComponent(token));
      } catch {
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.id },
      include: { department: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { message, attachmentUrl, attachmentName } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message content is required.' },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [{ id }, { trackingId: id }],
      },
      include: {
        department: true,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { success: false, message: 'Complaint not found' },
        { status: 404 }
      );
    }

    // 1. Create the Message
    const newMessage = await prisma.complaintMessage.create({
      data: {
        complaintId: complaint.id,
        senderType: user.role === 'SUPER_ADMIN' ? 'ADMIN' : 'STAFF',
        senderId: user.id,
        senderName: `${user.name} (${user.department ? user.department.nameEn : 'Administration'})`,
        message: message.trim(),
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
      },
    });

    // 2. Add an audit log entry
    await prisma.complaintAction.create({
      data: {
        complaintId: complaint.id,
        actorId: user.id,
        actionType: 'PUBLIC_UPDATE',
        description: `Hospital Staff (${user.name}) sent message: "${message.trim().slice(0, 100)}${message.trim().length > 100 ? '...' : ''}"`,
        isPublic: true,
      },
    });

    // 3. Send WhatsApp Alert if patient phone is present
    if (complaint.patientPhone) {
      try {
        await sendWhatsAppAlert({
          phone: complaint.patientPhone,
          patientName: complaint.patientName || undefined,
          trackingId: complaint.trackingId,
          pin: complaint.pin,
          status: complaint.status,
          departmentName: complaint.department.nameEn,
          actionSummary: `New Hospital Inquiry: "${message.trim().slice(0, 80)}..."`,
          type: 'STATUS_UPDATE',
        });
      } catch (err) {
        console.warn('Failed to send WhatsApp message notification:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent to patient',
      data: newMessage,
    });
  } catch (error) {
    console.error('Error posting admin message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
