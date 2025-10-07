const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { getSetting, setSetting } = require('../utils/settings');
const { testEmailConnection, reloadEmailTransporter } = require('../services/email');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/admin/email/settings - Get email configuration
router.get('/settings', authenticateToken, isAdmin, (req, res) => {
  try {
    const settings = {
      enabled: getSetting('EMAIL_ENABLED') === '1',
      host: getSetting('EMAIL_HOST') || '',
      port: getSetting('EMAIL_PORT') || '587',
      secure: getSetting('EMAIL_SECURE') === '1',
      user: getSetting('EMAIL_USER') || '',
      from: getSetting('EMAIL_FROM') || getSetting('EMAIL_USER') || '',
      // Don't send password to client
      hasPassword: !!getSetting('EMAIL_PASS')
    };

    res.json(settings);
  } catch (error) {
    logger.error('Error fetching email settings:', error);
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
});

// POST /api/admin/email/settings - Update email configuration
router.post('/settings', authenticateToken, isAdmin, (req, res) => {
  try {
    const { enabled, host, port, secure, user, password, from } = req.body;

    // Validate required fields if email is enabled
    if (enabled) {
      if (!host || !user) {
        return res.status(400).json({ 
          error: 'Host and user are required when email is enabled' 
        });
      }
    }

    // Update settings
    setSetting('EMAIL_ENABLED', enabled ? '1' : '0');
    if (host) setSetting('EMAIL_HOST', host);
    if (port) setSetting('EMAIL_PORT', port.toString());
    setSetting('EMAIL_SECURE', secure ? '1' : '0');
    if (user) setSetting('EMAIL_USER', user);
    if (password) setSetting('EMAIL_PASS', password); // Only update if provided
    if (from) setSetting('EMAIL_FROM', from);

    // Reload email transporter with new settings
    reloadEmailTransporter();

    logger.info(`📧 Email settings updated by admin: ${req.user.username}`);

    res.json({
      success: true,
      message: 'Email settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating email settings:', error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

// POST /api/admin/email/test - Test email configuration
router.post('/test', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ error: 'Test email address required' });
    }

    // Test connection
    const connectionTest = await testEmailConnection();
    if (!connectionTest.success) {
      return res.json({
        success: false,
        error: connectionTest.error,
        message: 'Email connection test failed'
      });
    }

    // Send test email
    const { sendEmail } = require('../services/email');
    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email from Vonix Network',
      html: `
        <h1>Email Configuration Test</h1>
        <p>This is a test email from your Vonix Network installation.</p>
        <p>If you're receiving this, your email configuration is working correctly!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Sent at: ${new Date().toISOString()}<br>
          From: ${getSetting('EMAIL_FROM') || getSetting('EMAIL_USER')}
        </p>
      `
    });

    if (result.success) {
      logger.info(`✅ Test email sent to ${testEmail} by admin: ${req.user.username}`);
      res.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`
      });
    } else {
      res.json({
        success: false,
        error: result.error,
        message: 'Failed to send test email'
      });
    }
  } catch (error) {
    logger.error('Error testing email:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to test email configuration'
    });
  }
});

module.exports = router;
