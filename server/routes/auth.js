const express = require('express');
const router = express.Router();

// ฟังก์ชัน setup route - รับ pool เป็น parameter
module.exports = (pool) => {
  // 1. สมัครสมาชิกใหม่
  router.post('/register', async (req, res) => {
    try {
      const { email, password, first_name, last_name, phone, birth_date, address, province, district, subdistrict, user_type = 'user' } = req.body;
      
      // ตรวจสอบว่ามีผู้ใช้งานนี้อยู่แล้วหรือไม่
      const userExists = await pool.query('SELECT user_id FROM "user" WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'ผู้ใช้งานนี้มีอยู่แล้วในระบบ' });
      }

      const newUser = await pool.query(
        `INSERT INTO "user" (email, password, first_name, last_name, phone, birth_date, address, province, district, subdistrict, user_type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [email, password, first_name, last_name, phone, birth_date, address, province, district, subdistrict, user_type]
      );

      const user = newUser.rows[0];
      delete user.password; // ลบรหัสผ่านออกจากการตอบกลับ
      
      res.status(201).json({
        message: 'สมัครสมาชิกสำเร็จ',
        user: user
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
    }
  });

  // 2. เข้าสู่ระบบ
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await pool.query('SELECT * FROM "user" WHERE email = $1 AND password = $2', [email, password]);
      
      if (user.rows.length === 0) {
        return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }

      const userData = user.rows[0];
      delete userData.password; // ลบรหัสผ่านออกจากการตอบกลับ
      
      res.json({
        message: 'เข้าสู่ระบบสำเร็จ',
        user: userData
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
  });

  return router;
};
