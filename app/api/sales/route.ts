import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { formatInTimeZone } from 'date-fns-tz';

// IST timezone constant
const IST_TIMEZONE = 'Asia/Kolkata';

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
      // Format the date directly in IST
      date: formatInTimeZone(transaction.createdAt, IST_TIMEZONE, 'MMM dd, yyyy HH:mm'),
      // Also provide requestDate field which is simply an alias for createdAt to match expected API structure
      requestDate: formatInTimeZone(transaction.createdAt, IST_TIMEZONE, 'MMM dd, yyyy HH:mm'),
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