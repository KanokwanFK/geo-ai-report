const express = require('express');
const router = express.Router();

module.exports = (pool, sendNewReportEmails, sendStatusUpdateEmails, upload) => {
  // ฟังก์ชันแปลง step number เป็นสถานะภาษาไทย
  function getStatusFromStep(step) {
    const statusMap = {
      1: 'รอตรวจสอบ',
      2: 'กำลังตรวจสอบ', 
      3: 'รอดำเนินการ',
      4: 'กำลังดำเนินการ',
      5: 'เสร็จสิ้น'
    };
    return statusMap[step] || 'รอตรวจสอบ';
  }

  // 1. สร้างรายงานใหม่
  router.post('/', async (req, res) => {
    try {
      const { user_id, problem_type_id, title, description, latitude, longitude, location_detail } = req.body;
      
      // สร้างรายงานในฐานข้อมูล
      const newReport = await pool.query(
        `INSERT INTO report (user_id, problem_type_id, title, description, latitude, longitude, location_detail) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [user_id, problem_type_id, title, description, latitude, longitude, location_detail]
      );
      
      const reportData = newReport.rows[0];
      
      // ส่งอีเมลแจ้งเตือน (ไม่บล็อคการตอบกลับ)
      // ทำงานแบบ async โดยไม่ await เพื่อไม่ให้ user รอนาน
      sendNewReportEmails(pool, reportData)
        .catch(error => {
          console.error(`❌ Error sending email notifications: ${error.message}`);
        });
      
      // ตอบกลับทันทีโดยไม่รอส่งอีเมล
      res.status(201).json({
        message: 'สร้างรายงานสำเร็จ',
        report: reportData,
        notification: 'กำลังส่งอีเมลแจ้งเตือน'
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
    }
  });

  // 2. ดูรายงานทั้งหมดพร้อมรายละเอียด
  router.get('/', async (req, res) => {
    try {
      const { status, user_id, problem_type_id, limit = 50, offset = 0 } = req.query;
      
      // ใช้ query ที่เรียบง่ายกว่าแทน view
      let query = `
          SELECT 
              r.report_id,
              r.user_id,
              r.problem_type_id,
              r.title,
              r.description,
              r.latitude,
              r.longitude,
              r.location_detail,
              r.status,
              r.current_step,
              r.created_at,
              r.updated_at,
              u.first_name,
              u.last_name,
              u.email,
              pt.type_name as problem_type,
              pt.color_code,
              CASE 
                  WHEN r.status = 'รอตรวจสอบ' THEN 'เริ่มยื่นคำร้อง'
                  WHEN r.status = 'กำลังตรวจสอบ' THEN 'ตรวจสอบข้อมูล'
                  WHEN r.status = 'รอดำเนินการ' THEN 'รอดำเนินการ'
                  WHEN r.status = 'กำลังดำเนินการ' THEN 'กำลังดำเนินการ'
                  WHEN r.status = 'เสร็จสิ้น' THEN 'เสร็จสิ้น'
                  WHEN r.status = 'ปฏิเสธ' THEN 'ปฏิเสธ'
                  ELSE 'เริ่มยื่นคำร้อง'
              END as current_step_name,
              CASE 
                  WHEN r.status = 'รอตรวจสอบ' THEN '#E91E63'
                  WHEN r.status = 'กำลังตรวจสอบ' THEN '#FF9800'
                  WHEN r.status = 'รอดำเนินการ' THEN '#FFEB3B'
                  WHEN r.status = 'กำลังดำเนินการ' THEN '#00BCD4'
                  WHEN r.status = 'เสร็จสิ้น' THEN '#4CAF50'
                  WHEN r.status = 'ปฏิเสธ' THEN '#f5222d'
                  ELSE '#E91E63'
              END as current_step_color,
              CASE 
                  WHEN r.status = 'รอตรวจสอบ' THEN 0
                  WHEN r.status = 'กำลังตรวจสอบ' THEN 25
                  WHEN r.status = 'รอดำเนินการ' THEN 50
                  WHEN r.status = 'กำลังดำเนินการ' THEN 75
                  WHEN r.status = 'เสร็จสิ้น' THEN 100
                  WHEN r.status = 'ปฏิเสธ' THEN 0
                  ELSE 0
              END as progress_percentage,
              CASE 
                  WHEN r.status = 'รอตรวจสอบ' THEN 1
                  WHEN r.status = 'กำลังตรวจสอบ' THEN 2
                  WHEN r.status = 'รอดำเนินการ' THEN 3
                  WHEN r.status = 'กำลังดำเนินการ' THEN 4
                  WHEN r.status = 'เสร็จสิ้น' THEN 5
                  WHEN r.status = 'ปฏิเสธ' THEN 1
                  ELSE 1
              END as calculated_current_step
          FROM report r
          LEFT JOIN "user" u ON r.user_id = u.user_id
          LEFT JOIN problem_type pt ON r.problem_type_id = pt.problem_type_id
          WHERE 1=1
      `;
      
      let params = [];
      let paramCount = 0;
      
      if (status) {
        paramCount++;
        query += ` AND r.status = $${paramCount}`;
        params.push(status);
      }
      
      if (user_id) {
        paramCount++;
        query += ` AND r.user_id = $${paramCount}`;
        params.push(user_id);
      }
      
      if (problem_type_id) {
        paramCount++;
        query += ` AND r.problem_type_id = $${paramCount}`;
        params.push(problem_type_id);
      }
      
      query += ` ORDER BY r.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);
      
      const reports = await pool.query(query, params);
      
      res.json(reports.rows);
    } catch (err) {
      console.error('Error in /api/reports:', err.message);
      console.error('Full error:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน: ' + err.message });
    }
  });

  // 3. ดูรายงานตาม ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const report = await pool.query('SELECT * FROM report_detail_view WHERE report_id = $1', [id]);
      
      if (report.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      // ดึงรูปภาพสำหรับรายงานนี้
      const images = await pool.query('SELECT * FROM report_image WHERE report_id = $1', [id]);
      
      res.json({
        ...report.rows[0],
        images: images.rows
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน' });
    }
  });

  // 4. อัพเดทสถานะรายงาน (สำหรับ Admin) - Simplified version
  router.put('/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, admin_id, comment } = req.body;
      
      // ดึงสถานะเดิมก่อนอัพเดท
      const oldReportResult = await pool.query(
        'SELECT status FROM report WHERE report_id = $1',
        [id]
      );
      
      if (oldReportResult.rowCount === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      const oldStatus = oldReportResult.rows[0].status;
      
      // อัพเดทสถานะ
      const updateResult = await pool.query(
        'UPDATE report SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE report_id = $2 RETURNING *',
        [status, id]
      );
      
      const updatedReport = updateResult.rows[0];
      
      // ส่งอีเมลแจ้งเตือนการอัพเดทสถานะ (ไม่บล็อคการตอบกลับ)
      sendStatusUpdateEmails(pool, {
        reportId: parseInt(id),
        oldStatus: oldStatus,
        newStatus: status,
        adminId: admin_id,
        comment: comment || ''
      }).catch(error => {
        console.error(`❌ Error sending status update emails: ${error.message}`);
      });
      
      res.json({
        message: 'อัพเดทสถานะรายงานสำเร็จ',
        report: updatedReport,
        success: true,
        notification: 'กำลังส่งอีเมลแจ้งเตือน'
      });
    } catch (err) {
      console.error('Error in update status:', err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะรายงาน' });
    }
  });

  // 5. แก้ไขรายละเอียดรายงาน
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, problem_type_id, latitude, longitude, location_detail } = req.body;
      
      const updatedReport = await pool.query(
        `UPDATE report SET title = $1, description = $2, problem_type_id = $3, 
         latitude = $4, longitude = $5, location_detail = $6 
         WHERE report_id = $7 RETURNING *`,
        [title, description, problem_type_id, latitude, longitude, location_detail, id]
      );
      
      if (updatedReport.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      res.json({
        message: 'อัพเดทรายงานสำเร็จ',
        report: updatedReport.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทรายงาน' });
    }
  });

  // 6. ลบรายงาน
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const deletedReport = await pool.query('DELETE FROM report WHERE report_id = $1 RETURNING title', [id]);
      
      if (deletedReport.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      res.json({ message: 'ลบรายงานสำเร็จ' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบรายงาน' });
    }
  });

  // 7. ดูประวัติการเปลี่ยนแปลงสถานะรายงาน
  router.get('/:id/status-history', async (req, res) => {
    try {
      const { id } = req.params;
      
      const statusHistory = await pool.query(`
        SELECT rsl.*, a.admin_level, u.first_name, u.last_name 
        FROM report_status_log rsl
        LEFT JOIN admin a ON rsl.admin_id = a.admin_id
        LEFT JOIN "user" u ON a.user_id = u.user_id
        WHERE rsl.report_id = $1
        ORDER BY rsl.changed_at DESC
      `, [id]);
      
      res.json(statusHistory.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงประวัติการเปลี่ยนแปลงสถานะ' });
    }
  });

  // อัพเดตสถานะรายงานตาม phone และ report_id
  router.put('/update-status-by-phone', async (req, res) => {
    try {
      const { phone, report_id, new_status } = req.body;
      // หา user_id จาก phone
      const userRes = await pool.query('SELECT user_id FROM "user" WHERE phone = $1', [phone]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
      }
      const user_id = userRes.rows[0].user_id;
      // อัพเดตสถานะใน report
      const updateRes = await pool.query(
        'UPDATE report SET status = $1 WHERE report_id = $2 AND user_id = $3 RETURNING *',
        [new_status, report_id, user_id]
      );
      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงานหรือไม่ตรงกับผู้ใช้งาน' });
      }
      res.json({ message: 'อัพเดทสถานะสำเร็จ', report: updateRes.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ' });
    }
  });

  // อัพเดตสถานะรายงานตาม email และ report_id
  router.put('/update-status-by-email', async (req, res) => {
    try {
      const { email, report_id, new_status } = req.body;
      // หา user_id จาก email
      const userRes = await pool.query('SELECT user_id FROM "user" WHERE email = $1', [email]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
      }
      const user_id = userRes.rows[0].user_id;
      // อัพเดตสถานะใน report
      const updateRes = await pool.query(
        'UPDATE report SET status = $1 WHERE report_id = $2 AND user_id = $3 RETURNING *',
        [new_status, report_id, user_id]
      );
      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงานหรือไม่ตรงกับผู้ใช้งาน' });
      }
      res.json({ message: 'อัพเดทสถานะสำเร็จ', report: updateRes.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ' });
    }
  });

  // Update status using status mapping table
  router.get('/update-status', async (req, res) => {
    try {
      // อัพเดท report ให้ใช้สถานะใหม่ตาม mapping
      const updateResult = await pool.query(`
        UPDATE report 
        SET status = sm.new_status
        FROM status_mapping sm
        WHERE report.status = sm.old_status
        AND report.status != sm.new_status
      `);

      // เช็คสถานะปัจจุบัน
      const statusCheck = await pool.query(`
        SELECT 
          r.status,
          COUNT(*) as count,
          COALESCE(sm.status_color, '#999999') as color,
          COALESCE(sm.step_number, 0) as step_number
        FROM report r
        LEFT JOIN status_mapping sm ON r.status = sm.new_status
        GROUP BY r.status, sm.status_color, sm.step_number
        ORDER BY COALESCE(sm.step_number, 999), r.status
      `);

      res.json({
        message: 'อัพเดทสถานะสำเร็จด้วย Status Mapping',
        updated_rows: updateResult.rowCount,
        current_status: statusCheck.rows
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ: ' + err.message });
    }
  });

  // Get status mapping table
  router.get('/status-mapping', async (req, res) => {
    try {
      const mappings = await pool.query(`
        SELECT * FROM status_mapping 
        ORDER BY step_number, old_status
      `);
      res.json(mappings.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล status mapping' });
    }
  });

  // Get status colors and info
  router.get('/status-info', async (req, res) => {
    try {
      // ใช้ query ที่เรียบง่ายกว่า - นับจำนวนรายงานตามสถานะ
      const statusInfo = await pool.query(`
        SELECT 
          status as status_name,
          COUNT(*) as report_count,
          CASE 
            WHEN status = 'รอตรวจสอบ' THEN '#E91E63'
            WHEN status = 'กำลังตรวจสอบ' THEN '#FF9800'
            WHEN status = 'รอดำเนินการ' THEN '#FFEB3B'
            WHEN status = 'กำลังดำเนินการ' THEN '#00BCD4'
            WHEN status = 'เสร็จสิ้น' THEN '#4CAF50'
            WHEN status = 'ปฏิเสธ' THEN '#F44336'
            ELSE '#6c757d'
          END as status_color,
          CASE 
            WHEN status = 'รอตรวจสอบ' THEN 'รอการตรวจสอบจากเจ้าหน้าที่'
            WHEN status = 'กำลังตรวจสอบ' THEN 'เจ้าหน้าที่กำลังตรวจสอบข้อมูล'
            WHEN status = 'รอดำเนินการ' THEN 'รอการดำเนินการแก้ไข'
            WHEN status = 'กำลังดำเนินการ' THEN 'กำลังดำเนินการแก้ไขปัญหา'
            WHEN status = 'เสร็จสิ้น' THEN 'ดำเนินการเสร็จสิ้นแล้ว'
            WHEN status = 'ปฏิเสธ' THEN 'รายงานถูกปฏิเสธ'
            ELSE 'สถานะไม่ระบุ'
          END as description,
          CASE 
            WHEN status = 'รอตรวจสอบ' THEN 1
            WHEN status = 'กำลังตรวจสอบ' THEN 2
            WHEN status = 'รอดำเนินการ' THEN 3
            WHEN status = 'กำลังดำเนินการ' THEN 4
            WHEN status = 'เสร็จสิ้น' THEN 5
            WHEN status = 'ปฏิเสธ' THEN 0
            ELSE 99
          END as step_number
        FROM report 
        GROUP BY status
        ORDER BY step_number
      `);
      
      res.json(statusInfo.rows);
    } catch (err) {
      console.error('Error in status-info:', err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล status info' });
    }
  });

   router.post('/:id/images', upload.single('image'), async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
      }
      
      // Check if report exists
      const report = await pool.query('SELECT report_id FROM report WHERE report_id = $1', [id]);
      if (report.rows.length === 0) {
        // Delete uploaded file if report doesn't exist
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      // image_path จะถูกบันทึกเป็น /uploads/filename เพื่อให้ frontend ใช้งานตรงกับ static path
      const imagePath = `/uploads/${req.file.filename}`;

      // เพิ่ม updated_at timestamp ตอนบันทึกข้อมูลรูปภาพ
      const newImage = await pool.query(
        `INSERT INTO report_image (report_id, image_path, original_name, file_size, mime_type, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
        [id, imagePath, req.file.originalname, req.file.size, req.file.mimetype]
      );

      res.status(201).json({
        message: 'อัพโหลดรูปภาพสำเร็จ',
        image: newImage.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      // Delete uploaded file on error
      if (req.file) {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ' });
    }
  });

  // 2. Upload multiple images for report
  router.post('/:id/images/multiple', upload.array('images', 5), async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
      }
      
      // Check if report exists
      const report = await pool.query('SELECT report_id FROM report WHERE report_id = $1', [id]);
      if (report.rows.length === 0) {
        // Delete uploaded files if report doesn't exist
        const fs = require('fs');
        req.files.forEach(file => fs.unlinkSync(file.path));
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      const uploadedImages = [];
      
      for (const file of req.files) {
        // image_path จะถูกบันทึกเป็น /uploads/filename เพื่อให้ frontend ใช้งานตรงกับ static path
        const imagePath = `/uploads/${file.filename}`;
        // เพิ่ม updated_at timestamp ตอนบันทึกข้อมูลรูปภาพ
        const newImage = await pool.query(
          `INSERT INTO report_image (report_id, image_path, original_name, file_size, mime_type, updated_at) 
           VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
          [id, imagePath, file.originalname, file.size, file.mimetype]
        );
        uploadedImages.push(newImage.rows[0]);
      }
      
      res.status(201).json({
        message: 'อัพโหลดรูปภาพสำเร็จ',
        images: uploadedImages
      });
    } catch (err) {
      console.error(err.message);
      // Delete uploaded files on error
      if (req.files) {
        const fs = require('fs');
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ' });
    }
  });

  // 3. Get images for a report
  router.get('/:id/images', async (req, res) => {
    try {
      const { id } = req.params;
      // ปรับ response ให้มี field ที่ frontend ต้องการ เช่น filename, uploaded_at
      const images = await pool.query(`
        SELECT 
          image_id, 
          report_id, 
          image_path, 
          original_name, 
          file_size, 
          mime_type, 
          image_path AS filename, 
          updated_at AS uploaded_at
        FROM report_image 
        WHERE report_id = $1 
        ORDER BY updated_at DESC
      `, [id]);
      res.json(images.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ' });
    }
  });

  return router;
};
