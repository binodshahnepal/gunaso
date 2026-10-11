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
    const search = searchParams.get('search')?.trim();

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as Status;
    }

    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
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
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        feedback: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Error fetching admin complaints:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}
