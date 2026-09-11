export function buildWelcomeEmail(params: { 
  name: string; 
  dashboardUrl: string;
  logoUrl: string;      
}) {
  const canvas = "#FAFAF9";
  const black = "#1A1A1A";
  const teal = "#006D77";
  const lavender = "#DCCCFF";
  const white = "#FAFAF9";

  const fontSerif = "'Baskervville', Georgia, serif";
  const fontSans = "'Inter', Arial, sans-serif";
  const fontMono = "'JetBrains Mono', Courier, monospace";

  return {
    subject: "Welcome to SCOPREVO",
    text: `Hi ${params.name},\n\nWelcome to SCOPREVO! Your account is ready.\n\nGo to Dashboard: ${params.dashboardUrl}\n\nSCOPREVO Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0; padding:40px 20px; background-color:${canvas}; font-family:${fontSans}; color:${black};">
        <div style="max-width:540px; margin:0 auto; background-color:${canvas}; border:2px solid ${black}; padding:40px; box-shadow:6px 6px 0px 0px ${black};">
          
          <!-- Header Bar — WITH LOGO -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:32px;">
            <tr>
              <td style="vertical-align:middle;">
                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle; padding-right:10px;">
                      <img src="${params.logoUrl}" alt="SCOPREVO" width="32" height="32" style="display:block; width:32px; height:32px; border:2px solid ${black}; background-color:${canvas};">
                    </td>
                    <td style="vertical-align:middle; font-family:${fontSerif}; font-size:22px; font-weight:bold; color:${black};">
                      SCOPREVO
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right" style="vertical-align:middle;">
                <span style="background-color:${lavender}; color:${black}; border:1px solid ${black}; padding:4px 8px; font-family:${fontMono}; font-size:10px; text-transform:uppercase;">
                  NEW USER • ONBOARDING
                </span>
              </td>
            </tr>
          </table>

          <!-- Main Title -->
          <h1 style="font-family:${fontSerif}; font-size:36px; font-weight:normal; margin:0 0 16px 0; line-height:1.1; text-align:center;">
            Welcome to<br>SCOPREVO
          </h1>
          
          <p style="text-align:center; font-size:15px; color:#444; margin:0 0 32px 0;">
            Hi ${params.name}, your account is completely set up. Turn messy client feedback into actionable, in-scope revision checklists.
          </p>

          <!-- Primary CTA Button -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:32px;">
            <tr>
              <td align="center">
                <a href="${params.dashboardUrl}" style="display:inline-block; background-color:${teal}; color:${white}; text-decoration:none; padding:14px 28px; font-family:${fontSans}; font-weight:600; font-size:13px; text-transform:uppercase; letter-spacing:0.05em; border:2px solid ${black}; box-shadow:4px 4px 0px 0px ${black};">
                  GO TO DASHBOARD &rarr;
                </a>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <div style="border-top:1px solid ${black}; padding-top:20px; text-align:center; font-family:${fontMono}; font-size:11px; color:#666;">
            SCOPREVO TEAM • AUTOMATED SYSTEM NOTIFICATION
          </div>

        </div>
      </body>
      </html>
    `
  };
}