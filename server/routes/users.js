const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // 1. ดูข้อมูลโปรไฟล์ผู้ใช้
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await pool.query('SELECT * FROM "user" WHERE user_id = $1', [id]);
      
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
      }

      const userData = user.rows[0];
      delete userData.password;
      
      res.json(userData);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน' });
    }
  });

  // 2. แก้ไขข้อมูลโปรไฟล์ผู้ใช้
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { first_name, last_name, phone, birth_date, address, province, district, subdistrict } = req.body;
      
      const updatedUser = await pool.query(
        `UPDATE "user" SET first_name = $1, last_name = $2, phone = $3, birth_date = $4, 
         address = $5, province = $6, district = $7, subdistrict = $8 
         WHERE user_id = $9 RETURNING *`,
        [first_name, last_name, phone, birth_date, address, province, district, subdistrict, id]
      );
      
      if (updatedUser.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
      }

      const userData = updatedUser.rows[0];
      delete userData.password;
      
      res.json({
        message: 'อัพเดทข้อมูลสำเร็จ',
        user: userData
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' });
    }
  });

  // 3. เปลี่ยนรหัสผ่าน
  router.put('/:id/password', async (req, res) => {
    try {
      const { id } = req.params;
      const { old_password, new_password } = req.body;
      
      // ตรวจสอบรหัสผ่านเดิม
      const user = await pool.query('SELECT password FROM "user" WHERE user_id = $1', [id]);
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
      }
      
      if (user.rows[0].password !== old_password) {
        return res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });
      }
      
      await pool.query('UPDATE "user" SET password = $1 WHERE user_id = $2', [new_password, id]);
      
      res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    }
  });

  // 4. ดูการแจ้งเตือนสำหรับผู้ใช้
  router.get('/:user_id/notifications', async (req, res) => {
    try {
      const { user_id } = req.params;
      const { is_read, limit = 20, offset = 0 } = req.query;
      
      let query = `
        SELECT n.*, r.title as report_title 
        FROM notifications n
        LEFT JOIN report r ON n.report_id = r.report_id
        WHERE n.user_id = $1
      `;
      let params = [user_id];
      let paramCount = 1;
      
      if (is_read !== undefined) {
        paramCount++;
        query += ` AND n.is_read = $${paramCount}`;
        params.push(is_read === 'true');
      }
      
      query += ` ORDER BY n.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);
      
      const notifications = await pool.query(query, params);
      
      res.json(notifications.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน' });
    }
  });

  // 5. Mark all notifications as read for a user
  router.put('/:user_id/notifications/read-all', async (req, res) => {
    try {
      const { user_id } = req.params;
      
      const result = await pool.query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
        [user_id]
      );
      
      res.json({
        message: 'อัพเดทสถานะการอ่านทั้งหมดสำเร็จ',
        updated_count: result.rowCount
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะการอ่าน' });
    }
  });

  // 6. Get unread notification count
  router.get('/:user_id/notifications/unread-count', async (req, res) => {
    try {
      const { user_id } = req.params;
      
      const result = await pool.query(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
        [user_id]
      );
      
      res.json({ unread_count: parseInt(result.rows[0].unread_count) });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการนับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน' });
    }
  });

  return router;
};
