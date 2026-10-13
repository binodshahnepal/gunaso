import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Category, Priority } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const assignedToId = searchParams.get('assignedToId');
    const search = searchParams.get('search');
    const slaStatus = searchParams.get('slaStatus');

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as Status;
    }

    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }

    if (assignedToId && assignedToId !== 'ALL') {
      if (assignedToId === 'UNASSIGNED') {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedToId;
      }
    }

    if (category && category !== 'ALL') {
      where.category = category as Category;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority as Priority;
    }

    if (search) {
      where.OR = [
        { trackingId: { contains: search } },
        { subject: { contains: search } },
        { patientName: { contains: search } },
        { targetPersonName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
          take: 10,
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

    const nowTime = Date.now();
    let totalOverdueCount = 0;

    const enrichedComplaints = complaints.map((c) => {
      const slaHours = c.department.slaHours || 48;
      const createdAtTime = new Date(c.createdAt).getTime();
      const deadlineTime = createdAtTime + slaHours * 3600 * 1000;
      const isResolved = c.status === Status.RESOLVED || c.status === Status.REJECTED;
      const isOverdue = !isResolved && nowTime > deadlineTime;
      const hoursOverdue = isOverdue ? Math.max(1, Math.round((nowTime - deadlineTime) / 3600000)) : 0;
      const hoursRemaining = !isResolved && !isOverdue ? Math.max(0, Math.round((deadlineTime - nowTime) / 3600000)) : 0;

      if (isOverdue) totalOverdueCount++;

      return {
        ...c,
        slaDeadline: new Date(deadlineTime).toISOString(),
        isOverdue,
        hoursOverdue,
        hoursRemaining,
      };
    });

    const filteredComplaints =
      slaStatus === 'OVERDUE'
        ? enrichedComplaints.filter((c) => c.isOverdue)
        : enrichedComplaints;

    return NextResponse.json({
      success: true,
      count: filteredComplaints.length,
      overdueCount: totalOverdueCount,
      complaints: filteredComplaints,
    });
  } catch (error) {
    console.error('Error fetching admin complaints:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}
