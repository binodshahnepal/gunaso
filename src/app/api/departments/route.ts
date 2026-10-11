import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { nameEn: 'asc' },
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameNp: true,
        slaHours: true,
        units: {
          orderBy: { nameEn: 'asc' },
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameNp: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
