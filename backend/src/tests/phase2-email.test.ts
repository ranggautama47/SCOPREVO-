import './test-setup';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { db } from '../config/database';
import { accountRepository } from '../repositories/account.repository';
import { authService } from '../services/auth.service';
import {
  __setMailFailForTest,
  __setMailTransportForTest,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
} from '../services/mailer.service';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function runTests(): Promise<void> {
  let passed = 0;
  const original = {
    findByEmail: accountRepository.findByEmail,
    findById: accountRepository.findById,
    create: accountRepository.create,
    updatePassword: accountRepository.updatePassword,
  };

  try {
    assert(await sendWelcomeEmail('welcome@example.com', 'Test User') === 'console', 'welcome console'); passed++;
    const transport = { sendMail: async () => ({}) } as unknown as nodemailer.Transporter;
    __setMailTransportForTest(transport);
    (env as any).SMTP_HOST = 'test.smtp';
    assert(await sendWelcomeEmail('welcome@example.com', 'Test User') === 'smtp', 'welcome smtp'); passed++;
    assert(await sendPasswordChangedEmail('changed@example.com') === 'smtp', 'password changed smtp'); passed++;
    (env as any).SMTP_HOST = '';
    assert(await sendPasswordChangedEmail('changed@example.com') === 'console', 'password changed console'); passed++;

    const passwordHash = await bcrypt.hash('CurrentPassword123!', 12);
    const row: any = {
      id: 'phase2-test-id', name: 'Phase 2 User', email: 'phase2@example.com', password_hash: passwordHash,
      email_verified: false, email_verification_token: null, email_verification_expires_at: null, created_at: new Date(),
    };
    accountRepository.findByEmail = async () => null;
    accountRepository.create = async () => row;
    __setMailFailForTest(true);
    const registered = await authService.register(row.name, row.email, 'CurrentPassword123!');
    assert(registered.account.email === row.email, 'register survives mail failure'); passed++;

    accountRepository.findById = async () => row;
    accountRepository.updatePassword = async () => undefined;
    await authService.changePassword(row.id, 'CurrentPassword123!', 'NewPassword456!');
    passed++;
    console.log(`PHASE 2 EMAIL TESTS: ${passed}/6 PASS`);
  } finally {
    accountRepository.findByEmail = original.findByEmail;
    accountRepository.findById = original.findById;
    accountRepository.create = original.create;
    accountRepository.updatePassword = original.updatePassword;
    __setMailFailForTest(false);
    __setMailTransportForTest(null);
    (env as any).SMTP_HOST = '';
    await db.end();
  }
}

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
