import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Company from '@/lib/models/Company';

async function getUserSettings(userId: string, role: string) {
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  let companyDetails = null;
  if (role === 'company' && user.company) {
    companyDetails = await Company.findById(user.company);
  }

  // Read from user.settings
  return {
    notifications: user.settings?.notifications || {},
    security: user.settings?.session || {},
    adminPreferences: role === 'admin' ? user.adminPreferences : undefined,
    companyPreferences:
      role === 'company' && companyDetails
        ? {
            companyName: companyDetails.name,
            registrationNumber: companyDetails.registrationNumber,
            sector: companyDetails.sector,
            officeAddress: companyDetails.officeAddress,
            state: companyDetails.state,
            country: companyDetails.country,
            businessDescription: companyDetails.businessDescription,
          }
        : undefined,
    employeePreferences:
      role === 'employee' ? user.employeePreferences : undefined,
  };
}

async function updateUserSettings(
  userId: string,
  role: string,
  settings: any
) {
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Write to user.settings
  if (settings.notifications) {
    user.settings = user.settings || {};
    user.settings.notifications = {
      ...user.settings.notifications,
      ...settings.notifications,
    };
  }
  if (settings.security) {
    user.settings = user.settings || {};
    user.settings.session = {
      ...user.settings.session,
      ...settings.security,
    };
  }
  if (role === 'admin' && settings.adminPreferences) {
    user.adminPreferences = {
      ...user.adminPreferences,
      ...settings.adminPreferences,
    };
  }
  if (role === 'employee' && settings.employeePreferences) {
    user.employeePreferences = {
      ...user.employeePreferences,
      ...settings.employeePreferences,
    };
  }

  await user.save();

  if (role === 'company' && settings.companyPreferences) {
    const company = await Company.findById(user.company);
    if (company) {
      company.name = settings.companyPreferences.companyName ?? company.name;
      company.registrationNumber =
        settings.companyPreferences.registrationNumber ??
        company.registrationNumber;
      company.sector = settings.companyPreferences.sector ?? company.sector;
      company.officeAddress =
        settings.companyPreferences.officeAddress ?? company.officeAddress;
      company.state = settings.companyPreferences.state ?? company.state;
      company.country = settings.companyPreferences.country ?? company.country;
      company.businessDescription =
        settings.companyPreferences.businessDescription ??
        company.businessDescription;
      await company.save();
    }
  }

  return { success: true, message: 'Settings updated successfully' };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getUserSettings(
      session.user.id,
      session.user.role
    );
    if (!settings) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await updateUserSettings(
      session.user.id,
      session.user.role,
      body
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating settings:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
