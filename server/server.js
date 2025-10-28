const express = require("express")
const cors = require("cors")
const { Pool } = require("pg")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { sendNewReportEmails, sendStatusUpdateEmails } = require('./services/emailService')
const { verifyConnection } = require('./config/emailConfig')
const WebSocket = require('ws')
const http = require('http')

// โหลด environment variables
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3003

// ตั้งค่า Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // อนุญาตให้ frontend จาก ngrok เข้าถึงได้
  credentials: true
}))
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
  // console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  // console.log('Headers:', req.headers)
  // console.log('Body:', req.body)
  next()
})

// การเชื่อมต่อฐานข้อมูล
const pool = new Pool(
    process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    } : {
        user: process.env.DB_USER ||  "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "report_system",
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: false
        } : false
    }
)

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

// Import routes
const authRoutes = require('./routes/auth')(pool);
const userRoutes = require('./routes/users')(pool);
const adminRoutes = require('./routes/admin')(pool);
const problemTypesRoutes = require('./routes/problemTypes')(pool);
const reportsRoutes = require('./routes/reports')(pool, sendNewReportEmails, sendStatusUpdateEmails, upload);
const imagesRoutes = require('./routes/images')(pool, upload);
const notificationsRoutes = require('./routes/notifications')(pool);
const settingsRoutes = require('./routes/settings')(pool);
const dashboardRoutes = require('./routes/dashboard')(pool);
const reportStepsRoutes = require('./routes/reportSteps')(pool);
const statusRoutes = require('./routes/status')(pool);

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/problem-types', problemTypesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/report-steps', reportStepsRoutes);
app.use('/api', statusRoutes); // สำหรับ /api/status-mapping และ /api/statuses
// report-steps routes ยังครอบคลุม /api/reports/:id/status, /api/reports/:id/next-step, etc
app.use('/api', reportStepsRoutes); // เพื่อรองรับ /api/reports/* endpoints ที่เกี่ยวกับ steps

// Test endpoints
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ message: 'Database is working', data: result.rows[0] });
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// ==================== WebSocket Setup ====================

// สร้าง HTTP Server และ WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// เก็บ active WebSocket connections
const activeConnections = new Map();

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

// Import chat routes with WebSocket functions
const chatRoutes = require('./routes/chat')(pool, broadcastMessage, notifyExternalSystem);
app.use('/webhook', chatRoutes);
app.use('/api/chat', chatRoutes);

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

// เริ่มต้นเซิร์ฟเวอร์
server.listen(port, () => {
  console.log(`เซิร์ฟเวอร์ทำงานบน port ${port}`)
  console.log(`เส้นทาง API พร้อมใช้งานที่: http://localhost:${port}/api`)
  console.log(`รูปภาพที่อัปโหลดสามารถเข้าถึงได้ที่: http://localhost:${port}/uploads`)
  console.log(`Webhook endpoints:`)
  console.log(`  - POST http://localhost:${port}/webhook/:session_id/chat`)
  console.log(`  - POST http://localhost:${port}/webhook/:session_id/status-update`)
})
