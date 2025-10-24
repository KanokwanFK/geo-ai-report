# วิธีการทดสอบ API ด้วย Postman

## การติดตั้งและเริ่มต้น

### 1. ติดตั้ง Dependencies
```bash
cd server
npm install
```

### 2. ติดตั้ง multer (สำหรับ upload รูปภาพ)
```bash
npm install multer
```

### 3. สร้างฐานข้อมูล PostgreSQL
- สร้างฐานข้อมูลชื่อ `report_system`
- รันคำสั่ง SQL ที่ให้มาเพื่อสร้างตารางและข้อมูลตัวอย่าง

### 4. เริ่มเซิร์ฟเวอร์
```bash
npm start
```

## การนำเข้า Postman Collection

1. เปิด Postman
2. คลิก Import
3. เลือกไฟล์ `Postman_Collection.json`
4. Collection จะถูกเพิ่มเข้ามาพร้อมทั้ง environments

## การทดสอบ API แต่ละหมวด

### 🔐 User Authentication
1. **Register User** - สมัครสมาชิกใหม่
2. **Login User** - เข้าสู่ระบบ
3. **Get User Profile** - ดูข้อมูลผู้ใช้
4. **Update User Profile** - แก้ไขข้อมูลผู้ใช้
5. **Change Password** - เปลี่ยนรหัสผ่าน

### 👑 Admin Management
1. **Get All Users** - ดูผู้ใช้ทั้งหมด (Admin)
2. **Create Admin** - สร้างผู้ดูแลระบบ
3. **Update Admin Status** - เปลี่ยนสถานะ Admin
4. **Delete User** - ลบผู้ใช้ (Admin)

### 🏷️ Problem Types
1. **Get All Problem Types** - ดูประเภทปัญหาทั้งหมด
2. **Get Problem Type by ID** - ดูประเภทปัญหาตาม ID
3. **Create Problem Type** - สร้างประเภทปัญหาใหม่
4. **Update Problem Type** - แก้ไขประเภทปัญหา
5. **Delete Problem Type** - ลบประเภทปัญหา

### 📋 Reports
1. **Create Report** - สร้างรายงานใหม่
2. **Get All Reports** - ดูรายงานทั้งหมด
3. **Get Reports by Status** - ดูรายงานตามสถานะ
4. **Get Reports by User** - ดูรายงานของผู้ใช้
5. **Get Report by ID** - ดูรายงานตาม ID
6. **Update Report Status** - เปลี่ยนสถานะรายงาน
7. **Update Report Details** - แก้ไขรายละเอียดรายงาน
8. **Get Report Status History** - ดูประวัติการเปลี่ยนสถานะ
9. **Delete Report** - ลบรายงาน

### 📸 Image Upload
1. **Upload Single Image** - อัพโหลดรูปภาพเดี่ยว
   - เลือก Body > form-data
   - เลือก key "image" และ type "File"
   - เลือกไฟล์รูปภาพ
2. **Upload Multiple Images** - อัพโหลดหลายรูปภาพ
   - เลือก Body > form-data
   - เพิ่ม key "images" หลาย ๆ อัน และ type "File"
3. **Get Report Images** - ดูรูปภาพในรายงาน
4. **Delete Image** - ลบรูปภาพ

### 🔔 Notifications
1. **Get User Notifications** - ดูการแจ้งเตือนของผู้ใช้
2. **Get Unread Notifications** - ดูการแจ้งเตือนที่ยังไม่อ่าน
3. **Create Notification** - สร้างการแจ้งเตือน
4. **Mark Notification as Read** - ทำเครื่องหมายว่าอ่านแล้ว
5. **Mark All Notifications as Read** - ทำเครื่องหมายอ่านทั้งหมด
6. **Get Unread Count** - นับจำนวนที่ยังไม่อ่าน
7. **Delete Notification** - ลบการแจ้งเตือน

### ⚙️ System Settings
1. **Get All Settings** - ดูการตั้งค่าทั้งหมด
2. **Get Setting by Key** - ดูการตั้งค่าตาม key
3. **Create/Update Setting** - สร้าง/แก้ไขการตั้งค่า
4. **Update Setting** - อัพเดทการตั้งค่า
5. **Delete Setting** - ลบการตั้งค่า

### 📊 Dashboard & Statistics
1. **Get Dashboard Stats** - ดูสถิติแดชบอร์ด
2. **Get Reports by Problem Type** - ดูรายงานแยกตามประเภท
3. **Get Recent Reports** - ดูรายงานล่าสุด

## ลำดับการทดสอบที่แนะนำ

### ขั้นตอนที่ 1: สร้างข้อมูลพื้นฐาน
1. ทดสอบ Register User เพื่อสร้างผู้ใช้ใหม่
2. ทดสอบ Login User เพื่อเข้าสู่ระบบ
3. ทดสอบ Get All Problem Types เพื่อดูประเภทปัญหา

### ขั้นตอนที่ 2: ทดสอบระบบรายงาน
1. สร้างรายงานใหม่ด้วย Create Report
2. ดูรายงานด้วย Get All Reports
3. อัพโหลดรูปภาพด้วย Upload Single Image

### ขั้นตอนที่ 3: ทดสอบระบบ Admin
1. สร้าง Admin ด้วย Create Admin
2. เปลี่ยนสถานะรายงานด้วย Update Report Status
3. ดูประวัติการเปลี่ยนสถานะ

### ขั้นตอนที่ 4: ทดสอบระบบแจ้งเตือน
1. สร้างการแจ้งเตือนด้วย Create Notification
2. ดูการแจ้งเตือนด้วย Get User Notifications
3. ทำเครื่องหมายอ่านแล้ว

## หมายเหตุสำคัญ

1. **Base URL**: http://localhost:3003/api
2. **Image Upload**: ต้องใช้ form-data และเลือกไฟล์รูปภาพที่มีนาสกุล .jpg, .jpeg, .png, .gif
3. **File Size Limit**: ไฟล์รูปภาพขนาดสูงสุด 5MB
4. **Image Access**: รูปภาพที่อัพโหลดจะสามารถเข้าถึงได้ที่ http://localhost:3003/uploads/filename
5. **Database**: ต้องมีฐานข้อมูล PostgreSQL ที่ชื่อ "report_system" และรันคำสั่ง SQL เพื่อสร้างตาราง

## ข้อมูลทดสอบ
- **Admin Login**: admin@gmail.com / 1234
- **User Login**: kln@gmail.com / 1234
- **User IDs**: 1=admin, 2=kln, 3=klnc, 4=kch
- **Problem Type IDs**: 1=ถนนชำรุด, 2=ไฟฟ้า, 3=น้ำ, 4=อื่นๆ

## การแก้ไขปัญหาทั่วไป

1. **Connection Error**: ตรวจสอบว่าเซิร์ฟเวอร์ทำงานบน port 3003
2. **Database Error**: ตรวจสอบการเชื่อมต่อ PostgreSQL และข้อมูลการเข้าสู่ระบบ
3. **File Upload Error**: ตรวจสอบว่าใช้ Content-Type เป็น multipart/form-data
4. **404 Error**: ตรวจสอบ URL และ HTTP Method ให้ถูกต้อง