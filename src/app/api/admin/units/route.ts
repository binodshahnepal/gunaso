import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { departmentId, nameEn, nameNp, code } = await req.json();

    if (!departmentId || !nameEn || !code) {
      return NextResponse.json(
        { success: false, message: 'Department ID, Unit name (English), and unique Unit Code are required' },
        { status: 400 }
      );
    }

    const uppercaseCode = code.trim().toUpperCase();

    const existing = await prisma.unit.findUnique({
      where: { code: uppercaseCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Unit with code '${uppercaseCode}' already exists` },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.create({
      data: {
        departmentId,
        nameEn: nameEn.trim(),
        nameNp: nameNp ? nameNp.trim() : nameEn.trim(),
        code: uppercaseCode,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Unit created successfully',
      unit,
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create unit' },
      { status: 500 }
    );
  }
}
