import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { nameEn, nameNp, code, slaHours } = await req.json();

    if (!nameEn || !code) {
      return NextResponse.json(
        { success: false, message: 'Department name (English) and unique Code are required' },
        { status: 400 }
      );
    }

    const uppercaseCode = code.trim().toUpperCase();

    const existing = await prisma.department.findUnique({
      where: { code: uppercaseCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Department with code '${uppercaseCode}' already exists` },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        nameEn: nameEn.trim(),
        nameNp: nameNp ? nameNp.trim() : nameEn.trim(),
        code: uppercaseCode,
        slaHours: slaHours ? Number(slaHours) : 48,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Department created successfully',
      department,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create department' },
      { status: 500 }
    );
  }
}
