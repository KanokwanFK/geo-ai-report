const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // 1. ดูประเภทปัญหาทั้งหมด
  router.get('/', async (req, res) => {
    try {
      const problemTypes = await pool.query('SELECT * FROM problem_type WHERE is_active = true ORDER BY created_at DESC');
      res.json(problemTypes.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทปัญหา' });
    }
  });

  // 2. ดูประเภทปัญหาตาม ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const problemType = await pool.query('SELECT * FROM problem_type WHERE problem_type_id = $1', [id]);
      
      if (problemType.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบประเภทปัญหา' });
      }
      
      res.json(problemType.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทปัญหา' });
    }
  });

  // 3. สร้างประเภทปัญหาใหม่ (สำหรับ Admin)
  router.post('/', async (req, res) => {
    try {
      const { type_name, description, color_code } = req.body;
      
      const newProblemType = await pool.query(
        'INSERT INTO problem_type (type_name, description, color_code) VALUES ($1, $2, $3) RETURNING *',
        [type_name, description, color_code]
      );
      
      res.status(201).json({
        message: 'สร้างประเภทปัญหาสำเร็จ',
        problemType: newProblemType.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างประเภทปัญหา' });
    }
  });

  // 4. แก้ไขประเภทปัญหา (สำหรับ Admin)
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { type_name, description, color_code, is_active } = req.body;
      
      const updatedProblemType = await pool.query(
        'UPDATE problem_type SET type_name = $1, description = $2, color_code = $3, is_active = $4 WHERE problem_type_id = $5 RETURNING *',
        [type_name, description, color_code, is_active, id]
      );
      
      if (updatedProblemType.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบประเภทปัญหา' });
      }
      
      res.json({
        message: 'อัพเดทประเภทปัญหาสำเร็จ',
        problemType: updatedProblemType.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทประเภทปัญหา' });
    }
  });

  // 5. ลบประเภทปัญหา (สำหรับ Admin)
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const deletedProblemType = await pool.query('DELETE FROM problem_type WHERE problem_type_id = $1 RETURNING type_name', [id]);
      
      if (deletedProblemType.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบประเภทปัญหา' });
      }
      
      res.json({ message: 'ลบประเภทปัญหาสำเร็จ' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบประเภทปัญหา' });
    }
  });

  return router;
};
