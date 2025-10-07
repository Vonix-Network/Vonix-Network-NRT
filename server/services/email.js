const nodemailer = require('nodemailer');
const { getSetting } = require('../utils/settings');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Initialize email transporter with stored settings
 */
function initializeEmailTransporter() {
  try {
    const emailEnabled = getSetting('EMAIL_ENABLED');
    if (emailEnabled !== '1') {
      logger.info('📧 Email service is disabled');
      return null;
    }

    const host = getSetting('EMAIL_HOST');
    const port = getSetting('EMAIL_PORT') || '587';
    const secure = getSetting('EMAIL_SECURE') === '1';
    const user = getSetting('EMAIL_USER');
    const pass = getSetting('EMAIL_PASS');
    const from = getSetting('EMAIL_FROM') || user;

    if (!host || !user || !pass) {
      logger.warn('📧 Email service not configured - missing required settings');
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    logger.info(`✅ Email service initialized: ${host}:${port}`);
    return transporter;
  } catch (error) {
    logger.error('❌ Failed to initialize email service:', error);
    return null;
  }
}

/**
 * Get or create email transporter
 */
function getTransporter() {
  if (!transporter) {
    transporter = initializeEmailTransporter();
  }
  return transporter;
}

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      logger.warn('📧 Email not sent - service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const from = getSetting('EMAIL_FROM') || getSetting('EMAIL_USER');
    
    const mailOptions = {
      from: from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info(`✅ Email sent to ${to}: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 */
async function testEmailConnection() {
  try {
    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      return { success: false, error: 'Email service not configured' };
    }

    await emailTransporter.verify();
    logger.info('✅ Email connection test successful');
    return { success: true, message: 'Email connection test successful' };
  } catch (error) {
    logger.error('❌ Email connection test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reload email transporter (call after settings change)
 */
function reloadEmailTransporter() {
  if (transporter) {
    try {
      transporter.close();
    } catch (e) {
      // Ignore close errors
    }
  }
  transporter = null;
  return initializeEmailTransporter();
}

/**
 * Send forum notification email
 */
async function sendForumNotification({ to, username, topicTitle, postContent, topicUrl }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Reply in "${topicTitle}"</h1>
        </div>
        <div class="content">
          <p>Hi ${username},</p>
          <p>There's a new reply in a topic you're subscribed to:</p>
          <blockquote style="border-left: 4px solid #6366f1; padding-left: 15px; margin: 15px 0; color: #4b5563;">
            ${postContent.substring(0, 200)}${postContent.length > 200 ? '...' : ''}
          </blockquote>
          <a href="${topicUrl}" class="button">View Topic</a>
        </div>
        <div class="footer">
          <p>You're receiving this because you're subscribed to this topic.</p>
          <p>To unsubscribe, visit the topic and click "Unsubscribe".</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `New reply in "${topicTitle}"`,
    html
  });
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail({ to, username }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Vonix Network!</h1>
        </div>
        <div class="content">
          <p>Hi ${username},</p>
          <p>Welcome to the Vonix Network community! We're excited to have you join us.</p>
          <p>Here's what you can do:</p>
          <ul>
            <li>Join the discussion in our forums</li>
            <li>Connect with other players</li>
            <li>Stay updated with the latest news</li>
            <li>Participate in community events</li>
          </ul>
          <a href="${getSetting('CLIENT_URL') || 'https://vonix.network'}" class="button">Visit the Site</a>
        </div>
        <div class="footer">
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Welcome to Vonix Network!',
    html
  });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail({ to, username, resetUrl }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${username},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour.
          </div>
          <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Password Reset Request - Vonix Network',
    html
  });
}

module.exports = {
  initializeEmailTransporter,
  getTransporter,
  sendEmail,
  testEmailConnection,
  reloadEmailTransporter,
  sendForumNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
