export function buildVerificationEmail(link: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Verify your email',
    text: `Please verify your email by visiting: ${link}`,
    html: `<p>Please verify your email by clicking <a href="${link}">this link</a>.</p>`,
  };
}
