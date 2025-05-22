import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

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
      // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/jewelry-inventory/abcdef
      const urlParts = imageUrl.split('/');
      const folderIndex = urlParts.findIndex(part => part === 'jewelry-inventory');
      
      if (folderIndex !== -1 && folderIndex < urlParts.length - 1) {
        // Get the folder and filename parts (without file extension)
        const publicId = `jewelry-inventory/${urlParts[folderIndex + 1].split('.')[0]}`;
        
        console.log(`Deleting image from Cloudinary: ${publicId}`);
        await cloudinary.uploader.destroy(publicId);
        console.log(`Successfully deleted image: ${publicId}`);
      }
    }
  } catch (error) {
    console.error(`Error deleting image from Cloudinary:`, error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    console.log(`Fetching long set product with ID: ${id}`);    // Find the product with its long set details
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        LongSetProduct: {
          include: {
            parts: {
              include: {
                karigar: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      console.log(`Product with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching long set product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
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

    const id = params.id;
    console.log(`Updating long set product with ID: ${id}`);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        LongSetProduct: {
          include: {
            parts: true
          }
        }
      }
    });

    if (!existingProduct) {
      console.log(`Product with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!existingProduct.LongSetProduct) {
      console.log(`Product with ID ${id} is not a long set product`);
      return NextResponse.json(
        { error: 'Product is not a long set product' },
        { status: 400 }
      );
    }    let name: string;
    let sku: string;
    let description: string;
    let category: string;
    let material: string;
    let price: number;
    let costPrice: number | undefined;
    let stock: number;
    let image: File | null = null;
    let removeImage: boolean = false;
    let supplier: string | undefined;
    let parts: any[] = [];
    
    // Check if the request is formData or JSON
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle formData request
      const formData = await req.formData();
      name = formData.get('name') as string;
      sku = formData.get('sku') as string;
      description = formData.get('description') as string;
      category = formData.get('category') as string;
      material = formData.get('material') as string;
      price = parseFloat(formData.get('price') as string);
      costPrice = formData.get('costPrice') ? parseFloat(formData.get('costPrice') as string) : undefined;
      stock = parseInt(formData.get('stock') as string);
      image = formData.get('image') as File || null;
      removeImage = formData.get('removeImage') === 'true';
      supplier = formData.get('supplier') as string || undefined;
      parts = JSON.parse(formData.get('parts') as string || '[]');
    } else {
      // Handle JSON request
      const body = await req.json();
      name = body.name;
      sku = body.sku;
      description = body.description || '';
      category = body.category;
      material = body.material;
      price = parseFloat(body.price);
      costPrice = body.costPrice ? parseFloat(body.costPrice) : undefined;
      stock = parseInt(body.stock);
      removeImage = body.removeImage === true;
      supplier = body.supplier;
      parts = body.parts || [];
    }

    // Validate required fields
    if (!name || !sku || !category || !material || isNaN(price) || isNaN(stock)) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if SKU changed and if new SKU already exists
    if (sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({
        where: {
          sku,
          id: { not: id }
        },
      });

      if (skuExists) {
        console.error('Product ID already exists:', sku);
        return NextResponse.json(
          { error: 'Product ID already exists' },
          { status: 409 }
        );
      }
    }    // Handle image upload/removal
    let imageUrl = existingProduct.imageUrl || '';

    if (removeImage) {
      await deleteImageFromCloudinary(existingProduct.imageUrl);
      imageUrl = '';
    } else if (image instanceof File) {
      // Upload new image
      const buffer = Buffer.from(await (image as File).arrayBuffer());
      const timestamp = Math.floor(Date.now() / 1000);
      
      try {
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'jewelry-inventory',
              public_id: `product_${id}_${timestamp}`,
              overwrite: true,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        // Delete the old image if there was one
        if (existingProduct.imageUrl) {
          await deleteImageFromCloudinary(existingProduct.imageUrl);
        }
        
        imageUrl = result.secure_url;
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 }
        );
      }
    }

    // Update the main product record
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        description,
        category,
        material,
        price,
        costPrice,
        stock,
        imageUrl,
        supplier
      },
    });

    // Update the long set product record
    // Ensure longSetProduct exists and store its ID
    if (!existingProduct.LongSetProduct) {
      throw new Error('LongSetProduct not found');
    }
    const longSetProductId = existingProduct.LongSetProduct.id;

    const updatedLongSetProduct = await prisma.longSetProduct.update({
      where: { id: longSetProductId },
      data: {
        name,
        sku,
        description,
        category,
        material,
        price,
        costPrice,
        stock,
        imageUrl,
      },
    });

    // Handle parts updates
    // First, delete all existing parts
    await prisma.longSetProductPart.deleteMany({
      where: { longSetProductId }
    });

    // Then create new parts from the submitted data
    const updatedParts = await Promise.all(
      parts.map(async (part: any) => {
        return prisma.longSetProductPart.create({
          data: {
            longSetProductId,
            partName: part.partName,
            partDescription: part.partDescription || '',
            costPrice: part.costPrice || null,
            karigarId: part.karigarId || null
          }
        });
      })
    );

    return NextResponse.json({
      ...updatedProduct,
      LongSetProduct: {
        ...updatedLongSetProduct,
        parts: updatedParts
      }
    });
  } catch (error: any) {
    console.error('Error updating long set product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    console.log(`Deleting long set product with ID: ${id}`);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        LongSetProduct: {
          include: {
            parts: true
          }
        }
      }
    });

    if (!existingProduct) {
      console.log(`Product with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!existingProduct.LongSetProduct) {
      console.log(`Product with ID ${id} is not a long set product`);
      return NextResponse.json(
        { error: 'Product is not a long set product' },
        { status: 400 }
      );
    }

    // Delete image from storage if it exists
    if (existingProduct.imageUrl) {
      await deleteImageFromCloudinary(existingProduct.imageUrl);
    }

    // Ensure longSetProduct exists and store its ID
    if (!existingProduct.LongSetProduct) {
      throw new Error('LongSetProduct not found');
    }
    const longSetProductId = existingProduct.LongSetProduct.id;

    // Delete all parts first
    await prisma.longSetProductPart.deleteMany({
      where: { longSetProductId }
    });

    // Delete the long set product
    await prisma.longSetProduct.delete({
      where: { id: longSetProductId }
    });

    // Delete the main product
    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting long set product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
