const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // 1. Create notification
  router.post('/', async (req, res) => {
    try {
      const { user_id, report_id, title, message, type = 'info' } = req.body;
      
      const newNotification = await pool.query(
        'INSERT INTO notifications (user_id, report_id, title, message, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user_id, report_id, title, message, type]
      );
      
      res.status(201).json({
        message: 'สร้างการแจ้งเตือนสำเร็จ',
        notification: newNotification.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างการแจ้งเตือน' });
    }
  });

  // 2. Mark notification as read
  router.put('/:id/read', async (req, res) => {
    try {
      const { id } = req.params;
      
      const updatedNotification = await pool.query(
        'UPDATE notifications SET is_read = true WHERE notification_id = $1 RETURNING *',
        [id]
      );
      
      if (updatedNotification.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบการแจ้งเตือน' });
      }
      
      res.json({
        message: 'อัพเดทสถานะการอ่านสำเร็จ',
        notification: updatedNotification.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะการอ่าน' });
    }
  });

  // 3. Delete notification
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const deletedNotification = await pool.query('DELETE FROM notifications WHERE notification_id = $1 RETURNING title', [id]);
      
      if (deletedNotification.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบการแจ้งเตือน' });
      }
      
      res.json({ message: 'ลบการแจ้งเตือนสำเร็จ' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน' });
    }
  });

  return router;
};
