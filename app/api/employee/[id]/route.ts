import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { getToken } from 'next-auth/jwt';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Authentication secret is not configured' },
      { status: 500 }
    );
  }

  const token = await getToken({ req, secret });

  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Not authenticated or not an admin' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { firstName, lastName, email, department } = body;

    const updatedEmployee = await User.findByIdAndUpdate(
      params.id,
      {
        firstName,
        lastName,
        email,
        department,
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedEmployee, { status: 200 });
  } catch (error) {
    console.error('Failed to update employee:', error);
    return NextResponse.json(
      { message: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Authentication secret is not configured' },
      { status: 500 }
    );
  }

  const token = await getToken({ req, secret });

  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Not authenticated or not an admin' }, { status: 401 });
  }

  await dbConnect();

  try {
    const deletedEmployee = await User.findByIdAndDelete(params.id);

    if (!deletedEmployee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Employee deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete employee:', error);
    return NextResponse.json(
      { message: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
