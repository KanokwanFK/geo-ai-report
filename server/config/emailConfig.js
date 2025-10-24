const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Configuration for Gmail SMTP
 * ตั้งค่า nodemailer transporter สำหรับส่งอีเมลผ่าน Gmail
 */

// สร้าง transporter สำหรับส่งอีเมล
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Gmail App Password
      },
      tls: {
        rejectUnauthorized: false // อนุญาตให้ทำงานกับ certificate ที่ไม่ผ่านการตรวจสอบ
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
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
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
