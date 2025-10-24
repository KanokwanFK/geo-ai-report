-- =========================================
-- สคริปต์อัพเดทข้อมูลเดิมให้สอดคล้องกับระบบใหม่
-- ========================================= 

-- 1. อัพเดทรายงานที่มีสถานะเดิมให้เข้ากับระบบ 5 ขั้นตอนใหม่
UPDATE report 
SET 
    status = CASE 
        WHEN status = 'pending' THEN 'step1'
        WHEN status = 'in_progress' THEN 'step3'
        WHEN status = 'resolved' THEN 'step5'
        WHEN status = 'rejected' THEN 'rejected'
        ELSE 'step1'
    END,
    current_step = CASE 
        WHEN status = 'pending' THEN 1
        WHEN status = 'in_progress' THEN 3
        WHEN status = 'resolved' THEN 5
        WHEN status = 'rejected' THEN 1
        ELSE 1
    END,
    -- กำหนดเวลาเสร็จสิ้นขั้นตอนต่างๆ ตามสถานะเดิม
    step1_completed_at = COALESCE(step1_completed_at, created_at),
    step2_completed_at = CASE 
        WHEN status IN ('in_progress', 'resolved') 
        THEN COALESCE(step2_completed_at, created_at + INTERVAL '1 hour')
        ELSE step2_completed_at
    END,
    step3_completed_at = CASE 
        WHEN status IN ('in_progress', 'resolved') 
        THEN COALESCE(step3_completed_at, created_at + INTERVAL '2 hours')
        ELSE step3_completed_at
    END,
    step4_completed_at = CASE 
        WHEN status = 'resolved' 
        THEN COALESCE(step4_completed_at, created_at + INTERVAL '1 day')
        ELSE step4_completed_at
    END,
    step5_completed_at = CASE 
        WHEN status = 'resolved' 
        THEN COALESCE(step5_completed_at, updated_at)
        ELSE step5_completed_at
    END,
    rejected_at = CASE 
        WHEN status = 'rejected' 
        THEN COALESCE(rejected_at, updated_at)
        ELSE rejected_at
    END
WHERE status IN ('pending', 'in_progress', 'resolved', 'rejected');

-- 2. เพิ่มข้อมูล report_status_log สำหรับรายงานที่มีอยู่แล้ว
INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, old_step, new_step, comment, changed_at)
SELECT 
    r.report_id,
    1, -- admin_id (สมมติว่าเป็น admin คนแรก)
    'pending', -- สมมติว่าเริ่มจาก pending
    r.status,
    1, -- เริ่มจาก step 1
    r.current_step,
    'อัพเดทข้อมูลเดิมเข้าสู่ระบบใหม่',
    r.created_at
FROM report r
WHERE NOT EXISTS (
    SELECT 1 FROM report_status_log rsl 
    WHERE rsl.report_id = r.report_id
);

-- 3. เพิ่มข้อมูลตัวอย่างเพิ่มเติมให้หลากหลายขั้นตอน
INSERT INTO report (user_id, problem_type_id, title, description, latitude, longitude, location_detail, status, current_step, step1_completed_at, step2_completed_at, step3_completed_at, step4_completed_at, step5_completed_at) VALUES

-- รายงานในขั้นตอนที่ 1 (เพิ่งยื่น)
(2, 2, 'ไฟฟ้าดับในซอย', 'ไฟฟ้าดับมา 2 วัน ส่งผลกระทบต่อชีวิตความเป็นอยู่', 13.7563, 100.5318, 'ซอยร่วมจิต 12', 'step1', 1, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL),

(3, 1, 'ถนนทรุดตัวหนัก', 'ถนนทรุดตัวกว้าง 3 เมตร ยาว 10 เมตร', 13.7463, 100.5118, 'ถนนพหลโยธิน กม.15', 'step1', 1, CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL),

-- รายงานในขั้นตอนที่ 2 (กำลังตรวจสอบ)
(4, 3, 'ท่อน้ำแตกใหญ่', 'ท่อน้ำแตกทำให้น้ำท่วมถนน', 13.7263, 100.5218, 'ถนนงามวงศ์วาน', 'step2', 2, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL, NULL, NULL),

