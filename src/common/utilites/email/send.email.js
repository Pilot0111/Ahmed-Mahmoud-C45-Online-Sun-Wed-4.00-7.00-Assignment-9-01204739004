import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async ({
  to = [],
  subject = "Saraha App",
  message = "<h1>Hello</h1>",
  attachments = [],
} = {}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can use other services like SendGrid, Outlook, etc.
    tls: {
      rejectUnauthorized: false,
    },
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
    attachments: attachments || {
      filename: "text.txt",
      content: "Hello, world!",
    },
  });
  return info.accepted.length > 0 ? true : false;
};
