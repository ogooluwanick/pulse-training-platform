import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/lib/models/User';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const data = JSON.stringify(user, null, 2);
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user_data.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
