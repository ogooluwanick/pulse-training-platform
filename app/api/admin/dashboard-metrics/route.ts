import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';


export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const totalCompanies = await Company.countDocuments();
    const totalEmployees = await User.countDocuments({ role: 'EMPLOYEE' });

    // This is a simplified calculation for overall compliance and average completion time.
    // A more complex aggregation would be needed for accurate metrics.
    const courses = await Course.find({});
    const overallCompliance = courses.length > 0 ? 75 : 0; // Placeholder
    const avgCompletionTime = courses.length > 0 ? 14 : 0; // Placeholder

    // Placeholder data for platform risk and recent activity
    const platformRisk = {
      companiesAtRisk: 5,
      employeesAtRisk: 25,
    };

    const recentActivity = [
      {
        id: '1',
        user: 'John Doe',
        action: 'completed',
        course: 'Introduction to TypeScript',
        timestamp: '2 hours ago',
        type: 'completion',
      },
      {
        id: '2',
        user: 'Jane Smith',
        action: 'enrolled in',
        course: 'Advanced React Patterns',
        timestamp: '1 day ago',
        type: 'enrollment',
      },
      {
        id: '3',
        user: 'Peter Jones',
        action: 'is overdue for',
        course: 'Cybersecurity Essentials',
        timestamp: '3 days ago',
        type: 'deadline',
      },
    ];

    return NextResponse.json({
      totalCompanies,
      totalEmployees,
      overallCompliance,
      avgCompletionTime,
      platformRisk,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard metrics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
