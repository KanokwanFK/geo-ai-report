const express = require('express');
const router = express.Router();

module.exports = (pool, upload) => {
  // 1. อัปโหลดรูปภาพสำหรับรายงาน
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

  // 4. Delete image
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const path = require('path');
      const fs = require('fs');
      
      // Get image info before deleting
      const image = await pool.query('SELECT image_path FROM report_image WHERE image_id = $1', [id]);
      
      if (image.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบรูปภาพ' });
      }
      
      const imagePath = path.join(__dirname, '..', image.rows[0].image_path);
      
      // Delete from database
      await pool.query('DELETE FROM report_image WHERE image_id = $1', [id]);
      
      // Delete file from filesystem
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      res.json({ message: 'ลบรูปภาพสำเร็จ' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบรูปภาพ' });
    }
  });

  return router;
};
