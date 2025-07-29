import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import User from '@/lib/models/User'; // Import User model to register it
import { authOptions } from '../../../auth/[...nextauth]/route';

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
    const companyId = session.user.companyId || session.user.id;

    const cultureModule = await Course.findOne({
      _id: params.id,
      category: 'culture',
      isCompanySpecific: true,
      companyId: companyId,
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    if (!cultureModule) {
      return NextResponse.json(
        { error: 'Culture module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      module: cultureModule,
    });
  } catch (error) {
    console.error('Error fetching culture module:', error);
    return NextResponse.json(
      { error: 'Failed to fetch culture module' },
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
      difficulty,
      lessons,
      finalQuiz,
      category,
    } = body;

    await dbConnect();

    // Get the correct company ID
    const companyId = session.user.companyId || session.user.id;

    // Find the culture module and verify ownership
    const cultureModule = await Course.findOne({
      _id: params.id,
      category: 'culture',
      isCompanySpecific: true,
      companyId: companyId,
    });

    if (!cultureModule) {
      return NextResponse.json(
        { error: 'Culture module not found' },
        { status: 404 }
      );
    }

    console.log('Updating culture module:', params.id);
    console.log('Update data:', JSON.stringify(body, null, 2));

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
    if (difficulty !== undefined) updateData.difficulty = difficulty;

    // Handle lessons array
    if (lessons !== undefined && Array.isArray(lessons)) {
      updateData.lessons = lessons.map((lesson) => ({
        title: lesson.title,
        type: lesson.type || 'text',
        content: lesson.content,
        duration: lesson.duration || 0,
        quiz: lesson.quiz
          ? {
              title: lesson.quiz.title || 'Lesson Quiz',
              questions: lesson.quiz.questions || [],
            }
          : undefined,
      }));
    } else if (content !== undefined || quiz !== undefined) {
      // Backward compatibility: update the first lesson
      const existingLessons = cultureModule.lessons || [];
      const firstLesson = existingLessons[0] || {
        title: title || cultureModule.title,
        type: 'text',
        content: '',
        duration: 0,
      };

      if (content !== undefined) {
        firstLesson.content = content;
      }

      if (quiz !== undefined) {
        firstLesson.quiz = quiz
          ? {
              title: quiz.title || 'Module Quiz',
              questions: quiz.questions || [],
            }
          : undefined;
      }

      updateData.lessons = [firstLesson, ...existingLessons.slice(1)];
    }

    // Handle final quiz
    if (finalQuiz !== undefined) {
      updateData.finalQuiz = finalQuiz
        ? {
            title: finalQuiz.title || 'Final Assessment',
            questions: finalQuiz.questions || [],
          }
        : undefined;
    }

    console.log('Final update data:', JSON.stringify(updateData, null, 2));

    const updatedModule = await Course.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    if (!updatedModule) {
      return NextResponse.json(
        { error: 'Failed to update culture module' },
        { status: 500 }
      );
    }

    console.log('Culture module updated successfully:', updatedModule._id);

    return NextResponse.json({
      success: true,
      module: updatedModule,
      message: 'Culture module updated successfully',
    });
  } catch (error) {
    console.error('Error updating culture module:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to update culture module',
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
    const companyId = session.user.companyId || session.user.id;

    const deletedModule = await Course.findOneAndDelete({
      _id: params.id,
      category: 'culture',
      isCompanySpecific: true,
      companyId: companyId,
    });

    if (!deletedModule) {
      return NextResponse.json(
        { error: 'Culture module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Culture module deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting culture module:', error);
    return NextResponse.json(
      { error: 'Failed to delete culture module' },
      { status: 500 }
    );
  }
}
