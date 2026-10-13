import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';
import { sendWhatsAppAlert } from '@/lib/whatsapp';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const tokenStr = cookieStore.get('gunaso_token')?.value;
    let currentUser: { id: string; name: string; role: string } | null = null;
    if (tokenStr) {
      try {
        currentUser = JSON.parse(tokenStr);
      } catch (e) {}
    }

    const now = new Date();

    // Fetch all unresolved active complaints that are not already escalated or closed
    const activeComplaints = await prisma.complaint.findMany({
      where: {
        status: {
          in: [Status.SUBMITTED, Status.UNDER_INVESTIGATION, Status.ACTION_TAKEN],
        },
      },
      include: {
        department: true,
        unit: true,
        assignedTo: true,
      },
    });

    const escalatedCases: any[] = [];

    for (const comp of activeComplaints) {
      const slaHours = comp.department.slaHours || 48;
      const createdAtTime = new Date(comp.createdAt).getTime();
      const deadlineTime = createdAtTime + slaHours * 60 * 60 * 1000;

      if (now.getTime() > deadlineTime) {
        const overdueHours = Math.max(1, Math.round((now.getTime() - deadlineTime) / (1000 * 60 * 60)));

        // 1. Advance status to ESCALATED
        const updated = await prisma.complaint.update({
          where: { id: comp.id },
          data: { status: Status.ESCALATED },
        });

        // 2. Create Audit Action Log
        await prisma.complaintAction.create({
          data: {
            complaintId: comp.id,
            actionType: 'STATUS_CHANGE',
            description: `⚠️ AUTOMATED SLA BREACH ESCALATION: Complaint exceeded designated ${slaHours}h SLA resolution threshold by ${overdueHours}h without resolution. Case escalated directly to Grievance Redressal Committee and Medical Director for emergency review.`,
            isPublic: true,
            actorId: currentUser?.id || null,
          },
        });

        // 3. Create High-Priority Notification for Central Admins
        await prisma.notification.create({
          data: {
            userId: null, // Broadcast to central admins
            complaintId: comp.id,
            title: `⚠️ CRITICAL: SLA Breach Escalation for ${comp.trackingId}`,
            message: `${comp.department.nameEn} case is ${overdueHours}h overdue. Priority escalated to ESCALATED.`,
            type: 'ESCALATION',
          },
        });

        // 4. Also notify assigned officer if one exists
        if (comp.assignedToId) {
          await prisma.notification.create({
            data: {
              userId: comp.assignedToId,
              complaintId: comp.id,
              title: `⚠️ URGENT: Assigned case ${comp.trackingId} has been ESCALATED`,
              message: `Your assigned grievance in ${comp.department.nameEn} exceeded the ${slaHours}h SLA threshold and has been escalated to hospital management.`,
              type: 'ESCALATION',
            },
          });
        }

        // 5. Send WhatsApp / SMS Notification to Patient
        if (!comp.isAnonymous && comp.patientPhone) {
          sendWhatsAppAlert({
            phone: comp.patientPhone,
            patientName: comp.patientName,
            trackingId: comp.trackingId,
            pin: comp.pin,
            status: 'ESCALATED',
            departmentName: comp.department.nameEn,
            unitName: comp.unit?.nameEn,
            actionSummary: `Your grievance has exceeded our standard departmental resolution timeframe and has been automatically escalated to the Medical Director & Senior Grievance Committee for expedited investigation.`,
            type: 'STATUS_UPDATE',
          }).catch((err) => console.error('WhatsApp escalation alert error:', err));
        }

        escalatedCases.push({
          id: comp.id,
          trackingId: comp.trackingId,
          department: comp.department.nameEn,
          slaHours,
          overdueHours,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        escalatedCases.length > 0
          ? `SLA scan complete. ${escalatedCases.length} overdue grievance(s) automatically escalated to Hospital Executive.`
          : 'SLA scan complete. No overdue unescalated grievances detected.',
      scannedCount: activeComplaints.length,
      escalatedCount: escalatedCases.length,
      escalatedCases,
    });
  } catch (error: any) {
    console.error('Error running SLA escalation scan:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to run SLA escalation check' },
      { status: 500 }
    );
  }
}
