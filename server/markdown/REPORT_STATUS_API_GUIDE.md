# คู่มือ API ติดตามสถานะรายงาน (Report Status Tracking API)

## ภาพรวมระบบ

ระบบติดตามสถานะรายงานแบ่งออกเป็น 5 ขั้นตอน:

1. **Step 1** - เริ่มยื่นคำร้อง (สีชมพู)
2. **Step 2** - ตรวจสอบข้อมูล (สีส้ม)  
3. **Step 3** - รอดำเนินการ (สีเหลือง)
4. **Step 4** - กำลังดำเนินการ (สีฟ้า)
5. **Step 5** - เสร็จสิ้น (สีเขียว)

## โครงสร้างฐานข้อมูล

### ตาราง report (อัพเดทแล้ว)
```sql
- report_id: ID รายงาน
- current_step: ขั้นตอนปัจจุบัน (1-5)
- status: สถานะ (step1, step2, step3, step4, step5, rejected)
- step1_completed_at: เวลาที่เสร็จขั้นตอนที่ 1
- step2_completed_at: เวลาที่เสร็จขั้นตอนที่ 2
- step3_completed_at: เวลาที่เสร็จขั้นตอนที่ 3
- step4_completed_at: เวลาที่เสร็จขั้นตอนที่ 4
- step5_completed_at: เวลาที่เสร็จขั้นตอนที่ 5
- rejected_at: เวลาที่ปฏิเสธ
```

### ตาราง report_steps (ใหม่)
```sql
- step_id: ID ขั้นตอน
- step_number: หมายเลขขั้นตอน (1-5)
- step_name: ชื่อขั้นตอน
- step_description: คำอธิบายขั้นตอน
- step_color: รหัสสี hex
- estimated_duration_hours: เวลาประมาณที่ใช้ (ชั่วโมง)
```

## API Endpoints

### 1. ดูขั้นตอนทั้งหมด
```http
GET /api/report-steps
```

**Response:**
```json
[
  {
    "step_id": 1,
    "step_number": 1,
    "step_name": "เริ่มยื่นคำร้อง",
    "step_description": "ผู้ใช้งานยื่นรายงานปัญหาเข้าสู่ระบบ",
    "step_color": "#E91E63",
    "estimated_duration_hours": 0
  },
  {
    "step_id": 2,
    "step_number": 2,
    "step_name": "ตรวจสอบข้อมูล",
    "step_description": "เจ้าหน้าที่ตรวจสอบความถูกต้องของข้อมูล",
    "step_color": "#FF9800",
    "estimated_duration_hours": 24
  }
]
```

### 2. ดูสถานะรายงานพร้อมขั้นตอนปัจจุบัน
```http
GET /api/reports/:id/status
```

**Response:**
```json
{
  "report_id": 1,
  "current_step": 3,
  "status": "step3",
  "step_name": "รอดำเนินการ",
  "step_description": "รายงานอยู่ในคิวรอดำเนินการ",
  "step_color": "#FFEB3B",
  "progress_percentage": 50,
  "steps_progress": [
    {
      "step": 1,
      "name": "เริ่มยื่นคำร้อง",
      "completed": true,
      "completed_at": "2024-10-01T10:00:00.000Z"
    },
    {
      "step": 2,
      "name": "ตรวจสอบข้อมูล",
      "completed": true,
      "completed_at": "2024-10-01T12:00:00.000Z"
    },
    {
      "step": 3,
      "name": "รอดำเนินการ",
      "completed": true,
      "completed_at": "2024-10-01T14:00:00.000Z"
    },
    {
      "step": 4,
      "name": "กำลังดำเนินการ",
      "completed": false,
      "completed_at": null
    },
    {
      "step": 5,
      "name": "เสร็จสิ้น",
      "completed": false,
      "completed_at": null
    }
  ]
}
```

### 3. อัพเดทไปขั้นตอนถัดไป (Admin)
```http
PUT /api/reports/:id/next-step
```

**Request Body:**
```json
{
  "admin_id": 1,
  "comment": "ตรวจสอบข้อมูลเรียบร้อยแล้ว"
}
```

**Response:**
```json
{
  "message": "อัพเดทสถานะเป็นขั้นตอนที่ 4 สำเร็จ",
  "report": { "..." },
  "previous_step": 3,
  "current_step": 4
}
```

### 4. อัพเดทไปขั้นตอนที่กำหนด (Admin)
```http
PUT /api/reports/:id/set-step
```

**Request Body:**
```json
{
  "step": 5,
  "admin_id": 1,
  "comment": "ดำเนินการแก้ไขเสร็จสิ้น"
}
```

