import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string; // Payment ID
  };
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();
    const { id } = params;
    const data = await req.json();
    const { approve } = data; // boolean - true for approve, false for reject

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can approve/reject payments' }, { status: 403 });
    }

    // Find the payment
    const payment = await prisma.vyapariPayment.findUnique({
      where: { id }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.isApproved) {
      return NextResponse.json({ error: 'Payment is already approved' }, { status: 400 });
    }

    if (approve) {
      // Approve the payment
      await prisma.vyapariPayment.update({
        where: { id },
        data: {
          isApproved: true,
          approvedById: userId,
        }
      });

      return NextResponse.json({ message: 'Payment approved successfully' });
    } else {
      // Reject by deleting the payment
      await prisma.vyapariPayment.delete({
        where: { id }
      });

      return NextResponse.json({ message: 'Payment rejected successfully' });
    }
  } catch (error) {
    console.error(`Error handling payment approval ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to process payment approval' },
      { status: 500 }
    );
  }
}