(2, 4, 'ขยะล้นคอนเทนเนอร์', 'ขยะล้นคอนเทนเนอร์ส่งกลิ่นเหม็น', 13.7163, 100.5418, 'ซอยสาย 3', 'step2', 2, CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', NULL, NULL, NULL),

-- รายงานในขั้นตอนที่ 4 (กำลังดำเนินการ)
(3, 1, 'หลุมบ่อขนาดใหญ่', 'หลุมบ่อกว้าง 2 เมตร ลึก 50 ซม.', 13.7063, 100.5518, 'ถนนสุขาภิบาล 2', 'step4', 4, 
 CURRENT_TIMESTAMP - INTERVAL '3 days', 
 CURRENT_TIMESTAMP - INTERVAL '2 days', 
 CURRENT_TIMESTAMP - INTERVAL '1 day', 
 CURRENT_TIMESTAMP - INTERVAL '2 hours', 
 NULL),

-- รายงานที่เสร็จสิ้นแล้ว
(4, 2, 'เสาไฟล้ม', 'เสาไฟล้มขวางถนนหลังพายุ', 13.6963, 100.5618, 'ถนนรามอินทรา', 'step5', 5, 
 CURRENT_TIMESTAMP - INTERVAL '5 days', 
 CURRENT_TIMESTAMP - INTERVAL '4 days', 
 CURRENT_TIMESTAMP - INTERVAL '3 days', 
 CURRENT_TIMESTAMP - INTERVAL '2 days', 
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(2, 3, 'รั่วซึมน้ำประปา', 'น้ำประปารั่วซึมใต้ดิน', 13.6863, 100.5718, 'ซอยเอกมัย 15', 'step5', 5, 
 CURRENT_TIMESTAMP - INTERVAL '7 days', 
 CURRENT_TIMESTAMP - INTERVAL '6 days', 
 CURRENT_TIMESTAMP - INTERVAL '5 days', 
 CURRENT_TIMESTAMP - INTERVAL '3 days', 
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

-- รายงานที่ถูกปฏิเสธ
(3, 4, 'รายงานข้อมูลไม่ครบ', 'แจ้งปัญหาแต่ไม่ระบุตำแหน่งชัดเจน', 13.6763, 100.5818, 'ไม่ระบุตำแหน่งชัดเจน', 'rejected', 1, 
 CURRENT_TIMESTAMP - INTERVAL '2 days', 
 NULL, NULL, NULL, NULL);

-- 4. เพิ่มประวัติการเปลี่ยนแปลงสถานะสำหรับรายงานใหม่
INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, old_step, new_step, comment, changed_at)
SELECT 
    r.report_id,
    1, -- admin_id
    'step1',
    'step2',
    1,
    2,
    'ตรวจสอบข้อมูลเรียบร้อยแล้ว',
    r.step2_completed_at
FROM report r 
WHERE r.current_step >= 2 AND r.step2_completed_at IS NOT NULL
AND r.report_id > (SELECT COALESCE(MAX(report_id), 0) FROM report WHERE report_id <= 2);

INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, old_step, new_step, comment, changed_at)
SELECT 
    r.report_id,
    1, -- admin_id
    'step2',
    'step3',
    2,
    3,
    'ส่งต่อไปยังหน่วยปฏิบัติการ',
    r.step3_completed_at
FROM report r 
WHERE r.current_step >= 3 AND r.step3_completed_at IS NOT NULL
AND r.report_id > (SELECT COALESCE(MAX(report_id), 0) FROM report WHERE report_id <= 2);

INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, old_step, new_step, comment, changed_at)
SELECT 
    r.report_id,
    1, -- admin_id
    'step3',
    'step4',
    3,
    4,
    'เริ่มดำเนินการแก้ไข',
    r.step4_completed_at
FROM report r 
WHERE r.current_step >= 4 AND r.step4_completed_at IS NOT NULL
AND r.report_id > (SELECT COALESCE(MAX(report_id), 0) FROM report WHERE report_id <= 2);

INSERT INTO report_status_log (report_id, admin_id, old_status, new_status, old_step, new_step, comment, changed_at)
SELECT 
    r.report_id,
    1, -- admin_id
    'step4',
    'step5',
    4,
    5,
    'ดำเนินการแก้ไขเสร็จสิ้น',
    r.step5_completed_at
FROM report r 
WHERE r.current_step = 5 AND r.step5_completed_at IS NOT NULL
AND r.report_id > (SELECT COALESCE(MAX(report_id), 0) FROM report WHERE report_id <= 2);

