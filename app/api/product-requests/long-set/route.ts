import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { generateRequestId } from '../../utils';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to find admin users
async function findAdminUsers() {
  try {
    const usersResponse = await clerkClient.users.getUserList({
      limit: 100
    });
    const users = usersResponse.data || [];
    
    return users
      .filter(user => user.publicMetadata?.role === 'admin')
      .map(user => user.id);
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

    // Check if user is admin
    const isAdmin = clerkUser.publicMetadata?.role === 'admin';
    
    // Parse request data - handle both FormData and JSON
    let longSetProductData;
    let imageUrl = '';
    let adminAction = false;
    let parts = [];

    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      // Handle FormData request
      const formData = await req.formData();
      
      // Extract basic product data
      const name = formData.get('name') as string;
      const sku = formData.get('sku') as string;
      const description = formData.get('description') as string || '';
      const category = formData.get('category') as string;
      const material = formData.get('material') as string;
      const price = parseFloat(formData.get('price') as string);
      const costPrice = formData.get('costPrice') ? parseFloat(formData.get('costPrice') as string) : null;
      const stock = parseInt(formData.get('stock') as string);
      adminAction = formData.get('adminAction') === 'true';
      
      // Parse parts from JSON string
      parts = JSON.parse(formData.get('parts') as string || '[]');
      
      // Handle image upload
      const image = formData.get('image') as File;
      if (image && image instanceof Blob) {
        try {
          const bytes = await image.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64Image = buffer.toString('base64');
          
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(
            `data:${image.type};base64,${base64Image}`,
            {
              folder: 'jewelry-inventory',
            }
          );
          imageUrl = result.secure_url;
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
          // Use default image if upload fails
          imageUrl = 'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png';
        }
      } else {
        // Use default image if no image provided
        imageUrl = 'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png';
      }
      
      // Combine all data
      longSetProductData = {
        name,
        sku,
        description,
        category,
        material,
        price,
        costPrice,
        stock,
        imageUrl,
        parts
      };
    } else {
      // Handle JSON request
      const body = await req.json();
      longSetProductData = body;
      adminAction = body.adminAction || false;
      parts = body.parts || [];
      imageUrl = body.imageUrl || 'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png';
    }

    // Validate required fields
    if (!longSetProductData.name || !longSetProductData.sku || !longSetProductData.price) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    // Check if product with same SKU already exists
    const existingProduct = await prisma.product.findFirst({
      where: { sku: longSetProductData.sku }
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this Product ID already exists' },
        { status: 400 }
      );
    }

    // Create a product request for the long set product
    const productRequest = await prisma.productRequest.create({
      data: {
        requestId: generateRequestId(),
        requestType: 'add',
        status: 'Pending', // All requests must go through approval
        adminAction,
        userId,
        isLongSet: true, // Flag it as a long set product request
        details: {
          create: {
            name: longSetProductData.name,
            sku: longSetProductData.sku,
            description: longSetProductData.description || '',
            price: longSetProductData.price,
            costPrice: longSetProductData.costPrice,
            stock: longSetProductData.stock,
            category: longSetProductData.category,
            material: longSetProductData.material,
            imageUrl: imageUrl,
            // Store parts as JSON in requestDetails
            longSetParts: JSON.stringify(parts)
          }
        },
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
        details: true
      }
    });

    // Create notifications for admins
    const adminUserIds = await findAdminUsers();
    
    if (adminUserIds.length > 0) {
      let notificationMessage = '';
      const productName = longSetProductData.name;
      
      // Different message based on who created the request
      if (adminAction) {
        notificationMessage = `Admin ${clerkUser.firstName} ${clerkUser.lastName} has requested to add long set product "${productName}" (${productRequest.requestId}). This requires approval.`;
      } else {
        notificationMessage = `New long set product request (${productRequest.requestId}) created by ${clerkUser.firstName} ${clerkUser.lastName} for product "${productName}".`;
      }

      // Create notifications for all admin users
      await prisma.notification.createMany({
        data: adminUserIds.map(adminId => ({
          title: 'New Long Set Product Request',
          message: notificationMessage,
          type: 'request',
          userId: adminId
        }))
      });
    }

    return NextResponse.json(productRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating long set product request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
