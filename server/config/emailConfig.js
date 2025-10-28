const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

/**
 * Email Configuration
 * รองรับทั้ง SendGrid Web API (production) และ SMTP (development)
 * 
 * SendGrid Web API: ใช้ HTTPS ไม่โดน Render block ports
 * Gmail SMTP: สำหรับ development เท่านั้น (โดน block บน Render)
 */

// กำหนดค่า SendGrid API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('📧 SendGrid Web API configured');
}

// ฟังก์ชันส่งอีเมลผ่าน SendGrid Web API
const sendEmailViaSendGrid = async (mailOptions) => {
  try {
    // SendGrid API format - ต้องใช้ content array
    const msg = {
      to: mailOptions.to,
      from: {
        email: mailOptions.from.address || process.env.EMAIL_FROM,
        name: mailOptions.from.name || process.env.EMAIL_FROM_NAME || 'ระบบรายงานปัญหา'
      },
      subject: mailOptions.subject,
      content: [
        {
          type: 'text/html',
          value: mailOptions.html || mailOptions.text || ''
        }
      ]
    };

    // เพิ่ม plain text ถ้ามี
    if (mailOptions.text && mailOptions.html) {
      msg.content.unshift({
        type: 'text/plain',
        value: mailOptions.text
      });
    }

    const result = await sgMail.send(msg);
    console.log('✅ Email sent via SendGrid Web API');
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ SendGrid send failed:', error.response?.body || error.message);
    throw error;
  }
};

// สร้าง transporter สำหรับ Gmail SMTP (development only)
const createGmailTransporter = () => {
  try {
    console.log('📧 Using Gmail SMTP for email service (development only)');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    return transporter;
  } catch (error) {
    console.error('Error creating Gmail transporter:', error);
    throw error;
  }
};

// ฟังก์ชันส่งอีเมลแบบ Universal (เลือกวิธีการส่งอัตโนมัติ)
const sendEmail = async (mailOptions) => {
  // ถ้ามี SendGrid API Key ให้ใช้ Web API (แนะนำสำหรับ production)
  if (process.env.SENDGRID_API_KEY) {
    return await sendEmailViaSendGrid(mailOptions);
  }
  
  // ถ้าไม่มี SendGrid ให้ใช้ Gmail SMTP (development only)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    const transporter = createGmailTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent via Gmail SMTP');
    return { success: true, messageId: result.messageId };
  }
  
  throw new Error('No email service configured');
};

// ตรวจสอบการตั้งค่า Email Service
const verifyConnection = async () => {
  try {
    // ตรวจสอบว่ามีการตั้งค่า email service หรือไม่
    if (!process.env.SENDGRID_API_KEY && !process.env.EMAIL_USER) {
      console.log('⚠️ Email service not configured - skipping verification');
      return false;
    }
    
    // ถ้าใช้ SendGrid Web API
    if (process.env.SENDGRID_API_KEY) {
      // SendGrid Web API ไม่ต้อง verify connection
      // จะรู้ว่าใช้งานได้หรือไม่เมื่อส่งอีเมลจริง
      console.log('✅ SendGrid Web API ready (using HTTPS - no port blocking)');
      return true;
    }
    
    // ถ้าใช้ Gmail SMTP (development only)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const transporter = createGmailTransporter();
      await transporter.verify();
      console.log('✅ Gmail SMTP connection verified (development only)');
      console.warn('⚠️ Gmail SMTP will NOT work on Render Free Plan (ports blocked)');
      return true;
    }
    
    return false;
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
  sendEmail,
  verifyConnection,
  emailDefaults
};
