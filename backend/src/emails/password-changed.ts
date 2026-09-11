import { env } from '../config/env';


export function buildPasswordChangedEmail(params: {
  name: string;
  time: string | Date;
  ip?: string;
  location?: string;
  device?: string;
  logoUrl?: string;
  baseUrl?: string;
}) {
  const canvas = "#FAFAF9";
  const black = "#1A1A1A";
  const yellow = "#FDFFB6";

  const fontSerif = "'Baskervville', Georgia, serif";
  const fontMono = "'JetBrains Mono', 'Courier New', Courier, monospace";

  function formatTimestamp(input: string | Date): string {
    const d = typeof input === "string" ? new Date(input) : input;
    if (isNaN(d.getTime())) return String(input);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${month} ${day}, ${year} ${hh}:${mm}:${ss} UTC`;
  }

  const formattedTime = formatTimestamp(params.time);
  const safeName = params.name || "there";
  const baseUrl = params.baseUrl || env.APP_BASE_URL;

  const logoBlock = params.logoUrl
    ? `<img src="${params.logoUrl}" alt="SCOPREVO" width="28" height="28" style="display:inline-block; vertical-align:middle; width:28px; height:28px; margin-right:10px; border:2px solid ${black}; background-color:${canvas};" />`
    : "";

  const ipRow = params.ip
    ? `<tr><td width="120" style="padding:2px 0;">IP ADDRESS</td><td style="padding:2px 0;">: ${params.ip}</td></tr>`
    : "";

  const locationRow = params.location
    ? `<tr><td width="120" style="padding:2px 0;">LOCATION</td><td style="padding:2px 0;">: ${params.location}</td></tr>`
    : "";

  const deviceRow = params.device
    ? `<tr><td width="120" style="padding:2px 0;">DEVICE</td><td style="padding:2px 0;">: ${params.device}</td></tr>`
    : "";

  return {
    subject: "SECURITY NOTIFICATION: Password Changed",
    text: `Hello ${safeName},\n\nThis email is to inform you of a recent change to your account password.\n\nIf you did not make this change, secure your account immediately.\n\nDATE & TIME: ${formattedTime}\n\nStay safe,\nThe SCOPREVO Security Team`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Baskervville&family=JetBrains+Mono:wght@400;700&display=swap');
  </style>
</head>
<body style="margin:0; padding:40px 20px; background-color:${canvas}; color:${black}; font-family:${fontMono};">
  <div style="max-width:600px; margin:0 auto; background-color:${canvas};">

    <!-- HEADER WITH LOGO -->
    <table border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="vertical-align:middle;">${logoBlock}</td>
        <td style="vertical-align:middle;">
          <span style="display:inline-block; background-color:${black}; color:${canvas}; padding:8px 16px; font-size:24px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">SCOPREVO</span>
        </td>
      </tr>
    </table>
    <div style="font-size:12px; letter-spacing:2px; padding:8px 0; border-bottom:1px solid ${black}; text-transform:uppercase;">SECURITY SYSTEMS</div>

    <h2 style="font-size:16px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin:32px 0 24px 0;">SECURITY NOTIFICATION</h2>

    <p style="font-size:14px; line-height:1.6; margin:0 0 16px 0;">Hello ${safeName},</p>
    <p style="font-size:14px; line-height:1.6; margin:0 0 16px 0;">This email is to inform you of a recent change to your account password.</p>
    <p style="font-size:14px; line-height:1.6; margin:0 0 32px 0;">If you did not make this change, secure your account immediately.</p>

    <!-- YELLOW ALERT BOX -->
    <div style="background-color:${yellow}; border:2px solid ${black}; padding:32px; margin-bottom:32px;">
      <h1 style="font-family:${fontSerif}; font-size:42px; font-weight:normal; margin:0 0 24px 0; padding-bottom:16px; border-bottom:2px solid ${black}; letter-spacing:-1px;">⚠️ Password Changed</h1>

      <p style="font-size:14px; line-height:1.6; margin:0 0 8px 0;">Your account password was changed successfully.</p>
      <p style="font-size:14px; line-height:1.6; margin:0 0 24px 0;">If this was you, no further action is needed.</p>

      <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom:32px;">
        <tr>
          <td>
            <!-- Di file TS/HTML -->
<a href="${baseUrl}/settings" style="display:inline-block; background-color:#FAFAF9; color:#1A1A1A; border:2px solid #1A1A1A; padding:12px 24px; text-decoration:none; font-weight:bold; font-size:14px; letter-spacing:1px; text-transform:uppercase;">
  SECURE ACCOUNT
</a>
          </td>
        </tr>
      </table>

      <div style="border-top:2px solid ${black}; padding-top:16px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family:${fontMono}; font-size:12px; line-height:1.8;">
          <tr>
            <td width="120" style="padding:2px 0;">DATE & TIME</td>
            <td style="padding:2px 0;">: ${formattedTime}</td>
          </tr>
          ${ipRow}
          ${locationRow}
          ${deviceRow}
          <tr>
            <td width="120" style="padding:2px 0;">SYSTEM</td>
            <td style="padding:2px 0;">: SCOPREVO Account Settings</td>
          </tr>
        </table>
      </div>
    </div>

    <p style="font-size:14px; line-height:1.6; margin:0 0 32px 0;">Stay safe,<br><strong>The SCOPREVO Security Team</strong></p>

    <div style="border-top:2px solid ${black}; padding-top:16px; font-size:10px; color:#555; line-height:1.6; text-transform:uppercase; letter-spacing:1px;">
      SCOPREVO SECURITY SYSTEMS<br>
      THIS IS AN AUTOMATED MESSAGE. DO NOT REPLY.
    </div>

  </div>
</body>
</html>`,
  };
}
