import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const total = await prisma.complaint.count();
    const submitted = await prisma.complaint.count({ where: { status: 'SUBMITTED' } });
    const underInvestigation = await prisma.complaint.count({ where: { status: 'UNDER_INVESTIGATION' } });
    const actionTaken = await prisma.complaint.count({ where: { status: 'ACTION_TAKEN' } });
    const resolved = await prisma.complaint.count({ where: { status: 'RESOLVED' } });
    const rejected = await prisma.complaint.count({ where: { status: 'REJECTED' } });
    const escalated = await prisma.complaint.count({ where: { status: 'ESCALATED' } });

    // Category breakdown
    const categoriesRaw = await prisma.complaint.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    const categoryBreakdown = categoriesRaw.map((c) => ({
      category: c.category,
      count: c._count.category,
    }));

    // Department breakdown
    const departmentsRaw = await prisma.complaint.groupBy({
      by: ['departmentId'],
      _count: { departmentId: true },
    });

    const depts = await prisma.department.findMany();
    const deptMap = new Map(depts.map((d) => [d.id, d.nameEn]));

    const departmentBreakdown = departmentsRaw.map((d) => ({
      departmentName: deptMap.get(d.departmentId) || 'Unknown',
      count: d._count.departmentId,
    }));

    // CSAT Feedback Average
    const feedbackAgg = await prisma.feedback.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total,
        submitted,
        underInvestigation,
        actionTaken,
        resolved,
        rejected,
        escalated,
        categoryBreakdown,
        departmentBreakdown,
        avgRating: feedbackAgg._avg.rating ? feedbackAgg._avg.rating.toFixed(1) : '5.0',
        feedbackCount: feedbackAgg._count.rating,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
