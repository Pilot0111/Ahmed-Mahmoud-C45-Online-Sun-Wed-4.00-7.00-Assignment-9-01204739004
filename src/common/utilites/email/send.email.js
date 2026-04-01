import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async ({
  to,
  subject = "Saraha App",
  message = "<h1>Hello</h1>",
  attachments = [],
} = {}) => {
  try {
    if (!to) throw new Error("Recipient email (to) is missing");

    const info = await transporter.sendMail({
      from: `"Saraha App" <${process.env.EMAIL}>`,
      to,
      subject,
      html: message,
      attachments: attachments.length > 0 ? attachments : [],
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Nodemailer transport error:", error.message);
    return false;
  }
};
