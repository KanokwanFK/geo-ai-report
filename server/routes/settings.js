const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // 1. Get all system settings
  router.get('/', async (req, res) => {
    try {
      const settings = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');
      res.json(settings.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงการตั้งค่าระบบ' });
    }
  });

  // 2. Get setting by key
  router.get('/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await pool.query('SELECT * FROM system_settings WHERE setting_key = $1', [key]);
      
      if (setting.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบการตั้งค่า' });
      }
      
      res.json(setting.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงการตั้งค่าระบบ' });
    }
  });

  // 3. Create or update system setting (Admin only)
  router.post('/', async (req, res) => {
    try {
      const { setting_key, setting_value, description, data_type } = req.body;
      
      const result = await pool.query(`
        INSERT INTO system_settings (setting_key, setting_value, description, data_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = EXCLUDED.setting_value,
          description = EXCLUDED.description,
          data_type = EXCLUDED.data_type,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [setting_key, setting_value, description, data_type]);
      
      res.status(201).json({
        message: 'บันทึกการตั้งค่าสำเร็จ',
        setting: result.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' });
    }
  });

  // 4. Update system setting (Admin only)
  router.put('/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const { setting_value, description, data_type } = req.body;
      
      const updatedSetting = await pool.query(
        'UPDATE system_settings SET setting_value = $1, description = $2, data_type = $3 WHERE setting_key = $4 RETURNING *',
        [setting_value, description, data_type, key]
      );
      
      if (updatedSetting.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบการตั้งค่า' });
      }
      
      res.json({
        message: 'อัพเดทการตั้งค่าสำเร็จ',
        setting: updatedSetting.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า' });
    }
  });

  // 5. Delete system setting (Admin only)
  router.delete('/:key', async (req, res) => {
    try {
      const { key } = req.params;
      
      const deletedSetting = await pool.query('DELETE FROM system_settings WHERE setting_key = $1 RETURNING setting_key', [key]);
      
      if (deletedSetting.rows.length === 0) {
        return res.status(404).json({ error: 'ไม่พบการตั้งค่า' });
      }
      
      res.json({ message: 'ลบการตั้งค่าสำเร็จ' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบการตั้งค่า' });
    }
  });

  return router;
};
