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
  const startTime = Date.now();
  console.log('=== POST /api/company/courses/save - Request Started ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  try {
    console.log('Step 1: Connecting to database...');
    await dbConnect();
    console.log('✅ Database connection successful');

    console.log('Step 2: Getting server session...');
    const session = await getServerSession(authOptions);
    console.log('Session details:', {
      exists: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            companyId: session.user.companyId,
          }
        : null,
    });

    if (!session || !session.user || session.user.role !== 'COMPANY') {
      console.log('❌ Authorization failed:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userRole: session?.user?.role,
        expected: 'COMPANY',
      });
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.log('✅ Authorization successful');

    console.log('Step 3: Parsing request body...');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', requestBody);
    } catch (parseError) {
      console.log('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        {
          message: 'Invalid JSON in request body',
          error:
            parseError instanceof Error
              ? parseError.message
              : 'Unknown parsing error',
        },
        { status: 400 }
      );
    }

    const { courseId } = requestBody;
    console.log('Extracted courseId:', courseId, 'Type:', typeof courseId);

    if (!courseId) {
      console.log('❌ Course ID missing from request');
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Clean the courseId (remove any whitespace)
    const cleanCourseId = courseId.toString().trim();
    console.log('Step 4: Cleaned courseId:', cleanCourseId);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(cleanCourseId)) {
      console.log('❌ Invalid ObjectId format:', cleanCourseId);
      return NextResponse.json(
        { message: 'Invalid course ID format', received: cleanCourseId },
        { status: 400 }
      );
    }
    console.log('✅ ObjectId format validation passed');

    console.log('Step 5: Looking up course in database...');

    // Try multiple approaches to find the course
    console.log(
      'Attempting Course.findById with cleanCourseId:',
      cleanCourseId
    );
    let course = await Course.findById(cleanCourseId);
    console.log(
      'Course.findById result:',
      course
        ? {
            id: course._id.toString(),
            title: course.title,
            exists: true,
          }
        : { exists: false }
    );

    // If findById fails, try alternative lookup methods
    if (!course) {
      console.log('findById failed, trying Course.findOne with _id filter...');
      course = await Course.findOne({ _id: cleanCourseId });
      console.log(
        'Course.findOne result:',
        course
          ? {
              id: course._id.toString(),
              title: course.title,
              exists: true,
            }
          : { exists: false }
      );
    }

    // If still not found, try with string comparison
    if (!course) {
      console.log(
        'findOne also failed, trying Course.findOne with string comparison...'
      );
      course = await Course.findOne({ _id: { $eq: cleanCourseId } });
      console.log(
        'Course.findOne (string comparison) result:',
        course
          ? {
              id: course._id.toString(),
              title: course.title,
              exists: true,
            }
          : { exists: false }
      );
    }

    // Try as a raw MongoDB query to see if it's a collection issue
    if (!course) {
      console.log('Trying raw collection query...');
      try {
        const db = mongoose.connection.db;
        if (db) {
          const collection = db.collection('courses');
          const rawCourse = await collection.findOne({ _id: cleanCourseId });
          console.log(
            'Raw MongoDB collection query result:',
            rawCourse
              ? {
                  id: rawCourse._id.toString(),
                  title: rawCourse.title,
                  exists: true,
                }
              : { exists: false }
          );

          if (rawCourse) {
            // Convert the raw document to a mongoose document
            course = new Course(rawCourse);
            console.log('✅ Found course using raw collection query!');
          }
        } else {
          console.log('Database connection not available for raw query.');
        }
      } catch (rawError) {
        console.log('Raw collection query error:', rawError);
      }
    }

    // If still not found, debug the actual data types in the database
    if (!course) {
      console.log(
        '❌ All lookup methods failed, debugging database content...'
      );
      
      // Let's check what type the _id fields actually are in the database
      const sampleCourses = await Course.find({}, '_id title').limit(5);
      console.log(
        'Sample courses with _id types:',
        sampleCourses.map((c) => ({
          id: c._id.toString(),
          title: c.title,
          idType: typeof c._id,
          isObjectId: c._id instanceof mongoose.Types.ObjectId,
          originalId: c._id,
        }))
      );

      // Try one more approach - find by regex if the ID got corrupted
      const regexCourse = await Course.findOne({
        $expr: { $eq: [{ $toString: '$_id' }, cleanCourseId] }
      });
      console.log('Regex/string conversion lookup:', regexCourse ? {
        id: regexCourse._id.toString(),
        title: regexCourse.title,
        exists: true
      } : { exists: false });

      if (regexCourse) {
        course = regexCourse;
        console.log('✅ Found course using string conversion query!');
      }
    }

    // Final failure case
    if (!course) {
      return NextResponse.json(
        {
          message: 'Course not found after all lookup attempts',
          requestedId: cleanCourseId,
          requestedIdType: typeof cleanCourseId,
          isValidObjectId: mongoose.Types.ObjectId.isValid(cleanCourseId),
          debugInfo: {
            attemptedMethods: [
              'Course.findById()',
              'Course.findOne({ _id })',
              'Course.findOne({ _id: { $eq } })',
              'Raw MongoDB collection query',
              'String conversion query'
            ]
          }
        },
        { status: 404 }
      );
    }
    console.log('✅ Course found successfully');

    console.log('Step 6: Looking up company...');
    // Find the company
    const company = await Company.findById(session.user.companyId);
    console.log(
      'Company lookup result:',
      company
        ? {
            id: company._id.toString(),
            name: company.name,
            savedCoursesCount: company.savedCourses?.length || 0,
            exists: true,
          }
        : { exists: false }
    );

    if (!company) {
      console.log('❌ Company not found for ID:', session.user.companyId);
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }
    console.log('✅ Company found successfully');

    console.log('Step 7: Checking if course is already saved...');
    // Check if already saved - ensure we're comparing properly
    const courseObjectId = new mongoose.Types.ObjectId(cleanCourseId);
    const savedCoursesAsStrings = (company.savedCourses || []).map(
      (id: mongoose.Types.ObjectId) => id.toString()
    );
    const isAlreadySaved = savedCoursesAsStrings.includes(
      courseObjectId.toString()
    );

    console.log('Save status check:', {
      courseObjectId: courseObjectId.toString(),
      isAlreadySaved,
      savedCoursesCount: savedCoursesAsStrings.length,
      existingSavedCourses: savedCoursesAsStrings,
    });

    if (isAlreadySaved) {
      console.log('ℹ️ Course already saved, returning success response');
      return NextResponse.json(
        { message: 'Course already saved', saved: true },
        { status: 200 }
      );
    }

    console.log('Step 8: Adding course to saved courses...');
    // Add course to saved courses
    const originalSavedCount = company.savedCourses.length;
    company.savedCourses.push(courseObjectId);
    console.log(
      'Before save - savedCourses count:',
      originalSavedCount,
      'After adding:',
      company.savedCourses.length
    );

    console.log('Step 9: Saving company document...');
    const saveResult = await company.save();
    console.log('✅ Company save result:', {
      success: !!saveResult,
      newSavedCoursesCount: saveResult.savedCourses.length,
      modifiedPaths: saveResult.modifiedPaths(),
    });

    const endTime = Date.now();
    console.log('✅ Course saved successfully!');
    console.log(
      `=== POST /api/company/courses/save - Request Completed in ${endTime - startTime}ms ===`
    );

    return NextResponse.json(
      {
        message: 'Course saved successfully',
        saved: true,
        courseTitle: course.title,
      },
      { status: 200 }
    );
  } catch (error) {
    const endTime = Date.now();
    console.error('❌ ERROR in POST /api/company/courses/save:', {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      requestDuration: `${endTime - startTime}ms`,
    });

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Unsave a course
export async function DELETE(req: NextRequest) {
  const startTime = Date.now();
  console.log('=== DELETE /api/company/courses/save - Request Started ===');
  console.log('Request URL:', req.url);

  try {
    console.log('Step 1: Connecting to database...');
    await dbConnect();
    console.log('✅ Database connection successful');

    console.log('Step 2: Getting server session...');
    const session = await getServerSession(authOptions);
    console.log('Session details:', {
      exists: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            companyId: session.user.companyId,
          }
        : null,
    });

    if (!session || !session.user || session.user.role !== 'COMPANY') {
      console.log('❌ Authorization failed for DELETE request');
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.log('✅ Authorization successful');

    console.log('Step 3: Extracting courseId from query params...');
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    console.log('Extracted courseId from params:', courseId);

    if (!courseId) {
      console.log('❌ Course ID missing from query params');
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 }
      );
    }

    const cleanCourseId = courseId.toString().trim();
    console.log('Cleaned courseId:', cleanCourseId);

    if (!mongoose.Types.ObjectId.isValid(cleanCourseId)) {
      console.log('❌ Invalid ObjectId format:', cleanCourseId);
      return NextResponse.json(
        { message: 'Invalid course ID format' },
        { status: 400 }
      );
    }
    console.log('✅ ObjectId format validation passed');

    console.log('Step 4: Looking up company...');
    // Find the company
    const company = await Company.findById(session.user.companyId);
    console.log(
      'Company lookup result:',
      company
        ? {
            id: company._id.toString(),
            name: company.name,
            savedCoursesCount: company.savedCourses?.length || 0,
            exists: true,
          }
        : { exists: false }
    );

    if (!company) {
      console.log('❌ Company not found for ID:', session.user.companyId);
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }
    console.log('✅ Company found successfully');

    console.log('Step 5: Removing course from saved courses...');
    // Remove course from saved courses
    const courseObjectId = new mongoose.Types.ObjectId(cleanCourseId);
    const originalCount = company.savedCourses.length;
    const originalSavedCourses = company.savedCourses.map(
      (id: mongoose.Types.ObjectId) => id.toString()
    );

    company.savedCourses = company.savedCourses.filter(
      (id: mongoose.Types.ObjectId) =>
        id.toString() !== courseObjectId.toString()
    );

    const newCount = company.savedCourses.length;
    const wasRemoved = originalCount > newCount;

    console.log('Removal details:', {
      originalCount,
      newCount,
      wasRemoved,
      targetCourseId: courseObjectId.toString(),
      originalSavedCourses,
    });

    console.log('Step 6: Saving company document...');
    const saveResult = await company.save();
    console.log('✅ Company save result:', {
      success: !!saveResult,
      finalSavedCoursesCount: saveResult.savedCourses.length,
    });

    const endTime = Date.now();
    console.log('✅ Course unsaved successfully!');
    console.log(
      `=== DELETE /api/company/courses/save - Request Completed in ${endTime - startTime}ms ===`
    );

    return NextResponse.json(
      { message: 'Course unsaved successfully', saved: false },
      { status: 200 }
    );
  } catch (error) {
    const endTime = Date.now();
    console.error('❌ ERROR in DELETE /api/company/courses/save:', {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      requestDuration: `${endTime - startTime}ms`,
    });

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get saved courses status for multiple courses
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log('=== GET /api/company/courses/save - Request Started ===');
  console.log('Request URL:', req.url);

  try {
    console.log('Step 1: Connecting to database...');
    await dbConnect();
    console.log('✅ Database connection successful');

    console.log('Step 2: Getting server session...');
    const session = await getServerSession(authOptions);
    console.log('Session details:', {
      exists: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            companyId: session.user.companyId,
          }
        : null,
    });

    if (!session || !session.user || session.user.role !== 'COMPANY') {
      console.log('❌ Authorization failed for GET request');
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.log('✅ Authorization successful');

    console.log('Step 3: Looking up company with saved courses...');
    // Find the company with saved courses
    const company = await Company.findById(session.user.companyId);
    console.log(
      'Company lookup result:',
      company
        ? {
            id: company._id.toString(),
            name: company.name,
            savedCoursesCount: company.savedCourses?.length || 0,
            savedCourses: (company.savedCourses || []).map(
              (id: mongoose.Types.ObjectId) => id.toString()
            ),
            exists: true,
          }
        : { exists: false }
    );

    if (!company) {
      console.log('❌ Company not found for ID:', session.user.companyId);
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }
    console.log('✅ Company found successfully');

    const endTime = Date.now();
    console.log('✅ Saved courses fetched successfully!');
    console.log(
      `=== GET /api/company/courses/save - Request Completed in ${endTime - startTime}ms ===`
    );

    return NextResponse.json({
      savedCourses: company.savedCourses || [],
    });
  } catch (error) {
    const endTime = Date.now();
    console.error('❌ ERROR in GET /api/company/courses/save:', {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      requestDuration: `${endTime - startTime}ms`,
    });

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
