import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { Status } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const searchPhone = searchParams.get('phone')?.trim();
    const searchQuery = searchParams.get('query')?.trim() || searchParams.get('search')?.trim();
    const filterStatus = searchParams.get('status')?.trim();

    const cookieStore = await cookies();
    const token = cookieStore.get('patient_token')?.value;

    let patient: any = null;
    if (token) {
      try {
        patient = JSON.parse(token);
      } catch (e) {
        // invalid token cookie
      }
    }

    // Build query conditions
    const whereAnd: any[] = [];

    if (searchPhone) {
      // Direct search by mobile number
      whereAnd.push({
        OR: [
          { patientPhone: searchPhone },
          { patientPhone: { contains: searchPhone } },
        ],
      });
    } else if (patient) {
      // Default: Patient's own complaints
      const patientOr: any[] = [];
      if (patient.id) patientOr.push({ patientId: patient.id });
      if (patient.phone) patientOr.push({ patientPhone: patient.phone });
      if (patient.email) patientOr.push({ patientEmail: patient.email });

      if (patientOr.length > 0) {
        whereAnd.push({ OR: patientOr });
      }
    } else {
      // If neither authenticated nor searching by phone, require auth
      return NextResponse.json(
        { success: false, message: 'Please sign in or provide a phone number to search.' },
        { status: 401 }
      );
    }

    // Keyword filter (Tracking ID, Subject, Description, or Mobile)
    if (searchQuery) {
      whereAnd.push({
        OR: [
          { trackingId: { contains: searchQuery } },
          { subject: { contains: searchQuery } },
          { description: { contains: searchQuery } },
          { patientPhone: { contains: searchQuery } },
          { location: { contains: searchQuery } },
        ],
      });
    }

    // Status filter
    if (filterStatus && filterStatus !== 'ALL') {
      whereAnd.push({ status: filterStatus as Status });
    }

    const complaints = await prisma.complaint.findMany({
      where: whereAnd.length > 0 ? { AND: whereAnd } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        unit: true,
        actions: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        feedback: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: complaints.length,
      patient: patient || { phone: searchPhone },
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
