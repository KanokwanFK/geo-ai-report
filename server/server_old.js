// 4. Get reports by province (จำนวนรายงานแต่ละจังหวัด)
const express = require("express")
const cors = require("cors")
const { Pool } = require("pg")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { sendNewReportEmails, sendStatusUpdateEmails } = require('./services/emailService')
const { verifyConnection } = require('./config/emailConfig')
const app = express()

// 4. Get reports by province (จำนวนรายงานแต่ละจังหวัด)
app.get('/api/dashboard/reports-by-province', async (req, res) => {
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
const port = process.env.PORT || 3003

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

// ตั้งค่า Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ตั้งค่า Static files สำหรับเปิดไฟล์รูปภาพที่อัปโหลด
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// สร้างโฟลเดอร์ uploads หากยังไม่มี
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// ตั้งค่า multer สำหรับอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('เฉพาะไฟล์รูปภาพเท่านั้น (jpeg, jpg, png, gif)'))
    }
  }
})

// ตั้งค่า Middleware สำหรับ Logging และ Debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  console.log('Headers:', req.headers)
  console.log('Body:', req.body)
  next()
})

// การเชื่อมต่อฐานข้อมูล
const pool = new Pool({
    user: "postgres",
    password: "postgres",
    database: "report_system",
    host: "localhost",
    port: 5432,
})

// ทดสอบการเชื่อมต่อฐานข้อมูล
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack)
    return
  }
  console.log('Connected to PostgreSQL database successfully!')
  release()
})

// ทดสอบการเชื่อมต่อ Email Server
verifyConnection()
  .then(result => {
    if (result) {
      console.log('📧 Email service is ready to use');
    } else {
      console.warn('⚠️ Email service may not be configured properly. Check your .env file');
    }
  })
  .catch(err => {
    console.error('❌ Email service verification failed:', err.message);
  });

