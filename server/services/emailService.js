const { createTransporter, emailDefaults } = require('../config/emailConfig');
const {
  reportConfirmationTemplate,
  adminNotificationTemplate,
  statusUpdateTemplate
} = require('../templates/reportNotificationEmail');

/**
 * Email Service สำหรับจัดการการส่งอีเมลทุกประเภท
 * รองรับการใช้งานใน API ต่างๆ ได้อย่าง flexible
 */

/**
 * ฟังก์ชันหลักสำหรับส่งอีเมล (Generic)
 * @param {Object} options - ตัวเลือกสำหรับการส่งอีเมล
 * @param {string|string[]} options.to - อีเมลผู้รับ (สามารถเป็น array ได้)
 * @param {string} options.subject - หัวข้ออีเมล
 * @param {string} options.html - HTML content
 * @param {string} options.text - ข้อความแบบ plain text (optional)
 * @param {string} options.from - ผู้ส่ง (optional, จะใช้ default ถ้าไม่ระบุ)
 * @returns {Promise<Object>} - ผลลัพธ์การส่งอีเมล
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    // ตั้งค่า from address
    const fromAddress = options.from || `${emailDefaults.from.name} <${emailDefaults.from.address}>`;

    // สร้าง mail options
    const mailOptions = {
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '', // ถ้าไม่มี text จะใช้ค่าว่าง
      replyTo: options.replyTo || emailDefaults.replyTo
    };

    // ส่งอีเมล
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to: ${mailOptions.to}`);
    console.log(`Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      recipients: mailOptions.to
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * ส่งอีเมลยืนยันการสร้างรายงานให้กับผู้ใช้
 * @param {Object} reportData - ข้อมูลรายงาน
 * @param {Object} userData - ข้อมูลผู้ใช้
 * @returns {Promise<Object>}
 */
