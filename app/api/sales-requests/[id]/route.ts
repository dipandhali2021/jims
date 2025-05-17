import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { SalesItem } from '@prisma/client';

// Helper to ensure user exists in database
async function ensureUserExists(userId: string) {
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const clerkUser = await clerkClient.users.getUser(userId);
    user = await prisma.user.create({
      data: {
        id: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        role: clerkUser.publicMetadata?.role as string || 'user'
      }
    });
  }
  return user;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, billType, billDetails } = await req.json();
    const id = params.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get the sales request with its items and user
    const salesRequest = await prisma.salesRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    if (!salesRequest) {
      return NextResponse.json(
        { error: 'Sales request not found' },
        { status: 404 }
      );
    }


    // Check if the user is authorized to update this request

    if (status === 'Approved') {
      // Update product stock for each item
      for (const item of salesRequest.items) {
        if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }
      }
    }        // Create transaction record if request is approved and there's no existing transaction
    if (status === 'Approved') {
      // Ensure user exists in database
      await ensureUserExists(salesRequest.userId);

      // Check if a transaction already exists for this sales request
      const existingTransaction = await prisma.transaction.findUnique({
        where: { orderId: salesRequest.requestId }
      });      
      
      // Only create a transaction if one doesn't exist
      if (!existingTransaction) {
        // Format items for transaction record with full product details
        const transactionItems = salesRequest.items.map(item => ({
          productId: item.productId,
          productName: item?.product?.name || item.productName,
          category: item?.product?.category,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          material: item?.product?.material,
          imageUrl: item?.product?.imageUrl || item.productImageUrl
        }));

        // Create transaction record with billType information
        await prisma.transaction.create({
          data: {
            orderId: salesRequest.requestId,
            customer: salesRequest.customer,
            totalAmount: salesRequest.totalValue,
            items: transactionItems,
            userId: salesRequest.userId,
            billType: billType || null, // Set billType from request (GST or Non-GST)
          }
        });
          // Create a transaction in the khatabook for the vyapari if associated
        if (salesRequest.vyapariId) {
          try {
            // First check if the vyapari exists and is approved
            const vyapari = await prisma.vyapari.findFirst({
              where: {
                id: salesRequest.vyapariId,
                isApproved: true
              }
            });
            
            if (!vyapari) {
              console.warn(`Vyapari ${salesRequest.vyapariId} not found or not approved, skipping khatabook transaction`);
            } else {
              // Generate transaction ID in VT-YYYY-XXXX format for Vyapari Transaction
              const currentYear = new Date().getFullYear();
              const transactionCountForYear = await prisma.vyapariTransaction.count({
                where: {
                  transactionId: {
                    startsWith: `VT-${currentYear}-`
                  }
                }
              });
              
              const sequentialNumber = (transactionCountForYear + 1).toString().padStart(4, '0');
              const transactionId = `VT-${currentYear}-${sequentialNumber}`;
              
              // Create vyapari transaction - negative amount means the trader owes us money
              await prisma.vyapariTransaction.create({
                data: {
                  transactionId,
                  description: `Sales Request ${salesRequest.requestId} approved`,
                  amount: -salesRequest.totalValue, // Negative amount - trader owes us money
                  items: {
                    salesRequestId: salesRequest.requestId,
                    items: transactionItems,
                    billType: billType || 'Regular'
                  },
                  vyapari: {
                    connect: { id: salesRequest.vyapariId }
                  },
                  createdBy: {
                    connect: { id: userId }
                  }
                }
              });
              
              console.log(`Khatabook transaction created for vyapari ${salesRequest.vyapariId} with ID ${transactionId}`);
            }
          } catch (error) {
            // Log the error but don't fail the overall request - the main transaction is already created
            console.error(`Error creating khatabook transaction for vyapari ${salesRequest.vyapariId}:`, error);
          }
        }
      }
      // Generate bill if billType is provided
      if (billType && ['GST', 'Non-GST'].includes(billType)) {
        // Generate bill number
        const billNumber = `BILL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          // Get the HSN code from billDetails or use default
        const hsnCode = billDetails?.hsnCode || '7113';
        // Get the taxable status from billDetails or default to true for GST bills
        const isTaxable = billDetails?.isTaxable !== undefined ? billDetails.isTaxable : (billType === 'GST');
        // Get the GST percentages from billDetails or use defaults
        const cgstPercentage = billDetails?.cgstPercentage || 9;
        const sgstPercentage = billDetails?.sgstPercentage || 9;
        const igstPercentage = billDetails?.igstPercentage || 0;
        const cgstRate = cgstPercentage / 100;
        const sgstRate = sgstPercentage / 100;
        const igstRate = igstPercentage / 100;
        
        // Format bill items
        const billItems = salesRequest.items.map(item => ({
          name: item?.product?.name || item.productName,
          quantity: item.quantity,
          rate: item.price,
          amount: item.price * item.quantity,
          hsn: billType === 'GST' ? hsnCode : undefined,
        }));
        
        const totalAmount = salesRequest.totalValue;
        let sgst = 0, cgst = 0, igst = 0;
        
        if (billType === 'GST' && isTaxable) {
          // Calculate GST components using the provided percentages
          cgst = totalAmount * cgstRate;
          sgst = totalAmount * sgstRate;
          igst = totalAmount * igstRate;
        }
          // Process date and time of supply
        let date = new Date();
        let timeOfSupply = null;
        if (billDetails?.supplyDateTime) {
          try {
            date = new Date(billDetails.supplyDateTime);
            timeOfSupply = date.toTimeString().split(' ')[0]; // Extract only the time part (HH:MM:SS)
          } catch (e) {
            console.error("Invalid supply date time format", e);
          }
        }
        
        // Store HSN codes as JSON if available
        const hsnCodes = billType === 'GST' ? { default: hsnCode } : undefined;        
        
        // Store custom fields in _meta to preserve GST percentage information (for backward compatibility)
        const enhancedItems = {
          ...billItems,
          _meta: {
            dateOfSupply: date || null,
            timeOfSupply: timeOfSupply,
            cgstPercentage: cgstPercentage || 9,
            sgstPercentage: sgstPercentage || 9,
            igstPercentage: igstPercentage || 0,
            hsnCode: hsnCode || '7113'
          }
        };
        
        // Create bill record with additional GST details if provided
        await prisma.bill.create({
          data: {
            billNumber,
            billType,
            date, // Use the supply date as the main date
            dateOfSupply: date, // Also store explicitly in the dateOfSupply field
            timeOfSupply: timeOfSupply,
            customerName: salesRequest.customer,
            customerAddress: billDetails?.customerAddress,
            customerState: billDetails?.customerState,
            customerGSTIN: billDetails?.customerGSTIN,
            transportMode: billDetails?.transportMode,
            vehicleNo: billDetails?.vehicleNo,
            placeOfSupply: billDetails?.placeOfSupply || (billType === 'GST' ? 'Maharashtra' : undefined),
            items: enhancedItems,            totalAmount: billType === 'GST' && isTaxable ? totalAmount + (sgst || 0) + (cgst || 0) + (igst || 0) : totalAmount,
            sgst,
            cgst,
            igst,
            hsnCodes,
            isTaxable: billType === 'GST' ? isTaxable : false,
            userId: userId,
            createdBy: userId,
          }
        });
      }
    }

    // Update sales request status
    const updatedRequest = await prisma.salesRequest.update({
      where: { id },
      data: {
        status,
        // Update timestamp for approved requests
        ...(status === 'Approved' ? {
          requestDate: new Date()
        } : {})
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Create notification for the shopkeeper
    await prisma.notification.create({
      data: {
        title: `Sales Request ${status}`,
        message: `Your sales request (${salesRequest.requestId}) has been ${status.toLowerCase()}. Total value: ₹${salesRequest.totalValue.toFixed(2)}`,
        type: 'status_update',
        userId: salesRequest.userId,
      }
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating sales request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}