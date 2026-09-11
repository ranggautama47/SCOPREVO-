import { env } from '../config/env';
import nodemailer from 'nodemailer';
import { buildVerificationEmail } from '../emails/verification';
import { buildWelcomeEmail } from '../emails/welcome';
import { buildPasswordChangedEmail } from '../emails/password-changed';
import { buildEmailChangeVerification } from '../emails/email-change-verification';
import { buildEmailChangedNotification } from '../emails/email-changed-notification';
import { buildPasswordResetEmail } from '../emails/password-reset';

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
  const logoUrl = `${env.APP_BASE_URL}/asset/logo.png`;
  
  const { subject, text, html } = buildVerificationEmail({ link, logoUrl });

  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Verification email (console fallback) to=${to} link=${link}`);
    return 'console';
  }

  const t = transportOverride ?? getTransporter();
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
  const { subject, text, html } = buildWelcomeEmail({
    name,
    dashboardUrl: `${env.APP_BASE_URL}/dashboard`,
    logoUrl: `${env.APP_BASE_URL}/asset/logo.png`,      
  });
  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Welcome email (console fallback) to=${to}`);
    return 'console';
  }
  const t = transportOverride ?? getTransporter();
  await t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
  return 'smtp';
}

export async function sendPasswordChangedEmail(
  to: string,
  name?: string,
  meta?: { ip: string; device: string },   // ← TAMBAH
): Promise<'smtp' | 'console'> {
  if (forceFailForTest) throw new Error('Simulated mailer failure');
  const { subject, text, html } = buildPasswordChangedEmail({
    name: name ?? 'there',
    time: new Date(),
    ip: meta?.ip ?? 'unknown',
    device: meta?.device,                    // ← pass device
    // location: SKIP untuk MVP — butuh geolocation API
    logoUrl: `${env.APP_BASE_URL}/asset/logo.png`,
  });
  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Password-changed email (console fallback) to=${to} ip=${meta?.ip}`);
    return 'console';
  }
  const t = transportOverride ?? getTransporter();
  await t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
  return 'smtp';
}

export async function sendEmailChangeVerification(
  to: string, 
  name: string, 
  token: string
): Promise<'smtp' | 'console'> {
  if (forceFailForTest) throw new Error('Simulated mailer failure');
  const link = `${env.APP_BASE_URL}/verify-email-change/${token}`;
  const logoUrl = `${env.APP_BASE_URL}/asset/logo.png`;

  const { subject, text, html } = buildEmailChangeVerification({
    name,
    newEmail: to,
    link,
    logoUrl,
  });

  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Email-change verification (console fallback) to=${to} link=${link}`);
    return 'console';
  }
  const t = transportOverride ?? getTransporter();
  await t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
  return 'smtp';
}

export async function sendEmailChangedNotification(
  to: string, 
  name: string, 
  oldEmail: string, 
  newEmail: string,
  meta?: { ip?: string; device?: string }
): Promise<'smtp' | 'console'> {
  if (forceFailForTest) throw new Error('Simulated mailer failure');
  
  const logoUrl = `${env.APP_BASE_URL}/asset/logo.png`;
  const baseUrl = env.APP_BASE_URL;

  const { subject, text, html } = buildEmailChangedNotification({
    name,
    oldEmail,
    newEmail,
    timestamp: new Date().toUTCString(),
    ip: meta?.ip,
    device: meta?.device,
    logoUrl,
    baseUrl,
  });

  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Email-changed notification (console fallback) to=${to}`);
    return 'console';
  }
  const t = transportOverride ?? getTransporter();
  await t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
  return 'smtp';
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<'smtp' | 'console'> {
  if (forceFailForTest) throw new Error('Simulated mailer failure');
  const link = `${env.APP_BASE_URL}/reset-password/${token}`;
  const logoUrl = `${env.APP_BASE_URL}/asset/logo.png`;
  const { subject, text, html } = buildPasswordResetEmail({ name, link, logoUrl });
  if (!env.SMTP_HOST) {
    console.log(`[MAILER] Password reset email (console fallback) to=${to}`);
    return 'console';
  }
  const t = transportOverride ?? getTransporter();
  await t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
  return 'smtp';
}
