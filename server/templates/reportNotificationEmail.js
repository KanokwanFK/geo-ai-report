/**
 * Email Templates สำหรับระบบแจ้งซ่อม (Bootstrap 5 Version)
 * ใช้ Bootstrap 5 CDN และ Bootstrap Icons
 */

/**
 * Template สำหรับอีเมลยืนยันการสร้างรายงาน (ส่งให้ User)
 */
const reportConfirmationTemplate = (data) => {
  const {
    userName,
    reportId,
    title,
    problemType,
    description,
    location,
    status,
    createdAt
  } = data;

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ยืนยันการสร้างรายงาน</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    body {
      font-family: 'Sarabun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
    .email-header {
      background-color: #0d6efd;
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .email-header i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .email-body {
      padding: 2rem;
    }
    .info-table th {
      width: 150px;
      font-weight: 600;
      color: #495057;
    }
    .info-table td {
      color: #212529;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <i class="bi bi-check-circle-fill"></i>
      <h1 class="h3 mb-2">ยืนยันการรับรายงาน</h1>
      <p class="mb-0 small">ระบบรายงานปัญหาและแจ้งซ่อม</p>
    </div>

    <!-- Body -->
    <div class="email-body">
      <p>เรียนคุณ <strong>${userName}</strong></p>
      
      <!-- Success Alert -->
      <div class="alert alert-success border-start border-success border-4" role="alert">
        <div class="d-flex align-items-center">
          <i class="bi bi-check-circle-fill me-2 fs-5"></i>
          <div>
            <strong>รายงานของคุณถูกบันทึกเรียบร้อยแล้ว</strong><br>
            <small>ขอบคุณที่ใช้บริการระบบแจ้งปัญหาของเรา ระบบได้รับรายงานของคุณและจะดำเนินการตรวจสอบโดยเร็วที่สุด</small>
          </div>
        </div>
      </div>

      <!-- Report Details -->
      <div class="card mb-3">
        <div class="card-header bg-primary text-white">
          <i class="bi bi-clipboard-data me-2"></i><strong>รายละเอียดรายงาน</strong>
        </div>
        <div class="card-body">
          <table class="table table-borderless info-table mb-0">
            <tbody>
              <tr>
                <th><i class="bi bi-hash text-primary me-2"></i>เลขที่รายงาน:</th>
                <td><strong>#${reportId}</strong></td>
              </tr>
              <tr>
                <th><i class="bi bi-file-text text-primary me-2"></i>หัวข้อ:</th>
                <td>${title}</td>
              </tr>
              <tr>
                <th><i class="bi bi-tag text-primary me-2"></i>ประเภทปัญหา:</th>
                <td>${problemType}</td>
              </tr>
              <tr>
                <th><i class="bi bi-card-text text-primary me-2"></i>รายละเอียด:</th>
                <td>${description}</td>
              </tr>
              <tr>
                <th><i class="bi bi-geo-alt text-primary me-2"></i>สถานที่:</th>
                <td>${location}</td>
              </tr>
              <tr>
                <th><i class="bi bi-hourglass-split text-primary me-2"></i>สถานะปัจจุบัน:</th>
                <td><span class="badge bg-warning text-dark">${status}</span></td>
              </tr>
              <tr>
                <th><i class="bi bi-calendar-event text-primary me-2"></i>วันที่สร้าง:</th>
                <td>${createdAt}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Next Steps -->
      <div class="mb-3">
        <h5 class="mb-3"><i class="bi bi-list-check text-primary me-2"></i>ขั้นตอนถัดไป:</h5>
        <div class="list-group">
          <div class="list-group-item border-start border-primary border-3">
            <i class="bi bi-1-circle-fill text-primary me-2"></i>
            เจ้าหน้าที่จะตรวจสอบรายงานของคุณภายใน 24-48 ชั่วโมง
          </div>
          <div class="list-group-item border-start border-primary border-3">
            <i class="bi bi-2-circle-fill text-primary me-2"></i>
            คุณจะได้รับการแจ้งเตือนทางอีเมลเมื่อมีการอัพเดทสถานะ
          </div>
          <div class="list-group-item border-start border-primary border-3">
            <i class="bi bi-3-circle-fill text-primary me-2"></i>
            สามารถติดตามสถานะได้ตลอดเวลาผ่านระบบ
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-light text-center py-3 border-top">
      <p class="mb-1"><strong><i class="bi bi-telephone me-2"></i>ติดต่อเรา</strong></p>
      <p class="mb-2 small text-muted">
        <i class="bi bi-envelope me-1"></i>support@report-system.com | 
        <i class="bi bi-phone ms-2 me-1"></i>02-xxx-xxxx
      </p>
      <p class="mb-0 small text-muted">
        <i class="bi bi-info-circle me-1"></i>อีเมลฉบับนี้ส่งอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Template สำหรับแจ้งเตือน Admin เมื่อมีรายงานใหม่
 */
const adminNotificationTemplate = (data) => {
  const {
    adminName,
    reportId,
    userName,
    userEmail,
    title,
    problemType,
    description,
    location,
    createdAt,
    priority = 'medium'
  } = data;

  const priorityConfig = {
    high: { color: 'danger', label: 'ด่วนมาก', icon: 'exclamation-triangle-fill' },
    medium: { color: 'warning', label: 'ปานกลาง', icon: 'exclamation-circle-fill' },
    low: { color: 'success', label: 'ไม่ด่วน', icon: 'info-circle-fill' }
  };

  const config = priorityConfig[priority];

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>แจ้งเตือน: รายงานใหม่</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    body {
      font-family: 'Sarabun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
    .email-header {
      background-color: #dc3545;
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .email-header i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .email-body {
      padding: 2rem;
    }
    .info-table th {
      width: 150px;
      font-weight: 600;
      color: #495057;
    }
    .info-table td {
      color: #212529;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <i class="bi bi-bell-fill"></i>
      <h1 class="h3 mb-2">แจ้งเตือน: รายงานใหม่</h1>
      <p class="mb-0 small">ระบบรายงานปัญหาและแจ้งซ่อม</p>
    </div>

    <!-- Body -->
    <div class="email-body">
      <p>เรียน ${adminName ? 'คุณ<strong>' + adminName + '</strong>' : '<strong>ผู้ดูแลระบบ</strong>'}</p>
      
      <!-- Warning Alert -->
      <div class="alert alert-warning border-start border-warning border-4" role="alert">
        <div class="d-flex align-items-center">
          <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
          <div>
            <strong>มีรายงานปัญหาใหม่เข้ามาในระบบ</strong><br>
            <small>กรุณาตรวจสอบและดำเนินการโดยเร็วที่สุด</small>
          </div>
        </div>
      </div>

      <!-- Report Details -->
      <div class="card mb-3">
        <div class="card-header bg-danger text-white">
          <i class="bi bi-clipboard-data me-2"></i><strong>ข้อมูลรายงาน</strong>
        </div>
        <div class="card-body">
          <table class="table table-borderless info-table mb-0">
            <tbody>
              <tr>
                <th><i class="bi bi-hash text-danger me-2"></i>เลขที่รายงาน:</th>
                <td><strong>#${reportId}</strong></td>
              </tr>
              <tr>
                <th><i class="bi bi-${config.icon} text-${config.color} me-2"></i>ระดับความสำคัญ:</th>
                <td><span class="badge bg-${config.color} ${config.color === 'warning' ? 'text-dark' : ''}">${config.label}</span></td>
              </tr>
              <tr>
                <th><i class="bi bi-person text-danger me-2"></i>ผู้แจ้ง:</th>
                <td>${userName}</td>
              </tr>
              <tr>
                <th><i class="bi bi-envelope text-danger me-2"></i>อีเมลผู้แจ้ง:</th>
                <td><a href="mailto:${userEmail}" class="text-decoration-none">${userEmail}</a></td>
              </tr>
              <tr>
                <th><i class="bi bi-file-text text-danger me-2"></i>หัวข้อ:</th>
                <td>${title}</td>
              </tr>
              <tr>
                <th><i class="bi bi-tag text-danger me-2"></i>ประเภทปัญหา:</th>
                <td>${problemType}</td>
              </tr>
              <tr>
                <th><i class="bi bi-card-text text-danger me-2"></i>รายละเอียด:</th>
                <td>${description}</td>
              </tr>
              <tr>
                <th><i class="bi bi-geo-alt text-danger me-2"></i>สถานที่:</th>
                <td>${location}</td>
              </tr>
              <tr>
                <th><i class="bi bi-calendar-event text-danger me-2"></i>วันที่แจ้ง:</th>
                <td>${createdAt}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Items -->
      <div class="mb-3">
        <h5 class="mb-3"><i class="bi bi-list-check text-danger me-2"></i>การดำเนินการที่แนะนำ:</h5>
        <div class="list-group">
          <div class="list-group-item border-start border-danger border-3">
            <i class="bi bi-check2-square text-danger me-2"></i>
            ตรวจสอบความถูกต้องของข้อมูล
          </div>
          <div class="list-group-item border-start border-danger border-3">
            <i class="bi bi-check2-square text-danger me-2"></i>
            ประเมินระดับความรุนแรงของปัญหา
          </div>
          <div class="list-group-item border-start border-danger border-3">
            <i class="bi bi-check2-square text-danger me-2"></i>
            มอบหมายงานให้ทีมที่เกี่ยวข้อง
          </div>
          <div class="list-group-item border-start border-danger border-3">
            <i class="bi bi-check2-square text-danger me-2"></i>
            อัพเดทสถานะให้ผู้แจ้งทราบ
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="text-center mt-4">
        <a href="#" class="btn btn-primary me-2">
          <i class="bi bi-eye me-2"></i>ดูรายละเอียดเพิ่มเติม
        </a>
        <a href="#" class="btn btn-success">
          <i class="bi bi-check-circle me-2"></i>อนุมัติรายงาน
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-light text-center py-3 border-top">
      <p class="mb-1"><strong>ระบบรายงานปัญหาและแจ้งซ่อม</strong></p>
      <p class="mb-0 small text-muted">
        <i class="bi bi-info-circle me-1"></i>อีเมลฉบับนี้ส่งอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Template สำหรับการอัพเดทสถานะ
 */
const statusUpdateTemplate = (data) => {
  const {
    userName,
    reportId,
    title,
    oldStatus,
    newStatus,
    updatedBy,
    updateNote,
    updatedAt,
    isAdminConfirmation = false
  } = data;

  const statusColors = {
    'รอตรวจสอบ': 'warning',
    'กำลังตรวจสอบ': 'info',
    'รอดำเนินการ': 'primary',
    'กำลังดำเนินการ': 'primary',
    'เสร็จสิ้น': 'success',
    'ปฏิเสธ': 'danger'
  };

  const oldColor = statusColors[oldStatus] || 'secondary';
  const newColor = statusColors[newStatus] || 'secondary';

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>อัพเดทสถานะรายงาน</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    body {
      font-family: 'Sarabun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
    .email-header {
      background: linear-gradient(135deg, #0dcaf0 0%, #0d6efd 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .email-header i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .email-body {
      padding: 2rem;
    }
    .status-flow {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin: 2rem 0;
      flex-wrap: wrap;
    }
    .status-badge-large {
      padding: 0.75rem 1.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <i class="bi bi-arrow-repeat"></i>
      <h1 class="h3 mb-2">${isAdminConfirmation ? 'ยืนยันการอัพเดทสถานะ' : 'อัพเดทสถานะรายงาน'}</h1>
      <p class="mb-0 small">ระบบรายงานปัญหาและแจ้งซ่อม</p>
    </div>

    <!-- Body -->
    <div class="email-body">
      <p>เรียนคุณ <strong>${userName}</strong></p>
      
      ${isAdminConfirmation 
        ? `<div class="alert alert-success border-start border-success border-4" role="alert">
            <div class="d-flex align-items-center">
              <i class="bi bi-check-circle-fill me-2 fs-5"></i>
              <div>
                <strong>คุณได้ทำการอัพเดทสถานะรายงานเรียบร้อยแล้ว</strong><br>
                <small>ระบบได้ส่งการแจ้งเตือนไปยังผู้แจ้งเรียบร้อยแล้ว</small>
              </div>
            </div>
          </div>`
        : `<div class="alert alert-info border-start border-info border-4" role="alert">
            <div class="d-flex align-items-center">
              <i class="bi bi-info-circle-fill me-2 fs-5"></i>
              <div>
                <strong>รายงานของคุณมีการอัพเดทสถานะ</strong><br>
                <small>รายงานหมายเลข <strong>#${reportId}</strong> ได้รับการปรับปรุงสถานะ</small>
              </div>
            </div>
          </div>`
      }

      <!-- Status Update Card -->
      <div class="card mb-3">
        <div class="card-header bg-info text-white">
          <i class="bi bi-file-earmark-text me-2"></i><strong>${title}</strong>
        </div>
        <div class="card-body">
          <h6 class="text-muted mb-3">
            <i class="bi bi-arrow-left-right me-2"></i>การเปลี่ยนแปลงสถานะ
          </h6>
          
          <!-- Status Flow -->
          <div class="status-flow">
            <span class="badge bg-${oldColor} status-badge-large">
              ${oldStatus}
            </span>
            <i class="bi bi-arrow-right fs-2 text-info"></i>
            <span class="badge bg-${newColor} status-badge-large">
              ${newStatus}
            </span>
          </div>

          ${updateNote ? `
            <div class="alert alert-light border mt-3">
              <h6 class="alert-heading">
                <i class="bi bi-chat-left-text me-2"></i>หมายเหตุจากเจ้าหน้าที่:
              </h6>
              <p class="mb-0">${updateNote}</p>
            </div>
          ` : ''}

          <hr>
          
          <div class="small text-muted">
            <p class="mb-1">
              <i class="bi bi-person-badge me-2"></i>
              <strong>อัพเดทโดย:</strong> ${updatedBy || 'เจ้าหน้าที่'}
            </p>
            <p class="mb-0">
              <i class="bi bi-clock me-2"></i>
              <strong>เมื่อ:</strong> ${updatedAt}
            </p>
          </div>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="alert alert-light">
        <i class="bi bi-lightbulb text-warning me-2"></i>
        <small>คุณสามารถติดตามสถานะรายงานได้ตลอดเวลาผ่านระบบ</small>
      </div>

      <!-- Action Button -->
      <div class="text-center mt-4">
        <a href="#" class="btn btn-primary">
          <i class="bi bi-box-arrow-up-right me-2"></i>ดูรายละเอียดเพิ่มเติม
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-light text-center py-3 border-top">
      <p class="mb-1"><strong>ระบบรายงานปัญหาและแจ้งซ่อม</strong></p>
      <p class="mb-0 small text-muted">
        <i class="bi bi-info-circle me-1"></i>อีเมลฉบับนี้ส่งอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = {
  reportConfirmationTemplate,
  adminNotificationTemplate,
  statusUpdateTemplate
};
