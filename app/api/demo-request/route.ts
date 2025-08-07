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

    // Send confirmation email to the user
    const userEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Demo Request Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { width: 90%; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 20px; font-size: 0.9em; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Demo Request Received</h1>
          </div>
          <div class="content">
            <h2>Thank you for your demo request!</h2>
            <p>Dear ${firstName} ${lastName},</p>
            <p>Thank you for your interest in Pulse. We have received your demo request and our team will be in touch with you shortly.</p>
            
            <div class="details">
              <h3>Your Request Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${firstName} ${lastName}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Company:</strong> ${companyName}</li>
                <li><strong>Company Size:</strong> ${companySize}</li>
                <li><strong>Sector:</strong> ${sector}</li>
                ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
                ${message ? `<li><strong>Message:</strong> ${message}</li>` : ''}
              </ul>
            </div>
            
            <p>We typically respond within 24 hours during business days.</p>
            <div class="footer">
              <p>Best regards,<br>The Pulse Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: 'Demo Request Received - Pulse',
      text: `Thank you for your demo request, ${firstName}. We'll be in touch soon.`,
      htmlContent: userEmailContent,
      customerName: `${firstName} ${lastName}`,
    });

    // Send notification email to admin
    const adminEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>New Demo Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { width: 90%; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .header { background-color: #e74c3c; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 20px; font-size: 0.9em; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Demo Request</h1>
          </div>
          <div class="content">
            <p>A new demo request has been submitted:</p>
            
            <div class="details">
              <h3>Contact Information:</h3>
              <ul>
                <li><strong>Name:</strong> ${firstName} ${lastName}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Company:</strong> ${companyName}</li>
                <li><strong>Company Size:</strong> ${companySize}</li>
                <li><strong>Sector:</strong> ${sector}</li>
                ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
                ${message ? `<li><strong>Message:</strong> ${message}</li>` : ''}
              </ul>
            </div>
            
            <p><strong>Inquiry ID:</strong> ${inquiry._id}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            <div class="footer">
              <p>This is an automated notification from Pulse.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
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
