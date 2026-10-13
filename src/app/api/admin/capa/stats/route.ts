import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RootCauseCategory, CapaStatus } from '@prisma/client';

export async function GET() {
  try {
    const totalCapa = await prisma.capaRecord.count();

    const [draftCount, pendingCount, approvedCount, closedCount] = await Promise.all([
      prisma.capaRecord.count({ where: { status: CapaStatus.DRAFT } }),
      prisma.capaRecord.count({ where: { status: CapaStatus.PENDING_QA_REVIEW } }),
      prisma.capaRecord.count({ where: { status: CapaStatus.APPROVED_BY_QA } }),
      prisma.capaRecord.count({ where: { status: CapaStatus.CLOSED } }),
    ]);

    // Group by Root Cause Category
    const categoryCounts: Record<string, number> = {};
    for (const cat of Object.values(RootCauseCategory)) {
      categoryCounts[cat] = await prisma.capaRecord.count({
        where: { rootCauseCategory: cat as RootCauseCategory },
      });
    }

    const categoryBreakdown = Object.entries(categoryCounts).map(([cat, count]) => ({
      category: cat,
      label: cat.replace(/_/g, ' '),
      count,
      percentage: totalCapa > 0 ? Math.round((count / totalCapa) * 100) : 0,
    }));

    // Fetch recent 10 CAPA cases for quality audit log
    const recentCapas = await prisma.capaRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        complaint: {
          select: {
            id: true,
            trackingId: true,
            subject: true,
            status: true,
            priority: true,
            department: {
              select: {
                nameEn: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalCapa,
        draft: draftCount,
        pendingQaReview: pendingCount,
        approvedByQa: approvedCount,
        closed: closedCount,
        categoryBreakdown,
        recentCapas,
      },
    });
  } catch (error: any) {
    console.error('Error fetching CAPA stats:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch CAPA statistics' },
      { status: 500 }
    );
  }
}
