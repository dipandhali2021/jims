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
    console.log(`Updating product with ID: ${id}`);

    // Check if product exists and belongs to the user
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      console.log(`Product with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const material = formData.get('material') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string);
    const image = formData.get('image');
    const removeImage = formData.get('removeImage') === 'true';
    const supplier = formData.get('supplier') as string || undefined;

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
    }

    // Set default imageUrl from existing product
    let imageUrl = existingProduct.imageUrl;

    // Check if we should remove the image
    if (removeImage) {
      console.log('Removing image for product');
      
      // If the existing image is from Cloudinary, delete it
      if (existingProduct.imageUrl && 
          existingProduct.imageUrl.includes('cloudinary.com') && 
          !existingProduct.imageUrl.includes('placeholderproduct-500x500-1.png')) {
        await deleteImageFromCloudinary(existingProduct.imageUrl);
      }
      
      // Set to default placeholder URL
      imageUrl = 'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png';
    }
    // Process new image if provided
    else if (image && image instanceof Blob) {
      console.log('New image received:', image.type, image.size);

      // If replacing an existing Cloudinary image, delete the old one
      if (existingProduct.imageUrl && 
          existingProduct.imageUrl.includes('cloudinary.com') && 
          !existingProduct.imageUrl.includes('placeholderproduct-500x500-1.png')) {
        await deleteImageFromCloudinary(existingProduct.imageUrl);
      }
      
      // Convert the file to base64
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');
      
      console.log('Image converted to base64');

      // Upload to Cloudinary
      console.log('Uploading to Cloudinary...');
      const result = await cloudinary.uploader.upload(
        `data:${image.type};base64,${base64Image}`,
        {
          folder: 'jewelry-inventory',
        }
      );
      console.log('Cloudinary upload successful:', result.secure_url);
      
      imageUrl = result.secure_url;
    }

    // Update product in database
    console.log('Updating product in database...');
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        description: description || '',
        category,
        material,
        price,
        stock,
        imageUrl,
        supplier, // Include supplier field in the update
      },
    });

    console.log('Product updated successfully:', updatedProduct.id);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Error updating product' },
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
    console.log(`Deleting product with ID: ${id}`);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      console.log(`Product with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Find any sales items associated with this product
    const salesItems = await prisma.salesItem.findMany({
      where: { productId: id },
    });

    // If there are associated sales items, update them to preserve historical data
    if (salesItems.length > 0) {
      console.log(`Found ${salesItems.length} sales items associated with product ${id}. Preserving data before deletion.`);
      
      await prisma.$transaction(
        salesItems.map((item) => 
          prisma.salesItem.update({
            where: { id: item.id },
            data: {
              // Store product details for historical reference
              productName: existingProduct.name,
              productSku: existingProduct.sku,
              // Set productId to null - this allows the product to be deleted
              productId: null
            }
          })
        )
      );
      console.log(`Updated ${salesItems.length} sales items to preserve product data`);
    }

    // Delete the product image from Cloudinary if it's not the default
    if (existingProduct.imageUrl && 
        existingProduct.imageUrl.includes('cloudinary.com') && 
        !existingProduct.imageUrl.includes('placeholderproduct-500x500-1.png')) {
      await deleteImageFromCloudinary(existingProduct.imageUrl);
    }

    // Delete product from database
    await prisma.product.delete({
      where: { id },
    });
    
    console.log(`Product ${id} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting product:`, error);
    return NextResponse.json(
      { error: 'Error deleting product' },
      { status: 500 }
    );
  }
}