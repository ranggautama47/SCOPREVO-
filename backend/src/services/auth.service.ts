import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { accountRepository } from "../repositories/account.repository";
import { env } from "../config/env";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  TooManyRequestsError,
} from "../middleware/error.middleware";
import {
  sendPasswordChangedEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendEmailChangeVerification,
  sendEmailChangedNotification,
  sendPasswordResetEmail,
} from "./mailer.service";

const SALT_ROUNDS = 12;
export interface AuthResult {
  token: string;
  account: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    emailVerified: boolean;
  };
}
export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResult> {
    const existing = await accountRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError(
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists.",
      );
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const row = await accountRepository.create({ name, email, passwordHash });
    try {
      await sendWelcomeEmail(email, name);
    } catch (err) {
      console.warn(
        `[MAILER] Welcome email failed for ${email}: ${(err as Error).message}`,
      );
    }
    const token = issueToken(row.id);
    return {
      token,
      account: {
        id: row.id,
        name: row.name,
        email: row.email,
        createdAt: row.created_at,
        emailVerified: row.email_verified,
      },
    };
  },
  async login(email: string, password: string): Promise<AuthResult> {
    const row = await accountRepository.findByEmail(email);
    const invalid = new UnauthorizedError("Invalid email or password.");
    if (!row) throw invalid;
    const passwordMatch = await bcrypt.compare(password, row.password_hash);
    if (!passwordMatch) throw invalid;
    const token = issueToken(row.id);
    return {
      token,
      account: {
        id: row.id,
        name: row.name,
        email: row.email,
        createdAt: row.created_at,
        emailVerified: row.email_verified,
      },
    };
  },

  async changePassword(
    accountId: string,
    currentPassword: string,
    newPassword: string,
    meta?: { ip: string; device: string },
  ): Promise<void> {
    const row = await accountRepository.findById(accountId);
    if (!row) {
      throw new NotFoundError("Account not found.");
    }
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      row.password_hash,
    );
    if (!passwordMatch) {
      throw new UnauthorizedError(
        "Invalid credentials.",
        "INVALID_CREDENTIALS",
      );
    }
    if (currentPassword === newPassword) {
      throw new ConflictError(
        "PASSWORD_UNCHANGED",
        "New password must be different from current password.",
      );
    }
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await accountRepository.updatePassword(accountId, newPasswordHash);
    try {
      await sendPasswordChangedEmail(row.email, row.name, meta);
    } catch (err) {
      console.warn(
        `[MAILER] Password-changed email failed for ${row.email}: ${(err as Error).message}`,
      );
    }
  },

  async requestEmailVerification(
    accountId: string,
  ): Promise<{
    message: string;
    deliveredVia: "smtp" | "console";
    expiresAt: Date;
  }> {
    const row = await accountRepository.findById(accountId);
    if (!row) {
      throw new NotFoundError("Account not found.");
    }
    if (row.email_verification_token && row.email_verification_expires_at) {
      const now = new Date();
      const expiresAt = new Date(row.email_verification_expires_at);
      const secondsSinceCreated =
        (expiresAt.getTime() - 24 * 60 * 60 * 1000 - now.getTime()) / 1000;
      if (secondsSinceCreated > -60) {
        throw new TooManyRequestsError(
          "VERIFICATION_COOLDOWN",
          "Verification email already sent recently. Please wait before requesting again.",
        );
      }
    }
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await accountRepository.setVerificationToken(accountId, token, expiresAt);
    let deliveredVia: "smtp" | "console" = "console";
    try {
      deliveredVia = await sendVerificationEmail(row.email, token);
    } catch (err) {
      console.warn(
        `[MAILER] SMTP send failed, falling back to console. Error: ${(err as Error).message}`,
      );
      deliveredVia = "console";
    }
    return { message: "Verification email sent.", deliveredVia, expiresAt };
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const row = await accountRepository.findIdByVerificationToken(token);
    if (!row) {
      throw new NotFoundError("Invalid or expired verification link.");
    }
    const expiresAt = row.expiresAt ? new Date(row.expiresAt) : null;
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      throw new ConflictError(
        "TOKEN_EXPIRED",
        "Verification token has expired.",
      );
    }
    await accountRepository.markEmailVerified(row.id);
    return { message: "Email verified successfully." };
  },

  async me(
    accountId: string,
  ): Promise<{
    account: {
      id: string;
      name: string;
      email: string;
      createdAt: Date;
      emailVerified: boolean;
    };
  }> {
    const row = await accountRepository.findById(accountId);
    if (!row) {
      throw new NotFoundError("Account not found.");
    }
    return {
      account: {
        id: row.id,
        name: row.name,
        email: row.email,
        createdAt: row.created_at,
        emailVerified: row.email_verified,
      },
    };
  },
  async requestEmailChange(
    accountId: string,
    newEmail: string,
    currentPassword: string,
  ): Promise<{
    message: string;
    deliveredVia: "smtp" | "console";
    expiresAt: Date;
  }> {
    const row = await accountRepository.findById(accountId);
    if (!row) throw new NotFoundError("Account not found.");
    if (!(await bcrypt.compare(currentPassword, row.password_hash)))
      throw new UnauthorizedError(
        "Invalid credentials.",
        "INVALID_CREDENTIALS",
      );
    const target = newEmail.trim().toLowerCase();
    if (target === row.email)
      throw new ConflictError(
        "EMAIL_UNCHANGED",
        "New email must differ from current email.",
      );
    const existing = await accountRepository.findByEmail(target);
    if (existing && existing.id !== accountId)
      throw new ConflictError(
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists.",
      );
    if (row.email_change_expires_at) {
      const requestedAt = new Date(
        row.email_change_expires_at.getTime() - 60 * 60 * 1000,
      );
      const secondsSinceRequested = (Date.now() - requestedAt.getTime()) / 1000;
      if (secondsSinceRequested < 60)
        throw new TooManyRequestsError(
          "EMAIL_CHANGE_COOLDOWN",
          "Email change already requested recently. Please wait before requesting again.",
        );
    }
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    try {
      await accountRepository.setPendingEmailChange(
        accountId,
        target,
        token,
        expiresAt,
      );
    } catch (err) {
      if ((err as any).code === "23505")
        throw new ConflictError(
          "EMAIL_ALREADY_EXISTS",
          "An account is already using or pending this email.",
        );
      throw err;
    }
    let deliveredVia: "smtp" | "console" = "console";
    try {
      deliveredVia = await sendEmailChangeVerification(target, row.name, token);
    } catch (err) {
      console.warn(
        `[MAILER] Email-change verification failed for ${target}: ${(err as Error).message}`,
      );
    }
    return { message: "Verification email sent.", deliveredVia, expiresAt };
  },
  async verifyEmailChange(token: string): Promise<{ message: string }> {
    const row = await accountRepository.findByEmailChangeToken(token);
    if (!row) throw new NotFoundError("Invalid or expired verification link.");
    const result = await accountRepository.applyEmailChange(row.id, token);
    if (!result)
      throw new ConflictError(
        "TOKEN_EXPIRED",
        "Verification token has expired or already been used.",
      );
    try {
      await sendEmailChangedNotification(
        row.currentEmail,
        row.name,
        row.currentEmail,
        result.newEmail,
      );
    } catch (err) {
      console.warn(
        `[MAILER] Email-changed notification failed for ${row.currentEmail}: ${(err as Error).message}`,
      );
    }
    return { message: "Email changed successfully." };
  },
  async requestPasswordReset(email: string): Promise<{ message: string; deliveredVia: 'smtp' | 'console'; expiresAt: Date }> {
    const message = 'If an account exists for this email, a reset link has been sent.';
    const account = await accountRepository.findAccountByEmail(email.trim().toLowerCase());
    if (!account) return { message, deliveredVia: 'console', expiresAt: new Date(Date.now() + 60 * 60 * 1000) };
    if (account.password_reset_expires_at) {
      const requestedAt = new Date(account.password_reset_expires_at.getTime() - 60 * 60 * 1000);
      if ((Date.now() - requestedAt.getTime()) / 1000 < 60) throw new TooManyRequestsError('RESET_COOLDOWN', 'Password reset already requested recently. Please wait before requesting again.');
    }
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await accountRepository.setPasswordResetToken(account.id, token, expiresAt);
    let deliveredVia: 'smtp' | 'console' = 'console';
    try { deliveredVia = await sendPasswordResetEmail(account.email, account.name, token); } catch (err) { console.warn(`[MAILER] Password reset email failed for ${account.email}: ${(err as Error).message}`); }
    return { message, deliveredVia, expiresAt };
  },
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const result = await accountRepository.consumePasswordResetToken(token, await bcrypt.hash(newPassword, SALT_ROUNDS));
    if (!result) throw new NotFoundError('Invalid or expired reset link.');
    return { message: 'Password has been reset successfully. Please sign in with your new password.' };
  },
};
function issueToken(accountId: string): string {
  return jwt.sign({ accountId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}
