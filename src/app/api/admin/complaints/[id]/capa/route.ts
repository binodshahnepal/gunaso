import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { RootCauseCategory, CapaStatus } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [{ id }, { trackingId: id }],
      },
      include: {
        capa: true,
        department: true,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { success: false, message: 'Complaint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      complaintId: complaint.id,
      trackingId: complaint.trackingId,
      capa: complaint.capa,
    });
  } catch (error: any) {
    console.error('Error fetching CAPA record:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch CAPA record' },
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
    const body = await req.json();

    const {
      rootCauseCategory,
      rootCauseAnalysis,
      correctiveAction,
      preventiveAction,
      status,
      targetReviewDate,
      qaOfficerName,
      qaNotes,
    } = body;

    if (!rootCauseAnalysis?.trim() || !correctiveAction?.trim() || !preventiveAction?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Root Cause Analysis, Corrective Action, and Preventive Action are required.',
        },
        { status: 400 }
      );
    }

    // Authenticate officer from session cookie
    const cookieStore = await cookies();
    let tokenStr = cookieStore.get('gunaso_token')?.value;
    let currentUser: any = null;
    if (tokenStr) {
      try {
        currentUser = JSON.parse(decodeURIComponent(tokenStr));
      } catch {
        try {
          currentUser = JSON.parse(tokenStr);
        } catch {
          // ignore
        }
      }
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [{ id }, { trackingId: id }],
      },
      include: {
        department: true,
        capa: true,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { success: false, message: 'Complaint not found' },
        { status: 404 }
      );
    }

    const validCategory = (rootCauseCategory as RootCauseCategory) || RootCauseCategory.PROCESS_DEFECT;
    const validStatus = (status as CapaStatus) || CapaStatus.PENDING_QA_REVIEW;
    const reviewDate = targetReviewDate ? new Date(targetReviewDate) : null;
    const officerName = qaOfficerName?.trim() || currentUser?.name || 'Quality Assurance Officer';

    // Upsert the CAPA record
    const capa = await prisma.capaRecord.upsert({
      where: { complaintId: complaint.id },
      update: {
        rootCauseCategory: validCategory,
        rootCauseAnalysis: rootCauseAnalysis.trim(),
        correctiveAction: correctiveAction.trim(),
        preventiveAction: preventiveAction.trim(),
        status: validStatus,
        targetReviewDate: reviewDate,
        qaOfficerName: officerName,
        qaNotes: qaNotes?.trim() || null,
      },
      create: {
        complaintId: complaint.id,
        rootCauseCategory: validCategory,
        rootCauseAnalysis: rootCauseAnalysis.trim(),
        correctiveAction: correctiveAction.trim(),
        preventiveAction: preventiveAction.trim(),
        status: validStatus,
        targetReviewDate: reviewDate,
        qaOfficerName: officerName,
        qaNotes: qaNotes?.trim() || null,
      },
    });

    // Create Action Log in audit trail
    await prisma.complaintAction.create({
      data: {
        complaintId: complaint.id,
        actorId: currentUser?.id || null,
        actionType: 'CAPA_RECORDED',
        description: `CAPA Audit Logged by ${currentUser?.name || officerName}: Root Cause [${validCategory.replace(/_/g, ' ')}]. Status: ${validStatus.replace(/_/g, ' ')}.`,
        isPublic: false, // Internal Clinical Governance Record
      },
    });

    // Notify Central Administration
    await prisma.notification.create({
      data: {
        userId: null,
        complaintId: complaint.id,
        title: `CAPA Documented: ${complaint.trackingId}`,
        message: `${currentUser?.name || officerName} recorded Corrective & Preventive Action for "${complaint.subject}". Root Cause: ${validCategory}.`,
        type: 'DEPT_UPDATE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'CAPA Record saved and audited successfully.',
      capa,
    });
  } catch (error: any) {
    console.error('Error saving CAPA record:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save CAPA record' },
      { status: 500 }
    );
  }
}
