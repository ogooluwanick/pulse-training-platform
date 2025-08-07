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

      const statusUpdateEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Demo Request Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { width: 90%; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; }
            .status-pending { background-color: #fff3cd; color: #856404; }
            .status-contacted { background-color: #cce5ff; color: #004085; }
            .status-qualified { background-color: #d4edda; color: #155724; }
            .status-converted { background-color: #d1ecf1; color: #0c5460; }
            .status-rejected { background-color: #f8d7da; color: #721c24; }
            .footer { margin-top: 20px; font-size: 0.9em; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Demo Request Status Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${inquiry.firstName} ${inquiry.lastName},</h2>
              <p>Your demo request status has been updated.</p>
              
              <div style="margin: 20px 0;">
                <strong>Current Status:</strong>
                <span class="status-badge status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
              </div>
              
              <p><strong>Message:</strong></p>
              <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #2c3e50;">
                ${statusMessages[status as keyof typeof statusMessages] || 'Your demo request status has been updated.'}
              </p>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                <h3>Your Request Details:</h3>
                <ul>
                  <li><strong>Company:</strong> ${inquiry.companyName}</li>
                  <li><strong>Company Size:</strong> ${inquiry.companySize}</li>
                  <li><strong>Sector:</strong> ${inquiry.sector}</li>
                  <li><strong>Submitted:</strong> ${new Date(inquiry.createdAt).toLocaleDateString()}</li>
                </ul>
              </div>
              
              <p>If you have any questions, please don't hesitate to reach out to our team.</p>
              
              <div class="footer">
                <p>Best regards,<br>The Pulse Team</p>
              </div>
            </div>
          </div>
        </body>
        </html>
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