-- 5. เพิ่มการแจ้งเตือนตัวอย่าง
INSERT INTO notifications (user_id, report_id, title, message, type, is_read, created_at)
SELECT 
    r.user_id,
    r.report_id,
    CASE r.current_step
        WHEN 1 THEN 'รายงานของคุณได้รับแล้ว'
        WHEN 2 THEN 'กำลังตรวจสอบรายงานของคุณ'
        WHEN 3 THEN 'รายงานของคุณอยู่ในคิวรอดำเนินการ'
        WHEN 4 THEN 'กำลังดำเนินการแก้ไขปัญหา'
        WHEN 5 THEN 'แก้ไขปัญหาเสร็จสิ้นแล้ว'
        ELSE 'อัพเดทสถานะรายงาน'
    END,
    CASE r.current_step
        WHEN 1 THEN 'เราได้รับรายงาน "' || r.title || '" ของคุณแล้ว และจะตรวจสอบข้อมูลในเร็วๆ นี้'
        WHEN 2 THEN 'เจ้าหน้าที่กำลังตรวจสอบข้อมูลรายงาน "' || r.title || '"'
        WHEN 3 THEN 'รายงาน "' || r.title || '" อยู่ในคิวรอดำเนินการ'
        WHEN 4 THEN 'เจ้าหน้าที่กำลังดำเนินการแก้ไขปัญหา "' || r.title || '"'
        WHEN 5 THEN 'ดำเนินการแก้ไขปัญหา "' || r.title || '" เสร็จสิ้นแล้ว ขอบคุณสำหรับการรายงาน'
        ELSE 'มีการอัพเดทสถานะรายงาน "' || r.title || '"'
    END,
    CASE r.current_step
        WHEN 1 THEN 'info'
        WHEN 2 THEN 'info'
        WHEN 3 THEN 'warning'
        WHEN 4 THEN 'info'
        WHEN 5 THEN 'success'
        ELSE 'info'
    END,
    false,
    r.updated_at
FROM report r
WHERE r.report_id > (SELECT COALESCE(MAX(report_id), 0) FROM report WHERE report_id <= 2);

-- 6. อัพเดทข้อมูลสถิติเพิ่มเติม
UPDATE system_settings 
SET setting_value = '5', description = 'จำนวนขั้นตอนการดำเนินการ (1-5)' 
WHERE setting_key = 'total_steps' 
OR setting_key NOT IN (SELECT setting_key FROM system_settings);

INSERT INTO system_settings (setting_key, setting_value, description, data_type) VALUES
('total_steps', '5', 'จำนวนขั้นตอนการดำเนินการ (1-5)', 'NUMBER'),
('step_colors', '["#E91E63", "#FF9800", "#FFEB3B", "#00BCD4", "#4CAF50"]', 'รหัสสีสำหรับแต่ละขั้นตอน', 'JSON'),
('default_step_duration', '24', 'ระยะเวลาเริ่มต้นสำหรับแต่ละขั้นตอน (ชั่วโมง)', 'NUMBER'),
('auto_progress_enabled', 'false', 'เปิดใช้งานการเลื่อนขั้นตอนอัตโนมัติ', 'BOOLEAN')
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description,
updated_at = CURRENT_TIMESTAMP;

-- 7. สร้างดัชนีเพิ่มเติมเพื่อปรับปรุงประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_report_status_step ON report(status, current_step);
CREATE INDEX IF NOT EXISTS idx_report_updated_at ON report(updated_at);
CREATE INDEX IF NOT EXISTS idx_report_status_log_report_id ON report_status_log(report_id);
CREATE INDEX IF NOT EXISTS idx_report_status_log_changed_at ON report_status_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 8. อัพเดท View ให้แสดงข้อมูลที่ถูกต้อง
DROP VIEW IF EXISTS report_detail_view;
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
        WHEN r.status = 'rejected' THEN 0
        ELSE (r.current_step - 1) * 25
    END as progress_percentage,
    -- คำนวณเวลาที่ใช้ในขั้นตอนปัจจุบัน
    CASE 
        WHEN r.status = 'rejected' THEN EXTRACT(EPOCH FROM (r.rejected_at - r.updated_at))/3600
        WHEN r.current_step = 5 THEN EXTRACT(EPOCH FROM (r.step5_completed_at - r.step4_completed_at))/3600
        ELSE EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - r.updated_at))/3600
    END as hours_in_current_step,
    -- ตรวจสอบว่าค้างนานเกินกำหนดหรือไม่
    CASE 
        WHEN r.status = 'rejected' OR r.current_step = 5 THEN false
        ELSE EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - r.updated_at))/3600 > rs.estimated_duration_hours
    END as is_overdue
FROM report r
JOIN "user" u ON r.user_id = u.user_id
JOIN problem_type pt ON r.problem_type_id = pt.problem_type_id
LEFT JOIN report_steps rs ON r.current_step = rs.step_number;

