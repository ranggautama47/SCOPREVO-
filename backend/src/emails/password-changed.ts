export function buildPasswordChangedEmail(): { subject: string; text: string; html: string } {
  const timestamp = new Date().toISOString();
  return {
    subject: 'Your password was changed',
    text: `Your SCOPREVO password was changed successfully at ${timestamp}. If you did not make this change, please contact support.`,
    html: `<p>Your SCOPREVO password was changed successfully at ${timestamp}.</p><p>If you did not make this change, please contact support.</p>`,
  };
}
