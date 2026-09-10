import { env } from '../config/env';
import nodemailer from 'nodemailer';
import { buildVerificationEmail } from '../emails/verification';
import { buildWelcomeEmail } from '../emails/welcome';
import { buildPasswordChangedEmail } from '../emails/password-changed';

let transporter: nodemailer.Transporter | null = null;
let transportOverride: nodemailer.Transporter | null = null;
let forceFailForTest = false;

export function __setMailTransportForTest(t: nodemailer.Transporter | null): void {
  transportOverride = t;
}

export function __setMailFailForTest(f: boolean): void {
  forceFailForTest = f;
}

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
  const { subject, text, html } = buildVerificationEmail(link);

  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Verification email (console fallback) to=${to} link=${link}`);
    return 'console';
  }

  const t = getTransporter();
  await t.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  return 'smtp';
}

export async function sendWelcomeEmail(to: string, name: string): Promise<'smtp' | 'console'> {
  if (forceFailForTest) throw new Error('Simulated mailer failure');
  const { subject, text, html } = buildWelcomeEmail(name);
  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Welcome email (console fallback) to=${to}`);
    return 'console';
  }
  const t = transportOverride ?? getTransporter();
  await t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
  return 'smtp';
}

export async function sendPasswordChangedEmail(to: string): Promise<'smtp' | 'console'> {
  if (forceFailForTest) throw new Error('Simulated mailer failure');
  const { subject, text, html } = buildPasswordChangedEmail();
  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Password-changed email (console fallback) to=${to}`);
    return 'console';
  }
  const t = transportOverride ?? getTransporter();
  await t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
  return 'smtp';
}
