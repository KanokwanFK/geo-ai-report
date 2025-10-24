-- ตรวจสอบและเพิ่มคอลัมน์ที่อาจจะขาดหายไป
ALTER TABLE report 
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5);

-- เพิ่มคอลัมน์ step timestamps ถ้ายังไม่มี
ALTER TABLE report ADD COLUMN IF NOT EXISTS step1_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE report ADD COLUMN IF NOT EXISTS step2_completed_at TIMESTAMP;
ALTER TABLE report ADD COLUMN IF NOT EXISTS step3_completed_at TIMESTAMP;
ALTER TABLE report ADD COLUMN IF NOT EXISTS step4_completed_at TIMESTAMP;
ALTER TABLE report ADD COLUMN IF NOT EXISTS step5_completed_at TIMESTAMP;
ALTER TABLE report ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;

-- สร้างตาราง status_mapping สำหรับแมปสถานะเก่าเป็นใหม่
CREATE TABLE IF NOT EXISTS status_mapping (
    mapping_id SERIAL PRIMARY KEY,
    old_status VARCHAR(50) NOT NULL UNIQUE,
    new_status VARCHAR(50) NOT NULL,
    step_number INTEGER,
    status_color VARCHAR(7),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- เก็บข้อมูล mapping ระหว่างสถานะเก่าและใหม่
INSERT INTO status_mapping (old_status, new_status, step_number, status_color, description) VALUES
-- Step-based status
('step1', 'รอตรวจสอบ', 1, '#E91E63', 'ผู้ใช้ยื่นรายงานเข้าสู่ระบบ'),
('step2', 'กำลังตรวจสอบ', 2, '#FF9800', 'เจ้าหน้าที่กำลังตรวจสอบข้อมูล'),
('step3', 'รอดำเนินการ', 3, '#FFEB3B', 'รายงานอยู่ในคิวรอดำเนินการ'),
('step4', 'กำลังดำเนินการ', 4, '#00BCD4', 'เจ้าหน้าที่กำลังดำเนินการแก้ไข'),
('step5', 'เสร็จสิ้น', 5, '#4CAF50', 'ดำเนินการแก้ไขเสร็จสิ้นแล้ว'),

-- English status
('pending', 'รอตรวจสอบ', 1, '#E91E63', 'รอการตรวจสอบจากเจ้าหน้าที่'),
('in_progress', 'กำลังดำเนินการ', 4, '#00BCD4', 'กำลังดำเนินการแก้ไขปัญหา'),
('resolved', 'เสร็จสิ้น', 5, '#4CAF50', 'แก้ไขปัญหาเสร็จสิ้นแล้ว'),
('completed', 'เสร็จสิ้น', 5, '#4CAF50', 'ดำเนินการเสร็จสมบูรณ์'),
('rejected', 'ปฏิเสธ', 0, '#F44336', 'รายงานถูกปฏิเสธ'),

-- Additional status
('reviewing', 'กำลังตรวจสอบ', 2, '#FF9800', 'อยู่ระหว่างการทบทวนข้อมูล'),
('waiting', 'รอดำเนินการ', 3, '#FFEB3B', 'รอการดำเนินการจากหน่วยงาน'),
('processing', 'กำลังดำเนินการ', 4, '#00BCD4', 'อยู่ระหว่างการประมวลผล'),
('cancelled', 'ปฏิเสธ', 0, '#F44336', 'ยกเลิกรายงาน'),
('denied', 'ปฏิเสธ', 0, '#F44336', 'ไม่อนุมัติรายงาน')

ON CONFLICT (old_status) DO UPDATE SET
    new_status = EXCLUDED.new_status,
    step_number = EXCLUDED.step_number,
    status_color = EXCLUDED.status_color,
    description = EXCLUDED.description;

-- อัพเดท report ให้ใช้สถานะใหม่ตาม mapping
UPDATE report 
SET status = sm.new_status
FROM status_mapping sm
WHERE report.status = sm.old_status
AND report.status != sm.new_status;

-- สร้าง View ใหม่ที่ใช้ status mapping (ไม่ใช้ report_steps)
CREATE OR REPLACE VIEW report_detail_with_status AS
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
    -- สร้างข้อมูล step จาก current_step โดยตรง
    CASE r.current_step
        WHEN 1 THEN 'รอตรวจสอบ'
        WHEN 2 THEN 'กำลังตรวจสอบ'
        WHEN 3 THEN 'รอดำเนินการ'
        WHEN 4 THEN 'กำลังดำเนินการ'
        WHEN 5 THEN 'เสร็จสิ้น'
        ELSE 'ไม่ระบุ'
    END as current_step_name,
    -- ใช้ status mapping สำหรับสีและข้อมูล
    COALESCE(sm.status_color, '#999999') as status_color,
    COALESCE(sm.step_number, r.current_step, 1) as mapped_step,
    COALESCE(sm.description, 'ไม่มีคำอธิบาย') as status_description,
    CASE 
        WHEN r.current_step = 5 OR r.status = 'เสร็จสิ้น' THEN 100
        ELSE (COALESCE(sm.step_number, r.current_step, 1) - 1) * 25
    END as progress_percentage
FROM report r
JOIN "user" u ON r.user_id = u.user_id
JOIN problem_type pt ON r.problem_type_id = pt.problem_type_id
LEFT JOIN status_mapping sm ON r.status = sm.new_status;

-- ตรวจสอบผลลัพธ์
SELECT 
    status, 
    COUNT(*) as count,
    COALESCE(sm.status_color, '#999999') as color
FROM report r
LEFT JOIN status_mapping sm ON r.status = sm.new_status
GROUP BY status, sm.status_color 
ORDER BY status;