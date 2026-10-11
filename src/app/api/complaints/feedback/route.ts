import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { complaintId, rating, comments } = await req.json();

    if (!complaintId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Valid complaint ID and rating (1-5) are required' },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return NextResponse.json(
        { success: false, message: 'Complaint not found' },
        { status: 404 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        complaintId,
        rating: Number(rating),
        comments: comments || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      feedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