-- 9. สร้าง View สำหรับสถิติแดชบอร์ด
CREATE OR REPLACE VIEW dashboard_stats_view AS
SELECT 
    COUNT(*) as total_reports,
    COUNT(*) FILTER (WHERE status IN ('step1', 'step2', 'step3', 'step4')) as pending_reports,
    COUNT(*) FILTER (WHERE status = 'step5') as resolved_reports,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_reports,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_reports,
    COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days') as week_reports,
    COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days') as month_reports,
    AVG(CASE 
        WHEN status = 'step5' AND step5_completed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (step5_completed_at - created_at))/3600 
        ELSE NULL 
    END) as avg_resolution_hours
FROM report;

-- 10. เพิ่มข้อมูลตัวอย่างเพิ่มเติมในช่วงเวลาต่างๆ เพื่อให้กราฟมีข้อมูล
INSERT INTO report (user_id, problem_type_id, title, description, latitude, longitude, location_detail, status, current_step, created_at, step1_completed_at) VALUES
-- รายงานเมื่อ 6 วันที่แล้ว
(2, 1, 'ถนนเป็นหลุม ซอยวิภาพัฒน์', 'ถนนเป็นหลุมหลายจุด', 13.7000, 100.5500, 'ซอยวิภาพัฒน์ 15', 'step5', 5, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(3, 2, 'ไฟฟ้าดับ ซอยสุขสวัสดิ์', 'ไฟฟ้าดับ 3 ชั่วโมง', 13.7100, 100.5600, 'ซอยสุขสวัสดิ์ 8', 'step5', 5, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),

-- รายงานเมื่อ 5 วันที่แล้ว
(4, 3, 'ท่อน้ำแตก ถนนสาย 2', 'ท่อน้ำแตกน้ำท่วม', 13.7200, 100.5700, 'ถนนสาย 2', 'step4', 4, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- รายงานเมื่อ 4 วันที่แล้ว
(2, 4, 'ขยะล้น ซอยมิตรภาพ', 'ขยะล้นถังขยะ', 13.7300, 100.5800, 'ซอยมิตรภาพ 20', 'step3', 3, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(3, 1, 'หลุมใหญ่ ถนนชัยพฤกษ์', 'หลุมใหญ่กีดขวางการจราจร', 13.7400, 100.5900, 'ถนนชัยพฤกษ์', 'step2', 2, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),

-- รายงานเมื่อ 3 วันที่แล้ว
(4, 2, 'ไฟฟ้าไม่มี ซอยเพชรเกษม', 'ไฟฟ้าดับทั้งซอย', 13.7500, 100.6000, 'ซอยเพชรเกษม 48', 'step1', 1, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- รายงานเมื่อ 2 วันที่แล้ว  
(2, 3, 'น้ำประปาขุ่น', 'น้ำประปาสีเหลือง', 13.7600, 100.6100, 'หมู่บ้านสุขสันต์', 'step2', 2, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 4, 'ขยะไม่เก็บ 3 วัน', 'รถเก็บขยะไม่มาเก็บ', 13.7700, 100.6200, 'ซอยประชาอุทิศ', 'step1', 1, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- รายงานเมื่อ 1 วันที่แล้ว
(4, 1, 'ถนนทรุดตัว', 'ถนนทรุดตัวหลังฝนตก', 13.7800, 100.6300, 'ถนนประชาร่วม', 'step3', 3, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),

-- รายงานวันนี้
(2, 2, 'ไฟฟ้าดับครึ่งซอย', 'ไฟฟ้าดับฝั่งขวา ฝั่งซ้ายปกติ', 13.7900, 100.6400, 'ซอยวัดใหม่', 'step1', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(3, 3, 'ท่อแตกใต้ดิน', 'น้ำประปาแตกใต้ดิน', 13.8000, 100.6500, 'ซอยบ้านผึ้ง', 'step1', 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- 11. คำสั่งตรวจสอบข้อมูลหลังอัพเดท
-- SELECT 'สถิติรายงานทั้งหมด' as info;
-- SELECT * FROM dashboard_stats_view;

-- SELECT 'รายงานตามขั้นตอน' as info;
-- SELECT current_step, count(*) as count FROM report GROUP BY current_step ORDER BY current_step;

-- SELECT 'รายงาน 7 วันล่าสุด' as info;
-- SELECT DATE(created_at) as date, COUNT(*) as count 
-- FROM report 
-- WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
-- GROUP BY DATE(created_at) 
-- ORDER BY date;

-- SELECT 'รายงานที่ค้างนาน' as info;
-- SELECT report_id, title, current_step_name, hours_in_current_step, is_overdue 
-- FROM report_detail_view 
-- WHERE is_overdue = true;

COMMIT;

-- แสดงข้อความเสร็จสิ้น
SELECT 'การอัพเดทข้อมูลเสร็จสิ้น! 🎉' as status,
       'ระบบพร้อมใช้งานระบบติดตามสถานะ 5 ขั้นตอน' as message;