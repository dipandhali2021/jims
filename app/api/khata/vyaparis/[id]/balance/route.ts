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
    }    // Get user role from metadata
    const userRole = auth().sessionClaims?.metadata?.role as string || 'user';
    const isAdmin = userRole === 'admin';    // Calculate balance from approved transactions
    // Positive transactions represent money we owe to vyapari
    // Negative transactions represent money vyapari owes us
    const transactionsSum = await prisma.vyapariTransaction.aggregate({
      where: {
        vyapariId: id,
        isApproved: true // Only include approved transactions
      },
      _sum: {
        amount: true
      }
    });
    
    // Get all approved payments with all fields
    const payments = await prisma.vyapariPayment.findMany({
      where: {
        vyapariId: id,
        isApproved: true // Only include approved payments
      }
    });

    const transactionTotal = transactionsSum._sum.amount || 0;
    
    // Calculate payment totals based on direction
    let paidToVyapariTotal = 0;
    let paidByVyapariTotal = 0;
    
    for (const payment of payments) {
      // Use type assertion since TypeScript doesn't have paymentDirection in its type definition
      const direction = (payment as any).paymentDirection;
      if (direction === 'to_vyapari') {
        paidToVyapariTotal += payment.amount;
      } else if (direction === 'from_vyapari') {
        paidByVyapariTotal += payment.amount;
      }
    }    // Final balance: positive means we owe them, negative means they owe us
    // Transactions affect the balance (positive amounts are what we owe)
    // Payments to vyapari reduce what we owe
    // Payments from vyapari reduce what they owe us
    const balance = transactionTotal - paidToVyapariTotal - paidByVyapariTotal;

    return NextResponse.json({ balance });
  } catch (error) {
    console.error(`Error calculating vyapari balance ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to calculate trader balance' },
      { status: 500 }
    );
  }
}
