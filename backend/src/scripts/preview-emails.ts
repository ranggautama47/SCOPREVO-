import * as fs from "fs";
import * as path from "path";
import { buildVerificationEmail } from "../emails/verification";
import { buildWelcomeEmail } from "../emails/welcome";
import { buildPasswordChangedEmail } from "../emails/password-changed";
import { buildEmailChangeVerification } from "../emails/email-change-verification";
import { buildEmailChangedNotification } from "../emails/email-changed-notification";
import { buildPasswordResetEmail } from "../emails/password-reset";

const outDir = path.join(__dirname, "..", "..", "email-preview");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const previews: Array<{
  file: string;
  mail: { subject: string; text: string; html: string };
}> = [
  {
    file: "verification.html",
    mail: buildVerificationEmail({
      link: "http://localhost:5173/verify-email/demo-token-123",
      logoUrl: "http://localhost:5173/asset/logo.png",
    }),
  },
  {
    file: "welcome.html",
    mail: buildWelcomeEmail({
      name: "Rangga",
      dashboardUrl: "http://localhost:5173/dashboard",
      logoUrl: "http://localhost:5173/asset/logo.png",
    }),
  },
  {
    file: "password-changed.html",
    mail: buildPasswordChangedEmail({
      name: "Rangga",
      time: new Date(),
      ip: "203.0.113.45",
      device: "Windows 10/11 / Chrome 124",
      logoUrl: "http://localhost:5173/asset/logo.png",
    }),
  },
  {
    file: "email-change-verification.html",
    mail: buildEmailChangeVerification({
      name: "Rangga",
      newEmail: "newemail@example.com",
      link: "http://localhost:5173/verify-email-change/abc123xyz",
      logoUrl: "http://localhost:5173/asset/logo.png",
    }),
  },
  {
    file: "email-changed-notification.html",
    mail: buildEmailChangedNotification({
      name: "Alex",
      oldEmail: "oldaddress@example.com",
      newEmail: "newaddress@example.com",
      timestamp: "Sep 11, 2026 06:44:02 UTC",
      ip: "203.0.113.45",
      device: "Windows 10/11 / Chrome 124",
      logoUrl: "http://localhost:5173/asset/logo.png",
      baseUrl: "http://localhost:5173",
    }),
  },
  {
    file: "password-reset.html",
    mail: buildPasswordResetEmail({
      name: "Rangga",
      link: "http://localhost:5173/reset-password/abc123xyz456",
      logoUrl: "http://localhost:5173/asset/logo.png",
    }),
  },
];

console.log("\n=== SCOPREVO Email Preview ===\n");

for (const { file, mail } of previews) {
  const wrapped = `<!--\n  SUBJECT: ${mail.subject}\n  PREVIEW FILE: ${file}\n-->\n${mail.html}`;
  fs.writeFileSync(path.join(outDir, file), wrapped, "utf-8");
  console.log(`✔ ${file}`);
  console.log(`   Subject: ${mail.subject}`);
  console.log(`   Path:    ${path.join(outDir, file)}\n`);
}

console.log(`All files written to: ${outDir}`);
console.log("Buka salah satu file .html di browser untuk preview.\n");
