/**
 * Email Service (Stated: Resend Removed)
 * 
 * Note: Resend has been removed from the codebase.
 * Authentication emails (verification, reset) are handled automatically by Supabase.
 * Business notifications are now handled via Native Push Notifications.
 */

export const EmailService = {
  /**
   * Send a general email (No-op)
   */
  async send({ to, subject, html, from, reply_to }) {
    console.log(`[EmailService] Suppression: Resend is inactive. Would have sent "${subject}" to ${to}.`);
    return { success: true, id: 'disabled' };
  },

  /**
   * Send a test email (No-op)
   */
  async sendTest(to) {
    console.log(`[EmailService] Suppression: Test email to ${to} skipped.`);
    return { success: true };
  }
};
