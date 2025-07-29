import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import { getServerSession } from 'next-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { name } = body;
    const updatedCompany = await Company.findByIdAndUpdate(
      params.id,
      { name },
      { new: true }
    );
    if (!updatedCompany) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedCompany);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error updating company', error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const deletedCompany = await Company.findByIdAndDelete(params.id);
    if (!deletedCompany) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error deleting company', error },
      { status: 500 }
    );
  }
}
