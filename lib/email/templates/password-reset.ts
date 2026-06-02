// Password reset email — plain text, editorial.
//
// The Supabase Auth flow already sends a password recovery email out
// of the box, configured in the Supabase Dashboard. This template is
// the recommended copy to paste into that template editor so the
// outgoing email matches the rest of the brand.

export interface PasswordResetEmailContent {
  subject: string;
  text: string;
}

export function passwordResetEmail(resetUrl: string): PasswordResetEmailContent {
  return {
    subject: 'Reset your Brut password',
    text: [
      'A password reset was requested for your Brut account.',
      '',
      'Open this link within the next hour to set a new password:',
      resetUrl,
      '',
      "If you didn't request a reset, ignore this email — your password",
      'is unchanged.',
      '',
      'The Brut team',
    ].join('\n'),
  };
}
