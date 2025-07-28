import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Course from '@/lib/models/Course';
import User from '@/lib/models/User';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Authentication secret is not configured' },
      { status: 500 }
    );
  }

  const token = await getToken({ req, secret });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();

  try {
    const companyId = token.companyId;

    if (!companyId) {
      return NextResponse.json(
        { message: 'Company ID not found in token' },
        { status: 400 }
      );
    }

    console.log('🔧 Fixing orphaned assignments for companyId:', companyId);

    // Get all assignments for this company
    const assignments = await CourseAssignment.find({
      companyId: new mongoose.Types.ObjectId(companyId as string),
    });

    console.log(`📊 Found ${assignments.length} assignments to check`);

    // Get all available courses
    const availableCourses = await Course.find({}).select('_id title');
    console.log(`📚 Found ${availableCourses.length} available courses`);

    if (availableCourses.length === 0) {
      return NextResponse.json(
        { message: 'No courses available in database' },
        { status: 400 }
      );
    }

    let fixed = 0;
    let deleted = 0;
    const results = [];

    for (const assignment of assignments) {
      const courseExists = await Course.findById(assignment.course);

      if (!courseExists) {
        console.log(
          `❌ Assignment ${assignment._id} references non-existent course ${assignment.course}`
        );

        // Option 1: Delete the orphaned assignment
        await CourseAssignment.findByIdAndDelete(assignment._id);
        deleted++;
        results.push({
          assignmentId: assignment._id,
          action: 'deleted',
          reason: 'Course not found',
        });

        // Option 2: Update to use first available course (uncomment if you want this instead)
        /*
        const firstCourse = availableCourses[0];
        await CourseAssignment.findByIdAndUpdate(assignment._id, {
          course: firstCourse._id
        });
        fixed++;
        results.push({
          assignmentId: assignment._id,
          action: 'updated',
          oldCourseId: assignment.course,
          newCourseId: firstCourse._id,
          newCourseTitle: firstCourse.title
        });
        */
      } else {
        console.log(
          `✅ Assignment ${assignment._id} has valid course ${assignment.course}`
        );
      }
    }

    console.log(`🎉 Fix completed: ${deleted} deleted, ${fixed} updated`);

    return NextResponse.json(
      {
        message: `Fixed orphaned assignments`,
        summary: {
          total: assignments.length,
          deleted,
          fixed,
          remaining: assignments.length - deleted - fixed,
        },
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Failed to fix orphaned assignments:', error);
    return NextResponse.json(
      { message: 'Failed to fix orphaned assignments' },
      { status: 500 }
    );
  }
}
