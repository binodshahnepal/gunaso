import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('patient_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated as patient' },
        { status: 401 }
      );
    }

    const patient = JSON.parse(token);

    const whereConditions: any[] = [];
    if (patient.id) whereConditions.push({ patientId: patient.id });
    if (patient.phone) whereConditions.push({ patientPhone: patient.phone });
    if (patient.email) whereConditions.push({ patientEmail: patient.email });

    const complaints = await prisma.complaint.findMany({
      where: {
        OR: whereConditions,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        unit: true,
        actions: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        feedback: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: complaints.length,
      patient,
      complaints,
    });
  } catch (error) {
    console.error('Error fetching patient complaints:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}
