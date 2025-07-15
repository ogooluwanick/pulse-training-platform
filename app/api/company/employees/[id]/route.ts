import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/lib/models/User';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;
    const { name, email, department } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse('Invalid employee ID', { status: 400 });
    }

    const [firstName, lastName] = name.split(' ');

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { firstName, lastName, email, department },
      { new: true }
    );

    if (!updatedUser) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
