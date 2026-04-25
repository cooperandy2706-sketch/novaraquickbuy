// FILE: src/lib/services/email.js
import { Resend } from 'resend';

let resendInstance = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY || process.env.NEXT_RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || process.env.NEXT_RESEND_FROM_EMAIL || 'notifications@novaraquickbuy.com';

/**
 * Core Email Service using Resend
 */
export const EmailService = {
  /**
   * Send a general email
   */
  async send({ to, subject, html, from = DEFAULT_FROM, reply_to }) {
    if (!process.env.RESEND_API_KEY && !process.env.NEXT_RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return { error: 'Email service not configured' };
    }

    try {
      const resend = getResend();
      if (!resend) {
        console.error('Resend client could not be initialized (missing API key)');
        return { error: 'Email service not configured' };
      }

      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html: wrapWithTheme(subject, html),
        reply_to,
      });

      if (error) {
        console.error('Resend Error:', error);
        return { error: error.message };
      }

      return { success: true, id: data.id };
    } catch (err) {
      console.error('Email Service Exception:', err);
      return { error: err.message };
    }
  },

  /**
   * Send a test email
   */
  async sendTest(to) {
    return this.send({
      to,
      subject: 'Test Notification from Novara QuickBuy',
      html: '<p>If you are seeing this, your Resend integration is working perfectly! 🚀</p>',
    });
  }
};

/**
 * Standard email wrapper with premium aesthetics
 */
function wrapWithTheme(title, content) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .logo {
            color: #ffffff;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
            text-decoration: none;
          }
          .content {
            padding: 40px;
          }
          .footer {
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
          h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 24px; }
          p { margin-bottom: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0f172a;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 20px;
          }
          .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 32px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="https://novaraquickbuy.com" class="logo">NOVARA</a>
          </div>
          <div class="content">
            <h1>${title}</h1>
            ${content}
            <div class="divider"></div>
            <p style="font-size: 14px; color: #64748b;">
              Need help? Contact us at support@novaraquickbuy.com.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Novara QuickBuy. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
}
