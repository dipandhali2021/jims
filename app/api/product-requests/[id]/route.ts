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

    // Get the product request with its details and user
    const productRequest = await prisma.productRequest.findUnique({
      where: { id },
      include: {
        product: true,
        user: true,
        details: true
      }
    });

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
    }

    // If request is approved, handle product operations based on request type
    if (status === 'Approved') {
      switch (productRequest.requestType) {
        case 'add':
          if (productRequest.details) {            // Create new product with details from the request
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
              // Update existing product
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
                // Add supplier field to the update
                ...(productRequest.details.supplier !== undefined && { supplier: productRequest.details.supplier })
              }
            });
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
      switch (productRequest.requestType) {
        case 'add':
          notificationMessage = `Your product add request (${productRequest.requestId}) has been ${status.toLowerCase()}.`;
          if (status === 'Approved' && productRequest.details)
            notificationMessage += ` Product "${productRequest.details.name}" has been added to inventory.`;
          break;
        case 'edit':
          notificationMessage = `Your product edit request (${productRequest.requestId}) has been ${status.toLowerCase()}.`;
          if (status === 'Approved' && productRequest.product)
            notificationMessage += ` Changes to product "${productRequest.product.name}" have been applied.`;
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