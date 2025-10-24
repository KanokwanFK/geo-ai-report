const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // 1. ดูข้อมูลผู้ใช้ทั้งหมด (สำหรับ Admin)
  router.get('/users', async (req, res) => {
    try {
      const users = await pool.query(`
        SELECT u.*, a.admin_level, a.department, a.is_active as admin_active
        FROM "user" u
        LEFT JOIN admin a ON u.user_id = a.user_id
        ORDER BY u.created_at DESC
      `);
      
      // ลบรหัสผ่านออกจากการตอบกลับ
      const usersData = users.rows.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersData);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน' });
    }
  });

  // 2. สร้างผู้ดูแลระบบ
  router.post('/create', async (req, res) => {
    try {
      const { user_id, admin_level, department } = req.body;
      
      // ตรวจสอบว่าผู้ใช้งานมีอยู่และยังไม่เป็น admin
      const user = await pool.query('SELECT user_type FROM "user" WHERE user_id = $1', [user_id]);
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
      }
      
      const existingAdmin = await pool.query('SELECT admin_id FROM admin WHERE user_id = $1', [user_id]);
      if (existingAdmin.rows.length > 0) {
        return res.status(400).json({ error: 'ผู้ใช้งานนี้เป็นแอดมินแล้ว' });
      }
      
      // อัพเดทประเภทผู้ใช้เป็น admin
      await pool.query('UPDATE "user" SET user_type = $1 WHERE user_id = $2', ['admin', user_id]);
      
      // สร้างข้อมูล admin
      const newAdmin = await pool.query(
        'INSERT INTO admin (user_id, admin_level, department) VALUES ($1, $2, $3) RETURNING *',
        [user_id, admin_level, department]
      );
      
      res.status(201).json({
        message: 'สร้างแอดมินสำเร็จ',
        admin: newAdmin.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างแอดมิน' });
    }
  });

  // 3. ลบผู้ใช้งาน (สำหรับ Admin)
  router.delete('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const deletedUser = await pool.query('DELETE FROM "user" WHERE user_id = $1 RETURNING email', [id]);
      
      if (deletedUser.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
      }
      
      res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน' });
    }
  });

  // 4. อัพเดทสถานะ Admin
  router.put('/:admin_id/status', async (req, res) => {
    try {
      const { admin_id } = req.params;
      const { is_active } = req.body;
      
      const updatedAdmin = await pool.query(
        'UPDATE admin SET is_active = $1 WHERE admin_id = $2 RETURNING *',
        [is_active, admin_id]
      );
      
      if (updatedAdmin.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบแอดมิน' });
      }
      
      res.json({
        message: 'อัพเดทสถานะแอดมินสำเร็จ',
        admin: updatedAdmin.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะแอดมิน' });
    }
  });

  return router;
};
