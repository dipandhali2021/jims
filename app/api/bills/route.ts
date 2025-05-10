import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { addMonths, subMonths } from 'date-fns';

// Helper function to generate bill number
function generateBillNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${year}-${random}`;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse search parameters
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const twoMonthsAgo = subMonths(new Date(), 2);

    // Get bills with search filter on customer name and automatic deletion of old bills
    const bills = await prisma.bill.findMany({
      where: {
        AND: [
          {
            OR: [
              { customerName: { contains: search, mode: 'insensitive' } },
              { billNumber: { contains: search, mode: 'insensitive' } },
            ],
          },
          { date: { gte: twoMonthsAgo } }, // Only show bills that are less than 2 months old
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { 
      billType, 
      customerName, 
      customerAddress, 
      customerState,
      customerGSTIN,
      items,
      totalAmount,
      sgst,
      cgst,
      igst,
      hsnCodes,
      transportMode,
      vehicleNo,
      placeOfSupply,
      isTaxable,
      isFakeBill, // Flag for fake bills that won't be saved in DB
      date,
      dateOfSupply,
      timeOfSupply,
      cgstPercentage,
      sgstPercentage,
      igstPercentage,
      hsnCode,
    } = data;

    if (!billType || !customerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    // For fake bills, just return the bill data without saving to database
    if (isFakeBill) {
      return NextResponse.json({
        billNumber: generateBillNumber(),
        billType,
        date: data.date || new Date(),
        customerName,
        customerAddress,
        customerState,
        customerGSTIN,
        items,
        totalAmount,
        sgst,
        cgst,
        igst,
        hsnCodes: { codes: hsnCode ? [hsnCode] : ['7113'] },
        transportMode,
        vehicleNo,
        placeOfSupply,
        isTaxable,
        // Include custom fields in response but not for database
        dateOfSupply: dateOfSupply || null,
        timeOfSupply: timeOfSupply || null,
        cgstPercentage: cgstPercentage || 9,
        sgstPercentage: sgstPercentage || 9,
        igstPercentage: igstPercentage || 0,
        isFakeBill: true,
      }, { status: 201 });
    }

    // Create actual bill in database
    // Still store custom fields in the items Json field for backward compatibility
    const enhancedItems = typeof items === 'object' ? 
      { 
        ...items,
        _meta: {
          dateOfSupply: dateOfSupply || null,
          timeOfSupply: timeOfSupply || null,
          cgstPercentage: cgstPercentage || 9,
          sgstPercentage: sgstPercentage || 9,
          igstPercentage: igstPercentage || 0,
          hsnCode: hsnCode || '7113'
        }
      } : items;
    
    // Parse the date of supply if provided
    let supplyDate = null;
    if (dateOfSupply) {
      try {
        supplyDate = new Date(dateOfSupply);
      } catch (e) {
        console.error("Invalid dateOfSupply format", e);
      }
    }
      
    const bill = await prisma.bill.create({
      data: {
        billNumber: generateBillNumber(),
        billType,
        date: date || new Date(),
        dateOfSupply: supplyDate,
        timeOfSupply: timeOfSupply || null,
        customerName,
        customerAddress,
        customerState,
        customerGSTIN,
        items: enhancedItems,
        totalAmount,
        sgst,
        cgst,
        igst,
        hsnCodes: { codes: hsnCode ? [hsnCode] : ['7113'] },
        transportMode,
        vehicleNo,
        placeOfSupply,
        isTaxable: billType === "GST" ? (isTaxable !== undefined ? isTaxable : true) : false,
        userId,
        createdBy: userId,
      },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete bills older than 2 months
    const twoMonthsAgo = subMonths(new Date(), 2);
    
    const result = await prisma.bill.deleteMany({
      where: {
        date: {
          lt: twoMonthsAgo
        }
      }
    });

    // Return success response
    return NextResponse.json({ 
      message: `${result.count} old bills deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting old bills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
