import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import User from '@/lib/models/User'; // Import User model to register it
import { authOptions } from '../../auth/[...nextauth]/route';

// GET: Get all culture modules for a company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching culture modules for user:', {
      id: session.user.id,
      role: session.user.role,
      companyId: session.user.companyId,
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    await dbConnect();
    console.log('Database connected successfully');

    // Get the correct company ID
    const companyId = session.user.companyId || session.user.id;
    console.log('Using company ID:', companyId);

    // Build query for company's courses
    const query: any = {
      isCompanySpecific: true,
      companyId: companyId,
    };

    if (status !== 'all') {
      query.status = status;
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    // First try without population to see if basic query works
    const courseModulesCount = await Course.countDocuments(query);
    console.log('Found', courseModulesCount, 'course modules');

    const courseModules = await Course.find(query)
      .sort({ updatedAt: -1 })
      .lean(); // Use lean() for better performance and avoid population issues

    console.log(
      'Course modules fetched successfully, count:',
      courseModules.length
    );

    return NextResponse.json({
      success: true,
      modules: courseModules,
    });
  } catch (error) {
    console.error('Error fetching course modules:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch course modules',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new culture module
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow COMPANY role to create culture modules
    if (session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Only companies can create culture modules' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, content, quiz, tags, status = 'draft' } = body;

    await dbConnect();

    // Get the correct company ID
    const companyId = session.user.companyId || session.user.id;

    console.log('Creating culture module for user:', {
      id: session.user.id,
      role: session.user.role,
      companyId: session.user.companyId,
      finalCompanyId: companyId,
    });
    console.log('Request body:', body);

    // Provide sensible defaults for culture modules
    const moduleTitle = title || 'Untitled Culture Module';
    const moduleContent =
      content || 'Start writing your culture module content here...';

    // Create a new course module
    const moduleData = {
      title: moduleTitle,
      description: description || 'A new course module for your organization.',
      category: body.category || 'General',
      isCompanySpecific: true,
      companyId: companyId,
      instructor: session.user.id,
      createdBy: session.user.id,
      lastModifiedBy: session.user.id,
      status,
      tags: tags || [],
      lessons: [
        {
          title: moduleTitle,
          type: 'text',
          content: moduleContent,
          duration: 0,
          quiz:
            quiz && quiz.questions && quiz.questions.length > 0
              ? {
                  title: quiz.title || 'Module Quiz',
                  questions: quiz.questions || [],
                }
              : undefined,
        },
      ],
    };

    console.log(
      'Creating course module with data:',
      JSON.stringify(moduleData, null, 2)
    );

    const courseModule = new Course(moduleData);
    const savedModule = await courseModule.save();

    console.log('Course module saved successfully:', savedModule._id);

    await savedModule.populate([
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'lastModifiedBy', select: 'firstName lastName email' },
    ]);

    return NextResponse.json(
      {
        success: true,
        module: savedModule,
        message: 'Course module created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course module:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to create course module',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
