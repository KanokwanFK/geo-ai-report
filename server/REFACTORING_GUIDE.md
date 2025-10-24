# Server Refactoring - Route Structure

## โครงสร้างหลังจาก Refactoring

ได้ทำการ refactor `server_old.js` โดยแยก API endpoints ออกเป็นไฟล์แยกใน directory `routes/`

### ไฟล์ที่สร้างขึ้น

```
server/
├── server.js                    # Entry point หลัก
├── server_old.js               # ไฟล์เดิม (ไม่ถูกแก้ไข)
└── routes/                     # Directory สำหรับ routes แยกตามหมวดหมู่
    ├── auth.js                 # การจัดการ Authentication
    ├── users.js                # การจัดการข้อมูลผู้ใช้
    ├── admin.js                # การจัดการผู้ดูแลระบบ
    ├── problemTypes.js         # การจัดการประเภทปัญหา
    ├── reports.js              # การจัดการรายงาน
    ├── images.js               # การจัดการรูปภาพ
    ├── notifications.js        # การจัดการการแจ้งเตือน
    ├── settings.js             # การจัดการการตั้งค่าระบบ
    ├── dashboard.js            # Dashboard และสถิติ
    ├── reportSteps.js          # การติดตามขั้นตอนรายงาน
    └── chat.js                 # Webhook และ Chat System
```

## รายละเอียด Routes

### 1. `/api/auth` (auth.js)
- `POST /api/auth/register` - สมัครสมาชิกใหม่
- `POST /api/auth/login` - เข้าสู่ระบบ

### 2. `/api/users` (users.js)
- `GET /api/users/:id` - ดูข้อมูลโปรไฟล์ผู้ใช้
- `PUT /api/users/:id` - แก้ไขข้อมูลโปรไฟล์ผู้ใช้
- `PUT /api/users/:id/password` - เปลี่ยนรหัสผ่าน
- `GET /api/users/:user_id/notifications` - ดูการแจ้งเตือนสำหรับผู้ใช้
- `PUT /api/users/:user_id/notifications/read-all` - อ่านการแจ้งเตือนทั้งหมด
- `GET /api/users/:user_id/notifications/unread-count` - นับการแจ้งเตือนที่ยังไม่ได้อ่าน

### 3. `/api/admin` (admin.js)
- `GET /api/admin/users` - ดูข้อมูลผู้ใช้ทั้งหมด (สำหรับ Admin)
- `POST /api/admin/create` - สร้างผู้ดูแลระบบ
- `DELETE /api/admin/users/:id` - ลบผู้ใช้งาน
- `PUT /api/admin/:admin_id/status` - อัพเดทสถานะ Admin

### 4. `/api/problem-types` (problemTypes.js)
- `GET /api/problem-types` - ดูประเภทปัญหาทั้งหมด
- `GET /api/problem-types/:id` - ดูประเภทปัญหาตาม ID
- `POST /api/problem-types` - สร้างประเภทปัญหาใหม่
- `PUT /api/problem-types/:id` - แก้ไขประเภทปัญหา
- `DELETE /api/problem-types/:id` - ลบประเภทปัญหา

### 5. `/api/reports` (reports.js)
- `POST /api/reports` - สร้างรายงานใหม่
- `GET /api/reports` - ดูรายงานทั้งหมดพร้อมรายละเอียด
- `GET /api/reports/:id` - ดูรายงานตาม ID
- `PUT /api/reports/:id/status` - อัพเดทสถานะรายงาน
- `PUT /api/reports/:id` - แก้ไขรายละเอียดรายงาน
- `DELETE /api/reports/:id` - ลบรายงาน
- `GET /api/reports/:id/status-history` - ดูประวัติการเปลี่ยนแปลงสถานะ
- `PUT /api/reports/update-status-by-phone` - อัพเดตสถานะตาม phone
- `PUT /api/reports/update-status-by-email` - อัพเดตสถานะตาม email
- `GET /api/reports/update-status` - Update status using status mapping
- `GET /api/reports/status-mapping` - Get status mapping table
- `GET /api/reports/status-info` - Get status colors and info

### 6. `/api/images` (images.js)
- `POST /api/images/:id/images` - อัปโหลดรูปภาพสำหรับรายงาน (single)
- `POST /api/images/:id/images/multiple` - อัปโหลดรูปภาพหลายไฟล์
- `GET /api/images/:id/images` - ดูรูปภาพของรายงาน
- `DELETE /api/images/:id` - ลบรูปภาพ

### 7. `/api/notifications` (notifications.js)
- `POST /api/notifications` - สร้างการแจ้งเตือน
- `PUT /api/notifications/:id/read` - ทำเครื่องหมายว่าอ่านแล้ว
- `DELETE /api/notifications/:id` - ลบการแจ้งเตือน

