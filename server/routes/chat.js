const express = require('express');
const router = express.Router();

module.exports = (pool, broadcastMessage, notifyExternalSystem) => {
  // 1. Webhook endpoint สำหรับรับข้อมูลจากระบบภายนอก
  router.post('/:session_id/chat', async (req, res) => {
    try {
      const { session_id } = req.params;
      const { message, sender_type, user_id, report_id, timestamp } = req.body;

      console.log('=== Webhook Chat Received ===');
      console.log('Session ID:', session_id);
      console.log('Message:', message);
      console.log('Sender Type:', sender_type);

      // ตรวจสอบว่า session_id ถูกต้อง
      if (!session_id || !message) {
        return res.status(400).json({ 
          error: 'session_id และ message จำเป็นต้องมี',
          required_fields: ['session_id', 'message', 'sender_type']
        });
      }

      // ตอบจำนวนประเภทของปัญหา
      if (/จำนวนประเภท.*ปัญหา|จำนวนประเภทปัญหา|จำนวนประเภทของปัญหา/i.test(message)) {
        const result = await pool.query('SELECT COUNT(*) AS type_count FROM problem_type');
        const reply = `ขณะนี้มีประเภทปัญหาในระบบทั้งหมด ${result.rows[0].type_count} ประเภทค่ะ`;
        return res.json({ output: reply });
      }

      // เพิ่ม logic ตอบ prompt เฉพาะเจาะจง
      if (/จำนวนรายงาน.*ประเภท|จำนวนรายงานแต่ละประเภท|รายงานแต่ละประเภท|จำนวนรายงานของแต่ละประเภท|จำนวนของแต่ละประเภท/i.test(message)) {
        const result = await pool.query(`
          SELECT pt.type_name, COUNT(r.report_id) AS report_count
          FROM problem_type pt
          LEFT JOIN report r ON pt.problem_type_id = r.problem_type_id
          GROUP BY pt.type_name
          ORDER BY pt.type_name
        `);
        const reply = 'จำนวนรายงานแต่ละประเภทในระบบ:\n' + result.rows.map(r => `- ${r.type_name}: ${r.report_count} รายงาน`).join('\n');
        return res.json({ output: reply });
      }

      if (/สถานะรายงาน|รายงานทั้งหมด|คืบหน้า|สถิติ/i.test(message)) {
        // ตัวอย่าง: สถิติรายงานทั้งหมด
        const stats = await pool.query(`
          SELECT COUNT(*) AS total_reports,
            SUM(CASE WHEN status IN ('รอตรวจสอบ','กำลังตรวจสอบ','รอดำเนินการ','กำลังดำเนินการ','pending','in_progress') THEN 1 ELSE 0 END) AS pending_reports,
            SUM(CASE WHEN status IN ('เสร็จสิ้น','resolved','step5') THEN 1 ELSE 0 END) AS resolved_reports,
            SUM(CASE WHEN status IN ('ปฏิเสธ','rejected') THEN 1 ELSE 0 END) AS rejected_reports
          FROM report
        `);
        const s = stats.rows[0];
        const reply = `ขณะนี้มีรายงานทั้งหมด ${s.total_reports} รายการ\nรอตรวจสอบ/กำลังดำเนินการ: ${s.pending_reports}\nเสร็จสิ้น: ${s.resolved_reports}\nปฏิเสธ: ${s.rejected_reports}`;
        return res.json({ output: reply });
      }

      // บันทึกข้อความและเชื่อมต่อระบบเดิม
      const chatMessage = await pool.query(`
        INSERT INTO chat_messages (session_id, user_id, report_id, message, sender_type, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *
      `, [session_id, user_id || null, report_id || null, message, sender_type || 'user']);

      console.log('Message saved:', chatMessage.rows[0]);

      broadcastMessage(session_id, {
        type: 'new_message',
        data: chatMessage.rows[0]
      });

      await notifyExternalSystem(session_id, chatMessage.rows[0]);

      res.status(201).json({
        message: 'ได้รับข้อความสำเร็จ',
        chat: chatMessage.rows[0],
        success: true
      });

    } catch (err) {
      console.error('Error in webhook:', err.message);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการรับข้อความ',
        details: err.message 
      });
    }
  });

  // 2. Webhook endpoint สำหรับรับการอัพเดตสถานะ
  router.post('/:session_id/status-update', async (req, res) => {
    try {
      const { session_id } = req.params;
      const { report_id, old_status, new_status, admin_id, comment } = req.body;

      console.log('=== Webhook Status Update Received ===');
      console.log('Session ID:', session_id);
      console.log('Report ID:', report_id);
      console.log('Status Change:', old_status, '->', new_status);

      // บันทึกการเปลี่ยนแปลงสถานะ
      const statusLog = await pool.query(`
        INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, comment, changed_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *
      `, [report_id, admin_id || null, old_status, new_status, comment || null]);

      // ส่งการแจ้งเตือนไปยังผู้ใช้
      const report = await pool.query('SELECT user_id FROM report WHERE report_id = $1', [report_id]);
      if (report.rows.length > 0) {
        await pool.query(`
          INSERT INTO notifications (user_id, report_id, title, message, type)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          report.rows[0].user_id,
          report_id,
          'อัพเดทสถานะรายงาน',
          `สถานะรายงานเปลี่ยนเป็น: ${new_status}`,
          'status_update'
        ]);
      }

      // ส่งการอัพเดตไปยัง WebSocket clients
      broadcastMessage(session_id, {
        type: 'status_update',
        data: {
          report_id,
          old_status,
          new_status,
          changed_at: statusLog.rows[0].changed_at
        }
      });

      res.status(201).json({
        message: 'บันทึกการอัพเดตสถานะสำเร็จ',
        log: statusLog.rows[0],
        success: true
      });

    } catch (err) {
      console.error('Error in status update webhook:', err.message);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการบันทึกการอัพเดตสถานะ',
        details: err.message 
      });
    }
  });

  // 3. API endpoint สำหรับดึงข้อความแชทของ session
  router.get('/:session_id/messages', async (req, res) => {
    try {
      const { session_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await pool.query(`
        SELECT * FROM chat_messages
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [session_id, limit, offset]);

      res.json({
        session_id,
        messages: messages.rows.reverse(),
        count: messages.rows.length
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อความแชท' });
    }
  });

  // 4. API endpoint สำหรับส่งข้อความ
  router.post('/:session_id/send', async (req, res) => {
    try {
      const { session_id } = req.params;
      const { user_id, message, report_id } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'ข้อความไม่สามารถเป็นค่าว่างได้' });
      }

      const chatMessage = await pool.query(`
        INSERT INTO chat_messages (session_id, user_id, report_id, message, sender_type, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *
      `, [session_id, user_id, report_id || null, message, 'user']);

      // ส่งไปยัง WebSocket clients
      broadcastMessage(session_id, {
        type: 'new_message',
        data: chatMessage.rows[0]
      });

      res.status(201).json({
        message: 'ส่งข้อความสำเร็จ',
        chat: chatMessage.rows[0]
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
    }
  });

  return router;
};
