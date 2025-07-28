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

    // Debug: Get raw assignments to see what course IDs they reference
    const rawAssignments = await CourseAssignment.find({
      companyId: new mongoose.Types.ObjectId(companyId as string),
    }).select('course employee status');
    
    console.log('🔍 Raw assignments found:');
    rawAssignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Assignment ID: ${assignment._id}`);
      console.log(`      Course ID: ${assignment.course}`);
      console.log(`      Employee ID: ${assignment.employee}`);
      console.log(`      Status: ${assignment.status}`);
    });

    // Debug: Check if referenced courses exist
    const courseIds = rawAssignments.map(a => a.course).filter(Boolean);
    console.log('📚 Course IDs referenced in assignments:', courseIds);
    
    if (courseIds.length > 0) {
      const existingCourses = await Course.find({ _id: { $in: courseIds } }).select('_id title');
      console.log('✅ Existing courses found:', existingCourses.length);
      existingCourses.forEach(course => {
        console.log(`   - ${course._id}: ${course.title}`);
      });
      
      const missingCourseIds = courseIds.filter(id => 
        !existingCourses.some(course => course._id.toString() === id.toString())
      );
      console.log('❌ Missing course IDs:', missingCourseIds);
    }

    // Debug: Check what courses actually exist in the database
    const totalCourses = await Course.countDocuments();
    console.log('📚 Total courses in database:', totalCourses);
    
    if (totalCourses > 0) {
      const sampleCourses = await Course.find({}).limit(5).select('_id title');
      console.log('📋 Sample courses in database:');
      sampleCourses.forEach(course => {
        console.log(`   - ${course._id}: ${course.title}`);
      });
    }

    // Debug: Check if referenced employees exist
    const employeeIds = rawAssignments.map(a => a.employee).filter(Boolean);
    console.log('👥 Employee IDs referenced in assignments:', employeeIds);
    
    if (employeeIds.length > 0) {
      const existingEmployees = await User.find({ _id: { $in: employeeIds } }).select('_id firstName lastName email');
      console.log('✅ Existing employees found:', existingEmployees.length);
      existingEmployees.forEach(employee => {
        console.log(`   - ${employee._id}: ${employee.firstName} ${employee.lastName} (${employee.email})`);
      });
      
      const missingEmployeeIds = employeeIds.filter(id => 
        !existingEmployees.some(employee => employee._id.toString() === id.toString())
      );
      console.log('❌ Missing employee IDs:', missingEmployeeIds);
    }

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
                          { $size: { $ifNull: ['$courseDetails.lessons', []] } },
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
            category: { $ifNull: ['$courseDetails.category', 'unknown'] },
            lessons: { $ifNull: ['$courseDetails.lessons', []] },
            finalQuiz: { $ifNull: ['$courseDetails.finalQuiz', null] },
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
            avatar: {
              $ifNull: [
                '$employeeDetails.profileImageUrl',
                '/placeholder-user.jpg',
              ],
            },
            department: { $ifNull: ['$employeeDetails.department', null] },
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

    // Debug: Log the final results
    console.log('📋 Final assignment results:');
    assignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Assignment ID: ${assignment._id}`);
      console.log(`      Course: ${assignment.course?.title || 'NOT FOUND'} (ID: ${assignment.course?._id || 'null'})`);
      console.log(`      Assignee: ${assignment.assignee?.name || 'NOT FOUND'} (ID: ${assignment.assignee?._id || 'null'})`);
      console.log(`      Status: ${assignment.status}`);
      console.log(`      Progress: ${assignment.progress}%`);
    });

    return NextResponse.json(assignments, { status: 200 });
  } catch (error) {
    console.error('❌ Failed to fetch course assignments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch course assignments' },
      { status: 500 }
    );
  }
}