### 8. `/api/settings` (settings.js)
- `GET /api/settings` - ดูการตั้งค่าระบบทั้งหมด
- `GET /api/settings/:key` - ดูการตั้งค่าตาม key
- `POST /api/settings` - สร้างหรืออัพเดทการตั้งค่า
- `PUT /api/settings/:key` - แก้ไขการตั้งค่า
- `DELETE /api/settings/:key` - ลบการตั้งค่า

### 9. `/api/dashboard` (dashboard.js)
- `GET /api/dashboard/stats` - สถิติแดชบอร์ด
- `GET /api/dashboard/reports-by-type` - รายงานตามประเภทปัญหา
- `GET /api/dashboard/recent-reports` - รายงานล่าสุด
- `GET /api/dashboard/reports-by-province` - รายงานแต่ละจังหวัด

### 10. `/api/report-steps` (reportSteps.js)
- `GET /api/report-steps` - ดูขั้นตอนทั้งหมด
- `GET /api/report-steps/:id/status` - ดูสถานะรายงานพร้อมขั้นตอน
- `PUT /api/report-steps/:id/next-step` - เลื่อนไปขั้นตอนถัดไป
- `PUT /api/report-steps/:id/set-step` - ตั้งค่าขั้นตอนเฉพาะ
- `PUT /api/report-steps/:id/reject` - ปฏิเสธรายงาน
- `GET /api/report-steps/stats/by-step` - สถิติตามขั้นตอน
- `GET /api/report-steps/by-step/:step` - ดูรายงานตามขั้นตอน
- `GET /api/report-steps/overdue` - รายงานค้างนาน

### 11. Webhook & Chat (chat.js)
- `POST /webhook/:session_id/chat` - Webhook รับข้อความ
- `POST /webhook/:session_id/status-update` - Webhook อัพเดตสถานะ
- `GET /api/chat/:session_id/messages` - ดึงข้อความแชท
- `POST /api/chat/:session_id/send` - ส่งข้อความ

### 12. Test Endpoints (server.js)
- `GET /api/test` - ทดสอบเซิร์ฟเวอร์
- `GET /api/test-db` - ทดสอบฐานข้อมูล

## คุณสมบัติที่คงเดิม

### Middleware และ Configuration
- ✅ CORS enabled
- ✅ JSON และ URL-encoded body parsing
- ✅ Static files serving สำหรับ `/uploads`
- ✅ Multer สำหรับ file upload
- ✅ Request logging middleware
- ✅ Error handling middleware

### Database
- ✅ PostgreSQL connection pool
- ✅ Database connection verification

### Email Service
- ✅ Email configuration และ verification
- ✅ New report email notifications
- ✅ Status update email notifications

### WebSocket
- ✅ WebSocket server สำหรับ real-time updates
- ✅ Session-based WebSocket connections
- ✅ Broadcast messages ภายใน session
- ✅ WebSocket event handling (connection, message, close, error)

## วิธีการใช้งาน

### เริ่มต้นเซิร์ฟเวอร์
```bash
# ใช้ server.js ใหม่
node server.js

# หรือถ้ามี npm script
npm start
```

### โครงสร้างการ export/import
แต่ละไฟล์ route จะ export เป็น function ที่รับ parameters ที่จำเป็น:

```javascript
// ตัวอย่างใน routes/reports.js
module.exports = (pool, sendNewReportEmails, sendStatusUpdateEmails) => {
  // ... route definitions
  return router;
};

// การ import และใช้งานใน server.js
const reportsRoutes = require('./routes/reports')(pool, sendNewReportEmails, sendStatusUpdateEmails);
app.use('/api/reports', reportsRoutes);
```

## หมายเหตุ

1. **ไฟล์ server_old.js ไม่ถูกแก้ไข** - เก็บไว้เป็น backup
2. **ทุก endpoint ทำงานเหมือนเดิม** - เปลี่ยนแค่โครงสร้างไฟล์
3. **รองรับ WebSocket** - สำหรับ real-time chat และ notifications
4. **Email notifications** - ส่งอีเมลแบบ async ไม่ block response
5. **File uploads** - รองรับทั้ง single และ multiple files

## การบำรุงรักษา

### เพิ่ม endpoint ใหม่
1. เปิดไฟล์ route ที่เกี่ยวข้องใน `routes/`
2. เพิ่ม route definition
3. ไม่ต้องแก้ไข `server.js` (เว้นแต่ต้องการ dependency ใหม่)

### แก้ไข endpoint ที่มีอยู่
1. เปิดไฟล์ route ที่เกี่ยวข้อง
2. แก้ไข logic ตามต้องการ
3. ทดสอบ endpoint

### Debug
- ใช้ console.log ใน route files
- ตรวจสอบ request logging middleware
- ดู WebSocket logs สำหรับ real-time features
