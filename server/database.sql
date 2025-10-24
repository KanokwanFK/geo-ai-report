-- ติดตั้ง Extensions สำหรับข้อมูลเชิงพื้นที่
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- สร้างตาราง USER
CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    birth_date DATE,
    address TEXT,
    province VARCHAR(100),
    district VARCHAR(100),
    subdistrict VARCHAR(100),
    user_type VARCHAR(20) CHECK (user_type IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง ADMIN
CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
    admin_level VARCHAR(50),
    department VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- สร้างตาราง SYSTEM_SETTINGS
CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    data_type VARCHAR(20) CHECK (data_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง PROBLEM_TYPE
CREATE TABLE problem_type (
    problem_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    color_code VARCHAR(7), -- สำหรับรหัสสี hex
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง REPORT
CREATE TABLE report (
    report_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(user_id),
    problem_type_id INTEGER REFERENCES problem_type(problem_type_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_detail VARCHAR(255),
    status VARCHAR(30) DEFAULT 'รอตรวจสอบ' CHECK (status IN ('รอตรวจสอบ', 'กำลังตรวจสอบ', 'รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ปฏิเสธ')),
    current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
    step1_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    step2_completed_at TIMESTAMP,
    step3_completed_at TIMESTAMP,
    step4_completed_at TIMESTAMP,
    step5_completed_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
    -- ตัวอย่าง SQL สำหรับอัพเดทสถานะรายงานตาม email และ report_id
    -- UPDATE report SET status = 'สถานะใหม่'
    -- FROM "user"
    -- WHERE report.user_id = "user".user_id
    --   AND "user".email = 'user@email.com'
    --   AND report.report_id = 123;

-- สร้างตาราง REPORT_IMAGE
CREATE TABLE report_image (
    image_id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES report(report_id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    original_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง REPORT_STATUS_LOG
CREATE TABLE report_status_log (
    log_id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES report(report_id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES admin(admin_id),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    old_step INTEGER,
    new_step INTEGER,
    comment TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง REPORT_STEPS เพื่อเก็บข้อมูลขั้นตอน
CREATE TABLE report_steps (
    step_id SERIAL PRIMARY KEY,
    step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 5),
    step_name VARCHAR(100) NOT NULL,
    step_description TEXT,
    step_color VARCHAR(7), -- รหัสสี hex
    estimated_duration_hours INTEGER DEFAULT 24, -- ประมาณเวลาที่ใช้ (ชั่วโมง)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง NOTIFICATIONS
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
    report_id INTEGER REFERENCES report(report_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง Index สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_report_user_id ON report(user_id);
CREATE INDEX idx_report_status ON report(status);
CREATE INDEX idx_report_created_at ON report(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- เพิ่มข้อมูลตัวอย่าง
-- ข้อมูล system_settings
INSERT INTO system_settings (setting_key, setting_value, description, data_type) VALUES
('app_name', 'ระบบรายงานปัญหา', 'ชื่อแอปพลิเคชัน', 'STRING'),
('max_file_size', '5242880', 'ขนาดไฟล์สูงสุด (bytes)', 'NUMBER'),
('allowed_file_types', '["jpg","jpeg","png","gif"]', 'ประเภทไฟล์ที่อนุญาต', 'JSON'),
('auto_assign_admin', 'true', 'กำหนดแอดมินอัตโนมัติ', 'BOOLEAN');

-- ข้อมูล problem_type
INSERT INTO problem_type (type_name, description, color_code) VALUES
('ถนนชำรุด', 'ปัญหาเกี่ยวกับถนนที่เสียหาย หลุมบ่อ', '#FF6B6B'),
('ไฟฟ้า', 'ปัญหาระบบไฟฟ้าสาธารณะ', '#4ECDC4'),
('น้ำ', 'ปัญหาน้ำประปา รั่วซึม น้ำท่วม', '#45B7D1'),
('อื่นๆ', 'ปัญหาอื่นๆ ที่ไม่อยู่ในหมวดหมู่ข้างต้น', '#FFEAA7');

-- ข้อมูล user ตัวอย่าง
INSERT INTO "user" (email, password, first_name, last_name, phone, user_type) VALUES
('admin@gmail.com', '1234', 'Admin', 'System', '0812345678', 'admin'),
('kln@gmail.com', '1234', 'กัลยาณี', 'บุญจันทร์', '0823456789', 'user'),
('klnc@gmail.com', '1234', 'ศิรินภา', 'ประเสริฐสังข์', '0856982402', 'user'),
('kch@gmail.com', '1234', 'กชกร', 'รอก่อน', '0834567890', 'user');

-- ข้อมูล admin
INSERT INTO admin (user_id, admin_level, department) VALUES
(1, 'super_admin', 'IT Department');

-- ข้อมูลขั้นตอนการดำเนินการ
INSERT INTO report_steps (step_number, step_name, step_description, step_color, estimated_duration_hours) VALUES
(1, 'เริ่มยื่นคำร้อง', 'ผู้ใช้งานยื่นรายงานปัญหาเข้าสู่ระบบ', '#E91E63', 0),
(2, 'ตรวจสอบข้อมูล', 'เจ้าหน้าที่ตรวจสอบความถูกต้องของข้อมูล', '#FF9800', 24),
(3, 'รอดำเนินการ', 'รายงานอยู่ในคิวรอดำเนินการ', '#FFEB3B', 48),
(4, 'กำลังดำเนินการ', 'เจ้าหน้าที่กำลังดำเนินการแก้ไขปัญหา', '#00BCD4', 72),
(5, 'เสร็จสิ้น', 'ดำเนินการแก้ไขปัญหาเสร็จสิ้นแล้ว', '#4CAF50', 0);

-- ข้อมูล report ตัวอย่าง
INSERT INTO report (user_id, problem_type_id, title, description, latitude, longitude, location_detail, status, current_step, step2_completed_at) VALUES
(2, 1, 'ถนนเป็นหลุมใหญ่', 'ถนนหน้าบ้านเป็นหลุมใหญ่ รถผ่านลำบาก', 13.7563, 100.5018, 'หน้าบ้านเลขที่ 123 ถนนสุขุมวิท', 'รอดำเนินการ', 3, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(3, 3, 'ท่อประปาแตก', 'ท่อประปาแตกน้ำท่วมถนน', 13.7463, 100.5318, 'ซอยลาดพร้าว 15', 'กำลังตรวจสอบ', 2, NULL);

-- สร้าง Function สำหรับอัพเดท updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง Trigger สำหรับอัพเดท updated_at
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_updated_at BEFORE UPDATE ON report
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- เพิ่ม Index สำหรับตาราง report_steps
CREATE INDEX idx_report_current_step ON report(current_step);
CREATE INDEX idx_report_steps_number ON report_steps(step_number);

-- สร้าง View สำหรับรายงานที่มีข้อมูลเพิ่มเติม
CREATE VIEW report_detail_view AS
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
    r.step1_completed_at,
    r.step2_completed_at,
    r.step3_completed_at,
    r.step4_completed_at,
    r.step5_completed_at,
    r.rejected_at,
    r.created_at,
    r.updated_at,
    u.first_name,
    u.last_name,
    u.email,
    pt.type_name as problem_type,
    pt.color_code,
    rs.step_name as current_step_name,
    rs.step_description as current_step_description,
    rs.step_color as current_step_color,
    rs.estimated_duration_hours,
    CASE 
        WHEN r.current_step = 5 THEN 100
        ELSE (r.current_step - 1) * 25
    END as progress_percentage
FROM report r
JOIN "user" u ON r.user_id = u.user_id
JOIN problem_type pt ON r.problem_type_id = pt.problem_type_id
LEFT JOIN report_steps rs ON r.current_step = rs.step_number;

COMMIT;
