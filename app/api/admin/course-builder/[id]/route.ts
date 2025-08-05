import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { Course, User } from '@/lib/models';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

// GET: Get a specific universal course by ID for admin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const course = await Course.findOne({
      _id: params.id,
      isCompanySpecific: false, // Only universal courses
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Universal course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      module: course,
    });
  } catch (error) {
    console.error('Error fetching universal course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universal course' },
      { status: 500 }
    );
  }
}

// PUT: Update a specific universal course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
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

    // Find the universal course and verify it's universal
    const course = await Course.findOne({
      _id: params.id,
      isCompanySpecific: false, // Only universal courses
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Universal course not found' },
        { status: 404 }
      );
    }

    console.log('Updating universal course:', params.id);
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
    if (difficulty !== undefined) updateData.difficulty = difficulty;

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
      const existingLessons = course.lessons || [];
      const firstLesson = existingLessons[0] || {
        title: title || course.title,
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
                title: quiz.title || 'Course Quiz',
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

    const updatedCourse = await Course.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return NextResponse.json(
        { error: 'Failed to update universal course' },
        { status: 500 }
      );
    }

    console.log('Universal course updated successfully:', updatedCourse._id);
    console.log(
      'Updated course lessons:',
      JSON.stringify(updatedCourse.lessons, null, 2)
    );
    console.log(
      'Updated course final quiz:',
      JSON.stringify(updatedCourse.finalQuiz, null, 2)
    );

    return NextResponse.json({
      success: true,
      module: updatedCourse,
      message: 'Universal course updated successfully',
    });
  } catch (error) {
    console.error('Error updating universal course:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to update universal course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific universal course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const deletedCourse = await Course.findOneAndDelete({
      _id: params.id,
      isCompanySpecific: false, // Only universal courses
    });

    if (!deletedCourse) {
      return NextResponse.json(
        { error: 'Universal course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Universal course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting universal course:', error);
    return NextResponse.json(
      { error: 'Failed to delete universal course' },
      { status: 500 }
    );
  }
}
