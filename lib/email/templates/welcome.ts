// Welcome email — plain text, editorial. Sent once after onboarding completes.

export interface WelcomeEmailContent {
  subject: string;
  text: string;
}

export function welcomeEmail(firstName: string): WelcomeEmailContent {
  const safeName = firstName.trim() || 'athlete';
  return {
    subject: 'Welcome to Brut',
    text: [
      `Hi ${safeName},`,
      '',
      'Welcome to Brut.',
      '',
      "You're in. Here's what you can do:",
      '',
      '— Plan a single session at brut-train',
      '— Build a full race programme at brut-race',
      '— Track your nutrition with every workout',
      '',
      'If you have questions, reply to this email.',
      '',
      'Train smart,',
      'The Brut team',
    ].join('\n'),
  };
}
