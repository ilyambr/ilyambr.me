import nodemailer from 'nodemailer';

let transporter;

export function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // smtp.zoho.com (or .eu/.in)
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,     // no-reply@ilyambr.me
      pass: process.env.SMTP_PASS,     // Zoho app password
    },
  });

  return transporter;
}