//================= เส้นทาง API Routes =================//
// อัพเดตสถานะรายงานตาม phone และ report_id
app.put('/api/reports/update-status-by-phone', async (req, res) => {
  try {
    const { phone, report_id, new_status } = req.body;
    // หา user_id จาก phone
    const userRes = await pool.query('SELECT user_id FROM "user" WHERE phone = $1', [phone]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
    }
    const user_id = userRes.rows[0].user_id;
    // อัพเดตสถานะใน report
    const updateRes = await pool.query(
      'UPDATE report SET status = $1 WHERE report_id = $2 AND user_id = $3 RETURNING *',
      [new_status, report_id, user_id]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบรายงานหรือไม่ตรงกับผู้ใช้งาน' });
    }
    res.json({ message: 'อัพเดทสถานะสำเร็จ', report: updateRes.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ' });
  }
});
// อัพเดตสถานะรายงานตาม email และ report_id
app.put('/api/reports/update-status-by-email', async (req, res) => {
  try {
    const { email, report_id, new_status } = req.body;
    // หา user_id จาก email
    const userRes = await pool.query('SELECT user_id FROM "user" WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
    }
    const user_id = userRes.rows[0].user_id;
    // อัพเดตสถานะใน report
    const updateRes = await pool.query(
      'UPDATE report SET status = $1 WHERE report_id = $2 AND user_id = $3 RETURNING *',
      [new_status, report_id, user_id]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบรายงานหรือไม่ตรงกับผู้ใช้งาน' });
    }
    res.json({ message: 'อัพเดทสถานะสำเร็จ', report: updateRes.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ' });
  }
});

// ระบบการจัดการผู้ใช้และการเข้าสู่ระบบ

// 1. สมัครสมาชิกใหม่
app.post('/api/auth/register', async (req, res) => {
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
app.post('/api/auth/login', async (req, res) => {
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

// 3. ดูข้อมูลโปรไฟล์ผู้ใช้
app.get('/api/users/:id', async (req, res) => {
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

// 4. แก้ไขข้อมูลโปรไฟล์ผู้ใช้
app.put('/api/users/:id', async (req, res) => {
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

// 5. เปลี่ยนรหัสผ่าน
app.put('/api/users/:id/password', async (req, res) => {
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

// ระบบการจัดการผู้ดูแลระบบ (Admin)

// 1. ดูข้อมูลผู้ใช้ทั้งหมด (สำหรับ Admin)
app.get('/api/admin/users', async (req, res) => {
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
app.post('/api/admin/create', async (req, res) => {
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
app.delete('/api/admin/users/:id', async (req, res) => {
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
app.put('/api/admin/:admin_id/status', async (req, res) => {
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

// ระบบการจัดการประเภทปัญหา

// 1. ดูประเภทปัญหาทั้งหมด
app.get('/api/problem-types', async (req, res) => {
  try {
    const problemTypes = await pool.query('SELECT * FROM problem_type WHERE is_active = true ORDER BY created_at DESC');
    res.json(problemTypes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทปัญหา' });
  }
});

// 2. ดูประเภทปัญหาตาม ID
app.get('/api/problem-types/:id', async (req, res) => {
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
app.post('/api/problem-types', async (req, res) => {
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
app.put('/api/problem-types/:id', async (req, res) => {
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
app.delete('/api/problem-types/:id', async (req, res) => {
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

// ระบบการจัดการรายงาน

// 1. สร้างรายงานใหม่
app.post('/api/reports', async (req, res) => {
  try {
    const { user_id, problem_type_id, title, description, latitude, longitude, location_detail } = req.body;
    
    // สร้างรายงานในฐานข้อมูล
    const newReport = await pool.query(
      `INSERT INTO report (user_id, problem_type_id, title, description, latitude, longitude, location_detail) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, problem_type_id, title, description, latitude, longitude, location_detail]
    );
    
    const reportData = newReport.rows[0];
    
    // ส่งอีเมลแจ้งเตือน (ไม่บล็อคการตอบกลับ)
    // ทำงานแบบ async โดยไม่ await เพื่อไม่ให้ user รอนาน
    sendNewReportEmails(pool, reportData)
      .then(emailResult => {
        if (emailResult.success) {
          console.log(`✅ Email notifications sent for report #${reportData.report_id}`);
        } else {
          console.error(`⚠️ Failed to send some email notifications: ${emailResult.error}`);
        }
      })
      .catch(error => {
        console.error(`❌ Error sending email notifications: ${error.message}`);
      });
    
    // ตอบกลับทันทีโดยไม่รอส่งอีเมล
    res.status(201).json({
      message: 'สร้างรายงานสำเร็จ',
      report: reportData,
      notification: 'กำลังส่งอีเมลแจ้งเตือน'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
  }
});

// Update status using status mapping table
app.get('/api/update-status', async (req, res) => {
  try {
    // อัพเดท report ให้ใช้สถานะใหม่ตาม mapping
    const updateResult = await pool.query(`
      UPDATE report 
      SET status = sm.new_status
      FROM status_mapping sm
      WHERE report.status = sm.old_status
      AND report.status != sm.new_status
    `);

    // เช็คสถานะปัจจุบัน
    const statusCheck = await pool.query(`
      SELECT 
        r.status,
        COUNT(*) as count,
        COALESCE(sm.status_color, '#999999') as color,
        COALESCE(sm.step_number, 0) as step_number
      FROM report r
      LEFT JOIN status_mapping sm ON r.status = sm.new_status
      GROUP BY r.status, sm.status_color, sm.step_number
      ORDER BY COALESCE(sm.step_number, 999), r.status
    `);

    res.json({
      message: 'อัพเดทสถานะสำเร็จด้วย Status Mapping',
      updated_rows: updateResult.rowCount,
      current_status: statusCheck.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ: ' + err.message });
  }
});

// Get status mapping table
app.get('/api/status-mapping', async (req, res) => {
  try {
    const mappings = await pool.query(`
      SELECT * FROM status_mapping 
      ORDER BY step_number, old_status
    `);
    res.json(mappings.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล status mapping' });
  }
});

// Get status colors and info
app.get('/api/status-info', async (req, res) => {
  try {
    console.log('=== Status Info API Called ===');
    
    // ใช้ query ที่เรียบง่ายกว่า - นับจำนวนรายงานตามสถานะ
    const statusInfo = await pool.query(`
      SELECT 
        status as status_name,
        COUNT(*) as report_count,
        CASE 
          WHEN status = 'รอตรวจสอบ' THEN '#E91E63'
          WHEN status = 'กำลังตรวจสอบ' THEN '#FF9800'
          WHEN status = 'รอดำเนินการ' THEN '#FFEB3B'
          WHEN status = 'กำลังดำเนินการ' THEN '#00BCD4'
          WHEN status = 'เสร็จสิ้น' THEN '#4CAF50'
          WHEN status = 'ปฏิเสธ' THEN '#F44336'
          ELSE '#6c757d'
        END as status_color,
        CASE 
          WHEN status = 'รอตรวจสอบ' THEN 'รอการตรวจสอบจากเจ้าหน้าที่'
          WHEN status = 'กำลังตรวจสอบ' THEN 'เจ้าหน้าที่กำลังตรวจสอบข้อมูล'
          WHEN status = 'รอดำเนินการ' THEN 'รอการดำเนินการแก้ไข'
          WHEN status = 'กำลังดำเนินการ' THEN 'กำลังดำเนินการแก้ไขปัญหา'
          WHEN status = 'เสร็จสิ้น' THEN 'ดำเนินการเสร็จสิ้นแล้ว'
          WHEN status = 'ปฏิเสธ' THEN 'รายงานถูกปฏิเสธ'
          ELSE 'สถานะไม่ระบุ'
        END as description,
        CASE 
          WHEN status = 'รอตรวจสอบ' THEN 1
          WHEN status = 'กำลังตรวจสอบ' THEN 2
          WHEN status = 'รอดำเนินการ' THEN 3
          WHEN status = 'กำลังดำเนินการ' THEN 4
          WHEN status = 'เสร็จสิ้น' THEN 5
          WHEN status = 'ปฏิเสธ' THEN 0
          ELSE 99
        END as step_number
      FROM report 
      GROUP BY status
      ORDER BY step_number
    `);
    
    console.log('Status info query result:', statusInfo.rows);
    res.json(statusInfo.rows);
  } catch (err) {
    console.error('=== ERROR in status-info ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล status info' });
  }
});

// 2. ดูรายงานทั้งหมดพร้อมรายละเอียด
app.get('/api/reports', async (req, res) => {
  try {
    console.log('=== Reports API Called ===');
    console.log('Query params:', req.query);
    
    const { status, user_id, problem_type_id, limit = 50, offset = 0 } = req.query;
    
    // ใช้ query ที่เรียบง่ายกว่าแทน view
    let query = `
        SELECT 
            r.report_id,
            r.user_id,
            r.problem_type_id,
            r.title,
            r.description,
            r.latitude,
            r.longitude,
            r.location_detail,
            r.status,
            r.current_step,
            r.created_at,
            r.updated_at,
            u.first_name,
            u.last_name,
            u.email,
            pt.type_name as problem_type,
            pt.color_code,
            CASE 
                WHEN r.status = 'รอตรวจสอบ' THEN 'เริ่มยื่นคำร้อง'
                WHEN r.status = 'กำลังตรวจสอบ' THEN 'ตรวจสอบข้อมูล'
                WHEN r.status = 'รอดำเนินการ' THEN 'รอดำเนินการ'
                WHEN r.status = 'กำลังดำเนินการ' THEN 'กำลังดำเนินการ'
                WHEN r.status = 'เสร็จสิ้น' THEN 'เสร็จสิ้น'
                WHEN r.status = 'ปฏิเสธ' THEN 'ปฏิเสธ'
                ELSE 'เริ่มยื่นคำร้อง'
            END as current_step_name,
            CASE 
                WHEN r.status = 'รอตรวจสอบ' THEN '#E91E63'
                WHEN r.status = 'กำลังตรวจสอบ' THEN '#FF9800'
                WHEN r.status = 'รอดำเนินการ' THEN '#FFEB3B'
                WHEN r.status = 'กำลังดำเนินการ' THEN '#00BCD4'
                WHEN r.status = 'เสร็จสิ้น' THEN '#4CAF50'
                WHEN r.status = 'ปฏิเสธ' THEN '#f5222d'
                ELSE '#E91E63'
            END as current_step_color,
            CASE 
                WHEN r.status = 'รอตรวจสอบ' THEN 0
                WHEN r.status = 'กำลังตรวจสอบ' THEN 25
                WHEN r.status = 'รอดำเนินการ' THEN 50
                WHEN r.status = 'กำลังดำเนินการ' THEN 75
                WHEN r.status = 'เสร็จสิ้น' THEN 100
                WHEN r.status = 'ปฏิเสธ' THEN 0
                ELSE 0
            END as progress_percentage,
            CASE 
                WHEN r.status = 'รอตรวจสอบ' THEN 1
                WHEN r.status = 'กำลังตรวจสอบ' THEN 2
                WHEN r.status = 'รอดำเนินการ' THEN 3
                WHEN r.status = 'กำลังดำเนินการ' THEN 4
                WHEN r.status = 'เสร็จสิ้น' THEN 5
                WHEN r.status = 'ปฏิเสธ' THEN 1
                ELSE 1
            END as calculated_current_step
        FROM report r
        LEFT JOIN "user" u ON r.user_id = u.user_id
        LEFT JOIN problem_type pt ON r.problem_type_id = pt.problem_type_id
        WHERE 1=1
    `;
    
    let params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
    }
    
    if (user_id) {
      paramCount++;
      query += ` AND r.user_id = $${paramCount}`;
      params.push(user_id);
    }
    
    if (problem_type_id) {
      paramCount++;
      query += ` AND r.problem_type_id = $${paramCount}`;
      params.push(problem_type_id);
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    console.log('Executing query:', query);
    console.log('With params:', params);
    
    const reports = await pool.query(query, params);
    
    console.log('Found reports:', reports.rows.length);
    res.json(reports.rows);
  } catch (err) {
    console.error('Error in /api/reports:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน: ' + err.message });
  }
});

// 3. ดูรายงานตาม ID
app.get('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await pool.query('SELECT * FROM report_detail_view WHERE report_id = $1', [id]);
    
    if (report.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบรายงาน' });
    }
    
    // ดึงรูปภาพสำหรับรายงานนี้
    const images = await pool.query('SELECT * FROM report_image WHERE report_id = $1', [id]);
    
    res.json({
      ...report.rows[0],
      images: images.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน' });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ message: 'Database is working', data: result.rows[0] });
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// 4. อัพเดทสถานะรายงาน (สำหรับ Admin) - Simplified version
app.put('/api/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_id, comment } = req.body;
    
    console.log('=== Update Status API Called ===');
    console.log('Report ID:', id, 'Type:', typeof id);
    console.log('New Status:', status, 'Type:', typeof status);
    console.log('Admin ID:', admin_id, 'Type:', typeof admin_id);
    console.log('Comment:', comment, 'Type:', typeof comment);
    
    // ดึงสถานะเดิมก่อนอัพเดท
    const oldReportResult = await pool.query(
      'SELECT status FROM report WHERE report_id = $1',
      [id]
    );
    
    if (oldReportResult.rowCount === 0) {
      console.log('No report found with ID:', id);
      return res.status(404).json({ error: 'ไม่พบรายงาน' });
    }
    
    const oldStatus = oldReportResult.rows[0].status;
    console.log('Old Status:', oldStatus);
    
    // อัพเดทสถานะ
    console.log('Attempting simple status update...');
    const updateResult = await pool.query(
      'UPDATE report SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE report_id = $2 RETURNING *',
      [status, id]
    );
    
    console.log('Update completed, affected rows:', updateResult.rowCount);
    
    const updatedReport = updateResult.rows[0];
    
    // ส่งอีเมลแจ้งเตือนการอัพเดทสถานะ (ไม่บล็อคการตอบกลับ)
    sendStatusUpdateEmails(pool, {
      reportId: parseInt(id),
      oldStatus: oldStatus,
      newStatus: status,
      adminId: admin_id,
      comment: comment || ''
    })
      .then(emailResult => {
        if (emailResult.success) {
          console.log(`✅ Status update email notifications sent for report #${id}`);
        } else {
          console.error(`⚠️ Failed to send status update emails: ${emailResult.error}`);
        }
      })
      .catch(error => {
        console.error(`❌ Error sending status update emails: ${error.message}`);
      });
    
    console.log('Sending success response');
    res.json({
      message: 'อัพเดทสถานะรายงานสำเร็จ',
      report: updatedReport,
      success: true,
      notification: 'กำลังส่งอีเมลแจ้งเตือน'
    });
  } catch (err) {
    console.error('=== ERROR in update status ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะรายงาน' });
  }
});

// 5. แก้ไขรายละเอียดรายงาน
app.put('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, problem_type_id, latitude, longitude, location_detail } = req.body;
    
    const updatedReport = await pool.query(
      `UPDATE report SET title = $1, description = $2, problem_type_id = $3, 
       latitude = $4, longitude = $5, location_detail = $6 
       WHERE report_id = $7 RETURNING *`,
      [title, description, problem_type_id, latitude, longitude, location_detail, id]
    );
    
    if (updatedReport.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบรายงาน' });
    }
    
    res.json({
      message: 'อัพเดทรายงานสำเร็จ',
      report: updatedReport.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทรายงาน' });
  }
});

// 6. ลบรายงาน
app.delete('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedReport = await pool.query('DELETE FROM report WHERE report_id = $1 RETURNING title', [id]);
    
    if (deletedReport.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบรายงาน' });
    }
    
    res.json({ message: 'ลบรายงานสำเร็จ' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบรายงาน' });
  }
});

// 7. ดูประวัติการเปลี่ยนแปลงสถานะรายงาน
app.get('/api/reports/:id/status-history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const statusHistory = await pool.query(`
      SELECT rsl.*, a.admin_level, u.first_name, u.last_name 
      FROM report_status_log rsl
      LEFT JOIN admin a ON rsl.admin_id = a.admin_id
      LEFT JOIN "user" u ON a.user_id = u.user_id
      WHERE rsl.report_id = $1
      ORDER BY rsl.changed_at DESC
    `, [id]);
    
    res.json(statusHistory.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงประวัติการเปลี่ยนแปลงสถานะ' });
  }
});

// ระบบการจัดการรูปภาพ

// 1. อัปโหลดรูปภาพสำหรับรายงาน
app.post('/api/reports/:id/images', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
    }
    
    // Check if report exists
    const report = await pool.query('SELECT report_id FROM report WHERE report_id = $1', [id]);
    if (report.rows.length === 0) {
      // Delete uploaded file if report doesn't exist
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
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ' });
  }
});

// 2. Upload multiple images for report
app.post('/api/reports/:id/images/multiple', upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
    }
    
    // Check if report exists
    const report = await pool.query('SELECT report_id FROM report WHERE report_id = $1', [id]);
    if (report.rows.length === 0) {
      // Delete uploaded files if report doesn't exist
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
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ' });
  }
});

// 3. Get images for a report
app.get('/api/reports/:id/images', async (req, res) => {
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
app.delete('/api/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get image info before deleting
    const image = await pool.query('SELECT image_path FROM report_image WHERE image_id = $1', [id]);
    
    if (image.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบรูปภาพ' });
    }
    
    const imagePath = path.join(__dirname, image.rows[0].image_path);
    
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

// ระบบการแจ้งเตือน

// 1. ดูการแจ้งเตือนสำหรับผู้ใช้
app.get('/api/users/:user_id/notifications', async (req, res) => {
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

// 2. Create notification
app.post('/api/notifications', async (req, res) => {
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

// 3. Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
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

// 4. Mark all notifications as read for a user
app.put('/api/users/:user_id/notifications/read-all', async (req, res) => {
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

// 5. Get unread notification count
app.get('/api/users/:user_id/notifications/unread-count', async (req, res) => {
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

// 6. Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
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

// ==================== System Settings APIs ====================

// 1. Get all system settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');
    res.json(settings.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงการตั้งค่าระบบ' });
  }
});

// 2. Get setting by key
app.get('/api/settings/:key', async (req, res) => {
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
app.post('/api/settings', async (req, res) => {
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
app.put('/api/settings/:key', async (req, res) => {
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
app.delete('/api/settings/:key', async (req, res) => {
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

// ==================== Dashboard & Statistics APIs ====================

// 1. Get dashboard statistics with status mapping
app.get('/api/dashboard/stats', async (req, res) => {
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
app.get('/api/dashboard/reports-by-type', async (req, res) => {
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
app.get('/api/dashboard/recent-reports', async (req, res) => {
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

//================= ระบบติดตามสถานะรายงาน (Report Status Tracking) =================//

// 1. ดูขั้นตอนทั้งหมด
app.get('/api/report-steps', async (req, res) => {
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

// 2. ดูสถานะรายงานพร้อมขั้นตอนปัจจุบัน
app.get('/api/reports/:id/status', async (req, res) => {
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

// 3. อัพเดทสถานะรายงานไปขั้นตอนถัดไป (สำหรับ Admin)
app.put('/api/reports/:id/next-step', async (req, res) => {
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

// 4. อัพเดทสถานะไปขั้นตอนที่กำหนด (สำหรับ Admin)
app.put('/api/reports/:id/set-step', async (req, res) => {
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

// 5. ปฏิเสธรายงาน (สำหรับ Admin)
app.put('/api/reports/:id/reject', async (req, res) => {
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

// 6. ดูประวัติการเปลี่ยนแปลงสถานะ
app.get('/api/reports/:id/status-history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = await pool.query(`
      SELECT 
        rsl.*,
        u.first_name,
        u.last_name,
        rs_old.step_name as old_step_name,
        rs_new.step_name as new_step_name
      FROM report_status_log rsl
      LEFT JOIN admin a ON rsl.admin_id = a.admin_id
      LEFT JOIN "user" u ON a.user_id = u.user_id
      LEFT JOIN report_steps rs_old ON rsl.old_step = rs_old.step_number
      LEFT JOIN report_steps rs_new ON rsl.new_step = rs_new.step_number
      WHERE rsl.report_id = $1
      ORDER BY rsl.changed_at DESC
    `, [id]);
    
    res.json(history.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงประวัติการเปลี่ยนแปลง' });
  }
});

// 7. ดูสถิติรายงานตามขั้นตอน
app.get('/api/dashboard/reports-by-step', async (req, res) => {
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

// 8. ดูรายงานตามขั้นตอน
app.get('/api/reports/by-step/:step', async (req, res) => {
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

// 9. ดูรายงานที่ค้างนานเกินกำหนด
app.get('/api/reports/overdue', async (req, res) => {
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

// การจัดการข้อผิดพลาด Middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

// การจัดการ 404
app.use((req, res) => {
  res.status(404).json({ error: 'ไม่พบเส้นทาง API ที่ร้องขอ' });
});

// ==================== Webhook & Chat System ====================

// ใช้ WebSocket หรือ HTTP Polling สำหรับการติดตามการอัพเดตแบบเรียลไทม์
const WebSocket = require('ws');
const http = require('http');

// สร้าง HTTP Server และ WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// เก็บ active WebSocket connections
const activeConnections = new Map();

// ==================== Webhook Endpoint ====================

// 1. Webhook endpoint สำหรับรับข้อมูลจากระบบภายนอก
app.post('/webhook/:session_id/chat', async (req, res) => {
    // ตอบจำนวนประเภทของปัญหา
    if (/จำนวนประเภท.*ปัญหา|จำนวนประเภทปัญหา|จำนวนประเภทของปัญหา/i.test(message)) {
      const result = await pool.query('SELECT COUNT(*) AS type_count FROM problem_type');
      const reply = `ขณะนี้มีประเภทปัญหาในระบบทั้งหมด ${result.rows[0].type_count} ประเภทค่ะ`;
      return res.json({ output: reply });
    }
  try {
    const { session_id } = req.params;
    const { message, sender_type, user_id, report_id, timestamp } = req.body;

    console.log('=== Webhook Chat Received ===');
    console.log('Session ID:', session_id);
    console.log('Message:', message);
    console.log('Sender Type:', sender_type);

    // ตรวจสอบว่า session_id ถูกต้อง
    if (!session_id || !message) {
      return res.status(400).json({ 
        error: 'session_id และ message จำเป็นต้องมี',
        required_fields: ['session_id', 'message', 'sender_type']
      });
    }
//=================== เพิ่ม logic ตอบ prompt เฉพาะเจาะจง ==================//
    // เพิ่ม logic ตอบ prompt เฉพาะเจาะจง
    if (/จำนวนรายงาน.*ประเภท|จำนวนรายงานแต่ละประเภท|รายงานแต่ละประเภท|จำนวนรายงานของแต่ละประเภท|จำนวนของแต่ละประเภท/i.test(message)) {
      const result = await pool.query(`
        SELECT pt.type_name, COUNT(r.report_id) AS report_count
        FROM problem_type pt
        LEFT JOIN report r ON pt.problem_type_id = r.problem_type_id
        GROUP BY pt.type_name
        ORDER BY pt.type_name
      `);
      const reply = 'จำนวนรายงานแต่ละประเภทในระบบ:\n' + result.rows.map(r => `- ${r.type_name}: ${r.report_count} รายงาน`).join('\n');
      return res.json({ output: reply });
    }
    if (/สถานะรายงาน|รายงานทั้งหมด|คืบหน้า|สถิติ/i.test(message)) {
      // ตัวอย่าง: สถิติรายงานทั้งหมด
      const stats = await pool.query(`
        SELECT COUNT(*) AS total_reports,
          SUM(CASE WHEN status IN ('รอตรวจสอบ','กำลังตรวจสอบ','รอดำเนินการ','กำลังดำเนินการ','pending','in_progress') THEN 1 ELSE 0 END) AS pending_reports,
          SUM(CASE WHEN status IN ('เสร็จสิ้น','resolved','step5') THEN 1 ELSE 0 END) AS resolved_reports,
          SUM(CASE WHEN status IN ('ปฏิเสธ','rejected') THEN 1 ELSE 0 END) AS rejected_reports
        FROM report
      `);
      const s = stats.rows[0];
      const reply = `ขณะนี้มีรายงานทั้งหมด ${s.total_reports} รายการ\nรอตรวจสอบ/กำลังดำเนินการ: ${s.pending_reports}\nเสร็จสิ้น: ${s.resolved_reports}\nปฏิเสธ: ${s.rejected_reports}`;
      return res.json({ output: reply });
    }

    // ...existing code (บันทึกข้อความและเชื่อมต่อระบบเดิม)...
    const chatMessage = await pool.query(`
      INSERT INTO chat_messages (session_id, user_id, report_id, message, sender_type, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `, [session_id, user_id || null, report_id || null, message, sender_type || 'user']);

    console.log('Message saved:', chatMessage.rows[0]);

    broadcastMessage(session_id, {
      type: 'new_message',
      data: chatMessage.rows[0]
    });

    await notifyExternalSystem(session_id, chatMessage.rows[0]);

    res.status(201).json({
      message: 'ได้รับข้อความสำเร็จ',
      chat: chatMessage.rows[0],
      success: true
    });

  } catch (err) {
    console.error('Error in webhook:', err.message);
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการรับข้อความ',
      details: err.message 
    });
  }
});

// 2. Webhook endpoint สำหรับรับการอัพเดตสถานะ
app.post('/webhook/:session_id/status-update', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { report_id, old_status, new_status, admin_id, comment } = req.body;

    console.log('=== Webhook Status Update Received ===');
    console.log('Session ID:', session_id);
    console.log('Report ID:', report_id);
    console.log('Status Change:', old_status, '->', new_status);

    // บันทึกการเปลี่ยนแปลงสถานะ
    const statusLog = await pool.query(`
      INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, comment, changed_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `, [report_id, admin_id || null, old_status, new_status, comment || null]);

    // ส่งการแจ้งเตือนไปยังผู้ใช้
    const report = await pool.query('SELECT user_id FROM report WHERE report_id = $1', [report_id]);
    if (report.rows.length > 0) {
      await pool.query(`
        INSERT INTO notifications (user_id, report_id, title, message, type)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        report.rows[0].user_id,
        report_id,
        'อัพเดทสถานะรายงาน',
        `สถานะรายงานเปลี่ยนเป็น: ${new_status}`,
        'status_update'
      ]);
    }

    // ส่งการอัพเดตไปยัง WebSocket clients
    broadcastMessage(session_id, {
      type: 'status_update',
      data: {
        report_id,
        old_status,
        new_status,
        changed_at: statusLog.rows[0].changed_at
      }
    });

    res.status(201).json({
      message: 'บันทึกการอัพเดตสถานะสำเร็จ',
      log: statusLog.rows[0],
      success: true
    });

  } catch (err) {
    console.error('Error in status update webhook:', err.message);
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการบันทึกการอัพเดตสถานะ',
      details: err.message 
    });
  }
});

// 3. API endpoint สำหรับดึงข้อความแชทของ session
app.get('/api/chat/:session_id/messages', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await pool.query(`
      SELECT * FROM chat_messages
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [session_id, limit, offset]);

    res.json({
      session_id,
      messages: messages.rows.reverse(),
      count: messages.rows.length
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อความแชท' });
  }
});

// 4. API endpoint สำหรับส่งข้อความ
app.post('/api/chat/:session_id/send', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { user_id, message, report_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'ข้อความไม่สามารถเป็นค่าว่างได้' });
    }

    const chatMessage = await pool.query(`
      INSERT INTO chat_messages (session_id, user_id, report_id, message, sender_type, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `, [session_id, user_id, report_id || null, message, 'user']);

    // ส่งไปยัง WebSocket clients
    broadcastMessage(session_id, {
      type: 'new_message',
      data: chatMessage.rows[0]
    });

    res.status(201).json({
      message: 'ส่งข้อความสำเร็จ',
      chat: chatMessage.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
  }
});

// ==================== WebSocket Connection Handling ====================

wss.on('connection', (ws, req) => {
  console.log('=== WebSocket Connected ===');
  
  // ดึง session_id จาก URL query
  const url = new URL(req.url, `http://${req.headers.host}`);
  const session_id = url.searchParams.get('session_id');
  const user_id = url.searchParams.get('user_id');

  if (!session_id) {
    ws.close(1008, 'session_id required');
    return;
  }

  console.log('Session ID:', session_id);
  console.log('User ID:', user_id);

  // เก็บ connection
  if (!activeConnections.has(session_id)) {
    activeConnections.set(session_id, []);
  }
  activeConnections.get(session_id).push({ ws, user_id });

  // ส่งข้อความยินดีต้อนรับ
  ws.send(JSON.stringify({
    type: 'connected',
    session_id,
    timestamp: new Date().toISOString()
  }));

  // รับข้อความจาก client
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      console.log('WebSocket Message received:', message);

      if (message.type === 'chat_message') {
        // บันทึกข้อความ
        const chatMessage = await pool.query(`
          INSERT INTO chat_messages (session_id, user_id, message, sender_type, created_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          RETURNING *
        `, [session_id, user_id, message.text, 'user']);

        // ส่งไปยัง clients ทั้งหมด
        broadcastMessage(session_id, {
          type: 'new_message',
          data: chatMessage.rows[0]
        });
      }
    } catch (err) {
      console.error('WebSocket message error:', err.message);
      ws.send(JSON.stringify({
        type: 'error',
        error: err.message
      }));
    }
  });

  // ตัดการเชื่อมต่อ
  ws.on('close', () => {
    console.log('WebSocket Disconnected, Session:', session_id);
    const connections = activeConnections.get(session_id) || [];
    const index = connections.findIndex(c => c.ws === ws);
    if (index > -1) {
      connections.splice(index, 1);
    }
    if (connections.length === 0) {
      activeConnections.delete(session_id);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

// ==================== Helper Functions ====================

// ฟังก์ชันส่งข้อความไปยัง WebSocket clients ทั้งหมดใน session
function broadcastMessage(session_id, message) {
  const connections = activeConnections.get(session_id);
  if (!connections) return;

  const messageStr = JSON.stringify(message);
  connections.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

// ฟังก์ชันแจ้งเตือนระบบภายนอก
async function notifyExternalSystem(session_id, message) {
  try {
    // ใส่ logic สำหรับการส่งข้อมูลไปยังระบบภายนอก
    console.log('Notifying external system for session:', session_id);
    // const response = await fetch('https://external-system.com/webhook', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(message)
    // });
  } catch (err) {
    console.error('Error notifying external system:', err.message);
  }
}

// เริ่มต้นเซิร์ฟเวอร์
server.listen(port, () => {
  console.log(`เซิร์ฟเวอร์ทำงานบน port ${port}`)
  console.log(`เส้นทาง API พร้อมใช้งานที่: http://localhost:${port}/api`)
  console.log(`รูปภาพที่อัปโหลดสามารถเข้าถึงได้ที่: http://localhost:${port}/uploads`)
  console.log(`Webhook endpoints:`)
  console.log(`  - POST http://localhost:${port}/webhook/:session_id/chat`)
  console.log(`  - POST http://localhost:${port}/webhook/:session_id/status-update`)
})


