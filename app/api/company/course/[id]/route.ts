import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import User from '@/lib/models/User'; // Import User model to register it
import { authOptions } from '../../../auth/[...nextauth]/route';
import {
  requireCompanyContext,
  resolveCompanyIdFromRequest,
} from '@/lib/user-utils';

// GET: Get a specific culture module by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get the correct company ID
    const resolvedId = resolveCompanyIdFromRequest(request, session);
    const companyId = resolvedId || (await requireCompanyContext(session));

    const courseModule = await Course.findOne({
      _id: params.id,
      isCompanySpecific: true,
      companyId: companyId,
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');
    // .populate('instructor', 'firstName lastName email')

    if (!courseModule) {
      return NextResponse.json(
        { error: 'Course module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      module: courseModule,
    });
  } catch (error) {
    console.error('Error fetching course module:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course module' },
      { status: 500 }
    );
  }
}

// PUT: Update a specific culture module
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      quiz,
      tags,
      status,

      lessons,
      finalQuiz,
      category,
    } = body;

    await dbConnect();

    // Get the correct company ID
    const resolvedId = resolveCompanyIdFromRequest(request, session);
    const companyId = resolvedId || (await requireCompanyContext(session));

    // Find the course module and verify ownership
    const courseModule = await Course.findOne({
      _id: params.id,
      isCompanySpecific: true,
      companyId: companyId,
    });

    if (!courseModule) {
      return NextResponse.json(
        { error: 'Course module not found' },
        { status: 404 }
      );
    }

    console.log('Updating course module:', params.id);
    console.log('Update data:', JSON.stringify(body, null, 2));
    console.log('Lessons data:', JSON.stringify(body.lessons, null, 2));
    console.log('Final quiz data:', JSON.stringify(body.finalQuiz, null, 2));

    // Prepare update data
    const updateData: any = {
      lastModifiedBy: session.user.id,
    };

    // Update basic fields
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;

    // Handle lessons array
    if (lessons !== undefined && Array.isArray(lessons)) {
      updateData.lessons = lessons.map((lesson) => ({
        title: lesson.title,
        type: lesson.type || 'text',
        content: lesson.content,
        duration: lesson.duration || 0,
        quiz:
          lesson.quiz &&
          lesson.quiz.questions &&
          lesson.quiz.questions.length > 0
            ? {
                title: lesson.quiz.title || 'Lesson Quiz',
                questions: lesson.quiz.questions || [],
              }
            : undefined,
      }));
    } else if (content !== undefined || quiz !== undefined) {
      // Backward compatibility: update the first lesson
      const existingLessons = courseModule.lessons || [];
      const firstLesson = existingLessons[0] || {
        title: title || courseModule.title,
        type: 'text',
        content: '',
        duration: 0,
      };

      if (content !== undefined) {
        firstLesson.content = content;
      }

      if (quiz !== undefined) {
        firstLesson.quiz =
          quiz && quiz.questions && quiz.questions.length > 0
            ? {
                title: quiz.title || 'Lesson Quiz',
                questions: quiz.questions || [],
              }
            : undefined;
      }

      updateData.lessons = [firstLesson, ...existingLessons.slice(1)];
    }

    // Handle final quiz
    if (finalQuiz !== undefined) {
      updateData.finalQuiz =
        finalQuiz && finalQuiz.questions && finalQuiz.questions.length > 0
          ? {
              title: finalQuiz.title || 'Final Assessment',
              questions: finalQuiz.questions || [],
            }
          : undefined;
    }

    console.log('Final update data:', JSON.stringify(updateData, null, 2));
    console.log(
      'Lessons in update data:',
      JSON.stringify(updateData.lessons, null, 2)
    );
    console.log(
      'Final quiz in update data:',
      JSON.stringify(updateData.finalQuiz, null, 2)
    );

    const updatedModule = await Course.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    if (!updatedModule) {
      return NextResponse.json(
        { error: 'Failed to update course module' },
        { status: 500 }
      );
    }

    console.log('Course module updated successfully:', updatedModule._id);
    console.log(
      'Updated module lessons:',
      JSON.stringify(updatedModule.lessons, null, 2)
    );
    console.log(
      'Updated module final quiz:',
      JSON.stringify(updatedModule.finalQuiz, null, 2)
    );

    return NextResponse.json({
      success: true,
      module: updatedModule,
      message: 'Course module updated successfully',
    });
  } catch (error) {
    console.error('Error updating course module:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to update course module',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific culture module
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get the correct company ID
    const resolvedId = resolveCompanyIdFromRequest(request, session);
    const companyId = resolvedId || (await requireCompanyContext(session));

    const deletedModule = await Course.findOneAndDelete({
      _id: params.id,
      isCompanySpecific: true,
      companyId: companyId,
    });

    if (!deletedModule) {
      return NextResponse.json(
        { error: 'Course module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course module deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course module:', error);
    return NextResponse.json(
      { error: 'Failed to delete course module' },
      { status: 500 }
    );
  }
}
