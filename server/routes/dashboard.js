const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // 1. Get dashboard statistics with status mapping
  router.get('/stats', async (req, res) => {
    try {
      const stats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM report) as total_reports,
          (SELECT COUNT(*) FROM report r 
           LEFT JOIN status_mapping sm ON r.status = sm.old_status 
           WHERE COALESCE(sm.new_status, r.status) = 'รอตรวจสอบ') as pending_reports,
          (SELECT COUNT(*) FROM report r 
           LEFT JOIN status_mapping sm ON r.status = sm.old_status 
           WHERE COALESCE(sm.new_status, r.status) = 'กำลังตรวจสอบ') as checking_reports,
          (SELECT COUNT(*) FROM report r 
           LEFT JOIN status_mapping sm ON r.status = sm.old_status 
           WHERE COALESCE(sm.new_status, r.status) = 'รอดำเนินการ') as waiting_reports,
          (SELECT COUNT(*) FROM report r 
           LEFT JOIN status_mapping sm ON r.status = sm.old_status 
           WHERE COALESCE(sm.new_status, r.status) = 'กำลังดำเนินการ') as in_progress_reports,
          (SELECT COUNT(*) FROM report r 
           LEFT JOIN status_mapping sm ON r.status = sm.old_status 
           WHERE COALESCE(sm.new_status, r.status) = 'เสร็จสิ้น') as resolved_reports,
          (SELECT COUNT(*) FROM report r 
           LEFT JOIN status_mapping sm ON r.status = sm.old_status 
           WHERE COALESCE(sm.new_status, r.status) = 'ปฏิเสธ') as rejected_reports,
          (SELECT COUNT(*) FROM "user" WHERE user_type = 'user') as total_users,
          (SELECT COUNT(*) FROM "user" WHERE user_type = 'admin') as total_admins,
          (SELECT COUNT(*) FROM problem_type WHERE is_active = true) as active_problem_types
      `);
      
      res.json(stats.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติแดชบอร์ด' });
    }
  });

  // 2. Get reports by problem type
  router.get('/reports-by-type', async (req, res) => {
    try {
      const reportsByType = await pool.query(`
        SELECT 
          pt.type_name,
          pt.color_code,
          COUNT(r.report_id) as report_count
        FROM problem_type pt
        LEFT JOIN report r ON pt.problem_type_id = r.problem_type_id
        WHERE pt.is_active = true
        GROUP BY pt.problem_type_id, pt.type_name, pt.color_code
        ORDER BY report_count DESC
      `);
      
      res.json(reportsByType.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติรายงานตามประเภท' });
    }
  });

  // 3. Get recent reports
  router.get('/recent-reports', async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      
      const recentReports = await pool.query(`
        SELECT * FROM report_detail_view 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit]);
      
      res.json(recentReports.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงรายงานล่าสุด' });
    }
  });

  // 4. Get reports by province (จำนวนรายงานแต่ละจังหวัด)
  router.get('/reports-by-province', async (req, res) => {
    try {
      // Query: group by province, count reports, order by count desc
      const result = await pool.query(`
        SELECT COALESCE(u.province, 'ไม่ระบุจังหวัด') AS province, COUNT(r.report_id) AS report_count
        FROM report r
        LEFT JOIN "user" u ON r.user_id = u.user_id
        GROUP BY u.province
        ORDER BY report_count DESC, province ASC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานแต่ละจังหวัด' });
    }
  });

  // 5. Get reports by step (สถิติตามขั้นตอน)
  router.get('/reports-by-step', async (req, res) => {
    try {
      const stepStats = await pool.query(`
        SELECT 
          r.current_step,
          rs.step_name,
          rs.step_color,
          COUNT(*) as report_count,
          COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
        FROM report r
        LEFT JOIN report_steps rs ON r.current_step = rs.step_number
        WHERE r.status != 'ปฏิเสธ'
        GROUP BY r.current_step, rs.step_name, rs.step_color
        ORDER BY r.current_step
      `);
      
      // ดูจำนวนรายงานที่ปฏิเสธ
      const rejectedCount = await pool.query(`
        SELECT COUNT(*) as rejected_count FROM report WHERE status = 'ปฏิเสธ'
      `);
      
      res.json({
        by_step: stepStats.rows,
        rejected: parseInt(rejectedCount.rows[0].rejected_count),
        total: stepStats.rows.reduce((sum, step) => sum + parseInt(step.report_count), 0)
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติรายงานตามขั้นตอน' });
    }
  });

  return router;
};
