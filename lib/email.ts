// lib/email.ts

import nodemailer from "nodemailer";

const email = process.env.NEXT_PUBLIC_NODEMAIL_EMAIL;
const password = process.env.NEXT_PUBLIC_NODEMAIL_PASS;

// Create a reusable transporter object
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass: password,
  },
});

// A generic email sending function
export const sendEmail = async ({ to, subject, htmlContent }: { to: string; subject: string; htmlContent: string; }) => {
  const mailOptions = {
    from: email,
    to,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

// Specific function for sending a verification email
export const sendVerificationEmail = async (customerEmail: string, Cname: string, verificationToken: string) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const verificationLink = `${appUrl}/api/auth/verify-email?token=${verificationToken}`;
  
  const verificationHtmlTemplate = `
    <h1>Verify Your Email Address</h1>
    <p>Hi ${Cname},</p>
    <p>Please click the button below to verify your email:</p>
    <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none;">Verify Email</a>
  `;

  await sendEmail({
    to: customerEmail,
    subject: "Verify Your Email for AdScreener",
    htmlContent: verificationHtmlTemplate,
  });
};

// Function for sending a password reset email
export const sendPasswordResetEmail = async (customerEmail: string, Cname:string, resetLink: string) => {
    const passwordResetHtmlTemplate = `
    <h1>Reset Your Password</h1>
    <p>Hi ${Cname},</p>
    <p>Please click the button below to reset your password:</p>
    <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none;">Reset Password</a>
  `;

  await sendEmail({
    to: customerEmail,
    subject: "Reset Your Password for AdScreener",
    htmlContent: passwordResetHtmlTemplate,
  });
}
