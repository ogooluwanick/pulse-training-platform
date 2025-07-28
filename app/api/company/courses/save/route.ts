import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import Course from '@/lib/models/Course';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// Save a course
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { courseId } = await req.json();

    console.log('Received courseId:', courseId, 'Type:', typeof courseId); // Debug log

    if (!courseId) {
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Clean the courseId (remove any whitespace)
    const cleanCourseId = courseId.toString().trim();
    console.log('Cleaned courseId:', cleanCourseId);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(cleanCourseId)) {
      console.log('Invalid ObjectId format:', cleanCourseId);
      return NextResponse.json(
        { message: 'Invalid course ID format', received: cleanCourseId },
        { status: 400 }
      );
    }

    // Check if course exists - use the same method that works for the debug query
    let course;
    try {
      // Use find instead of findById since that's working in the debug section
      const foundCourses = await Course.find({ _id: cleanCourseId });
      course = foundCourses.length > 0 ? foundCourses[0] : null;
      console.log('Course found with find method:', course ? 'Yes' : 'No');

      if (!course) {
        // Try alternative methods as backup
        course = await Course.findById(cleanCourseId);
        console.log('Course found with findById:', course ? 'Yes' : 'No');
      }

      if (!course) {
        // Try with explicit ObjectId conversion
        const objectId = new mongoose.Types.ObjectId(cleanCourseId);
        const foundWithObjectId = await Course.find({ _id: objectId });
        course = foundWithObjectId.length > 0 ? foundWithObjectId[0] : null;
        console.log('Course found with ObjectId find:', course ? 'Yes' : 'No');
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    if (!course) {
      // Let's debug what courses actually exist
      const allCourses = await Course.find({}, '_id title').limit(10);
      console.log(
        'Available courses:',
        allCourses.map((c) => ({ id: c._id.toString(), title: c.title }))
      );

      return NextResponse.json(
        {
          message: 'Course not found',
          requestedId: cleanCourseId,
          availableCourses: allCourses.map((c) => ({
            id: c._id.toString(),
            title: c.title,
          })),
        },
        { status: 404 }
      );
    }

    console.log('Found course:', {
      id: course._id.toString(),
      title: course.title,
    });

    // Find the company
    const company = await Company.findById(session.user.companyId);
    if (!company) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    // Check if already saved - ensure we're comparing properly
    const courseObjectId = new mongoose.Types.ObjectId(cleanCourseId);
    const isAlreadySaved = company.savedCourses.some(
      (savedId: mongoose.Types.ObjectId) =>
        savedId.toString() === courseObjectId.toString()
    );

    console.log('Already saved?', isAlreadySaved);
    console.log(
      'Existing saved courses:',
      company.savedCourses.map((id) => id.toString())
    );

    if (isAlreadySaved) {
      return NextResponse.json(
        { message: 'Course already saved', saved: true },
        { status: 200 }
      );
    }

    // Add course to saved courses
    company.savedCourses.push(courseObjectId);
    await company.save();

    console.log('Course saved successfully');

    return NextResponse.json(
      {
        message: 'Course saved successfully',
        saved: true,
        courseTitle: course.title,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving course:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Unsave a course
export async function DELETE(req: NextRequest) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 }
      );
    }

    const cleanCourseId = courseId.toString().trim();

    if (!mongoose.Types.ObjectId.isValid(cleanCourseId)) {
      return NextResponse.json(
        { message: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    // Find the company
    const company = await Company.findById(session.user.companyId);
    if (!company) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    // Remove course from saved courses
    const courseObjectId = new mongoose.Types.ObjectId(cleanCourseId);
    company.savedCourses = company.savedCourses.filter(
      (id: mongoose.Types.ObjectId) =>
        id.toString() !== courseObjectId.toString()
    );
    await company.save();

    return NextResponse.json(
      { message: 'Course unsaved successfully', saved: false },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unsaving course:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get saved courses status for multiple courses
export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find the company with saved courses
    const company = await Company.findById(session.user.companyId);
    if (!company) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      savedCourses: company.savedCourses || [],
    });
  } catch (error) {
    console.error('Error fetching saved courses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
