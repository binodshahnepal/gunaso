import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, phone, email, password } = await req.json();

    if (!name || (!phone && !email) || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, Mobile Number (or Email), and Password are required' },
        { status: 400 }
      );
    }

    const cleanPhone = phone ? phone.trim() : null;
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    // Check existing phone
    if (cleanPhone) {
      const existingPhone = await prisma.patient.findUnique({
        where: { phone: cleanPhone },
      });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, message: 'A patient account with this mobile number already exists. Please login instead.' },
          { status: 400 }
        );
      }
    }

    // Check existing email
    if (cleanEmail) {
      const existingEmail = await prisma.patient.findUnique({
        where: { email: cleanEmail },
      });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: 'A patient account with this email address already exists. Please login instead.' },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const patient = await prisma.patient.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        passwordHash,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
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
    console.error('Error registering patient:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create account' },
      { status: 500 }
    );
  }
}
