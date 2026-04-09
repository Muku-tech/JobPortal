const nodemailer = require("nodemailer");
require("dotenv").config();

// Create Ethereal test account for development
let transporter;

async function createTransporter() {
  console.log("🔄 Creating Ethereal test account...");
  // Generate test account
  const testAccount = await nodemailer.createTestAccount();
  console.log("Test account created:", testAccount.user);

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("✅ Email transporter ready (Ethereal test mode)");
  console.log(
    `📧 Test emails: https://ethereal.email/login#/${testAccount.user}`,
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
  if (!transporter) {
    transporter = await createTransporter();
  }

  const statusTemplates = {
    shortlisted: {
      subject: "Congratulations! You have been shortlisted!",
      html: `
        <h2>🎉 Great news, ${applicantName}!</h2>
        <p>You have been <strong>shortlisted</strong> for the position of <strong>${jobTitle}</strong>.</p>
        <p>Our team will contact you soon with the next steps.</p>
        <p>Best regards,<br>The Hiring Team</p>
      `,
    },
    interview_scheduled: {
      subject: "Interview Invitation for ${jobTitle}",
      html: `
        <h2>📅 Interview Invitation</h2>
        <p>Hello ${applicantName},</p>
        <p>You have been invited for an interview for <strong>${jobTitle}</strong>.</p>
        <p>Please check your email for scheduling details.</p>
        <p>Best,<br>Hiring Team</p>
      `,
    },
    hired: {
      subject: "Congratulations! You are hired for ${jobTitle}!",
      html: `
        <h2>🎊 Congratulations ${applicantName}!</h2>
        <p>We are pleased to inform you that you have been <strong>selected</strong> for <strong>${jobTitle}</strong>.</p>
        <p>Welcome aboard! Please check your email for onboarding details.</p>
        <p>Best regards,<br>The Team</p>
      `,
    },
    rejected: {
      subject: "Application Update for ${jobTitle}",
      html: `
        <h2>Thank you for applying, ${applicantName}</h2>
        <p>Thank you for your interest in <strong>${jobTitle}</strong>.</p>
        <p>Unfortunately, we will not be proceeding with your application at this time.</p>
        <p>We encourage you to apply for other positions that match your skills.</p>
        <p>Best wishes,<br>Hiring Team</p>
      `,
    },
  };

  const template = statusTemplates[newStatus];
  if (!template) return; // No email for non-trigger statuses

  const mailOptions = {
    from: '"JobPortal Hiring" <noreply@jobportal.com>',
    to: applicantEmail,
    subject: template.subject.replace("${jobTitle}", jobTitle),
    html: template.html.replace(/\${([^}]+)}/g, (_, key) => {
      const replacements = { applicantName, jobTitle };
      return replacements[key] || key;
    }), // Safe template replace
  };

  console.log("Sending email to", applicantEmail);
  const info = await transporter.sendMail(mailOptions);
  console.log("✅ Status email sent:", nodemailer.getTestMessageUrl(info));
  return info;
};

module.exports = { sendStatusUpdateEmail };
