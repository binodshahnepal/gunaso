import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Priority, Category } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'ALL';

    const where: any = {};
    const now = new Date();

    if (timeframe === '7D') {
      const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: past7d };
    } else if (timeframe === '30D') {
      const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: past30d };
    }

    // Counts by status
    const [
      total,
      submitted,
      underInvestigation,
      actionTaken,
      resolved,
      rejected,
      escalated,
    ] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.count({ where: { ...where, status: Status.SUBMITTED } }),
      prisma.complaint.count({ where: { ...where, status: Status.UNDER_INVESTIGATION } }),
      prisma.complaint.count({ where: { ...where, status: Status.ACTION_TAKEN } }),
      prisma.complaint.count({ where: { ...where, status: Status.RESOLVED } }),
      prisma.complaint.count({ where: { ...where, status: Status.REJECTED } }),
      prisma.complaint.count({ where: { ...where, status: Status.ESCALATED } }),
    ]);

    // Priority breakdown
    const priorityCounts = await prisma.complaint.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    });

    const priorityBreakdown = {
      CRITICAL: priorityCounts.find((p) => p.priority === Priority.CRITICAL)?._count.priority || 0,
      HIGH: priorityCounts.find((p) => p.priority === Priority.HIGH)?._count.priority || 0,
      MEDIUM: priorityCounts.find((p) => p.priority === Priority.MEDIUM)?._count.priority || 0,
      LOW: priorityCounts.find((p) => p.priority === Priority.LOW)?._count.priority || 0,
    };

    // Category breakdown
    const categoriesRaw = await prisma.complaint.groupBy({
      by: ['category'],
      where,
      _count: { category: true },
    });

    const categoryBreakdown = categoriesRaw.map((c) => ({
      category: c.category,
      count: c._count.category,
      percentage: total > 0 ? Math.round((c._count.category / total) * 100) : 0,
    }));

    // Fetch all complaints in timeframe with department to compute SLA metrics & department breakdown
    const allComplaints = await prisma.complaint.findMany({
      where,
      select: {
        id: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            nameEn: true,
            code: true,
            slaHours: true,
          },
        },
      },
    });

    const nowTime = now.getTime();
    let overdueCount = 0;
    let resolvedWithinSla = 0;
    let resolvedTotal = 0;
    let totalTurnaroundHours = 0;

    // Per department analytics accumulator
    const deptStatsMap = new Map<
      string,
      {
        id: string;
        nameEn: string;
        code: string;
        slaHours: number;
        total: number;
        resolved: number;
        active: number;
        overdue: number;
      }
    >();

    for (const c of allComplaints) {
      const deptId = c.departmentId;
      const slaHours = c.department.slaHours || 48;
      const createdTime = new Date(c.createdAt).getTime();
      const deadlineTime = createdTime + slaHours * 3600 * 1000;
      const isResolved = c.status === Status.RESOLVED || c.status === Status.REJECTED;

      if (!deptStatsMap.has(deptId)) {
        deptStatsMap.set(deptId, {
          id: deptId,
          nameEn: c.department.nameEn,
          code: c.department.code,
          slaHours,
          total: 0,
          resolved: 0,
          active: 0,
          overdue: 0,
        });
      }

      const dStat = deptStatsMap.get(deptId)!;
      dStat.total++;

      if (isResolved) {
        dStat.resolved++;
        resolvedTotal++;

        if (c.resolvedAt) {
          const resolvedTime = new Date(c.resolvedAt).getTime();
          const turnaround = (resolvedTime - createdTime) / 3600000;
          totalTurnaroundHours += Math.max(0, turnaround);
          if (resolvedTime <= deadlineTime) {
            resolvedWithinSla++;
          }
        } else {
          resolvedWithinSla++;
        }
      } else {
        dStat.active++;
        if (nowTime > deadlineTime) {
          overdueCount++;
          dStat.overdue++;
        }
      }
    }

    const slaComplianceRate =
      resolvedTotal > 0 ? Math.round((resolvedWithinSla / resolvedTotal) * 100) : 100;

    const avgTurnaroundHours =
      resolvedTotal > 0 ? (totalTurnaroundHours / resolvedTotal).toFixed(1) : '0';

    const departmentAnalytics = Array.from(deptStatsMap.values()).map((d) => ({
      ...d,
      resolutionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
    }));

    // CSAT Feedback Analytics
    const [feedbackAgg, starCounts, recentFeedback] = await Promise.all([
      prisma.feedback.aggregate({
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.feedback.groupBy({
        by: ['rating'],
        _count: { rating: true },
      }),
      prisma.feedback.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          complaint: {
            select: {
              trackingId: true,
              subject: true,
              department: { select: { nameEn: true } },
            },
          },
        },
      }),
    ]);

    const starDistribution = {
      5: starCounts.find((s) => s.rating === 5)?._count.rating || 0,
      4: starCounts.find((s) => s.rating === 4)?._count.rating || 0,
      3: starCounts.find((s) => s.rating === 3)?._count.rating || 0,
      2: starCounts.find((s) => s.rating === 2)?._count.rating || 0,
      1: starCounts.find((s) => s.rating === 1)?._count.rating || 0,
    };

    return NextResponse.json({
      success: true,
      timeframe,
      stats: {
        total,
        submitted,
        underInvestigation,
        actionTaken,
        resolved,
        rejected,
        escalated,
        overdueCount,
        slaComplianceRate,
        avgTurnaroundHours,
        priorityBreakdown,
        categoryBreakdown,
        departmentAnalytics,
        avgRating: feedbackAgg._avg.rating ? feedbackAgg._avg.rating.toFixed(1) : '5.0',
        feedbackCount: feedbackAgg._count.rating,
        starDistribution,
        recentFeedback,
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
