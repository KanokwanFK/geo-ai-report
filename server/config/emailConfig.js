const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Configuration
 * รองรับทั้ง SMTP (Gmail) และ SendGrid API
 */

// สร้าง transporter สำหรับส่งอีเมล
const createTransporter = () => {
  try {
    // ถ้ามี SendGrid API Key ให้ใช้ SendGrid (แนะนำสำหรับ production)
    if (process.env.SENDGRID_API_KEY) {
      console.log('📧 Using SendGrid for email service');
      const transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
      return transporter;
    }
    
    // ถ้าไม่มี SendGrid ให้ใช้ Gmail SMTP (สำหรับ development)
    console.log('📧 Using Gmail SMTP for email service');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Gmail App Password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
};

// ตรวจสอบการเชื่อมต่อ SMTP
const verifyConnection = async () => {
  try {
    // ถ้าไม่มีการตั้งค่า email ให้ skip
    if (!process.env.SENDGRID_API_KEY && !process.env.EMAIL_USER) {
      console.log('⚠️ Email service not configured - skipping verification');
      return false;
    }
    
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    console.warn('⚠️ Email notifications will be disabled');
    return false;
  }
};

// ค่าเริ่มต้นสำหรับการส่งอีเมล
const emailDefaults = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'ระบบรายงานปัญหา',
    address: process.env.EMAIL_FROM || process.env.EMAIL_USER
  },
  replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER
};

module.exports = {
  createTransporter,
  verifyConnection,
  emailDefaults
};
