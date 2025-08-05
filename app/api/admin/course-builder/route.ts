import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { Course, User } from '@/lib/models';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

// GET: Get all courses for admin course builder (including drafts)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build query for admin courses (universal courses, not company-specific)
    const query: any = {
      isCompanySpecific: false, // Only universal courses
    };

    if (status !== 'all') {
      query.status = status;
    }

    console.log('Admin course builder query:', JSON.stringify(query, null, 2));

    const courses = await Course.find(query).sort({ updatedAt: -1 });

    console.log('Admin courses fetched successfully, count:', courses.length);

    return NextResponse.json({
      success: true,
      modules: courses,
    });
  } catch (error) {
    console.error('Error fetching admin courses:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch admin courses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new universal course for admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, content, quiz, tags, status = 'draft' } = body;

    await dbConnect();

    console.log('Creating universal course for admin:', {
      id: session.user.id,
      role: session.user.role,
    });
    console.log('Request body:', body);

    // Provide sensible defaults for universal courses
    const courseTitle = title || 'Untitled Universal Course';
    const courseContent =
      content || 'Start writing your universal course content here...';

    // Create a new universal course
    const courseData = {
      title: courseTitle,
      description:
        description || 'A new universal course available to all companies.',
      category: body.category || 'General',
      isCompanySpecific: false, // Universal course
      instructor: session.user.id,
      createdBy: session.user.id,
      lastModifiedBy: session.user.id,
      status,
      tags: tags || [],
      lessons: [
        {
          title: courseTitle,
          type: 'text',
          content: courseContent,
          duration: 0,
          quiz:
            quiz && quiz.questions && quiz.questions.length > 0
              ? {
                  title: quiz.title || 'Course Quiz',
                  questions: quiz.questions || [],
                }
              : undefined,
        },
      ],
    };

    console.log(
      'Creating universal course with data:',
      JSON.stringify(courseData, null, 2)
    );

    const course = new Course(courseData);
    const savedCourse = await course.save();

    console.log('Universal course saved successfully:', savedCourse._id);

    // Removed populate calls to avoid User model dependency

    return NextResponse.json(
      {
        success: true,
        module: savedCourse,
        message: 'Universal course created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating universal course:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to create universal course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
