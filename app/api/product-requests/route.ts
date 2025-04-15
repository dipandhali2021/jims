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

// Helper function to generate request ID
function generateRequestId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PR-${year}-${random}`;
}

// Helper function to find admin users
async function findAdminUsers() {
  try {
    const users = await clerkClient.users.getUserList({
      limit: 100,
    });

    return users?.data?.filter(user =>
      user.publicMetadata &&
      typeof user.publicMetadata === 'object' &&
      user.publicMetadata.role === 'admin'
    ).map(user => user.id);
  } catch (error) {
    console.error('Error finding admin users:', error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user exists in our database
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Create user if they don't exist
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

    // Check if the request is FormData or JSON
    const contentType = req.headers.get('content-type') || '';
    let requestType, productId, details;
    let imageUrl = 'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png'; // Default image
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData request
      const formData = await req.formData();
      requestType = formData.get('requestType') as string;
      productId = formData.get('productId') as string;
      
      // Check if details is provided as JSON string
      const detailsJson = formData.get('details');
      if (detailsJson && typeof detailsJson === 'string') {
        try {
          details = JSON.parse(detailsJson);
        } catch (e) {
          console.error('Error parsing details JSON:', e);
          return NextResponse.json(
            { error: 'Invalid details format' },
            { status: 400 }
          );
        }
      } else {
        // If not using JSON, handle fields individually
        if (requestType === 'add' || requestType === 'edit') {
          details = {
            name: formData.get('name') as string,
            sku: formData.get('sku') as string,
            description: formData.get('description') as string || '',
            category: formData.get('category') as string,
            material: formData.get('material') as string,
            price: parseFloat(formData.get('price') as string),
            stock: parseInt(formData.get('stock') as string),
            supplier: formData.get('supplier') as string || undefined, // Add supplier field
            imageUrl: '', // We'll update this after handling the image
          };
        }
      }
      
      // Handle image upload if present
      const imageFile = formData.get('image');
      if (imageFile && imageFile instanceof Blob) {
        try {
          console.log('Handling image upload...');
          // Convert the file to base64
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64Image = buffer.toString('base64');
          
          // Upload to Cloudinary
          console.log('Uploading to Cloudinary...');
          const result = await cloudinary.uploader.upload(
            `data:${imageFile.type};base64,${base64Image}`,
            {
              folder: 'jewelry-inventory',
            }
          );
          imageUrl = result.secure_url;
          console.log('Cloudinary upload successful:', imageUrl);
          
          // Update details with the image URL
          if (details) {
            details.imageUrl = imageUrl;
          }
        } catch (error) {
          console.error('Error uploading image to Cloudinary:', error);
          // Continue with the default image
        }
      } else if (requestType === 'edit' && productId) {
        // For edit requests, get the current product image if no new image provided
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { imageUrl: true }
        });
        
        if (product?.imageUrl) {
          imageUrl = product.imageUrl;
          if (details) {
            details.imageUrl = imageUrl;
          }
        }
      }
    } else {
      // Handle JSON request
      const body = await req.json();
      requestType = body.requestType;
      productId = body.productId;
      details = body.details;
      
      // If we have imageUrl in details, use it
      if (details?.imageUrl) {
        imageUrl = details.imageUrl;
      } else if (requestType === 'edit' && productId) {
        // For edit requests, get the current product image
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { imageUrl: true }
        });
        
        if (product?.imageUrl) {
          imageUrl = product.imageUrl;
          if (details) {
            details.imageUrl = imageUrl;
          }
        }
      }
    }

    if (!requestType || !['add', 'edit', 'delete'].includes(requestType)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    // For edit and delete requests, product ID is required
    if ((requestType === 'edit' || requestType === 'delete') && !productId) {
      return NextResponse.json(
        { error: 'Product ID is required for edit and delete requests' },
        { status: 400 }
      );
    }

    // For add requests, details are required
    if (requestType === 'add' && !details) {
      return NextResponse.json(
        { error: 'Product details are required for add requests' },
        { status: 400 }
      );
    }

    // For edit requests, both product ID and details are required
    if (requestType === 'edit' && (!productId || !details)) {
      return NextResponse.json(
        { error: 'Product ID and details are required for edit requests' },
        { status: 400 }
      );
    }

    // Check if the product exists for edit and delete requests
    if ((requestType === 'edit' || requestType === 'delete') && productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
    }

    // Create product request based on type
    let productRequest;
    
    if (requestType === 'add' || requestType === 'edit') {
      // For add and edit requests, we need to create details
      productRequest = await prisma.productRequest.create({
        data: {
          requestId: generateRequestId(),
          requestType,
          status: 'Pending',
          requestDate: new Date(),
          userId,
          productId: productId || null,
          details: {
            create: {
              name: details.name,
              sku: details.sku,
              description: details.description || '',
              price: details.price,
              stock: details.stock,
              category: details.category,
              material: details.material,
              supplier: details.supplier || null, // Include supplier field
              imageUrl: details.imageUrl || imageUrl, // Use the image URL from earlier
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          product: true,
          details: true
        }
      });
    } else {
      // For delete requests, we don't need details
      productRequest = await prisma.productRequest.create({
        data: {
          requestId: generateRequestId(),
          requestType,
          status: 'Pending',
          requestDate: new Date(),
          userId,
          productId: productId
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          product: true,
          details: true
        }
      });
    }

    // Find admin users and create notifications for them
    const adminUserIds = await findAdminUsers();
    
    if (adminUserIds.length > 0) {
      let notificationMessage = '';
      const requestTypeName = requestType.charAt(0).toUpperCase() + requestType.slice(1);
      const productName = details?.name || productRequest.product?.name || 'Unknown product';
      
      switch (requestType) {
        case 'add':
          notificationMessage = `New product add request (${productRequest.requestId}) created by ${user.firstName} ${user.lastName} for product "${productName}".`;
          break;
        case 'edit':
          notificationMessage = `New product edit request (${productRequest.requestId}) created by ${user.firstName} ${user.lastName} for product "${productName}".`;
          break;
        case 'delete':
          notificationMessage = `New product delete request (${productRequest.requestId}) created by ${user.firstName} ${user.lastName} for product "${productName}".`;
          break;
      }

      // Create notifications for all admin users
      await prisma.notification.createMany({
        data: adminUserIds.map(adminId => ({
          title: `New Product ${requestTypeName} Request`,
          message: notificationMessage,
          type: 'product_request',
          userId: adminId,
        }))
      });
    }

    return NextResponse.json(productRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating product request:', error);
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

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    const isAdmin = clerkUser.publicMetadata?.role === 'admin';

    // For admin users, return all product requests
    // For regular users, only return their own requests
    const productRequests = await prisma.productRequest.findMany({
      where: isAdmin ? {} : { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        product: true,
        details: true
      },
      orderBy: {
        requestDate: 'desc'
      }
    });

    return NextResponse.json(productRequests);
  } catch (error) {
    console.error('Error fetching product requests:', error);
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

    // Get all product requests with their details to clean up Cloudinary images
    const productRequests = await prisma.productRequest.findMany({
      where: {
        details: {
          isNot: null
        }
      },
      include: {
        details: true
      }
    });

    // Delete all non-default images from Cloudinary
    for (const request of productRequests) {
      if (
        request.details?.imageUrl &&
        request.details.imageUrl.includes('cloudinary.com') &&
        !request.details.imageUrl.includes('placeholderproduct-500x500-1.png')
      ) {
        try {
          // Extract public ID from the URL
          const publicId = request.details.imageUrl.split('/').slice(-2).join('/').split('.')[0];
          if (publicId) {
            console.log(`Deleting image from Cloudinary: ${publicId}`);
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (error) {
          console.error(`Error deleting image from Cloudinary:`, error);
          // Continue with deletion even if image cleanup fails
        }
      }
    }

    // Delete all product requests (this will cascade delete the details)
    await prisma.productRequest.deleteMany({});

    // Return success response
    return NextResponse.json({ message: 'All product requests deleted successfully' });
  } catch (error) {
    console.error('Error deleting product requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}