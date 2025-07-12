// lib/cloudinary_utils.ts

import cloudinary from './cloudinary';
import { UploadApiResponse } from 'cloudinary';

// Uploads a file buffer to a specified folder in Cloudinary
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  fileName: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<UploadApiResponse | null> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result || null);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

// Deletes a file from Cloudinary using its public ID
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}
