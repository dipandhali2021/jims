import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to delete image from Cloudinary if it belongs to our application
async function deleteImageFromCloudinary(imageUrl: string | null | undefined) {
  if (!imageUrl) return;
  
  try {
    // Only delete images that are stored in our Cloudinary folder
    if (imageUrl.includes('cloudinary.com') && imageUrl.includes('jewelry-inventory')) {
      // Extract public ID from the URL
      const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
      if (publicId) {
        console.log(`Deleting image from Cloudinary: ${publicId}`);
        await cloudinary.uploader.destroy(publicId);
        console.log(`Successfully deleted image: ${publicId}`);
      }
    }
  } catch (error) {
    console.error(`Error deleting image from Cloudinary:`, error);
  }
}

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

// Helper function to find karigar by name
async function findKarigarByName(name: string) {
  if (!name) return null;
  
  const karigar = await prisma.karigar.findFirst({
    where: {
      name: {
        contains: name,
        mode: 'insensitive'
      },
      isApproved: true
    }
  });
  
  return karigar;
}

// Helper function to create karigar transaction
async function createKarigarTransaction(
  karigarId: string, 
  description: string, 
  amount: number, 
  productRequestId: string, 
  productName: string, 
  userId: string
) {
  try {
    // Generate transaction ID: KT-YYYY-XXXX (KT for Karigar Transaction)
    const currentYear = new Date().getFullYear();
    const transactionCountForYear = await prisma.karigarTransaction.count({
      where: {
        transactionId: {
          startsWith: `KT-${currentYear}-`
        }
      }
    });
    
    const sequentialNumber = (transactionCountForYear + 1).toString().padStart(4, '0');
    const transactionId = `KT-${currentYear}-${sequentialNumber}`;    const transaction = await prisma.karigarTransaction.create({
      data: {
        transactionId,
        description,
        amount,
        items: {
          requestId: productRequestId,
          productName,
          type: 'product_request',
          autoApproved: true
        },
        karigar: {
          connect: { id: karigarId }
        },
        createdBy: {
          connect: { id: userId }
        }
      }
    });
    
    return transaction;
  } catch (error) {
    console.error(`Error creating karigar transaction:`, error);
    return null;
  }
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

    const { status } = await req.json();
    const id = params.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

// Custom type for product request details
interface ProductRequestDetails {
  id: string;
  requestId: string;
  name: string | null;
  sku: string | null;
  description: string | null;
  category: string | null;
  material: string | null;
  price: number | null;
  costPrice: number | null;
  stock: number | null;
  imageUrl: string | null;
  supplier: string | null;
  stockAdjustment?: number;
  longSetParts: string | null;
  removedPartIds?: string | null;
}

// Get the product request with its details and user
    const productRequest = await prisma.productRequest.findUnique({
      where: { id },
      include: {
        product: true,
        user: true,
        details: true
      }
    }) as {
      id: string;
      requestId: string;
      requestType: string;
      status: string;
      adminAction: boolean;
      isLongSet: boolean;
      userId: string;
      productId: string | null;
      requestDate: Date;
      product: any;
      user: any;
      details: ProductRequestDetails | null;
    } | null;

    if (!productRequest) {
      return NextResponse.json(
        { error: 'Product request not found' },
        { status: 404 }
      );
    }

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    const isAdmin = clerkUser.publicMetadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // If request is rejected, handle image cleanup carefully
    if (status === 'Rejected') {
      if (productRequest.requestType === 'add' && productRequest.details?.imageUrl) {
        // For add requests, always delete the uploaded image if it's not the default
        const isDefaultImage = productRequest.details.imageUrl.includes('placeholderproduct-500x500-1.png');
        if (!isDefaultImage) {
          await deleteImageFromCloudinary(productRequest.details.imageUrl);
        }
      } 
      else if (productRequest.requestType === 'edit' && productRequest.details?.imageUrl && productRequest.product) {
        // For edit requests, only delete the image if it's different from the original product image
        // AND not the default image (this fixes the issue with stock-only edits)
        const isDefaultImage = productRequest.details.imageUrl.includes('placeholderproduct-500x500-1.png');
        const isNewImage = productRequest.details.imageUrl !== productRequest.product.imageUrl;
        
        if (!isDefaultImage && isNewImage) {
          console.log('Rejecting edit with new image. Deleting uploaded image:', productRequest.details.imageUrl);
          await deleteImageFromCloudinary(productRequest.details.imageUrl);
        } else {
          console.log('Rejecting edit without image change. No image deletion needed.');
        }
      }
    }    // If request is approved, handle product operations based on request type
    if (status === 'Approved') {
      switch (productRequest.requestType) {
        case 'add':
          if (productRequest.details) {
            // Handle long set product creation differently
            if (productRequest.isLongSet && productRequest.details.longSetParts) {
              // Parse the parts from the JSON string
              const parts = JSON.parse(productRequest.details.longSetParts || '[]');
              
              // Create the main product first
              const product = await prisma.product.create({
                data: {
                  name: productRequest.details.name || '',
                  sku: productRequest.details.sku || '',
                  description: productRequest.details.description || '',
                  price: productRequest.details.price || 0,
                  costPrice: productRequest.details.costPrice || null,
                  stock: productRequest.details.stock || 0,
                  category: productRequest.details.category || '',
                  material: productRequest.details.material || '',
                  imageUrl: productRequest.details.imageUrl || '',
                  supplier: productRequest.details.supplier || null,
                  lowStockThreshold: 10,
                  userId: productRequest.userId // Associate with the requesting user
                }
              });

              // Create the long set product with reference to the main product
              const longSetProduct = await prisma.longSetProduct.create({
                data: {
                  name: productRequest.details.name || '',
                  sku: productRequest.details.sku || '',
                  description: productRequest.details.description || '',
                  category: productRequest.details.category || '',
                  material: productRequest.details.material || '',
                  price: productRequest.details.price || 0,
                  costPrice: productRequest.details.costPrice || null,
                  stock: productRequest.details.stock || 0,
                  imageUrl: productRequest.details.imageUrl || '',
                  userId: productRequest.userId,
                  productId: product.id,
                  parts: {
                    create: parts.map((part: any) => ({
                      partName: part.partName,
                      partDescription: part.partDescription || '',
                      costPrice: part.costPrice || null,
                      karigarId: part.karigarId || null
                    }))
                  }
                }
              });              // If parts have karigars specified, add transactions to their accounts
              if (parts.length > 0) {
                for (const part of parts) {
                  if (part.karigarId) {
                    const karigar = await prisma.karigar.findUnique({
                      where: { id: part.karigarId }
                    });
                    
                    if (karigar) {
                      const partCost = part.costPrice || 0;
                      const productStock = productRequest.details.stock || 0;
                      const totalPartCost = partCost * productStock; // Multiply by stock quantity
                      
                      // Create transaction for this part (multiplied by stock)
                      const transaction = await createKarigarTransaction(
                        karigar.id,
                        `Long set product part: ${part.partName} for ${productRequest.details.name} (${productStock} units)`,
                        totalPartCost,
                        productRequest.requestId,
                        productRequest.details.name || 'New long set product',
                        userId
                      );
                      
                      // Auto-approve the transaction
                      if (transaction) {
                        await prisma.karigarTransaction.update({
                          where: { id: transaction.id },
                          data: {
                            isApproved: true,
                            approvedById: userId
                          }
                        });
                      }
                    }
                  }
                }
              }
            } else {
              // Regular product creation
              await prisma.product.create({
                data: {
                  name: productRequest.details.name || '',
                  sku: productRequest.details.sku || '',
                  description: productRequest.details.description || '',
                  price: productRequest.details.price || 0,
                  costPrice: productRequest.details.costPrice || null,
                  stock: productRequest.details.stock || 0,
                  category: productRequest.details.category || '',
                  material: productRequest.details.material || '',
                  imageUrl: productRequest.details.imageUrl || '',
                  supplier: productRequest.details.supplier || null,
                  lowStockThreshold: 10,
                  userId: productRequest.userId // Associate with the requesting user
                }
              });

              // If a supplier (karigar) is specified, add a transaction to their account
              if (productRequest.details.supplier) {
                const karigar = await findKarigarByName(productRequest.details.supplier);
                if (karigar) {
                  const productCost = productRequest.details.costPrice || productRequest.details.price || 0;
                  const totalAmount = productCost * (productRequest.details.stock || 0);
                    // Create automatically approved transaction - positive amount means we owe money to karigar
                  const transaction = await createKarigarTransaction(
                    karigar.id,
                    `New product added: ${productRequest.details.name}`,
                    totalAmount,
                    productRequest.requestId,
                    productRequest.details.name || 'New product',
                    userId
                  );
                  
                  // Auto-approve the transaction for add request
                  if (transaction) {
                    console.log(`Auto-approving karigar transaction ${transaction.transactionId} for product add request ${productRequest.requestId}`);
                    await prisma.karigarTransaction.update({
                      where: { id: transaction.id },
                      data: {
                        isApproved: true,
                        approvedById: userId
                      }
                    });
                    console.log(`Add request transaction ${transaction.transactionId} auto-approved successfully`);
                  }
                }
              }
            }
          }
          break;
        
        case 'edit':
          if (productRequest.productId && productRequest.details && productRequest.product) {
            // If changing image, delete the old one from Cloudinary
            if (
              productRequest.product.imageUrl &&
              productRequest.details.imageUrl &&
              productRequest.product.imageUrl !== productRequest.details.imageUrl &&
              !productRequest.product.imageUrl.includes('placeholderproduct-500x500-1.png')
            ) {
              await deleteImageFromCloudinary(productRequest.product.imageUrl);
            }

            if (productRequest.isLongSet) {
              // First update the base product
              await prisma.product.update({
                where: { id: productRequest.productId },
                data: {
                  ...(productRequest.details.name && { name: productRequest.details.name }),
                  ...(productRequest.details.sku && { sku: productRequest.details.sku }),
                  ...(productRequest.details.description !== null && { description: productRequest.details.description }),
                  ...(productRequest.details.price && { price: productRequest.details.price }),
                  ...(productRequest.details.costPrice !== undefined && { costPrice: productRequest.details.costPrice }),
                  ...(productRequest.details.stock !== null && { stock: productRequest.details.stock }),
                  ...(productRequest.details.category && { category: productRequest.details.category }),
                  ...(productRequest.details.material && { material: productRequest.details.material }),
                  ...(productRequest.details.imageUrl !== null && { imageUrl: productRequest.details.imageUrl }),
                }
              });

              // Then update the long set product and its parts
              if (productRequest.details.longSetParts) {
                const parts = JSON.parse(productRequest.details.longSetParts);
                const removedPartIds = productRequest.details.removedPartIds ? 
                  JSON.parse(productRequest.details.removedPartIds) : [];

                // Update long set product
                const longSetProduct = await prisma.longSetProduct.update({
                  where: { productId: productRequest.productId },
                  data: {
                    name: productRequest.details.name || '',
                    sku: productRequest.details.sku || '',
                    description: productRequest.details.description || '',
                    category: productRequest.details.category || '',
                    material: productRequest.details.material || '',
                    price: productRequest.details.price || 0,
                    costPrice: productRequest.details.costPrice || null,
                    stock: productRequest.details.stock || 0,
                    imageUrl: productRequest.details.imageUrl || '',
                  }
                });

                // Delete removed parts
                if (removedPartIds.length > 0) {
                  await prisma.longSetProductPart.deleteMany({
                    where: {
                      id: {
                        in: removedPartIds
                      }
                    }
                  });
                }                // Update or create parts
                for (const part of parts) {
                  // Determine if this part has a karigar that needs transaction (new or updated)
                  const partKarigarId = part.karigarId && part.karigarId !== 'none' ? part.karigarId : null;
                  
                  if (part.id) {
                    // Update existing part
                    const existingPart = await prisma.longSetProductPart.findUnique({
                      where: { id: part.id },
                      include: { karigar: true }
                    });
                    
                    await prisma.longSetProductPart.update({
                      where: { id: part.id },
                      data: {
                        partName: part.partName,
                        partDescription: part.partDescription || '',
                        costPrice: part.costPrice || null,
                        karigarId: partKarigarId
                      }
                    });
                    
                    // If karigar changed or cost price changed for existing part, create a transaction
                    if (partKarigarId && 
                        (existingPart?.karigarId !== partKarigarId || existingPart?.costPrice !== part.costPrice)) {
                      const karigar = await prisma.karigar.findUnique({
                        where: { id: partKarigarId }
                      });
                      
                      if (karigar) {
                        const partCost = part.costPrice || 0;
                        const productStock = longSetProduct.stock || 0;
                        const totalPartCost = partCost * productStock; // Multiply by stock quantity
                        
                        // Create transaction for this updated part
                        const transaction = await createKarigarTransaction(
                          karigar.id,
                          `Updated long set product part: ${part.partName} for ${longSetProduct.name} (${productStock} units)`,
                          totalPartCost,
                          productRequest.requestId,
                          longSetProduct.name,
                          userId
                        );
                        
                        // Auto-approve the transaction
                        if (transaction) {
                          await prisma.karigarTransaction.update({
                            where: { id: transaction.id },
                            data: {
                              isApproved: true,
                              approvedById: userId
                            }
                          });
                        }
                      }
                    }
                  } else {
                    // Create new part
                    const createdPart = await prisma.longSetProductPart.create({
                      data: {
                        partName: part.partName,
                        partDescription: part.partDescription || '',
                        costPrice: part.costPrice || null,
                        karigarId: partKarigarId,
                        longSetProductId: longSetProduct.id
                      }
                    });
                    
                    // If karigar specified for new part, create a transaction
                    if (partKarigarId) {
                      const karigar = await prisma.karigar.findUnique({
                        where: { id: partKarigarId }
                      });
                      
                      if (karigar) {
                        const partCost = part.costPrice || 0;
                        const productStock = longSetProduct.stock || 0;
                        const totalPartCost = partCost * productStock; // Multiply by stock quantity
                        
                        // Create transaction for this new part
                        const transaction = await createKarigarTransaction(
                          karigar.id,
                          `New long set product part: ${part.partName} for ${longSetProduct.name} (${productStock} units)`,
                          totalPartCost,
                          productRequest.requestId,
                          longSetProduct.name,
                          userId
                        );
                        
                        // Auto-approve the transaction
                        if (transaction) {
                          await prisma.karigarTransaction.update({
                            where: { id: transaction.id },
                            data: {
                              isApproved: true,
                              approvedById: userId
                            }
                          });
                        }
                      }
                    }
                  }
                }
              }
            } else {
              // Update regular product
              await prisma.product.update({
                where: { id: productRequest.productId },
                data: {
                  ...(productRequest.details.name && { name: productRequest.details.name }),
                  ...(productRequest.details.sku && { sku: productRequest.details.sku }),
                  ...(productRequest.details.description !== null && { description: productRequest.details.description }),
                  ...(productRequest.details.price && { price: productRequest.details.price }),
                  ...(productRequest.details.costPrice !== undefined && { costPrice: productRequest.details.costPrice }),
                  ...(productRequest.details.stock !== null && { stock: productRequest.details.stock }),
                  ...(productRequest.details.category && { category: productRequest.details.category }),
                  ...(productRequest.details.material && { material: productRequest.details.material }),
                  ...(productRequest.details.imageUrl !== null && { imageUrl: productRequest.details.imageUrl }),
                  ...(productRequest.details.supplier !== undefined && { supplier: productRequest.details.supplier })
                }
              });
            }

            // If a supplier (karigar) is specified and it's different or stock is added, add a transaction to their account
            if (
              productRequest.details.supplier && 
              (productRequest.details.supplier !== productRequest.product.supplier ||
              (productRequest.details.stockAdjustment && productRequest.details.stockAdjustment > 0))
            ) {
              const karigar = await findKarigarByName(productRequest.details.supplier);
              if (karigar) {                const productCost = productRequest.details.costPrice !== undefined ? 
                  productRequest.details.costPrice : 
                  productRequest.product.costPrice || productRequest.product.price || 0;
                  
                const stockChange = productRequest.details.stockAdjustment || 0;
                const totalAmount = (productCost || 0) * stockChange;
                
                if (totalAmount > 0) {                  // Create transaction - positive amount means we owe money to karigar
                  const transaction = await createKarigarTransaction(
                    karigar.id,
                    `Updated product: ${productRequest.product.name}`,
                    totalAmount,
                    productRequest.requestId,
                    productRequest.product.name,
                    userId
                  );
                  
                  // Auto-approve the transaction for edit request
                  if (transaction) {
                    console.log(`Auto-approving karigar transaction ${transaction.transactionId} for product edit request ${productRequest.requestId}`);
                    await prisma.karigarTransaction.update({
                      where: { id: transaction.id },
                      data: {
                        isApproved: true,
                        approvedById: userId
                      }
                    });
                    console.log(`Edit request transaction ${transaction.transactionId} auto-approved successfully`);
                  }
                }
              }
            }
          }
          break;
        
        case 'delete':
          if (productRequest.productId && productRequest.product) {
            // Delete the product image from Cloudinary if it's not the default
            const isDefaultImage = productRequest.product.imageUrl?.includes('placeholderproduct-500x500-1.png');
            if (productRequest.product.imageUrl && !isDefaultImage) {
              await deleteImageFromCloudinary(productRequest.product.imageUrl);
            }
            
            // Delete product
            await prisma.product.delete({
              where: { id: productRequest.productId }
            });
          }
          break;
      }
    }

    // Update product request status
    const updatedRequest = await prisma.productRequest.update({
      where: { id },
      data: {
        status,
        // Update timestamp for processed requests
        requestDate: new Date()
      },
      include: {
        product: true,
        user: true,
        details: true
      }
    });

    // Create notification for the user who made the request
    if (productRequest.userId) {
      let notificationMessage = '';
      switch (productRequest.requestType) {        case 'add':          notificationMessage = `Your product add request (${productRequest.requestId}) has been ${status.toLowerCase()}.`;
          if (status === 'Approved' && productRequest.details) {
            notificationMessage += ` Product "${productRequest.details.name}" has been added to inventory.`;
            if (productRequest.isLongSet) {
              notificationMessage += ` This long set product and its parts have been created.`;
            } else if (productRequest.details.supplier) {
              notificationMessage += ` Related transactions with supplier ${productRequest.details.supplier} have been automatically approved.`;
            }
          }
          break;
        case 'edit':          notificationMessage = `Your product edit request (${productRequest.requestId}) has been ${status.toLowerCase()}.`;
          if (status === 'Approved' && productRequest.product) {
            notificationMessage += ` Changes to product "${productRequest.product.name}" have been applied.`;
            if (productRequest.details?.supplier && 
              (productRequest.details.supplier !== productRequest.product.supplier ||
              (productRequest.details.stockAdjustment && productRequest.details.stockAdjustment > 0))) {
              notificationMessage += ` Related transactions with supplier ${productRequest.details.supplier} have been automatically approved.`;
            }
          }
          break;
        case 'delete':
          notificationMessage = `Your product delete request (${productRequest.requestId}) has been ${status.toLowerCase()}.`;
          if (status === 'Approved' && productRequest.product)
            notificationMessage += ` Product "${productRequest.product.name}" has been removed from inventory.`;
          break;
      }

      await prisma.notification.create({
        data: {
          title: `Product Request ${status}`,
          message: notificationMessage,
          type: 'status_update',
          userId: productRequest.userId,
        }
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating product request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
