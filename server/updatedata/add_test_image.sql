-- เพิ่มข้อมูลรูปภาพทดสอบ
INSERT INTO report_image (report_id, image_path, original_name, file_size, mime_type) VALUES
(1, 'test-image.jpg', 'รูปทดสอบ.jpg', 1024, 'image/jpeg');

-- ตรวจสอบข้อมูล
SELECT * FROM report_image;