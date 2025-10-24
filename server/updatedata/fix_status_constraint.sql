-- แก้ไข CHECK constraint สำหรับ status ให้รองรับค่าสถานะที่ถูกต้อง
-- ลบ constraint เก่าก่อน
ALTER TABLE report DROP CONSTRAINT IF EXISTS report_status_check;

-- สร้าง constraint ใหม่ที่รองรับทุกสถานะที่เป็นไปได้
ALTER TABLE report ADD CONSTRAINT report_status_check 
CHECK (status IN (
    'รอตรวจสอบ',
    'กำลังตรวจสอบ', 
    'รอดำเนินการ',
    'กำลังดำเนินการ',
    'เสร็จสิ้น',
    'ปฏิเสธ',
    -- รองรับสถานะเก่าที่อาจจะยังมีอยู่ในฐานข้อมูล
    'step1',
    'step2', 
    'step3',
    'step4',
    'step5',
    'pending',
    'in_progress',
    'resolved',
    'completed',
    'rejected',
    'reviewing',
    'waiting',
    'processing',
    'cancelled',
    'denied'
));

-- แสดงข้อมูลสถานะปัจจุบันในตาราง
SELECT status, COUNT(*) as count 
FROM report 
GROUP BY status 
ORDER BY status;