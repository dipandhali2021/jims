import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if karigar exists and user has permission to view it
    const karigar = await prisma.karigar.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { isApproved: true }
        ]
      }
    });

    if (!karigar) {
      return NextResponse.json(
        { error: 'Artisan not found' },
        { status: 404 }
      );
    }

    // Calculate balance from transactions
    // Positive transactions represent money we owe to karigar
    // Negative transactions represent money karigar owes us
    const transactionsSum = await prisma.karigarTransaction.aggregate({
      where: {
        karigarId: id
      },
      _sum: {
        amount: true
      }
    });

    // Get sum of all payments
    const paymentsSum = await prisma.karigarPayment.aggregate({
      where: {
        karigarId: id
      },
      _sum: {
        amount: true
      }
    });

    const transactionTotal = transactionsSum._sum.amount || 0;
    const paymentTotal = paymentsSum._sum.amount || 0;

    // Final balance: positive means we owe them, negative means they owe us
    const balance = transactionTotal - paymentTotal;

    return NextResponse.json({ balance });
  } catch (error) {
    console.error(`Error calculating karigar balance ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to calculate artisan balance' },
      { status: 500 }
    );
  }
}
