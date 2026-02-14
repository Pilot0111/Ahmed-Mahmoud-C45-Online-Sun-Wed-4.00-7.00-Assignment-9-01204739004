import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async ({
  to = [],
  subject = "Saraha App",
  message = "<h1>Hello</h1>",
  attachments = [],
} = {}) => {
  // DEBUG: Check if env vars are loaded (Remove this after fixing)
  console.log("Current EMAIL:", process.env.EMAIL);
  console.log("Current PASS (first 4 chars):", process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.substring(0, 4) : "undefined");

  // Configure the transporter with your email service credentials
  // It is best practice to use environment variables for sensitive data
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can use other services like SendGrid, Outlook, etc.
    auth: {
      user: process.env.EMAIL, 
      pass: process.env.EMAIL_PASSWORD, 
    },
  });

  const info = await transporter.sendMail({
    from: `"Saraha App" <${process.env.EMAIL}>`,
    to,
    subject,
    html: message,
    attachments,
  });

  return info.accepted.length > 0;
};
