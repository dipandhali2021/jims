import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recentTransactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        user: true
      }
    });

    const formattedTransactions = recentTransactions.map(transaction => ({
      id: transaction.orderId,
      customer: transaction.customer,
      products: (transaction.items as any[]).map(item => item.productName),
      date: transaction.createdAt.toLocaleString(),
      amount: transaction.totalAmount,
      status: transaction.status,
      seller: `${transaction.user.firstName} ${transaction.user.lastName}`
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}