import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenStr = cookieStore.get('gunaso_token')?.value;

    let currentUser: { id: string; role: string; departmentId?: string } | null = null;
    if (tokenStr) {
      try {
        currentUser = JSON.parse(tokenStr);
      } catch (e) {}
    }

    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const isCentralAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'GRIEVANCE_ADMIN';

    const where: any = isCentralAdmin
      ? {
          OR: [
            { userId: null },
            { userId: currentUser.id },
          ],
        }
      : {
          userId: currentUser.id,
        };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          complaint: {
            select: {
              id: true,
              trackingId: true,
              subject: true,
              status: true,
              department: { select: { nameEn: true, code: true } },
            },
          },
        },
      }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { notificationId, markAllRead } = body;

    const cookieStore = await cookies();
    const tokenStr = cookieStore.get('gunaso_token')?.value;
    let currentUser: { id: string; role: string } | null = null;
    if (tokenStr) {
      try {
        currentUser = JSON.parse(tokenStr);
      } catch (e) {}
    }

    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (markAllRead) {
      const isCentralAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'GRIEVANCE_ADMIN';
      const where: any = isCentralAdmin
        ? {
            OR: [
              { userId: null },
              { userId: currentUser.id },
            ],
          }
        : {
            userId: currentUser.id,
          };

      await prisma.notification.updateMany({
        where,
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
