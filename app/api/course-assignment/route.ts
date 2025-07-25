import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Course from '@/lib/models/Course';
import User from '@/lib/models/User';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
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

    console.log('🔍 Fetching assignments for companyId:', companyId);

    // First, let's check if there are any assignments at all
    const totalAssignments = await CourseAssignment.countDocuments();
    console.log('📊 Total assignments in database:', totalAssignments);

    // Check assignments for this company
    const companyAssignmentsCount = await CourseAssignment.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId as string),
    });
    console.log('🏢 Assignments for this company:', companyAssignmentsCount);

    // Get all course assignments for the company with populated data
    const assignments = await CourseAssignment.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId as string),
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
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
      {
        $unwind: '$courseDetails',
      },
      {
        $unwind: '$employeeDetails',
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
                    $gt: [
                      { $size: { $ifNull: ['$courseDetails.lessons', []] } },
                      0,
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
            _id: '$courseDetails._id',
            title: '$courseDetails.title',
            category: '$courseDetails.category',
            lessons: '$courseDetails.lessons',
            finalQuiz: '$courseDetails.finalQuiz',
          },
          assignee: {
            _id: '$employeeDetails._id',
            name: {
              $concat: [
                '$employeeDetails.firstName',
                ' ',
                '$employeeDetails.lastName',
              ],
            },
            avatar: {
              $ifNull: [
                '$employeeDetails.profileImageUrl',
                '/placeholder-user.jpg',
              ],
            },
            department: '$employeeDetails.department',
          },
          status: 1,
          endDate: 1,
          progress: { $round: ['$progress', 0] },
          lessonProgress: 1,
          finalQuizResult: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    console.log('✅ Found assignments after aggregation:', assignments.length);

    return NextResponse.json(assignments, { status: 200 });
  } catch (error) {
    console.error('❌ Failed to fetch course assignments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch course assignments' },
      { status: 500 }
    );
  }
}