const sendReportConfirmation = async (reportData, userData) => {
  try {
    // เตรียมข้อมูลสำหรับ template
    const templateData = {
      userName: `${userData.first_name} ${userData.last_name}`,
      reportId: reportData.report_id,
      title: reportData.title,
      problemType: reportData.problem_type_name || 'ไม่ระบุประเภท',
      description: reportData.description || '-',
      location: reportData.location_detail || 'ไม่ระบุสถานที่',
      status: reportData.status || 'รอตรวจสอบ',
      createdAt: new Date(reportData.created_at).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // สร้าง HTML content
    const htmlContent = reportConfirmationTemplate(templateData);

    // ส่งอีเมล
    const result = await sendEmail({
      to: userData.email,
      subject: `✅ ยืนยันการรับรายงาน #${reportData.report_id} - ${reportData.title}`,
      html: htmlContent
    });

    return result;
  } catch (error) {
    console.error('Error in sendReportConfirmation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ส่งอีเมลแจ้งเตือนแอดมินเมื่อมีรายงานใหม่
 * @param {Object} reportData - ข้อมูลรายงาน
 * @param {Object} userData - ข้อมูลผู้ใช้ที่สร้างรายงาน
 * @param {Object} adminData - ข้อมูลแอดมินผู้รับ
 * @returns {Promise<Object>}
 */
const sendAdminNotification = async (reportData, userData, adminData) => {
  try {
    // เตรียมข้อมูลสำหรับ template
    const templateData = {
      adminName: adminData.first_name ? `${adminData.first_name} ${adminData.last_name}` : null,
      reportId: reportData.report_id,
      userName: `${userData.first_name} ${userData.last_name}`,
      userEmail: userData.email,
      title: reportData.title,
      problemType: reportData.problem_type_name || 'ไม่ระบุประเภท',
      description: reportData.description || '-',
      location: reportData.location_detail || 'ไม่ระบุสถานที่',
      createdAt: new Date(reportData.created_at).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      priority: reportData.priority || 'medium'
    };

    // สร้าง HTML content
    const htmlContent = adminNotificationTemplate(templateData);

    // ส่งอีเมล
    const result = await sendEmail({
      to: adminData.email,
      subject: `🔔 [แจ้งเตือน] รายงานใหม่ #${reportData.report_id} - ${reportData.title}`,
      html: htmlContent
    });

    return result;
  } catch (error) {
    console.error('Error in sendAdminNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ส่งอีเมลแจ้งเตือนแอดมินทุกคน
 * @param {Object} reportData - ข้อมูลรายงาน
 * @param {Object} userData - ข้อมูลผู้ใช้ที่สร้างรายงาน
 * @param {Array} adminList - รายการแอดมินทั้งหมด
 * @returns {Promise<Object>}
 */
const sendAdminNotifications = async (reportData, userData, adminList) => {
  try {
    console.log(`📧 Sending notifications to ${adminList.length} admin(s)...`);

    // ส่งอีเมลให้แต่ละแอดมินแบบ parallel
    const results = await Promise.allSettled(
      adminList.map(admin => sendAdminNotification(reportData, userData, admin))
    );

    // สรุปผลการส่ง
    const summary = {
      total: adminList.length,
      success: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
      results: results
    };

    console.log(`✅ Sent ${summary.success}/${summary.total} notification emails to admins`);

    return summary;
  } catch (error) {
    console.error('Error in sendAdminNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ส่งอีเมลแจ้งเตือนการอัพเดทสถานะ (สำหรับใช้ในอนาคต)
 * @param {Object} reportData - ข้อมูลรายงาน
 * @param {Object} userData - ข้อมูลผู้ใช้
 * @param {Object} statusData - ข้อมูลการเปลี่ยนแปลงสถานะ
 * @returns {Promise<Object>}
 */
const sendStatusUpdateNotification = async (reportData, userData, statusData) => {
  try {
    // เตรียมข้อมูลสำหรับ template
    const templateData = {
      userName: `${userData.first_name} ${userData.last_name}`,
      reportId: reportData.report_id,
      title: reportData.title,
      oldStatus: statusData.oldStatus,
      newStatus: statusData.newStatus,
      updatedBy: statusData.updatedBy || 'เจ้าหน้าที่',
      updateNote: statusData.note || '',
      updatedAt: new Date(statusData.updatedAt || Date.now()).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // สร้าง HTML content
    const htmlContent = statusUpdateTemplate(templateData);

    // ส่งอีเมล
    const result = await sendEmail({
      to: userData.email,
      subject: `🔄 อัพเดทสถานะรายงาน #${reportData.report_id} - ${statusData.newStatus}`,
      html: htmlContent
    });

    return result;
  } catch (error) {
    console.error('Error in sendStatusUpdateNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ส่งอีเมลแบบกำหนดเอง (Custom Email)
 * สำหรับกรณีพิเศษที่ต้องการความ flexible สูง
 * @param {Object} options
 * @param {string|string[]} options.to - ผู้รับ
 * @param {string} options.subject - หัวข้อ
 * @param {string} options.htmlContent - HTML content
 * @param {string} options.textContent - Plain text content (optional)
 * @returns {Promise<Object>}
 */
const sendCustomEmail = async (options) => {
  return await sendEmail({
    to: options.to,
    subject: options.subject,
    html: options.htmlContent,
    text: options.textContent
  });
};

/**
 * ฟังก์ชันสำหรับส่งอีเมลเมื่อมีรายงานใหม่
 * ส่งทั้งให้ user (confirmation) และ admin (notification)
 * @param {Object} pool - PostgreSQL pool connection
 * @param {Object} reportData - ข้อมูลรายงานที่สร้างขึ้น
 * @returns {Promise<Object>}
 */
const sendNewReportEmails = async (pool, reportData) => {
  try {
    console.log('📧 Starting email notification process...');

    // 1. ดึงข้อมูลผู้ใช้ที่สร้างรายงาน
    const userResult = await pool.query(
      `SELECT user_id, email, first_name, last_name, phone 
       FROM "user" 
       WHERE user_id = $1`,
      [reportData.user_id]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userData = userResult.rows[0];

    // 2. ดึงข้อมูลประเภทปัญหา
    const problemTypeResult = await pool.query(
      `SELECT type_name 
       FROM problem_type 
       WHERE problem_type_id = $1`,
      [reportData.problem_type_id]
    );

    const problemTypeName = problemTypeResult.rows.length > 0 
      ? problemTypeResult.rows[0].type_name 
      : 'ไม่ระบุประเภท';

    // เพิ่มข้อมูลประเภทปัญหาลงใน reportData
    const enrichedReportData = {
      ...reportData,
      problem_type_name: problemTypeName
    };

    // 3. ดึงรายชื่อแอดมินทั้งหมดที่ active
    const adminResult = await pool.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name
       FROM "user" u
       WHERE u.user_type = 'admin' AND u.email IS NOT NULL`
    );

    const adminList = adminResult.rows;
    console.log(`Found ${adminList.length} active admin(s)`);

    // 4. ส่งอีเมลแบบ parallel
    const emailResults = await Promise.allSettled([
      // ส่งอีเมลยืนยันให้ user
      sendReportConfirmation(enrichedReportData, userData),
      // ส่งอีเมลแจ้งเตือนให้ admin ทั้งหมด
      sendAdminNotifications(enrichedReportData, userData, adminList)
    ]);

    // 5. สรุปผลการส่ง
    const userEmailResult = emailResults[0];
    const adminEmailResult = emailResults[1];

    const summary = {
      success: true,
      userEmail: {
        sent: userEmailResult.status === 'fulfilled' && userEmailResult.value.success,
        result: userEmailResult.value
      },
      adminEmails: {
        sent: adminEmailResult.status === 'fulfilled',
        result: adminEmailResult.value
      }
    };

    console.log('📧 Email notification process completed');
    console.log(`   - User confirmation: ${summary.userEmail.sent ? '✅' : '❌'}`);
    console.log(`   - Admin notifications: ${summary.adminEmails.sent ? '✅' : '❌'}`);

    return summary;
  } catch (error) {
    console.error('❌ Error in sendNewReportEmails:', error);
    // ไม่ throw error เพื่อไม่ให้กระทบกับการสร้างรายงาน
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * ฟังก์ชันสำหรับส่งอีเมลเมื่อมีการอัพเดทสถานะรายงาน
 * ส่งให้ user ที่แจ้ง และ admin ที่ทำการอัพเดท
 * @param {Object} pool - PostgreSQL pool connection
 * @param {Object} params - พารามิเตอร์
 * @param {number} params.reportId - ID ของรายงาน
 * @param {string} params.oldStatus - สถานะเดิมก่อนเปลี่ยน
 * @param {string} params.newStatus - สถานะใหม่หลังเปลี่ยน
 * @param {number} params.adminId - ID ของ admin ที่ทำการอัพเดท
 * @param {string} params.comment - ความคิดเห็นจาก admin (optional)
 * @returns {Promise<Object>}
 */
const sendStatusUpdateEmails = async (pool, params) => {
  try {
    const { reportId, oldStatus, newStatus, adminId, comment } = params;
    
    console.log('📧 Starting status update email notification...');

    // 1. ดึงข้อมูลรายงาน
    const reportResult = await pool.query(
      `SELECT r.*, pt.type_name as problem_type_name
       FROM report r
       LEFT JOIN problem_type pt ON r.problem_type_id = pt.problem_type_id
       WHERE r.report_id = $1`,
      [reportId]
    );

    if (reportResult.rows.length === 0) {
      throw new Error('Report not found');
    }

    const reportData = reportResult.rows[0];

    // 2. ดึงข้อมูล user ที่สร้างรายงาน
    const userResult = await pool.query(
      `SELECT user_id, email, first_name, last_name 
       FROM "user" 
       WHERE user_id = $1`,
      [reportData.user_id]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Report owner not found');
    }

    const userData = userResult.rows[0];

    // 3. ดึงข้อมูล admin ที่ทำการอัพเดท (ถ้ามี)
    let adminData = null;
    if (adminId) {
      const adminResult = await pool.query(
        `SELECT user_id, email, first_name, last_name 
         FROM "user" 
         WHERE user_id = $1`,
        [adminId]
      );
      
      if (adminResult.rows.length > 0) {
        adminData = adminResult.rows[0];
      }
    }

    // 4. เตรียมข้อมูลสำหรับ email
    const statusData = {
      oldStatus: oldStatus,
      newStatus: newStatus,
      updatedBy: adminData 
        ? `${adminData.first_name} ${adminData.last_name}` 
        : 'เจ้าหน้าที่',
      note: comment || '',
      updatedAt: new Date()
    };

    // 5. ส่งอีเมล
    const emailPromises = [];

    // ส่งอีเมลให้ user ที่แจ้ง
    emailPromises.push(
      sendStatusUpdateNotification(reportData, userData, statusData)
    );

    // ส่งอีเมลให้ admin ที่ทำการอัพเดท (ถ้ามีและไม่ใช่คนเดียวกับ user)
    if (adminData && adminData.user_id !== userData.user_id) {
      // สร้าง email แจ้ง admin ว่าอัพเดทสำเร็จ
      const adminConfirmData = {
        ...statusData,
        isAdminConfirmation: true
      };
      emailPromises.push(
        sendStatusUpdateNotification(reportData, adminData, adminConfirmData)
      );
    }

    // รอการส่งอีเมลทั้งหมด
    const results = await Promise.allSettled(emailPromises);

    // 6. สรุปผลการส่ง
    const summary = {
      success: true,
      userEmail: {
        sent: results[0]?.status === 'fulfilled' && results[0]?.value?.success,
        result: results[0]?.value
      },
      adminEmail: results.length > 1 ? {
        sent: results[1]?.status === 'fulfilled' && results[1]?.value?.success,
        result: results[1]?.value
      } : null
    };

    console.log('📧 Status update email notification completed');
    console.log(`   - User notification: ${summary.userEmail.sent ? '✅' : '❌'}`);
    if (summary.adminEmail) {
      console.log(`   - Admin confirmation: ${summary.adminEmail.sent ? '✅' : '❌'}`);
    }

    return summary;
  } catch (error) {
    console.error('❌ Error in sendStatusUpdateEmails:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  // ฟังก์ชันหลัก
  sendEmail,
  
  // ฟังก์ชันสำหรับแต่ละประเภท
  sendReportConfirmation,
  sendAdminNotification,
  sendAdminNotifications,
  sendStatusUpdateNotification,
  sendCustomEmail,
  
  // ฟังก์ชันสำหรับ use case เฉพาะ
  sendNewReportEmails,
  sendStatusUpdateEmails
};
