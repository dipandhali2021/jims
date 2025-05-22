import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generates a unique request ID with format PR-YYYY-XXXX where XXXX is a random number
 * @returns The generated request ID
 */
export function generateRequestId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `PR-${year}-${randomNum}`;
}

/**
 * Uploads an image to Cloudinary storage
 * @param image The image file to upload
 * @returns The upload result containing the URL and path
 */
export async function uploadImageToStorage(image: File): Promise<{ url: string; path: string }> {
  if (!image) {
    throw new Error('No image provided');
  }

  try {
    // Convert the file to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(
      `data:${image.type};base64,${base64Image}`,
      {
        folder: 'jewelry-inventory',
      }
    );
    
    console.log('Cloudinary upload successful:', result.secure_url);
    
    return {
      url: result.secure_url,
      path: `jewelry-inventory/${result.public_id.split('/').pop()}`
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to storage');
  }
}

/**
 * Gets the URL for an image from its path
 * @param path The path of the image
 * @returns The URL of the image
 */
export async function getImageUrl(path: string): Promise<string> {
  if (!path) {
    return 'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png';
  }
  
  // If it's already a URL, return it
  if (path.startsWith('http')) {
    return path;
  }
  
  // Get the URL from Cloudinary
  try {
    const result = await cloudinary.api.resource(path);
    return result.secure_url;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return 'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png';
  }
}

/**
 * Deletes an image from Cloudinary storage
 * @param imageUrl The URL of the image to delete
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
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
