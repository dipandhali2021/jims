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

    // Get billType filter from query params
    const { searchParams } = new URL(req.url);
    const billType = searchParams.get('billType');    // Set up query with proper typing
    const queryOptions = {
      orderBy: {
        createdAt: 'desc' as const,
      },
      take: 20, // Increase to show more transactions
      include: {
        user: true
      },
      where: {} as any
    };
    
    // Add billType filter if provided
    if (billType && ['GST', 'Non-GST'].includes(billType)) {
      queryOptions.where = {
        billType
      };
    }
    
    // Execute the properly structured query
    const recentTransactions = await prisma.transaction.findMany(queryOptions);
    
    const formattedTransactions = recentTransactions.map(transaction => {
      // Parse the JSON items field
      let items = [];
      try {
        if (typeof transaction.items === 'string') {
          items = JSON.parse(transaction.items);
        } else {
          items = transaction.items as any[];
        }
      } catch (e) {
        console.error('Error parsing transaction items', e);
        items = [];
      }
      
      return {
        id: transaction.orderId,
        customer: transaction.customer,
        products: Array.isArray(items) 
          ? items.map(item => item.productName || 'Unknown Product')
          : ['Unknown Product'],
        // Format the date directly in IST
        date: formatInTimeZone(transaction.createdAt, IST_TIMEZONE, 'MMM dd, yyyy HH:mm'),
        // Also provide requestDate field which is simply an alias for createdAt to match expected API structure
        requestDate: formatInTimeZone(transaction.createdAt, IST_TIMEZONE, 'MMM dd, yyyy HH:mm'),
        amount: transaction.totalAmount,
        status: transaction.status,
        billType: transaction.billType || 'Unknown',
        seller: transaction.user ? `${transaction.user.firstName} ${transaction.user.lastName}` : 'Unknown'
      };
    });

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}