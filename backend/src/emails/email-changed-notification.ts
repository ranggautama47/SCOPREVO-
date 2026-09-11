import { env } from '../config/env';


export function buildEmailChangedNotification(params: {
  name: string;
  oldEmail: string;
  newEmail: string;
  timestamp: string;
  ip?: string;
  device?: string;
  logoUrl?: string;
  baseUrl?: string;
}): { subject: string; text: string; html: string } {
  const canvas = "#FAFAF9";
  const black = "#1A1A1A";
  const yellow = "#FDFFB6";
  const red = "#E63946";
  const lavender = "#DCCCFF";
  
  const baseUrl = params.baseUrl || env.APP_BASE_URL;;

  const fontSerif = "'Baskervville', Georgia, serif";
  const fontSans = "'Inter', Arial, sans-serif";
  const fontMono = "'JetBrains Mono', 'Courier New', Courier, monospace";

  const logoHtml = params.logoUrl
    ? `<img src="${params.logoUrl}" alt="SCOPREVO Logo" width="28" height="28" style="display:inline-block; width:28px; height:28px; border:2px solid ${black}; vertical-align:middle; margin-right:10px; background-color:#006D77;">`
    : `<span style="display:inline-block; width:28px; height:28px; background-color:#006D77; border:2px solid ${black}; vertical-align:middle; margin-right:10px;"></span>`;

  return {
    subject: "SECURITY NOTIFICATION: Your Email Was Changed",
    text: `SECURITY NOTIFICATION\n\nYour Email Was Changed\nHello ${params.name}, this is a confirmation that your SCOPREVO account email address was successfully changed.\n\nDATE & TIME : ${params.timestamp}\nOLD EMAIL   : ${params.oldEmail}\nNEW EMAIL   : ${params.newEmail}\nIP ADDRESS  : ${params.ip || "203.0.113.45"}\nDEVICE      : ${params.device || "Windows 10/11 / Chrome 124"}\nSYSTEM      : SCOPREVO Account Settings\n\nIf you did NOT make this change, secure your account immediately and contact support.\n\nStay safe,\nThe SCOPREVO Security Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Baskervville&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap');
        </style>
      </head>
      <body style="margin:0; padding:40px 20px; background-color:${canvas}; color:${black}; font-family:${fontSans};">
        
        <!-- Main Card Container -->
        <div style="max-width:580px; margin:0 auto; background-color:${canvas}; border:2px solid ${black}; box-shadow:6px 6px 0px 0px ${black};">
          
          <!-- Header Bar -->
          <div style="padding:24px 32px; border-bottom:1px solid ${black};">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="left" style="vertical-align:middle;">
                  ${logoHtml}
                  <span style="font-family:${fontSerif}; font-size:22px; font-weight:bold; vertical-align:middle; letter-spacing:-0.5px;">SCOPREVO</span>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="display:inline-block; background-color:${lavender}; color:${black}; border:1px solid ${black}; padding:4px 10px; font-family:${fontMono}; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">
                    SECURITY • ACCOUNT ALERT
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Body Content -->
          <div style="padding:32px;">
            
            <div style="font-family:${fontMono}; font-size:11px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; color:${black};">
              SECURITY NOTIFICATION
            </div>

            <h1 style="font-family:${fontSerif}; font-size:38px; font-weight:normal; margin:0 0 16px 0; line-height:1.1; letter-spacing:-0.5px;">
              Your Email Was Changed
            </h1>

            <p style="font-family:${fontSerif}; font-size:15px; margin:0 0 28px 0; color:#333; line-height:1.5;">
              Hello ${params.name}, this is a confirmation that your SCOPREVO account email address was successfully changed.
            </p>

            <!-- Yellow Alert Box (Style Qwen) -->
            <div style="background-color:${yellow}; border:2px solid ${black}; padding:28px; margin-bottom:28px;">
              
              <h2 style="font-family:${fontSerif}; font-size:28px; font-weight:normal; margin:0 0 12px 0; padding-bottom:12px; border-bottom:2px solid ${black}; letter-spacing:-0.5px;">
                ⚠️ Email Address Changed
              </h2>

              <p style="font-family:${fontSerif}; font-size:14px; margin:0 0 4px 0; color:#333;">
                Your email has been updated successfully.
              </p>
              <p style="font-family:${fontSerif}; font-size:14px; margin:0 0 24px 0; color:#333;">
                If this was you, no further action is needed.
              </p>

              <!-- Metadata Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family:${fontMono}; font-size:12px; line-height:1.8; margin-bottom:24px;">
                <tr>
                  <td width="120" style="padding:2px 0;">DATE & TIME</td>
                  <td style="padding:2px 0;">: ${params.timestamp}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;">OLD EMAIL</td>
                  <td style="padding:2px 0;">: ${params.oldEmail}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;">NEW EMAIL</td>
                  <td style="padding:2px 0;">: ${params.newEmail}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;">IP ADDRESS</td>
                  <td style="padding:2px 0;">: ${params.ip || "203.0.113.45"}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;">DEVICE</td>
                  <td style="padding:2px 0;">: ${params.device || "Windows 10/11 / Chrome 124"}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;">SYSTEM</td>
                  <td style="padding:2px 0;">: SCOPREVO Account Settings</td>
                </tr>
              </table>

              <!-- CTA Button inside Yellow Box -->
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${baseUrl}/settings" style="display:inline-block; background-color:${canvas}; color:${black}; border:2px solid ${black}; box-shadow:4px 4px 0px 0px ${black}; padding:12px 20px; text-decoration:none; font-family:${fontSans}; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:1px;">
                      SECURE MY ACCOUNT &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </div>

            <!-- Red Warning Line -->
            <div style="border-left:3px solid ${red}; padding-left:12px; text-align:left; font-family:${fontSerif}; font-size:13px; color:#333; line-height:1.4; margin-bottom:28px;">
              If you did <strong>NOT</strong> make this change, secure your account immediately and contact support.
            </div>

            <p style="font-family:${fontSerif}; font-size:14px; margin:0; color:#333;">
              Stay safe,<br>
              <strong>The SCOPREVO Security Team</strong>
            </p>

          </div>

          <!-- Footer -->
          <div style="border-top:1px solid ${black}; padding:20px 32px; font-family:${fontMono}; font-size:10px; color:#666; line-height:1.6; text-transform:uppercase; letter-spacing:0.5px; text-align:center;">
            <div>SCOPREVO SECURITY SYSTEMS</div>
            <div>THIS IS AN AUTOMATED MESSAGE. DO NOT REPLY.</div>
          </div>

        </div>

      </body>
      </html>
    `
  };
}