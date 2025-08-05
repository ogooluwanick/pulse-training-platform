import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'COMPANY') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const matchStage =
      session.user.role === 'ADMIN'
        ? {}
        : {
            companyId: new mongoose.Types.ObjectId(
              session.user.companyId as string
            ),
          };

    // Get all course assignments for the company with populated data
    const assignments = await CourseAssignment.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'courses',
          let: { courseId: '$course' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$courseId'] },
                status: 'published',
              },
            },
          ],
          as: 'courseDetails',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails',
        },
      },
      // Use $unwind with preserveNullAndEmptyArrays to keep assignments even if course/employee not found
      {
        $unwind: {
          path: '$courseDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$employeeDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          // Calculate progress based on lesson completion
          progress: {
            $cond: {
              if: { $eq: ['$status', 'completed'] },
              then: 100,
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: ['$courseDetails', null] },
                      {
                        $gt: [
                          {
                            $size: { $ifNull: ['$courseDetails.lessons', []] },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  then: {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $size: {
                              $filter: {
                                input: { $ifNull: ['$lessonProgress', []] },
                                cond: { $eq: ['$$this.status', 'completed'] },
                              },
                            },
                          },
                          { $size: '$courseDetails.lessons' },
                        ],
                      },
                      100,
                    ],
                  },
                  else: 0,
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          course: {
            _id: { $ifNull: ['$courseDetails._id', null] },
            title: { $ifNull: ['$courseDetails.title', 'Course Not Found'] },
            description: { $ifNull: ['$courseDetails.description', ''] },
            category: { $ifNull: ['$courseDetails.category', 'unknown'] },
            difficulty: { $ifNull: ['$courseDetails.difficulty', null] },
            duration: { $ifNull: ['$courseDetails.duration', 0] },
            lessons: { $ifNull: ['$courseDetails.lessons', []] },
            finalQuiz: { $ifNull: ['$courseDetails.finalQuiz', null] },
            tags: { $ifNull: ['$courseDetails.tags', []] },
          },
          assignee: {
            _id: { $ifNull: ['$employeeDetails._id', null] },
            name: {
              $cond: {
                if: { $ne: ['$employeeDetails', null] },
                then: {
                  $concat: [
                    { $ifNull: ['$employeeDetails.firstName', 'Unknown'] },
                    ' ',
                    { $ifNull: ['$employeeDetails.lastName', 'User'] },
                  ],
                },
                else: 'Unknown User',
              },
            },
            email: { $ifNull: ['$employeeDetails.email', ''] },
            avatar: {
              $ifNull: [
                '$employeeDetails.profileImageUrl',
                '/placeholder-user.jpg',
              ],
            },
            department: { $ifNull: ['$employeeDetails.department', null] },
          },
          status: 1,
          assignmentType: 1,
          interval: 1,
          endDate: 1,
          progress: { $round: ['$progress', 0] },
          lessonProgress: 1,
          finalQuizResult: 1,
          createdAt: 1,
          updatedAt: 1,
          completedAt: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return NextResponse.json(assignments, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch course assignments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch course assignments' },
      { status: 500 }
    );
  }
}
