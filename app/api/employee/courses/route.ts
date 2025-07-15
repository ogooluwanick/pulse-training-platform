import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Course from "@/lib/models/Course";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CourseAssignment from "@/lib/models/CourseAssignment";
import User from "@/lib/models/User";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const courseAssignments = await CourseAssignment.find({
      employeeId: user._id,
    }).populate("courseId");

    const courses = courseAssignments.map((assignment) => {
      const course = assignment.courseId;
      const totalLessons = course.lessons.length + (course.quiz ? 1 : 0);
      const courseDuration = course.lessons.reduce(
        (acc: any, lesson: any) => acc + lesson.duration,
        0
      );
      return {
        id: course._id,
        title: course.title,
        description: course.description,
        progress: assignment.progress,
        totalLessons: totalLessons,
        completedLessons: assignment.completedLessons.length,
        dueDate: assignment.dueDate,
        status: assignment.status,
        category: course.category,
        duration: courseDuration,
      };
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching employee courses:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