**Response:**
```json
{
  "message": "อัพเดทสถานะเป็นขั้นตอนที่ 5 สำเร็จ",
  "report": { "..." },
  "previous_step": 4,
  "current_step": 5
}
```

### 5. ปฏิเสธรายงาน (Admin)
```http
PUT /api/reports/:id/reject
```

**Request Body:**
```json
{
  "admin_id": 1,
  "comment": "ข้อมูลไม่ครบถ้วน กรุณาแนบรูปภาพเพิ่มเติม"
}
```

**Response:**
```json
{
  "message": "ปฏิเสธรายงานสำเร็จ",
  "report": { "..." },
  "rejected_reason": "ข้อมูลไม่ครบถ้วน กรุณาแนบรูปภาพเพิ่มเติม"
}
```

### 6. ดูประวัติการเปลี่ยนแปลงสถานะ
```http
GET /api/reports/:id/status-history
```

**Response:**
```json
[
  {
    "log_id": 1,
    "report_id": 1,
    "admin_id": 1,
    "old_status": "step2",
    "new_status": "step3",
    "old_step": 2,
    "new_step": 3,
    "comment": "ตรวจสอบเรียบร้อย",
    "changed_at": "2024-10-01T14:00:00.000Z",
    "first_name": "Admin",
    "last_name": "System",
    "old_step_name": "ตรวจสอบข้อมูล",
    "new_step_name": "รอดำเนินการ"
  }
]
```

### 7. ดูสถิติรายงานตามขั้นตอน
```http
GET /api/dashboard/reports-by-step
```

**Response:**
```json
{
  "by_step": [
    {
      "current_step": 1,
      "step_name": "เริ่มยื่นคำร้อง",
      "step_color": "#E91E63",
      "report_count": 5,
      "percentage": 25.0
    },
    {
      "current_step": 2,
      "step_name": "ตรวจสอบข้อมูล",
      "step_color": "#FF9800",
      "report_count": 8,
      "percentage": 40.0
    }
  ],
  "rejected": 2,
  "total": 20
}
```

### 8. ดูรายงานตามขั้นตอน
```http
GET /api/reports/by-step/:step
```

**Query Parameters:**
- `limit`: จำนวนรายการต่อหน้า (default: 20)
- `page`: หน้าที่ต้องการ (default: 1)

**Response:**
```json
{
  "reports": [
    {
      "report_id": 1,
      "title": "ถนนเป็นหลุมใหญ่",
      "current_step": 3,
      "current_step_name": "รอดำเนินการ",
      "current_step_color": "#FFEB3B",
      "progress_percentage": 50,
      "created_at": "2024-10-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 100,
    "limit": 20
  }
}
```

### 9. ดูรายงานที่ค้างนานเกินกำหนด
```http
GET /api/reports/overdue
```

**Response:**
```json
{
  "overdue_reports": [
    {
      "report_id": 1,
      "title": "ถนนเป็นหลุมใหญ่",
      "current_step": 2,
      "step_name": "ตรวจสอบข้อมูล",
      "estimated_duration_hours": 24,
      "hours_since_update": 48.5,
      "first_name": "กัลยาณี",
      "last_name": "บุญจันทร์"
    }
  ],
  "count": 1
}
```

## การคำนวณเปอร์เซ็นต์ความคืบหน้า

```javascript
// Progress Percentage คำนวณจาก:
const progressPercentage = currentStep === 5 ? 100 : (currentStep - 1) * 25;

// ตัวอย่าง:
// Step 1 = 0%   (เริ่มต้น)
// Step 2 = 25%  (เสร็จ 1 ขั้นตอน)
// Step 3 = 50%  (เสร็จ 2 ขั้นตอน)
// Step 4 = 75%  (เสร็จ 3 ขั้นตอน)
// Step 5 = 100% (เสร็จสิ้น)
```

## การใช้งานใน Frontend

### 1. แสดงสถานะรายงานแบบ Step Progress
```javascript
// ดึงสถานะรายงาน
const response = await fetch(`/api/reports/${reportId}/status`);
const reportStatus = await response.json();

// แสดง Progress Bar
const progressBar = document.getElementById('progress-bar');
progressBar.style.width = `${reportStatus.progress_percentage}%`;

// แสดงขั้นตอนต่างๆ
reportStatus.steps_progress.forEach(step => {
  const stepElement = document.querySelector(`[data-step="${step.step}"]`);
  stepElement.classList.toggle('completed', step.completed);
  
  if (step.completed_at) {
    stepElement.querySelector('.completed-time').textContent = 
      new Date(step.completed_at).toLocaleString('th-TH');
  }
});
```

