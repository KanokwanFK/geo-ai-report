const express = require('express');
const router = express.Router();

module.exports = (pool) => {
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

  // 1. ดูขั้นตอนทั้งหมด
  router.get('/', async (req, res) => {
    try {
      console.log('=== Report Steps API Called ===');
      
      // ตรวจสอบว่าตาราง report_steps มีอยู่หรือไม่
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'report_steps'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('Table report_steps does not exist, returning default steps');
        // ส่งข้อมูลขั้นตอนเริ่มต้นถ้าตารางไม่มี
        const defaultSteps = [
          {
            step_id: 1,
            step_number: 1,
            step_name: 'เริ่มยื่นคำร้อง',
            step_description: 'ผู้ใช้งานยื่นรายงานปัญหาเข้าสู่ระบบ',
            step_color: '#E91E63',
            estimated_duration_hours: 0,
            is_active: true
          },
          {
            step_id: 2,
            step_number: 2,
            step_name: 'ตรวจสอบข้อมูล',
            step_description: 'เจ้าหน้าที่ตรวจสอบความถูกต้องของข้อมูล',
            step_color: '#FF9800',
            estimated_duration_hours: 24,
            is_active: true
          },
          {
            step_id: 3,
            step_number: 3,
            step_name: 'รอดำเนินการ',
            step_description: 'รายงานอยู่ในคิวรอดำเนินการ',
            step_color: '#FFEB3B',
            estimated_duration_hours: 48,
            is_active: true
          },
          {
            step_id: 4,
            step_number: 4,
            step_name: 'กำลังดำเนินการ',
            step_description: 'เจ้าหน้าที่กำลังดำเนินการแก้ไขปัญหา',
            step_color: '#00BCD4',
            estimated_duration_hours: 72,
            is_active: true
          },
          {
            step_id: 5,
            step_number: 5,
            step_name: 'เสร็จสิ้น',
            step_description: 'ดำเนินการแก้ไขปัญหาเสร็จสิ้นแล้ว',
            step_color: '#4CAF50',
            estimated_duration_hours: 0,
            is_active: true
          }
        ];
        return res.json(defaultSteps);
      }
      
      const steps = await pool.query('SELECT * FROM report_steps WHERE is_active = true ORDER BY step_number ASC');
      
      if (steps.rows.length === 0) {
        console.log('No active steps found in database, returning default steps');
        // ส่งข้อมูลขั้นตอนเริ่มต้นถ้าไม่มีข้อมูล
        const defaultSteps = [
          {
            step_id: 1,
            step_number: 1,
            step_name: 'เริ่มยื่นคำร้อง',
            step_description: 'ผู้ใช้งานยื่นรายงานปัญหาเข้าสู่ระบบ',
            step_color: '#E91E63',
            estimated_duration_hours: 0,
            is_active: true
          },
          {
            step_id: 2,
            step_number: 2,
            step_name: 'ตรวจสอบข้อมูล',
            step_description: 'เจ้าหน้าที่ตรวจสอบความถูกต้องของข้อมูล',
            step_color: '#FF9800',
            estimated_duration_hours: 24,
            is_active: true
          },
          {
            step_id: 3,
            step_number: 3,
            step_name: 'รอดำเนินการ',
            step_description: 'รายงานอยู่ในคิวรอดำเนินการ',
            step_color: '#FFEB3B',
            estimated_duration_hours: 48,
            is_active: true
          },
          {
            step_id: 4,
            step_number: 4,
            step_name: 'กำลังดำเนินการ',
            step_description: 'เจ้าหน้าที่กำลังดำเนินการแก้ไขปัญหา',
            step_color: '#00BCD4',
            estimated_duration_hours: 72,
            is_active: true
          },
          {
            step_id: 5,
            step_number: 5,
            step_name: 'เสร็จสิ้น',
            step_description: 'ดำเนินการแก้ไขปัญหาเสร็จสิ้นแล้ว',
            step_color: '#4CAF50',
            estimated_duration_hours: 0,
            is_active: true
          }
        ];
        return res.json(defaultSteps);
      }
      
      console.log('Found steps:', steps.rows.length);
      res.json(steps.rows);
    } catch (err) {
      console.error('Error in /api/report-steps:', err.message);
      console.error('Full error:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลขั้นตอน: ' + err.message });
    }
  });

  // 2. ดูสถานะรายงานพร้อมขั้นตอนปัจจุบัน (ใช้ใน /api/reports/:id/status)
  router.get('/reports/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      
      const reportStatus = await pool.query(`
        SELECT 
          r.*,
          rs.step_name,
          rs.step_description,
          rs.step_color,
          rs.estimated_duration_hours,
          u.first_name,
          u.last_name,
          pt.type_name as problem_type,
          CASE 
            WHEN r.current_step = 5 THEN 100
            ELSE (r.current_step - 1) * 25
          END as progress_percentage,
          ARRAY[
            json_build_object('step', 1, 'name', 'เริ่มยื่นคำร้อง', 'completed', r.step1_completed_at IS NOT NULL, 'completed_at', r.step1_completed_at),
            json_build_object('step', 2, 'name', 'ตรวจสอบข้อมูล', 'completed', r.step2_completed_at IS NOT NULL, 'completed_at', r.step2_completed_at),
            json_build_object('step', 3, 'name', 'รอดำเนินการ', 'completed', r.step3_completed_at IS NOT NULL, 'completed_at', r.step3_completed_at),
            json_build_object('step', 4, 'name', 'กำลังดำเนินการ', 'completed', r.step4_completed_at IS NOT NULL, 'completed_at', r.step4_completed_at),
            json_build_object('step', 5, 'name', 'เสร็จสิ้น', 'completed', r.step5_completed_at IS NOT NULL, 'completed_at', r.step5_completed_at)
          ] as steps_progress
        FROM report r
        LEFT JOIN report_steps rs ON r.current_step = rs.step_number
        LEFT JOIN "user" u ON r.user_id = u.user_id
        LEFT JOIN problem_type pt ON r.problem_type_id = pt.problem_type_id
        WHERE r.report_id = $1
      `, [id]);
      
      if (reportStatus.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      res.json(reportStatus.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถานะรายงาน' });
    }
  });

  // 3. อัพเดทสถานะรายงานไปขั้นตอนถัดไป (สำหรับ Admin) ใช้ใน /api/reports/:id/next-step
  router.put('/reports/:id/next-step', async (req, res) => {
    try {
      const { id } = req.params;
      const { admin_id, comment } = req.body;
      
      // ดึงสถานะปัจจุบัน
      const currentReport = await pool.query('SELECT current_step, status FROM report WHERE report_id = $1', [id]);
      if (currentReport.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      const currentStep = currentReport.rows[0].current_step;
      const currentStatus = currentReport.rows[0].status;
      
      if (currentStep >= 5) {
        return res.status(400).json({ error: 'รายงานนี้ดำเนินการเสร็จสิ้นแล้ว' });
      }
      
      const nextStep = currentStep + 1;
      const nextStatus = getStatusFromStep(nextStep);
      const completedField = `step${nextStep}_completed_at`;
      
      // อัพเดทสถานะ
      const updateQuery = `
        UPDATE report 
        SET current_step = $1, status = $2, ${completedField} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE report_id = $3 
        RETURNING *
      `;
      
      const updatedReport = await pool.query(updateQuery, [nextStep, nextStatus, id]);
      
      // บันทึกประวัติ
      await pool.query(`
        INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, old_step, new_step, comment)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [id, admin_id, currentStatus, nextStatus, currentStep, nextStep, comment]);
      
      res.json({
        message: `อัพเดทสถานะเป็นขั้นตอนที่ ${nextStep} สำเร็จ`,
        report: updatedReport.rows[0],
        previous_step: currentStep,
        current_step: nextStep
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ' });
    }
  });

  // 4. อัพเดทสถานะไปขั้นตอนที่กำหนด (สำหรับ Admin) ใช้ใน /api/reports/:id/set-step
  router.put('/reports/:id/set-step', async (req, res) => {
    try {
      const { id } = req.params;
      const { step, admin_id, comment } = req.body;
      
      if (step < 1 || step > 5) {
        return res.status(400).json({ error: 'ขั้นตอนต้องอยู่ระหว่าง 1-5' });
      }
      
      // ดึงสถานะปัจจุบัน
      const currentReport = await pool.query('SELECT current_step, status FROM report WHERE report_id = $1', [id]);
      if (currentReport.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      const currentStep = currentReport.rows[0].current_step;
      const currentStatus = currentReport.rows[0].status;
      const newStatus = getStatusFromStep(step);
      
      // สร้าง SQL สำหรับอัพเดทเวลาที่เสร็จสิ้นขั้นตอน
      let updateFields = ['current_step = $1', 'status = $2', 'updated_at = CURRENT_TIMESTAMP'];
      let params = [step, newStatus];
      let paramIndex = 3;
      
      // อัพเดทเวลาเสร็จสิ้นสำหรับขั้นตอนที่เสร็จแล้ว
      for (let i = 1; i <= step; i++) {
        updateFields.push(`step${i}_completed_at = COALESCE(step${i}_completed_at, CURRENT_TIMESTAMP)`);
      }
      
      params.push(id);
      
      const updateQuery = `
        UPDATE report 
        SET ${updateFields.join(', ')}
        WHERE report_id = $${paramIndex}
        RETURNING *
      `;
      
      const updatedReport = await pool.query(updateQuery, params);
      
      // บันทึกประวัติ
      await pool.query(`
        INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, old_step, new_step, comment)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [id, admin_id, currentStatus, newStatus, currentStep, step, comment]);
      
      res.json({
        message: `อัพเดทสถานะเป็นขั้นตอนที่ ${step} สำเร็จ`,
        report: updatedReport.rows[0],
        previous_step: currentStep,
        current_step: step
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ' });
    }
  });

  // 5. ปฏิเสธรายงาน (สำหรับ Admin) ใช้ใน /api/reports/:id/reject
  router.put('/reports/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const { admin_id, comment } = req.body;
      
      if (!comment) {
        return res.status(400).json({ error: 'กรุณาระบุเหตุผลในการปฏิเสธ' });
      }
      
      // ดึงสถานะปัจจุบัน
      const currentReport = await pool.query('SELECT current_step, status FROM report WHERE report_id = $1', [id]);
      if (currentReport.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรายงาน' });
      }
      
      const currentStep = currentReport.rows[0].current_step;
      const currentStatus = currentReport.rows[0].status;
      
      // อัพเดทเป็นสถานะปฏิเสธ
      const updatedReport = await pool.query(`
        UPDATE report 
        SET status = 'ปฏิเสธ', rejected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE report_id = $1 
        RETURNING *
      `, [id]);
      
      // บันทึกประวัติ
      await pool.query(`
        INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, old_step, new_step, comment)
        VALUES ($1, $2, $3, 'ปฏิเสธ', $4, null, $5)
      `, [id, admin_id, currentStatus, currentStep, comment]);
      
      res.json({
        message: 'ปฏิเสธรายงานสำเร็จ',
        report: updatedReport.rows[0],
        rejected_reason: comment
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการปฏิเสธรายงาน' });
    }
  });



  // 6. ดูรายงานตามขั้นตอน ใช้ใน /api/reports/by-step/:step
  router.get('/reports/by-step/:step', async (req, res) => {
    try {
      const { step } = req.params;
      const { limit = 20, page = 1 } = req.query;
      const offset = (page - 1) * limit;
      
      if (step < 1 || step > 5) {
        return res.status(400).json({ error: 'ขั้นตอนต้องอยู่ระหว่าง 1-5' });
      }
      
      const reports = await pool.query(`
        SELECT * FROM report_detail_view 
        WHERE current_step = $1 AND status != 'rejected'
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [step, limit, offset]);
      
      // นับจำนวนทั้งหมด
      const totalCount = await pool.query(`
        SELECT COUNT(*) as total FROM report 
        WHERE current_step = $1 AND status != 'rejected'
      `, [step]);
      
      res.json({
        reports: reports.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCount.rows[0].total / limit),
          total_count: parseInt(totalCount.rows[0].total),
          limit: parseInt(limit)
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงรายงานตามขั้นตอน' });
    }
  });

  // 7. ดูรายงานที่ค้างนานเกินกำหนด ใช้ใน /api/reports/overdue
  router.get('/reports/overdue', async (req, res) => {
    try {
      const overdueReports = await pool.query(`
        SELECT 
          r.*,
          rs.step_name,
          rs.estimated_duration_hours,
          u.first_name,
          u.last_name,
          pt.type_name as problem_type,
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - r.updated_at))/3600 as hours_since_update
        FROM report r
        LEFT JOIN report_steps rs ON r.current_step = rs.step_number
        LEFT JOIN "user" u ON r.user_id = u.user_id
        LEFT JOIN problem_type pt ON r.problem_type_id = pt.problem_type_id
        WHERE r.status != 'rejected' 
          AND r.current_step < 5
          AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - r.updated_at))/3600 > rs.estimated_duration_hours
        ORDER BY hours_since_update DESC
      `);
      
      res.json({
        overdue_reports: overdueReports.rows,
        count: overdueReports.rows.length
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงรายงานค้างนาน' });
    }
  });

  return router;
};
