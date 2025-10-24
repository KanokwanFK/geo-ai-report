-- อัพเดทสถานะจากระบบเก่าเป็นระบบใหม่ (ภาษาไทย)

-- อัพเดทข้อมูลที่มีอยู่ให้เป็นสถานะภาษาไทย
UPDATE report 
SET status = CASE 
    -- สถานะแบบเลขขั้นตอน (step1-step5)
    WHEN status = 'step1' THEN 'รอตรวจสอบ'
    WHEN status = 'step2' THEN 'กำลังตรวจสอบ' 
    WHEN status = 'step3' THEN 'รอดำเนินการ'
    WHEN status = 'step4' THEN 'กำลังดำเนินการ'
    WHEN status = 'step5' THEN 'เสร็จสิ้น'
    
    -- สถานะภาษาอังกฤษทั่วไป
    WHEN status = 'pending' THEN 'รอตรวจสอบ'
    WHEN status = 'in_progress' THEN 'กำลังดำเนินการ' 
    WHEN status = 'resolved' THEN 'เสร็จสิ้น'
    WHEN status = 'completed' THEN 'เสร็จสิ้น'
    WHEN status = 'rejected' THEN 'ปฏิเสธ'
    
    -- สถานะเพิ่มเติม
    WHEN status = 'reviewing' THEN 'กำลังตรวจสอบ'
    WHEN status = 'waiting' THEN 'รอดำเนินการ'
    WHEN status = 'processing' THEN 'กำลังดำเนินการ'
    WHEN status = 'cancelled' THEN 'ปฏิเสธ'
    WHEN status = 'denied' THEN 'ปฏิเสธ'
    
    ELSE status
END
WHERE status IN (
    'step1', 'step2', 'step3', 'step4', 'step5', 
    'pending', 'in_progress', 'resolved', 'completed', 'rejected',
    'reviewing', 'waiting', 'processing', 'cancelled', 'denied'
);

-- เช็คผลลัพธ์
SELECT status, COUNT(*) as count 
FROM report 
GROUP BY status 
ORDER BY status;