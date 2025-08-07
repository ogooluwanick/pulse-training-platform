import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Inquiry from '@/lib/models/Inquiry';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { sector: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await Inquiry.countDocuments(query);

    // Get inquiries with pagination
    const inquiries = await Inquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      inquiries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { inquiryId, status } = body;

    if (!inquiryId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the current inquiry to check if status is actually changing
    const currentInquiry = await Inquiry.findById(inquiryId);
    if (!currentInquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // Only send email if status is actually changing
    const statusChanged = currentInquiry.status !== status;

    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status },
      { new: true }
    );

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // Send email notification if status changed
    if (statusChanged) {
      const statusMessages = {
        pending: 'Your demo request is currently under review.',
        contacted: 'We have reached out to discuss your demo request.',
        qualified:
          "Your demo request has been qualified and we're excited to work with you!",
        converted:
          'Congratulations! Your demo request has been converted to a customer account.',
        rejected:
          'Thank you for your interest, but we are unable to proceed with your demo request at this time.',
      };

      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'http://localhost:3000';
      const statusUpdateEmailContent = `
        <h1>Demo request status update</h1>
        <p>Hello ${inquiry.firstName} ${inquiry.lastName},</p>
        <p>Your demo request status has been updated.</p>
        <p><strong>Current status:</strong>
          <span style="display:inline-block; padding:6px 12px; border-radius:999px; background:#f5f4ed; font-weight:700;">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </p>
        <p style="margin: 12px 0 0 0;"><strong>Message:</strong></p>
        <p style="background-color: #f5f4ed; padding: 12px 16px; border-radius: 8px;">
          ${statusMessages[status as keyof typeof statusMessages] || 'Your demo request status has been updated.'}
        </p>
        <div style="margin: 16px 0; padding: 12px 16px; background-color: #f5f4ed; border-radius: 8px;">
          <h3 style="margin:0 0 8px 0;">Your request details</h3>
          <ul style="padding-left:18px; margin:0;">
            <li><strong>Company:</strong> ${inquiry.companyName}</li>
            <li><strong>Company size:</strong> ${inquiry.companySize}</li>
            <li><strong>Sector:</strong> ${inquiry.sector}</li>
            <li><strong>Submitted:</strong> ${new Date(inquiry.createdAt).toLocaleDateString()}</li>
          </ul>
        </div>
        <p>If you have any questions, please reach out to our team.</p>
        <p style="margin-top:16px;">
          <a href="${baseUrl}" class="btn">Visit Website</a>
        </p>
        <p class="muted" style="margin-top:16px;">Best regards,<br/>The Pulse Team</p>
      `;

      try {
        await sendEmail({
          to: inquiry.email,
          subject: `Demo Request Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          text: `Your demo request status has been updated to: ${status}. ${statusMessages[status as keyof typeof statusMessages]}`,
          htmlContent: statusUpdateEmailContent,
          customerName: `${inquiry.firstName} ${inquiry.lastName}`,
        });
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
        // Don't fail the request if email fails, just log the error
      }
    }

    return NextResponse.json({
      message: 'Inquiry status updated successfully',
      inquiry,
    });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
