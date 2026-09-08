import { env } from '../config/env';
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === 'true',
      auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    } as nodemailer.TransportOptions);
  }
  return transporter;
}

export async function sendVerificationEmail(to: string, token: string): Promise<'smtp' | 'console'> {
  const link = `${env.APP_BASE_URL}/verify-email/${token}`;
  const html = `<p>Please verify your email by clicking <a href="${link}">this link</a>.</p>`;
  const text = `Please verify your email by visiting: ${link}`;

  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Verification email (console fallback) to=${to} link=${link}`);
    return 'console';
  }

  const t = getTransporter();
  await t.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: 'Verify your email',
    text,
    html,
  });
  return 'smtp';
}