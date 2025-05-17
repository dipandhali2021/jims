import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string; // Transaction ID
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
      return NextResponse.json({ error: 'Only admins can approve/reject transactions' }, { status: 403 });
    }

    // Find the transaction
    const transaction = await prisma.vyapariTransaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.isApproved) {
      return NextResponse.json({ error: 'Transaction is already approved' }, { status: 400 });
    }

    if (approve) {
      // Approve the transaction
      await prisma.vyapariTransaction.update({
        where: { id },
        data: {
          isApproved: true,
          approvedById: userId,
        }
      });

      return NextResponse.json({ message: 'Transaction approved successfully' });
    } else {
      // Reject by deleting the transaction
      await prisma.vyapariTransaction.delete({
        where: { id }
      });

      return NextResponse.json({ message: 'Transaction rejected successfully' });
    }
  } catch (error) {
    console.error(`Error handling transaction approval ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to process transaction approval' },
      { status: 500 }
    );
  }
}