### 2. อัพเดทสถานะ (สำหรับ Admin)
```javascript
// อัพเดทไปขั้นตอนถัดไป
async function nextStep(reportId, adminId, comment) {
  const response = await fetch(`/api/reports/${reportId}/next-step`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_id: adminId, comment })
  });
  
  if (response.ok) {
    const result = await response.json();
    alert(`อัพเดทเป็นขั้นตอนที่ ${result.current_step} สำเร็จ`);
    // Refresh หน้าเพื่อแสดงสถานะใหม่
    location.reload();
  }
}

// อัพเดทไปขั้นตอนที่กำหนด
async function setStep(reportId, targetStep, adminId, comment) {
  const response = await fetch(`/api/reports/${reportId}/set-step`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      step: targetStep, 
      admin_id: adminId, 
      comment 
    })
  });
  
  const result = await response.json();
  console.log(result.message);
}
```

### 3. Dashboard แสดงสถิติ
```javascript
// ดึงสถิติรายงานตามขั้นตอน
const statsResponse = await fetch('/api/dashboard/reports-by-step');
const stats = await statsResponse.json();

// สร้าง Chart
const chartData = stats.by_step.map(step => ({
  label: step.step_name,
  value: step.report_count,
  color: step.step_color,
  percentage: step.percentage
}));

// แสดงจำนวนรายงานที่ปฏิเสธ
document.getElementById('rejected-count').textContent = stats.rejected;
```

### 4. แสดงรายงานที่ค้างนาน
```javascript
// ดึงรายงานที่ค้างนาน
const overdueResponse = await fetch('/api/reports/overdue');
const overdueData = await overdueResponse.json();

// แสดง Alert สำหรับ Admin
if (overdueData.count > 0) {
  const alertMessage = `มีรายงาน ${overdueData.count} รายการที่ค้างนานเกินกำหนด`;
  showNotification(alertMessage, 'warning');
  
  // แสดงรายการ
  overdueData.overdue_reports.forEach(report => {
    console.log(`รายงาน: ${report.title}`);
    console.log(`ค้างมาแล้ว: ${Math.round(report.hours_since_update)} ชั่วโมง`);
    console.log(`ควรใช้เวลา: ${report.estimated_duration_hours} ชั่วโมง`);
  });
}
```

## สีของแต่ละขั้นตอน

```css
.step-1 { background-color: #E91E63; } /* เริ่มยื่นคำร้อง - สีชมพู */
.step-2 { background-color: #FF9800; } /* ตรวจสอบข้อมูล - สีส้ม */
.step-3 { background-color: #FFEB3B; } /* รอดำเนินการ - สีเหลือง */
.step-4 { background-color: #00BCD4; } /* กำลังดำเนินการ - สีฟ้า */
.step-5 { background-color: #4CAF50; } /* เสร็จสิ้น - สีเขียว */
.rejected { background-color: #F44336; } /* ปฏิเสธ - สีแดง */
```

## ตัวอย่าง HTML สำหรับแสดงขั้นตอน

```html
<div class="report-progress">
  <div class="progress-bar">
    <div class="progress-fill" style="width: 50%"></div>
  </div>
  
  <div class="steps">
    <div class="step completed" data-step="1">
      <div class="step-circle">1</div>
      <div class="step-name">เริ่มยื่นคำร้อง</div>
      <div class="completed-time">01/10/2024 10:00</div>
    </div>
    
    <div class="step completed" data-step="2">
      <div class="step-circle">2</div>
      <div class="step-name">ตรวจสอบข้อมูล</div>
      <div class="completed-time">01/10/2024 12:00</div>
    </div>
    
    <div class="step active" data-step="3">
      <div class="step-circle">3</div>
      <div class="step-name">รอดำเนินการ</div>
      <div class="completed-time"></div>
    </div>
    
    <div class="step" data-step="4">
      <div class="step-circle">4</div>
      <div class="step-name">กำลังดำเนินการ</div>
      <div class="completed-time"></div>
    </div>
    
    <div class="step" data-step="5">
      <div class="step-circle">5</div>
      <div class="step-name">เสร็จสิ้น</div>
      <div class="completed-time"></div>
    </div>
  </div>
</div>
```

## หมายเหตุสำคัญ

1. **Permission**: API ที่มี "Admin" จำเป็นต้องมีการตรวจสอบสิทธิ์
2. **Validation**: ตรวจสอบข้อมูลก่อนอัพเดทสถานะ
3. **Notification**: ควรส่งการแจ้งเตือนให้ผู้ใช้เมื่อสถานะเปลี่ยน
4. **Audit Trail**: ระบบบันทึกประวัติทุกการเปลี่ยนแปลง
5. **Real-time**: อาจเพิ่ม WebSocket เพื่ออัพเดทแบบทันที

มีอะไรที่ต้องการเพิ่มเติมหรือปรับปรุงไหมคะ? 😊