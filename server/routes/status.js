const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // Get status mapping จาก database
  router.get('/status-mapping', async (req, res) => {
    try {
      console.log('=== Status Mapping API Called ===');
      
      const result = await pool.query(`
        SELECT 
          mapping_id,
          old_status,
          new_status,
          step_number,
          status_color,
          description,
          created_at
        FROM status_mapping
        ORDER BY step_number ASC
      `);
      
      console.log(`Found ${result.rows.length} status mappings`);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching status mapping:', err.message);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล status mapping',
        details: err.message 
      });
    }
  });

  // Get status info - สรุปข้อมูลสถานะทั้งหมด
  router.get('/status-info', async (req, res) => {
    try {
      console.log('=== Status Info API Called ===');
      
      // ดึงข้อมูลสถานะพร้อมจำนวนรายงานในแต่ละสถานะ
      const result = await pool.query(`
        SELECT 
          sm.new_status as status,
          sm.status_color as color,
          sm.step_number,
          sm.description,
          COUNT(r.report_id) as count
        FROM status_mapping sm
        LEFT JOIN report r ON r.status = sm.new_status
        WHERE sm.new_status IS NOT NULL
        GROUP BY sm.new_status, sm.status_color, sm.step_number, sm.description
        ORDER BY sm.step_number ASC
      `);
      
      console.log(`Found ${result.rows.length} status info entries`);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching status info:', err.message);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล status info',
        details: err.message 
      });
    }
  });

  // Get all available statuses
  router.get('/statuses', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT DISTINCT new_status as status, status_color, step_number, description
        FROM status_mapping
        WHERE new_status IS NOT NULL
        ORDER BY step_number ASC
      `);
      
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching statuses:', err.message);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ',
        details: err.message 
      });
    }
  });

  return router;
};
