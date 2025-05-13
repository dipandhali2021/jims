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

    // Check if vyapari exists and user has permission to view it
    const vyapari = await prisma.vyapari.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { isApproved: true }
        ]
      }
    });

    if (!vyapari) {
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
      );
    }

    // Calculate balance from transactions
    // Positive transactions represent money we owe to vyapari
    // Negative transactions represent money vyapari owes us
    const transactionsSum = await prisma.vyapariTransaction.aggregate({
      where: {
        vyapariId: id
      },
      _sum: {
        amount: true
      }
    });

    // Get sum of all payments
    const paymentsSum = await prisma.vyapariPayment.aggregate({
      where: {
        vyapariId: id
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
    console.error(`Error calculating vyapari balance ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to calculate trader balance' },
      { status: 500 }
    );
  }
}
