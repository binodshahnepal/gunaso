import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Priority } from '@prisma/client';
import { sendWhatsAppAlert } from '@/lib/whatsapp';
import { cookies } from 'next/headers';

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
        department: true,
        unit: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
        actions: {
          orderBy: { createdAt: 'asc' },
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                role: true,
                email: true,
              },
            },
          },
        },
        feedback: true,
        attachments: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
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
      complaint,
    });
  } catch (error: any) {
    console.error('Error fetching complaint details:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch complaint' },
      { status: 500 }
    );
  }
}

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
      assignedToId,
      departmentId,
      unitId,
      transferReason,
    } = body;

    // Identify current logged-in user from cookie
    const cookieStore = await cookies();
    const tokenStr = cookieStore.get('gunaso_token')?.value;
    let currentUser: { id: string; name: string; email: string; role: string; departmentId?: string } | null = null;
    if (tokenStr) {
      try {
        currentUser = JSON.parse(tokenStr);
      } catch (e) {
        // ignore
      }
    }

    const existing = await prisma.complaint.findFirst({
      where: {
        OR: [{ id }, { trackingId: id }],
      },
      include: { department: true, unit: true, assignedTo: true },
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

    // 0. Department Transfer handling
    if (departmentId && departmentId !== existing.departmentId) {
      const newDept = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (newDept) {
        updateData.departmentId = departmentId;
        updateData.unitId = unitId || null;
        updateData.assignedToId = null; // Reset specific user assignment upon department transfer

        newActions.push({
          actionType: 'ASSIGNMENT',
          description: `Grievance transferred from ${existing.department.nameEn} to ${newDept.nameEn}. ${transferReason ? `Note: ${transferReason}` : 'Re-assigned to respective department.'}`,
          isPublic: true,
          actorId: currentUser?.id || null,
        });

        // Notify admins and new department
        await prisma.notification.create({
          data: {
            userId: null,
            complaintId: existing.id,
            title: `Case Re-assigned to ${newDept.nameEn}: ${existing.trackingId}`,
            message: `${currentUser?.name || 'Officer'} transferred grievance "${existing.subject}" to ${newDept.nameEn}. Reason: ${transferReason || 'Department re-assignment.'}`,
            type: 'ASSIGNMENT',
          },
        });
      }
    } else if (unitId !== undefined && unitId !== existing.unitId) {
      updateData.unitId = unitId || null;
    }

    // 1. Assignment handling
    if (assignedToId !== undefined && assignedToId !== existing.assignedToId) {
      updateData.assignedToId = assignedToId || null;
      if (assignedToId) {
        const assignee = await prisma.user.findUnique({
          where: { id: assignedToId },
          include: { department: true },
        });

        if (assignee) {
          const roleLabel = assignee.role === 'DEPT_HEAD' ? 'Head of Department' : 'Department Officer';
          const deptName = assignee.department?.nameEn || existing.department.nameEn;
          
          newActions.push({
            actionType: 'ASSIGNMENT',
            description: `Assigned to ${assignee.name} (${roleLabel}, ${deptName}) for investigation and action.`,
            isPublic: true,
            actorId: currentUser?.id || null,
          });

          // If still SUBMITTED, advance to UNDER_INVESTIGATION
          if (!status && existing.status === Status.SUBMITTED) {
            statusChanged = true;
            updateData.status = Status.UNDER_INVESTIGATION;
            newActions.push({
              actionType: 'STATUS_CHANGE',
              description: `Status advanced to UNDER_INVESTIGATION upon assignment.`,
              isPublic: true,
              actorId: currentUser?.id || null,
            });
          }

          // Create notification for the assigned department user
          await prisma.notification.create({
            data: {
              userId: assignee.id,
              complaintId: existing.id,
              title: `Grievance Assigned: ${existing.trackingId}`,
              message: `You have been assigned grievance "${existing.subject}" for ${existing.department.nameEn}. Please investigate and update progress.`,
              type: 'ASSIGNMENT',
            },
          });

          // WhatsApp alert to patient regarding assignment
          if (!existing.isAnonymous && existing.patientPhone) {
            sendWhatsAppAlert({
              phone: existing.patientPhone,
              patientName: existing.patientName,
              trackingId: existing.trackingId,
              pin: existing.pin,
              status: updateData.status || existing.status,
              departmentName: existing.department.nameEn,
              unitName: existing.unit?.nameEn,
              actionSummary: `Assigned to ${assignee.name} (${deptName}) for prompt inquiry and resolution.`,
              type: 'STATUS_UPDATE',
            }).catch((err) => console.error('WhatsApp assignment alert error:', err));
          }
        }
      } else {
        newActions.push({
          actionType: 'ASSIGNMENT',
          description: `Complaint assignment cleared by administrator.`,
          isPublic: true,
          actorId: currentUser?.id || null,
        });
      }
    }

    // 2. Status change handling
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
        actorId: currentUser?.id || null,
      });
    }

    // 3. Priority change
    if (priority && priority !== existing.priority) {
      updateData.priority = priority as Priority;
    }

    // 4. Action Summary (public resolution report)
    if (actionSummary !== undefined) {
      updateData.actionSummary = actionSummary;
    }

    // 5. Note / Action narrative
    if (note) {
      newActions.push({
        actionType: isPublicNote ? 'PUBLIC_UPDATE' : 'INTERNAL_NOTE',
        description: note,
        isPublic: Boolean(isPublicNote),
        actorId: currentUser?.id || null,
      });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: existing.id },
      data: {
        ...updateData,
        actions: {
          create: newActions,
        },
      },
      include: {
        department: true,
        unit: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
        actions: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        feedback: true,
      },
    });

    // 6. Notify Central Admin when changes/updates are made by a department user
    const actorName = currentUser?.name || 'Department Staff';
    const isDeptUser = currentUser && (
      currentUser.role === 'DEPT_HEAD' || 
      currentUser.role === 'INVESTIGATOR' || 
      (currentUser.departmentId && currentUser.role !== 'SUPER_ADMIN')
    );

    if (isDeptUser && (statusChanged || note || actionSummary)) {
      await prisma.notification.create({
        data: {
          userId: null, // Broadcast to central admins
          complaintId: existing.id,
          title: `${actorName} (${existing.department.nameEn}) updated ${existing.trackingId}`,
          message: `Status: ${status || existing.status}. Action Note: ${note || actionSummary || 'Progress update recorded.'}`,
          type: 'DEPT_UPDATE',
        },
      });
    }

    // 7. Dispatch WhatsApp Status Update / Resolution Alert to Patient
    if (!existing.isAnonymous && existing.patientPhone && (statusChanged || actionSummary || (note && isPublicNote))) {
      const isResolved = (status || existing.status) === 'RESOLVED' || (status || existing.status) === 'ACTION_TAKEN';
      sendWhatsAppAlert({
        phone: existing.patientPhone,
        patientName: existing.patientName,
        trackingId: existing.trackingId,
        pin: existing.pin,
        status: status || existing.status,
        departmentName: existing.department.nameEn,
        unitName: existing.unit?.nameEn,
        actionSummary: actionSummary || note || existing.actionSummary,
        type: isResolved ? 'RESOLVED' : 'STATUS_UPDATE',
      }).catch((err) => console.error('WhatsApp dispatch error:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Complaint updated, notifications generated & alerts dispatched successfully',
      complaint: updatedComplaint,
    });
  } catch (error: any) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update complaint' },
      { status: 500 }
    );
  }
}
