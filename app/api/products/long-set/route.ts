import { NextRequest, NextResponse } from 'next/server';
import { clerkClient, currentUser } from '@clerk/nextjs/server';
import  prisma  from '@/lib/prisma';
import { uploadImageToStorage,getImageUrl } from '../../utils';
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
    
    if (userRole !== 'admin') {
      // If not admin, check if they're subscribed
      const isSubscribed = userInfo.publicMetadata.isSubscribed as boolean || false;
      if (!isSubscribed) {
        return NextResponse.json(
          { error: 'Subscription required to add products' },
          { status: 403 }
        );
      }
    }

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

    // Create the product first
    const product = await prisma.product.create({
      data: {
        name: longSetProductData.name,
        sku: longSetProductData.sku,
        description: longSetProductData.description || '',
        category: longSetProductData.category,
        material: longSetProductData.material,
        price: longSetProductData.price,
        costPrice: longSetProductData.costPrice,
        stock: longSetProductData.stock,
        imageUrl: imageUrl,
        userId: user.id
      }
    });

    // Create the long set product with reference to the main product
    const longSetProduct = await prisma.longSetProduct.create({
      data: {
        name: longSetProductData.name,
        sku: longSetProductData.sku,
        description: longSetProductData.description || '',
        category: longSetProductData.category,
        material: longSetProductData.material,
        price: longSetProductData.price,
        costPrice: longSetProductData.costPrice,
        stock: longSetProductData.stock,
        imageUrl: imageUrl,
        userId: user.id,
        productId: product.id,
        parts: {
          create: longSetProductData.parts.map((part: any) => ({
            partName: part.partName,
            partDescription: part.partDescription || '',
            costPrice: part.costPrice || null,
            karigarId: part.karigarId || null
          }))
        }
      },
      include: {
        parts: true
      }
    });

    return NextResponse.json(longSetProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error creating long set product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
