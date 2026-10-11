import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, password, role, departmentId } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found.' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name?.trim()) {
      updateData.name = name.trim();
    }

    if (email?.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (emailTaken) {
          return NextResponse.json(
            { success: false, message: 'This email is already in use by another admin.' },
            { status: 409 }
          );
        }
        updateData.email = normalizedEmail;
      }
    }

    if (role) {
      updateData.role = role as Role;
    }

    if (departmentId !== undefined) {
      updateData.departmentId = departmentId || null;
    }

    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { success: false, message: 'New password must be at least 6 characters.' },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            nameEn: true,
            nameNp: true,
            code: true,
          },
        },
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin user "${updatedUser.name}" updated successfully.`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating admin user:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update admin user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check logged-in admin from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('gunaso_token')?.value;
    let currentAdminId: string | null = null;
    if (token) {
      try {
        const parsed = JSON.parse(token);
        currentAdminId = parsed.id;
      } catch (e) {
        // ignore
      }
    }

    if (currentAdminId && currentAdminId === id) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own currently logged-in admin account.' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found.' },
        { status: 404 }
      );
    }

    // Ensure at least one SUPER_ADMIN remains
    if (targetUser.role === Role.SUPER_ADMIN) {
      const superAdminCount = await prisma.user.count({
        where: { role: Role.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { success: false, message: 'Cannot delete the only remaining Super Admin account.' },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Admin user "${targetUser.name}" has been deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete admin user' },
      { status: 500 }
    );
  }
}
