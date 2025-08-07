import nodemailer from 'nodemailer';

const email = process.env.NEXT_PUBLIC_NODEMAIL_EMAIL;
const password = process.env.NEXT_PUBLIC_NODEMAIL_PASS;

// Email configuration validation
export const validateEmailConfig = () => {
  if (!email || !password) {
    throw new Error(
      'Email configuration not found. Please check NEXT_PUBLIC_NODEMAIL_EMAIL and NEXT_PUBLIC_NODEMAIL_PASS environment variables.'
    );
  }
  return { email, password };
};

// Initialize transporter with validation
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    const config = validateEmailConfig();
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email,
        pass: config.password,
      },
    });
  }
  return transporter;
};

export const mailOptsBase = {
  from: email,
  // 'to' will be set per email
};

// Placeholder for the capitalize function
// You should replace this with your actual implementation
const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Placeholder for the email template
// You should replace this with your actual HTML email template
const getDefaultEmailTemplate = (
  customerName: string,
  message: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Notification</title>
    </head>
    <body>
      <p>Hi ${customerName},</p>
      <p>${message}</p>
      <p>Thank you,</p>
      <p>Pulse's </p>
    </body>
    </html>
  `;
};

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  htmlContent?: string; // Optional: if not provided, a default template will be used
  customerName?: string; // Optional: for personalizing the default template
}

// Global email sending function
export const sendEmail = async ({
  to,
  subject,
  text,
  htmlContent,
  customerName = 'Valued Customer',
}: SendEmailParams) => {
  try {
    const emailTransporter = getTransporter();

    const mailOptions = {
      ...mailOptsBase,
      to: to,
      subject: subject,
      text: text,
      html:
        htmlContent ||
        getDefaultEmailTemplate(capitalize(customerName.split(' ')[0]), text),
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} with subject "${subject}"`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error}`);
  }
};

// Example usage (from your snippet, adapted)
export const sendSignupEmail = async (customerEmail: string, Cname: string) => {
  const subject = `Pulse's  SIGNUP! 🎉`;
  const firstName = Cname && Cname.trim() ? Cname.split(' ')[0] : 'there';
  const text = `Hi ${capitalize(firstName)}, \nThank you for signing up with us at Pulse's . Enjoy a beautiful shopping experience.`;

  // Assuming you have a specific HTML template for signups
  // For now, using a modified version of the default template or you can provide your specific 'template' variable
  const signupHtmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Welcome to Pulse's !</title>
    </head>
    <body>
      <h1>Welcome, ${capitalize(firstName)}!</h1>
      <p>Thank you for signing up with us at Pulse's .</p>
      <p>We're thrilled to have you. Enjoy a beautiful shopping experience!</p>
      <p>Best regards,</p>
      <p>The Pulse's  Team</p>
    </body>
    </html>
  `;

  return await sendEmail({
    to: customerEmail, // Assuming the customer's email is the recipient for their signup confirmation
    subject,
    text,
    htmlContent: signupHtmlTemplate, // Or your specific template variable
    customerName: Cname,
  });
};

// Standardized email verification function
export const sendVerificationEmail = async (
  customerEmail: string,
  Cname: string,
  verificationToken: string,
  isNewUser: boolean = false
) => {
  // Ensure NEXT_PUBLIC_APP_URL is set in your .env file
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:6999');

  // Standardize the verification link based on user type
  const verificationLink = isNewUser
    ? `${appUrl}/auth/set-password?token=${verificationToken}`
    : `${appUrl}/api/auth/verify-email?token=${verificationToken}`;

  const subject = `Verify Your Email for Pulse`;
  const firstName = Cname && Cname.trim() ? Cname.split(' ')[0] : 'there';
  const text = `Hi ${capitalize(firstName)}, \nPlease verify your email address by clicking the link below:\n${verificationLink}\nIf you did not request this, please ignore this email. This link will expire in 24 hours.`;

  const verificationHtmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 90%; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .button { background-color: #007bff; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 0.9em; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Verify Your Email Address</h1>
        <p>Hi ${capitalize(firstName)},</p>
        <p>Thanks for signing up for Pulse! To complete your registration, please verify your email address by clicking the button below:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${verificationLink}" class="button">Verify Email Address</a>
        </p>
        <p>If the button above doesn't work, copy and paste the following link into your web browser:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>This verification link is valid for the next 24 hours.</p>
        <p>If you didn't sign up for Pulse, please disregard this email.</p>
        <div class="footer">
          <p>Thanks,</p>
          <p>The Pulse Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: customerEmail,
    subject,
    text,
    htmlContent: verificationHtmlTemplate,
    customerName: Cname,
  });
};

export const sendPasswordResetEmail = async (
  customerEmail: string,
  Cname: string,
  resetLink: string
) => {
  const subject = `Pulse Password Reset Request`;
  const firstName = Cname && Cname.trim() ? Cname.split(' ')[0] : 'there';
  const text = `Hi ${capitalize(firstName)}, \nYou requested a password reset. Click the link below to reset your password:\n${resetLink}\nIf you did not request this, please ignore this email. This link will expire in 1 hour.`;

  const passwordResetHtmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Password Reset Request</title>
    </head>
    <body>
      <h1>Password Reset Request</h1>
      <p>Hi ${capitalize(firstName)},</p>
      <p>You recently requested to reset your password for your Pulse account. Click the button below to reset it.</p>
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Your Password</a>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>This password reset link is only valid for the next 1 hour.</p>
      <p>Thanks,</p>
      <p>The Pulse Team</p>
    </body>
    </html>
  `;

  return await sendEmail({
    to: customerEmail,
    subject,
    text,
    htmlContent: passwordResetHtmlTemplate,
    customerName: Cname,
  });
};

export const sendInvitationEmail = async (
  customerEmail: string,
  companyName: string,
  token: string
) => {
  const subject = `You've been invited to join ${companyName} on Pulse`;
  const text = `Hi, \nYou've been invited to join ${companyName} on Pulse. Please sign up to get started.`;

  const invitationHtmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>You're Invited!</title>
    </head>
    <body>
      <h1>You're Invited!</h1>
      <p>You've been invited to join <strong>${companyName}</strong> on Pulse.</p>
      <p>Click the button below to sign up and get started.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/employee-signup?token=${token}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign Up</a>
      <p>Thanks,</p>
      <p>The Pulse Team</p>
    </body>
    </html>
  `;

  return await sendEmail({
    to: customerEmail,
    subject,
    text,
    htmlContent: invitationHtmlTemplate,
    customerName: 'there',
  });
};
