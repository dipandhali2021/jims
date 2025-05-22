import { NextRequest, NextResponse } from 'next/server';
import { clerkClient, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { uploadImageToStorage, getImageUrl } from '../../utils';

// Function to generate request ID
async function generateRequestId(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get the count of requests for this year to generate the sequence number
  const requestCount = await prisma.productRequest.count({
    where: {
      requestId: {
        startsWith: `PR-${year}`
      }
    }
  });

  // Format the sequence number with leading zeros (XXXX)
  const sequence = (requestCount + 1).toString().padStart(4, '0');
  
  return `PR-${year}-${sequence}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user is admin or has permissions
    const userInfo = await clerkClient.users.getUser(user.id);
    const userRole = userInfo.publicMetadata.role as string || 'user';
    
    // if (userRole !== 'admin') {
    //   // If not admin, check if they're subscribed
    //   const isSubscribed = userInfo.publicMetadata.isSubscribed as boolean || false;
    //   if (!isSubscribed) {
    //     return NextResponse.json(
    //       { error: 'Subscription required to add products' },
    //       { status: 403 }
    //     );
    //   }
    // }

    // Check if request is multipart/form-data or application/json
    let longSetProductData;
    let imageUrl = '';

    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      // Handle multipart form data (with image upload)
      const formData = await request.formData();
      
      // Extract product data
      const name = formData.get('name') as string;
      const sku = formData.get('sku') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const material = formData.get('material') as string;
      const price = parseFloat(formData.get('price') as string);
      const costPrice = formData.get('costPrice') ? parseFloat(formData.get('costPrice') as string) : null;
      const stock = parseInt(formData.get('stock') as string);
      
      // Parse parts data from JSON string
      const parts = JSON.parse(formData.get('parts') as string);
      
      // Process image
      const image = formData.get('image') as File;
      if (image) {
        // Upload the image and get URL
        const uploadResult = await uploadImageToStorage(image);
        imageUrl = await getImageUrl(uploadResult.path);
      }

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
      const body = await request.json();
      longSetProductData = body;
      imageUrl = body.imageUrl || '';
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
        { error: 'A product with this SKU already exists' },
        { status: 400 }
      );
    }

    // For admin actions, create a product request instead of direct creation
    if (userRole === 'admin') {
      // Generate a unique request ID
      const requestId = await generateRequestId();

      const productRequest = await prisma.productRequest.create({
        data: {
          requestId,
          requestType: 'add',
          status: 'Pending',
          adminAction: true,
          isLongSet: true,
          userId: user.id,
          details: {
            create: {
              name: longSetProductData.name,
              sku: longSetProductData.sku,
              description: longSetProductData.description || '',
              category: longSetProductData.category,
              material: longSetProductData.material,
              price: longSetProductData.price,
              costPrice: longSetProductData.costPrice,
              stock: longSetProductData.stock,
              imageUrl: imageUrl,
              longSetParts: JSON.stringify(longSetProductData.parts)
            }
          }
        },
        include: {
          details: true
        }
      });

      return NextResponse.json(productRequest, { status: 201 });
    }

    // For non-admin users, create a product request that needs approval
    // Generate a unique request ID
    const requestId = await generateRequestId();

    const productRequest = await prisma.productRequest.create({
      data: {
        requestId,
        requestType: 'add',
        status: 'Pending',
        adminAction: false,
        isLongSet: true,
        userId: user.id,
        details: {
          create: {
            name: longSetProductData.name,
            sku: longSetProductData.sku,
            description: longSetProductData.description || '',
            category: longSetProductData.category,
            material: longSetProductData.material,
            price: longSetProductData.price,
            costPrice: longSetProductData.costPrice,
            stock: longSetProductData.stock,
            imageUrl: imageUrl,
            longSetParts: JSON.stringify(longSetProductData.parts)
          }
        }
      },
      include: {
        details: true
      }
    });

    return NextResponse.json(productRequest, { status: 201 });
  } catch (error: any) {
    console.error('Error creating long set product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
