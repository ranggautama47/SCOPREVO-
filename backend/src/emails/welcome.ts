export function buildWelcomeEmail(name: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Welcome to SCOPREVO',
    text: `Welcome to SCOPREVO, ${name}! Your account has been created successfully.`,
    html: `<p>Welcome to SCOPREVO, ${name}!</p><p>Your account has been created successfully.</p>`,
  };
}
