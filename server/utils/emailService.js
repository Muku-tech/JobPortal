const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter (prod or test)
let transporter;
let isTestMode = true; // default fallback

async function createTransportFn() {
  console.log("🔄 Initializing email transporter...");

  // Production Gmail SMTP
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    console.log("🚀 Using PRODUCTION Gmail SMTP");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    isTestMode = false;

    // Test connection
    await transporter.verify();
    console.log("✅ PRODUCTION SMTP connection verified");
    return transporter;
  }

  // Fallback to Ethereal test
  console.log("🧪 Using ETHREAL TEST MODE (add SMTP vars for real emails)");
  const testAccount = await nodemailer.createTestAccount();
  console.log("Test account:", testAccount.user);

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("✅ Ethereal test transporter ready");
  console.log(
    `📧 View test emails: https://ethereal.email/login#/${testAccount.user}`,
  );
  return transporter;
}

// Send status update email
const sendStatusUpdateEmail = async (
  applicantEmail,
  applicantName,
  jobTitle,
  newStatus,
) => {
  try {
    if (!transporter) {
      transporter = await createTransportFn();
    }

    const statusTemplates = {
      shortlisted: {
        subject: `Congratulations! Shortlisted for ${jobTitle}`,
        html: `
          <h2>🎉 Great news, ${applicantName}!</h2>
          <p>You have been <strong>shortlisted</strong> for <strong>${jobTitle}</strong>.</p>
          <p>Next steps coming soon!</p>
          <p>Best,<br>Hiring Team</p>
        `,
      },
      interview_scheduled: {
        subject: `Interview scheduled for ${jobTitle}`,
        html: `
          <h2>📅 Interview Invitation</h2>
          <p>Hello ${applicantName},</p>
          <p>Interview scheduled for <strong>${jobTitle}</strong>.</p>
          <p>Check details below or reply to schedule.</p>
          <p>Best,<br>Hiring Team</p>
        `,
      },
      hired: {
        subject: `🎊 You're hired for ${jobTitle}!`,
        html: `
          <h2>Congratulations ${applicantName}!</h2>
          <p>You've been <strong>hired</strong> for <strong>${jobTitle}</strong>!</p>
          <p>Welcome aboard! Onboarding details coming soon.</p>
          <p>Best regards,<br>The Team</p>
        `,
      },
      rejected: {
        subject: `Update on ${jobTitle} application`,
        html: `
          <h2>Thank you ${applicantName}</h2>
          <p>Thank you for applying to <strong>${jobTitle}</strong>.</p>
          <p>We'll keep your profile for future opportunities.</p>
          <p>Best wishes,<br>Hiring Team</p>
        `,
      },
    };

    const template = statusTemplates[newStatus];
    if (!template) {
      console.log(`ℹ️ No email template for status: ${newStatus}`);
      return null;
    }

    const fromEmail =
      process.env.SMTP_USER || '"JobPortal" <no-reply@jobportal.com>';
    const mailOptions = {
      from: fromEmail,
      to: applicantEmail,
      subject: template.subject,
      html: template.html,
    };

    console.log(
      `${isTestMode ? "🧪 TEST" : "📧 REAL"}: Sending to ${applicantEmail} (Status: ${newStatus})`,
    );

    const info = await transporter.sendMail(mailOptions);

    if (isTestMode) {
      console.log("✅ Test email sent:", nodemailer.getTestMessageUrl(info));
    } else {
      console.log(
        "✅ REAL email sent successfully! Message ID:",
        info.messageId,
      );
    }

    return info;
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    // Don't throw - don't break status update
    return null;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  try {
    if (!transporter) {
      transporter = await createTransportFn();
    }

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_USER || '"JobPortal" <no-reply@jobportal.com>',
      to: userEmail,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>You recently requested to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This password reset link will expire in <strong>1 hour</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">
            If the button above doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p>Best regards,<br/>JobPortal Team</p>
        </div>
      `,
    };

    console.log(
      `${isTestMode ? "🧪 TEST" : "📧 REAL"}: Sending password reset to ${userEmail}`,
    );

    const info = await transporter.sendMail(mailOptions);

    if (isTestMode) {
      console.log("✅ Reset email sent:", nodemailer.getTestMessageUrl(info));
    } else {
      console.log("✅ REAL reset email sent! Message ID:", info.messageId);
    }

    return info;
  } catch (error) {
    console.error("❌ Password reset email failed:", error.message);
    return null;
  }
};

module.exports = { sendStatusUpdateEmail, sendPasswordResetEmail, isTestMode };
