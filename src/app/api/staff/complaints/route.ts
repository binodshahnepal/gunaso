import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { Status, Category, Priority } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    let tokenStr = cookieStore.get('gunaso_token')?.value;

    if (!tokenStr) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      tokenStr = decodeURIComponent(tokenStr);
    } catch {
      // ignore
    }

    let sessionUser: any;
    try {
      sessionUser = JSON.parse(tokenStr);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid session token' },
        { status: 401 }
      );
    }

    // Load full user record from database
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        department: {
          include: {
            units: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Staff user profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const assignedParam = searchParams.get('assigned'); // "ALL" | "ME" | "UNASSIGNED"
    const slaParam = searchParams.get('sla'); // "ALL" | "OVERDUE"
    const categoryParam = searchParams.get('category');
    const priorityParam = searchParams.get('priority');
    const searchParam = searchParams.get('search');
    const requestedDeptId = searchParams.get('departmentId');

    // Department Scoping Logic:
    // If DEPT_HEAD or INVESTIGATOR: strictly restrict to user's assigned department
    // If SUPER_ADMIN or GRIEVANCE_ADMIN: allow departmentId parameter or default to user's dept (or first dept)
    let effectiveDepartmentId = user.departmentId;

    if (user.role === 'SUPER_ADMIN' || user.role === 'GRIEVANCE_ADMIN') {
      if (requestedDeptId && requestedDeptId !== 'ALL') {
        effectiveDepartmentId = requestedDeptId;
      }
    }

    const where: any = {};

    if (effectiveDepartmentId) {
      where.departmentId = effectiveDepartmentId;
    }

    // Role-based safeguard: If user is an investigator with no dept, show assigned cases
    if (!effectiveDepartmentId && (user.role === 'INVESTIGATOR' || user.role === 'DEPT_HEAD')) {
      where.assignedToId = user.id;
    }

    // Filter by Assignment
    if (assignedParam === 'ME') {
      where.assignedToId = user.id;
    } else if (assignedParam === 'UNASSIGNED') {
      where.assignedToId = null;
    }

    // Filter by Status
    if (statusParam && statusParam !== 'ALL') {
      if (statusParam === 'PENDING_INQUIRY') {
        where.status = { in: [Status.SUBMITTED, Status.UNDER_INVESTIGATION] };
      } else {
        where.status = statusParam as Status;
      }
    }

    if (categoryParam && categoryParam !== 'ALL') {
      where.category = categoryParam as Category;
    }

    if (priorityParam && priorityParam !== 'ALL') {
      where.priority = priorityParam as Priority;
    }

    if (searchParam?.trim()) {
      const q = searchParam.trim();
      where.OR = [
        { trackingId: { contains: q } },
        { subject: { contains: q } },
        { patientName: { contains: q } },
        { targetPersonName: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
      ];
    }

    // Fetch complaints
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            messages: true,
            actions: true,
          },
        },
      },
    });

    const nowTime = Date.now();
    let deptOverdueCount = 0;

    const enrichedComplaints = complaints.map((c) => {
      const slaHours = c.department.slaHours || 48;
      const createdAtTime = new Date(c.createdAt).getTime();
      const deadlineTime = createdAtTime + slaHours * 3600 * 1000;
      const isResolved = c.status === Status.RESOLVED || c.status === Status.REJECTED;
      const isOverdue = !isResolved && nowTime > deadlineTime;
      const hoursOverdue = isOverdue ? Math.max(1, Math.round((nowTime - deadlineTime) / 3600000)) : 0;
      const hoursRemaining = !isResolved && !isOverdue ? Math.max(0, Math.round((deadlineTime - nowTime) / 3600000)) : 0;

      if (isOverdue) deptOverdueCount++;

      return {
        ...c,
        slaDeadline: new Date(deadlineTime).toISOString(),
        isOverdue,
        hoursOverdue,
        hoursRemaining,
      };
    });

    const finalComplaints =
      slaParam === 'OVERDUE'
        ? enrichedComplaints.filter((c) => c.isOverdue)
        : enrichedComplaints;

    // Fetch Department Aggregate Stats
    const statsWhere: any = {};
    if (effectiveDepartmentId) {
      statsWhere.departmentId = effectiveDepartmentId;
    }

    const [totalDept, submittedCount, underInquiryCount, actionTakenCount, resolvedCount, myAssignedCount] = await Promise.all([
      prisma.complaint.count({ where: statsWhere }),
      prisma.complaint.count({ where: { ...statsWhere, status: Status.SUBMITTED } }),
      prisma.complaint.count({ where: { ...statsWhere, status: Status.UNDER_INVESTIGATION } }),
      prisma.complaint.count({ where: { ...statsWhere, status: Status.ACTION_TAKEN } }),
      prisma.complaint.count({ where: { ...statsWhere, status: Status.RESOLVED } }),
      prisma.complaint.count({ where: { ...statsWhere, assignedToId: user.id } }),
    ]);

    // Fetch department list for re-assignment / transfer dropdown
    const allDepartments = await prisma.department.findMany({
      orderBy: { nameEn: 'asc' },
      select: {
        id: true,
        nameEn: true,
        nameNp: true,
        code: true,
        units: {
          select: {
            id: true,
            nameEn: true,
            nameNp: true,
            code: true,
          },
        },
      },
    });

    // Effective department metadata
    const activeDepartment = allDepartments.find((d) => d.id === effectiveDepartmentId) || user.department;

    return NextResponse.json({
      success: true,
      currentUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        departmentName: user.department?.nameEn || null,
        departmentCode: user.department?.code || null,
      },
      department: activeDepartment,
      allDepartments,
      stats: {
        total: totalDept,
        pendingInquiry: submittedCount + underInquiryCount,
        submitted: submittedCount,
        underInvestigation: underInquiryCount,
        actionTaken: actionTakenCount,
        resolved: resolvedCount,
        assignedToMe: myAssignedCount,
        overdueCount: deptOverdueCount,
      },
      complaints: finalComplaints,
    });
  } catch (error: any) {
    console.error('Error fetching staff complaints workspace:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch staff workspace data' },
      { status: 500 }
    );
  }
}
