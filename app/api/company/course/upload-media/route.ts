import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { uploadToCloudinary } from '@/lib/cloudinary_utils';
import User from '@/lib/models/User'; // Import User model to register it
import { authOptions } from '../../../auth/[...nextauth]/route';
import {
  requireCompanyContext,
  resolveCompanyIdFromRequest,
} from '@/lib/user-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow COMPANY role to upload media for culture modules
    if (session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Only companies can upload culture module media' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const lessonType = formData.get('lessonType') as string; // 'video' or 'image'
    const moduleId = formData.get('moduleId') as string;
    const lessonId = formData.get('lessonId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!lessonType || !['video', 'image'].includes(lessonType)) {
      return NextResponse.json(
        { error: 'Invalid lesson type. Must be "video" or "image"' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
    ];

    if (lessonType === 'image' && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid image file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    if (lessonType === 'video' && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid video file type. Allowed: MP4, WebM, OGG, AVI, MOV' },
        { status: 400 }
      );
    }

    console.log('Uploading media file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lessonType,
      moduleId,
      lessonId,
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${moduleId}_${lessonId}_${timestamp}_${sanitizedFileName}`;

    // Determine folder and resource type
    const resolvedId = resolveCompanyIdFromRequest(request, session);
    const companyId = resolvedId || (await requireCompanyContext(session));
    const folder = `culture-modules/${companyId}/${lessonType}s`;
    const resourceType = lessonType === 'video' ? 'video' : 'image';

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      buffer,
      folder,
      fileName,
      resourceType
    );

    if (!uploadResult) {
      return NextResponse.json(
        { error: 'Failed to upload file to cloud storage' },
        { status: 500 }
      );
    }

    console.log('Media upload successful:', uploadResult);

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileInfo: {
        originalName: file.name,
        size: file.size,
        type: file.type,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        resourceType: uploadResult.resource_type,
        bytes: uploadResult.bytes,
      },
      message: `${lessonType.charAt(0).toUpperCase() + lessonType.slice(1)} uploaded successfully`,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload media',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
