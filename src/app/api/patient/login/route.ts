import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Mobile Number/Email and Password are required' },
        { status: 400 }
      );
    }

    const cleanInput = identifier.trim();

    // Match against phone or email
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { phone: cleanInput },
          { email: cleanInput.toLowerCase() },
        ],
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'No patient account found with this Mobile Number/Email' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, patient.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
      },
    });

    response.cookies.set('patient_token', JSON.stringify({
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
    }), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Error logging in patient:', error);
    return NextResponse.json(
      { success: false, message: 'Server error logging in' },
      { status: 500 }
    );
  }
}
