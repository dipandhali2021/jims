import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Helper function to generate request ID
function generateRequestId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SR-${year}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customer, items } = await req.json();

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Calculate total value and validate products
    let totalValue = 0;
    const productIds = items.map(item => item.productId);
    
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
    });

    // Validate all products exist and have sufficient stock
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}` },
          { status: 400 }
        );
      }
      totalValue += product.price * item.quantity;
    }

    // Create sales request with unique request ID
    const salesRequest = await prisma.salesRequest.create({
      data: {
        requestId: generateRequestId(),
        customer,
        totalValue,
        userId,
        items: {
          create: items.map(item => ({
            quantity: item.quantity,
            price: products.find(p => p.id === item.productId)!.price,
            productId: item.productId
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(salesRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating sales request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const salesRequests = await prisma.salesRequest.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(salesRequests);
  } catch (error) {
    console.error('Error fetching sales requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}