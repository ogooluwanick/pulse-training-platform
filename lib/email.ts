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

const SITE_NAME = 'Pulse';

export const mailOptsBase = {
  from: `${SITE_NAME} <${email}>`,
  // 'to' will be set per email
};

// Placeholder for the capitalize function
// You should replace this with your actual implementation
const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const getBaseUrl = (): string => {
  // Prefer NEXTAUTH_URL for canonical base URL
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000')
  );
};

const getLogoUrl = (): string => {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return `${baseUrl}/pulse-logo.png`;
};

export const wrapEmailContent = (
  bodyHtml: string,
  options?: { title?: string; preheader?: string }
): string => {
  const baseUrl = getBaseUrl();
  const logoUrl = getLogoUrl();
  const title = options?.title || SITE_NAME;
  const preheader = options?.preheader || '';

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body { margin:0; background: #f5f4ed; color: #141413; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif; }
      .preheader { display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; }
      .container { width: 100%; background: #f5f4ed; padding: 24px 0; }
      .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(115, 114, 108, 0.12); overflow: hidden; border: 1px solid #e5e7eb; }
      .header { display:flex; align-items:center; gap: 10px; padding: 20px 24px; border-bottom: 1px solid #efefef; }
      .logo { display:inline-flex; align-items:center; text-decoration:none; color: inherit; }
      .logo-mark { display:inline-flex; align-items:center; justify-content:center; height: 32px; width: 32px; border-radius: 8px; background: #141413; color: #faf9f6; font-weight: 800; font-size: 14px; }
      .logo-text { font-weight: 800; font-size: 18px; color: #141413; margin-left: 10px; }
      .content { padding: 24px; line-height: 1.6; }
      h1, h2, h3 { color: #141413; }
      p { color: #141413; }
      .muted { color: #73726c; }
      .hr { height:1px; background:#efefef; border:0; margin: 16px 0; }
      .btn { display: inline-block; background: #141413; color: #faf9f6 !important; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; box-shadow: 0 2px 8px rgba(115,114,108,0.08); }
      .footer { padding: 16px 24px 24px; color: #73726c; font-size: 12px; }
      a { color: #141413; }
    </style>
  </head>
  <body>
    <span class="preheader">${preheader}</span>
    <div class="container">
      <div class="card">
        <div class="header">
          <a class="logo" href="${baseUrl}">
            <img src="${logoUrl}" alt="${SITE_NAME} Logo" height="32" width="32" style="border-radius:8px; display:block;"/>
            <span class="logo-text">${SITE_NAME}</span>
          </a>
        </div>
        <div class="content">
          ${bodyHtml}
        </div>
        <div class="footer">
          <div>© ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</div>
          <div><a href="${baseUrl}">${baseUrl.replace(/^https?:\/\//, '')}</a></div>
        </div>
      </div>
    </div>
  </body>
  </html>`;
};

// Default, generic email template
const getDefaultEmailTemplate = (
  customerName: string,
  message: string
): string => {
  const baseUrl = getBaseUrl();
  const sanitizedMessage = (message || '').replace(/\n/g, '<br/>');
  const body = `
    <h1>Hello ${customerName},</h1>
    <p>${sanitizedMessage}</p>
    <p style="margin-top:20px;">
      <a href="${baseUrl}/dashboard" class="btn">Open Dashboard</a>
    </p>
    <p class="muted" style="margin-top:16px;">If you have any questions, just reply to this email—we're here to help.</p>
  `;
  return wrapEmailContent(body, {
    title: `${SITE_NAME} Notification`,
    preheader: message,
  });
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

    // If a raw htmlContent is provided, wrap it into the branded layout
    const wrappedHtml = htmlContent
      ? wrapEmailContent(htmlContent, { title: subject, preheader: text })
      : getDefaultEmailTemplate(capitalize(customerName.split(' ')[0]), text);

    const mailOptions = {
      ...mailOptsBase,
      to: to,
      subject: subject,
      text: text,
      html: wrappedHtml,
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
  const subject = `${SITE_NAME} – Welcome aboard! 🎉`;
  const firstName = Cname && Cname.trim() ? Cname.split(' ')[0] : 'there';
  const text = `Hi ${capitalize(firstName)}, welcome to ${SITE_NAME}!`;

  const baseUrl = getBaseUrl();
  const signupHtmlTemplate = `
    <h1>Welcome, ${capitalize(firstName)}!</h1>
    <p>Thanks for joining ${SITE_NAME}. We’re excited to have you on board.</p>
    <p>Jump into your dashboard to get started.</p>
    <p style="margin-top:24px">
      <a href="${baseUrl}/dashboard" class="btn">Go to Dashboard</a>
    </p>
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
  const appUrl = getBaseUrl();

  // Standardize the verification link based on user type
  const verificationLink = isNewUser
    ? `${appUrl}/auth/set-password?token=${verificationToken}`
    : `${appUrl}/api/auth/verify-email?token=${verificationToken}`;

  const subject = `Verify your email for ${SITE_NAME}`;
  const firstName = Cname && Cname.trim() ? Cname.split(' ')[0] : 'there';
  const text = `Hi ${capitalize(firstName)}, please verify your email address.`;

  const verificationHtmlTemplate = `
    <h1>Verify your email</h1>
    <p>Hi ${capitalize(firstName)},</p>
    <p>To complete your registration with ${SITE_NAME}, please confirm your email address.</p>
    <p style="margin:24px 0; text-align:center;">
      <a href="${verificationLink}" class="btn">Verify Email Address</a>
    </p>
    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
    <p><a href="${verificationLink}">${verificationLink}</a></p>
    <p class="muted">This link expires in 24 hours.</p>
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
  const subject = `${SITE_NAME} password reset`;
  const firstName = Cname && Cname.trim() ? Cname.split(' ')[0] : 'there';
  const text = `Hi ${capitalize(firstName)}, reset your ${SITE_NAME} password.`;

  const passwordResetHtmlTemplate = `
    <h1>Reset your password</h1>
    <p>Hi ${capitalize(firstName)},</p>
    <p>You recently requested to reset your ${SITE_NAME} password. Click the button below to continue.</p>
    <p style="margin:24px 0;">
      <a href="${resetLink}" class="btn">Reset Password</a>
    </p>
    <p>If you did not request this, you can safely ignore this email.</p>
    <p class="muted">This link expires in 1 hour.</p>
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
  const subject = `You're invited to join ${companyName} on ${SITE_NAME}`;
  const text = `You've been invited to join ${companyName} on ${SITE_NAME}.`;

  const baseUrl = getBaseUrl();
  const invitationHtmlTemplate = `
    <h1>You're invited!</h1>
    <p>You've been invited to join <strong>${companyName}</strong> on ${SITE_NAME}.</p>
    <p style="margin:24px 0;">
      <a href="${baseUrl}/auth/employee-signup?token=${token}" class="btn">Accept Invitation</a>
    </p>
    <p class="muted">If you weren't expecting this, you can ignore this email.</p>
  `;

  return await sendEmail({
    to: customerEmail,
    subject,
    text,
    htmlContent: invitationHtmlTemplate,
    customerName: 'there',
  });
};
