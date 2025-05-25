import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const days = url.searchParams.get('days') || '30';
    const type = url.searchParams.get('type') || 'all'; // 'karigar', 'vyapari', or 'all'
    
    const daysNum = parseInt(days, 10);
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, daysNum));

    // Get current month range for monthly summary
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    // Base query filters for time range
    const timeRangeFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      }
    };

    // Prepare data objects
    let karigarData = null;
    let vyapariData = null;

    // Fetch Karigar data if requested
    if (type === 'karigar' || type === 'all') {
      // Get total count of karigars
      const totalKarigars = await prisma.karigar.count({
        where: {
          isApproved: true
        }
      });

      // Get recent transactions and payments
      const karigarTransactions = await prisma.karigarTransaction.findMany({
        where: timeRangeFilter,
        include: {
          karigar: {
            select: {
              name: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      // Get recent payments
      const karigarPayments = await prisma.karigarPayment.findMany({
        where: timeRangeFilter,
        include: {
          karigar: {
            select: {
              name: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      // Get total transaction amount in the period
      const karigarTransactionSum = await prisma.karigarTransaction.aggregate({
        where: timeRangeFilter,
        _sum: {
          amount: true
        }
      });

      // Get monthly transaction count
      const monthlyTransactionCount = await prisma.karigarTransaction.count({
        where: {
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        }
      });      // Calculate positive (amounts we owe to karigars) and negative amounts (karigars owe us)
      const positiveTransactions = await prisma.karigarTransaction.aggregate({
        where: {
          ...timeRangeFilter,
          amount: { gt: 0 }
        },
        _sum: {
          amount: true
        }
      });

      const negativeTransactions = await prisma.karigarTransaction.aggregate({
        where: {
          ...timeRangeFilter,
          amount: { lt: 0 }
        },
        _sum: {
          amount: true
        }
      });
      
      // Calculate total payments amount
      const karigarPaymentSum = await prisma.karigarPayment.aggregate({
        where: timeRangeFilter,
        _sum: {
          amount: true
        }
      });

      // Get payment counts
      const totalPayments = await prisma.karigarPayment.count({
        where: timeRangeFilter
      });
      
      const totalTransactions = await prisma.karigarTransaction.count({
        where: timeRangeFilter
      });
      
      const monthlyPaymentCount = await prisma.karigarPayment.count({
        where: {
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        }
      });
        // Get pending transaction data (not approved transactions)
      const pendingTransactions = await prisma.karigarTransaction.count({
        where: {
          ...timeRangeFilter,
          isApproved: false
        }
      });
      
      const pendingTransactionSum = await prisma.karigarTransaction.aggregate({
        where: {
          ...timeRangeFilter,
          isApproved: false
        },
        _sum: {
          amount: true
        }
      });
      
      // Get resolved transaction data (approved transactions)
      const resolvedTransactions = await prisma.karigarTransaction.count({
        where: {
          ...timeRangeFilter,
          isApproved: true
        }
      });
      
      const resolvedTransactionSum = await prisma.karigarTransaction.aggregate({
        where: {
          ...timeRangeFilter,
          isApproved: true
        },
        _sum: {
          amount: true
        }
      });

      // Get summary by karigar (top 5 with highest transaction amounts)
      const topKarigars = await prisma.karigarTransaction.groupBy({
        by: ['karigarId'],
        where: timeRangeFilter,
        _sum: {
          amount: true
        },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        },
        take: 5
      });

      // Fetch karigar names for the top karigars
      const topKarigarDetails = await Promise.all(
        topKarigars.map(async (k) => {
          const karigar = await prisma.karigar.findUnique({
            where: { id: k.karigarId },
            select: { name: true }
          });
          return {        id: k.karigarId,
            name: karigar?.name || 'Unknown',
            totalAmount: Number(k._sum.amount)
          };
        })
      );
        // Format transaction and payment data for charts
        const [transactionsByDate, paymentsByDate] = await Promise.all([
          prisma.$queryRaw`
            SELECT
              TO_CHAR("createdAt", 'YYYY-MM-DD') as "date",
              SUM("amount") as "totalAmount",
              COUNT(*) as "count"
            FROM "KarigarTransaction"
            WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
            ORDER BY "date"
          `,
          prisma.$queryRaw`
            SELECT
              TO_CHAR("createdAt", 'YYYY-MM-DD') as "date",
              SUM("amount") as "totalAmount",
              COUNT(*) as "count"
            FROM "KarigarPayment"
            WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
            ORDER BY "date"
          `
        ]);
  
        // Convert BigInt values to regular numbers
        const formattedTransactionsByDate = (transactionsByDate as any[]).map(item => ({
          date: item.date,
          totalAmount: Number(item.totalAmount),
          count: Number(item.count)
        }));
  
        const formattedPaymentsByDate = (paymentsByDate as any[]).map(item => ({
          date: item.date,
          totalAmount: Number(item.totalAmount),
          count: Number(item.count)
        }));

      // Format payments data
      const formattedKarigarPayments = karigarPayments.map(p => ({
        id: p.id,
        paymentId: p.paymentId,
        karigarName: p.karigar.name,
        description: p.notes || `Payment: ${p.paymentId}`,
        amount: p.amount,
        createdAt: format(p.createdAt, 'MMM dd, yyyy'),
      }));

      karigarData = {
        totalKarigars,
        recentTransactions: karigarTransactions.map(t => ({
          id: t.id,
          transactionId: t.transactionId,
          karigarName: t.karigar.name,
          description: t.description,
          amount: t.amount,
          createdAt: format(t.createdAt, 'MMM dd, yyyy'),
        })),
        recentPayments: formattedKarigarPayments,
        totalTransactionAmount: Number(karigarTransactionSum._sum.amount) || 0,
        totalPaymentAmount: Number(karigarPaymentSum._sum.amount) || 0,
        monthlyTransactionCount,
        monthlyPaymentCount,
        totalTransactions,
        totalPayments,
        pendingTransactions,
        pendingTransactionAmount: Number(pendingTransactionSum._sum.amount) || 0,
        resolvedTransactions,
        resolvedTransactionAmount: Number(resolvedTransactionSum._sum.amount) || 0,
        amountWeOwe: Number(positiveTransactions._sum.amount) || 0,
        amountOwedToUs: Math.abs(Number(negativeTransactions._sum.amount) || 0),
        topKarigars: topKarigarDetails,
        transactionChart: formattedTransactionsByDate,
        paymentChart: formattedPaymentsByDate,
      };
    }

    // Fetch Vyapari data if requested
    if (type === 'vyapari' || type === 'all') {
      // Get total count of vyaparis
      const totalVyaparis = await prisma.vyapari.count({
        where: {
          isApproved: true
        }
      });

      // Get recent transactions and payments
      const vyapariTransactions = await prisma.vyapariTransaction.findMany({
        where: timeRangeFilter,
        include: {
          vyapari: {
            select: {
              name: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      // Get recent payments
      const vyapariPayments = await prisma.vyapariPayment.findMany({
        where: timeRangeFilter,
        include: {
          vyapari: {
            select: {
              name: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      // Get total transaction amount in the period
      const vyapariTransactionSum = await prisma.vyapariTransaction.aggregate({
        where: timeRangeFilter,
        _sum: {
          amount: true
        }
      });

      // Get monthly transaction count
      const monthlyTransactionCount = await prisma.vyapariTransaction.count({
        where: {
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        }
      });      // Calculate positive (amounts we owe to vyaparis) and negative amounts (vyaparis owe us)
      const positiveTransactions = await prisma.vyapariTransaction.aggregate({
        where: {
          ...timeRangeFilter,
          amount: { gt: 0 }
        },
        _sum: {
          amount: true
        }
      });

      const negativeTransactions = await prisma.vyapariTransaction.aggregate({
        where: {
          ...timeRangeFilter,
          amount: { lt: 0 }
        },
        _sum: {
          amount: true
        }
      });
      
      // Calculate total payments amount
      const vyapariPaymentSum = await prisma.vyapariPayment.aggregate({
        where: timeRangeFilter,
        _sum: {
          amount: true
        }
      });

      // Get payment counts
      const totalPayments = await prisma.vyapariPayment.count({
        where: timeRangeFilter
      });
      
      const totalTransactions = await prisma.vyapariTransaction.count({
        where: timeRangeFilter
      });
      
      const monthlyPaymentCount = await prisma.vyapariPayment.count({
        where: {
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        }
      });
        // Get pending transaction data (not approved transactions)
      const pendingTransactions = await prisma.vyapariTransaction.count({
        where: {
          ...timeRangeFilter,
          isApproved: false
        }
      });
      
      const pendingTransactionSum = await prisma.vyapariTransaction.aggregate({
        where: {
          ...timeRangeFilter,
          isApproved: false
        },
        _sum: {
          amount: true
        }
      });
      
      // Get resolved transaction data (approved transactions)
      const resolvedTransactions = await prisma.vyapariTransaction.count({
        where: {
          ...timeRangeFilter,
          isApproved: true
        }
      });
      
      const resolvedTransactionSum = await prisma.vyapariTransaction.aggregate({
        where: {
          ...timeRangeFilter,
          isApproved: true
        },
        _sum: {
          amount: true
        }
      });

      // Get summary by vyapari (top 5 with highest transaction amounts)
      const topVyaparis = await prisma.vyapariTransaction.groupBy({
        by: ['vyapariId'],
        where: timeRangeFilter,
        _sum: {
          amount: true
        },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        },
        take: 5
      });

      // Fetch vyapari names for the top vyaparis
      const topVyapariDetails = await Promise.all(
        topVyaparis.map(async (v) => {
          const vyapari = await prisma.vyapari.findUnique({
            where: { id: v.vyapariId },
            select: { name: true }
          });
          return {        id: v.vyapariId,
            name: vyapari?.name || 'Unknown',
            totalAmount: Number(v._sum.amount)
          };
        })
      );
        // Format transaction and payment data for charts
        const [transactionsByDate, paymentsByDate] = await Promise.all([
          prisma.$queryRaw`
            SELECT
              TO_CHAR("createdAt", 'YYYY-MM-DD') as "date",
              SUM("amount") as "totalAmount",
              COUNT(*) as "count"
            FROM "VyapariTransaction"
            WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
            ORDER BY "date"
          `,
          prisma.$queryRaw`
            SELECT
              TO_CHAR("createdAt", 'YYYY-MM-DD') as "date",
              SUM("amount") as "totalAmount",
              COUNT(*) as "count"
            FROM "VyapariPayment"
            WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
            ORDER BY "date"
          `
        ]);
  
        // Convert BigInt values to regular numbers
        const formattedTransactionsByDate = (transactionsByDate as any[]).map(item => ({
          date: item.date,
          totalAmount: Number(item.totalAmount),
          count: Number(item.count)
        }));
  
        const formattedPaymentsByDate = (paymentsByDate as any[]).map(item => ({
          date: item.date,
          totalAmount: Number(item.totalAmount),
          count: Number(item.count)
        }));

      // Format payments data
      const formattedVyapariPayments = vyapariPayments.map(p => ({
        id: p.id,
        paymentId: p.paymentId,
        vyapariName: p.vyapari.name,
        description: p.notes || `Payment: ${p.paymentId}`,
        amount: p.amount,
        createdAt: format(p.createdAt, 'MMM dd, yyyy'),
      }));

      vyapariData = {
        totalVyaparis,
        recentTransactions: vyapariTransactions.map(t => ({
          id: t.id,
          transactionId: t.transactionId,
          vyapariName: t.vyapari.name,
          description: t.description,
          amount: t.amount,
          createdAt: format(t.createdAt, 'MMM dd, yyyy'),
        })),
        recentPayments: formattedVyapariPayments,
        totalTransactionAmount: Number(vyapariTransactionSum._sum?.amount) || 0,
        totalPaymentAmount: Number(vyapariPaymentSum._sum?.amount) || 0,
        monthlyTransactionCount,
        monthlyPaymentCount,
        totalTransactions,
        totalPayments,
        pendingTransactions,
        pendingTransactionAmount: Number(pendingTransactionSum._sum?.amount) || 0,
        resolvedTransactions,
        resolvedTransactionAmount: Number(resolvedTransactionSum._sum?.amount) || 0,
        amountWeOwe: Number(positiveTransactions._sum?.amount) || 0,
        amountOwedToUs: Math.abs(Number(negativeTransactions._sum?.amount) || 0),
        topVyaparis: topVyapariDetails,
        transactionChart: formattedTransactionsByDate,
        paymentChart: formattedPaymentsByDate,
      };
    }

    return NextResponse.json({
      karigar: karigarData,
      vyapari: vyapariData,
      timeRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
        days: daysNum,
      }
    });
  } catch (error) {
    console.error('Error fetching Khata analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
