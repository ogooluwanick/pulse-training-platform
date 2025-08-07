import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Inquiry from '@/lib/models/Inquiry';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      companyName,
      companySize,
      sector,
      phone,
      message,
    } = body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !companyName ||
      !companySize ||
      !sector
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if inquiry already exists for this email
    const existingInquiry = await Inquiry.findOne({ email });
    if (existingInquiry) {
      return NextResponse.json(
        { error: 'An inquiry with this email already exists' },
        { status: 409 }
      );
    }

    // Create new inquiry
    const inquiry = new Inquiry({
      firstName,
      lastName,
      email,
      companyName,
      companySize,
      sector,
      phone,
      message,
      status: 'pending',
    });

    await inquiry.save();

    // Send confirmation email to the user (body-only; wrapper applies branding)
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const userEmailContent = `
      <h1>We’ve received your demo request</h1>
      <p>Hi ${firstName} ${lastName},</p>
      <p>Thanks for your interest in Pulse. Your demo request is in, and a member of our team will reach out shortly.</p>
      <div style="margin:16px 0; padding:12px 16px; background:#f5f4ed; border-radius:8px;">
        <h3 style="margin:0 0 8px 0;">Request details</h3>
        <ul style="padding-left:18px; margin:0;">
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Company:</strong> ${companyName}</li>
          <li><strong>Company size:</strong> ${companySize}</li>
          <li><strong>Sector:</strong> ${sector}</li>
          ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
          ${message ? `<li><strong>Message:</strong> ${message}</li>` : ''}
        </ul>
      </div>
      <p>In the meantime, you can learn more about Pulse on our website.</p>
      <p style="margin-top:20px;">
        <a href="${baseUrl}" class="btn">Visit Website</a>
      </p>
      <p class="muted" style="margin-top:16px;">We typically respond within one business day.</p>
    `;

    await sendEmail({
      to: email,
      subject: 'Demo Request Received - Pulse',
      text: `Thank you for your demo request, ${firstName}. We'll be in touch soon.`,
      htmlContent: userEmailContent,
      customerName: `${firstName} ${lastName}`,
    });

    // Send notification email to admin (body-only)
    const adminEmailContent = `
      <h1>New demo request</h1>
      <p>A new demo request has been submitted.</p>
      <div style="margin:16px 0; padding:12px 16px; background:#f5f4ed; border-radius:8px;">
        <h3 style="margin:0 0 8px 0;">Contact information</h3>
        <ul style="padding-left:18px; margin:0;">
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Company:</strong> ${companyName}</li>
          <li><strong>Company size:</strong> ${companySize}</li>
          <li><strong>Sector:</strong> ${sector}</li>
          ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
          ${message ? `<li><strong>Message:</strong> ${message}</li>` : ''}
        </ul>
      </div>
      <p><strong>Inquiry ID:</strong> ${inquiry._id}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      <p class="muted">This is an automated notification from Pulse.</p>
    `;

    // Send to admin email (you can configure this in your environment variables)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pulse.com';
    await sendEmail({
      to: adminEmail,
      subject: 'New Demo Request - Pulse',
      text: `New demo request from ${firstName} ${lastName} at ${companyName}`,
      htmlContent: adminEmailContent,
      customerName: 'Admin',
    });

    return NextResponse.json(
      {
        message: 'Demo request submitted successfully',
        inquiryId: inquiry._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Demo request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
