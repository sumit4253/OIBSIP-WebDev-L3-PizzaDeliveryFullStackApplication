const nodemailer = require('nodemailer');
const { verificationEmailTemplate }   = require('../emails/verificationEmail');
const { forgotPasswordEmailTemplate } = require('../emails/forgotPasswordEmail');
const { orderConfirmEmailTemplate }   = require('../emails/orderConfirmEmail');
const { lowStockEmailTemplate }       = require('../emails/lowStockEmail');

/**
 * Create Nodemailer transporter
 * Uses Gmail SMTP with app password
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,  // true for port 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Base email sender function
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();

    // Verify connection in development
    if (process.env.NODE_ENV === 'development') {
      await transporter.verify();
    }

    const info = await transporter.sendMail({
      from:    process.env.EMAIL_FROM || `Pizza App <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // Don't throw — email failure shouldn't crash the app
    return { success: false, error: error.message };
  }
};

/**
 * Send email verification OTP
 */
const sendVerificationEmail = async (email, name, otp) => {
  return sendEmail({
    to:      email,
    subject: '🍕 Verify Your Email - Pizza App',
    html:    verificationEmailTemplate(name, otp),
  });
};

/**
 * Send forgot password OTP
 */
const sendForgotPasswordEmail = async (email, name, otp) => {
  return sendEmail({
    to:      email,
    subject: '🔑 Reset Your Password - Pizza App',
    html:    forgotPasswordEmailTemplate(name, otp),
  });
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async (email, name, order) => {
  return sendEmail({
    to:      email,
    subject: `✅ Order Confirmed #${order.orderNumber} - Pizza App`,
    html:    orderConfirmEmailTemplate(name, order),
  });
};

/**
 * Send low stock notification to admin
 */
const sendLowStockEmail = async (items) => {
  const adminEmail = process.env.EMAIL_USER;  // Send to admin email
  return sendEmail({
    to:      adminEmail,
    subject: '⚠️ Low Stock Alert - Pizza App',
    html:    lowStockEmailTemplate(items),
  });
};

module.exports = {
  sendVerificationEmail,
  sendForgotPasswordEmail,
  sendOrderConfirmationEmail,
  sendLowStockEmail,
};