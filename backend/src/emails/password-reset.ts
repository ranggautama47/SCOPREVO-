export function buildPasswordResetEmail(params: {
  name: string;
  link: string;
  logoUrl?: string;
}): { subject: string; text: string; html: string } {
  const { name, link, logoUrl } = params;

  const canvas = "#FAFAF9";
  const black = "#1A1A1A";
  const teal = "#006D77";
  const yellow = "#FDFFB6";
  const white = "#FAFAF9";

  const fontSerif = "'Baskervville', Georgia, serif";
  const fontSans = "'Inter', Arial, sans-serif";
  const fontMono = "'JetBrains Mono', 'Courier New', Courier, monospace";

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="SCOPREVO Logo" width="28" height="28" style="display:inline-block; width:28px; height:28px; border:2px solid ${black}; vertical-align:middle; margin-right:10px; background-color:${teal};">`
    : `<span style="display:inline-block; width:28px; height:28px; background-color:${teal}; border:2px solid ${black}; vertical-align:middle; margin-right:10px;"></span>`;

  return {
    subject: "Reset your SCOPREVO password",
    text: `PASSWORD RESET REQUEST\n\nReset Your Password\nHi ${name}, we received a request to reset your SCOPREVO password. Click below to set a new one:\n${link}\n\nTHIS LINK EXPIRES IN 1 HOUR\nFor your security, password reset links only work once and expire quickly.\n\nDidn't request this? You can safely ignore this email. Your password will remain unchanged.\n\nSCOPREVO TEAM • AUTOMATED SYSTEM NOTIFICATION`,
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
        <div style="max-width:580px; margin:0 auto; background-color:${canvas}; border:2px solid ${black}; box-shadow:6px 6px 0px 0px ${black}; text-align:center;">
          
          <!-- Header Bar -->
          <div style="padding:24px 32px; border-bottom:1px solid ${black};">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="left" style="vertical-align:middle;">
                  ${logoHtml}
                  <span style="font-family:${fontSerif}; font-size:22px; font-weight:bold; vertical-align:middle; letter-spacing:-0.5px;">SCOPREVO</span>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="display:inline-block; background-color:${yellow}; color:${black}; border:1px solid ${black}; padding:4px 10px; font-family:${fontMono}; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">
                    SECURITY • PASSWORD RESET
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Body Content -->
          <div style="padding:40px 32px 32px 32px;">
            
            <div style="font-family:${fontMono}; font-size:11px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; color:${black};">
              PASSWORD RESET REQUEST
            </div>

            <h1 style="font-family:${fontSerif}; font-size:42px; font-weight:normal; margin:0 0 16px 0; line-height:1.1; letter-spacing:-0.5px;">
              Reset Your Password
            </h1>

            <p style="font-family:${fontSerif}; font-size:15px; margin:0 0 28px 0; color:#333; line-height:1.5;">
              Hi ${name}, we received a request to reset your SCOPREVO<br>password. Click below to set a new one.
            </p>

            <!-- Primary CTA Button -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${link}" style="display:inline-block; background-color:${teal}; color:${white}; border:2px solid ${black}; box-shadow:4px 4px 0px 0px ${black}; padding:14px 28px; text-decoration:none; font-family:${fontSans}; font-weight:600; font-size:13px; text-transform:uppercase; letter-spacing:1px;">
                    RESET PASSWORD &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Fallback Link Block -->
            <p style="font-family:${fontSerif}; font-style:italic; font-size:13px; margin:0 0 8px 0; color:#444;">
              Or copy this link into your browser:
            </p>

            <div style="display:inline-block; background-color:#F0F0EE; border:1px solid ${black}; padding:8px 16px; font-family:${fontMono}; font-size:12px; margin-bottom:28px; word-break:break-all;">
              ${link}
            </div>

            <!-- Yellow Warning Box -->
            <div style="background-color:${yellow}; border:1px solid ${black}; padding:16px 20px; text-align:center; margin-bottom:28px;">
              <div style="font-family:${fontMono}; font-size:11px; font-weight:bold; letter-spacing:1px; margin-bottom:6px;">
                ⏱ THIS LINK EXPIRES IN 1 HOUR
              </div>
              <div style="font-family:${fontSerif}; font-size:13px; color:#333; line-height:1.4;">
                For your security, password reset links only work once and expire quickly.
              </div>
            </div>

            <!-- Security Note Block -->
            <div style="border-left:2px solid ${black}; padding-left:12px; text-align:left; font-family:${fontSerif}; font-size:13px; color:#555; line-height:1.4;">
              Didn't request this? You can safely ignore this email. Your password will remain unchanged.
            </div>

          </div>

          <!-- Footer -->
          <div style="border-top:1px solid ${black}; padding:20px 32px; font-family:${fontMono}; font-size:10px; color:#666; line-height:1.6; text-transform:uppercase; letter-spacing:0.5px;">
            SCOPREVO TEAM • AUTOMATED SYSTEM NOTIFICATION
          </div>

        </div>

      </body>
      </html>
    `
  };
}