// Problem Utils - ฟังก์ชันยูทิลิตี้สำหรับจัดการข้อมูลปัญหา

// Interface สำหรับข้อมูลสถิติ
export interface StatusStatistics {
    total: number;
    pending: number;
    checking: number;
    waiting: number;
    progress: number;
    resolved: number;
    rejected: number;
}

// Interface สำหรับข้อมูลรายงาน
export interface ReportSummary {
    id: number;
    title: string;
    status: string;
    createdDate: string;
    updatedDate: string;
    location: string;
    priority: 'low' | 'medium' | 'high';
}

// ฟังก์ชันแปลงสถานะจากภาษาอังกฤษเป็นไทย
export const translateStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
        'pending': 'รอตรวจสอบ',
        'checking': 'กำลังตรวจสอบ',
        'waiting': 'รอดำเนินการ',
        'in_progress': 'กำลังดำเนินการ',
        'resolved': 'เสร็จสิ้น',
        'rejected': 'ปฏิเสธ'
    };
    
    return statusMap[status] || status;
};

// ฟังก์ชันแปลงสถานะจากไทยเป็นอังกฤษ
export const translateStatusToEn = (status: string): string => {
    const statusMap: { [key: string]: string } = {
        'รอตรวจสอบ': 'pending',
        'กำลังตรวจสอบ': 'checking',
        'รอดำเนินการ': 'waiting',
        'กำลังดำเนินการ': 'in_progress',
        'เสร็จสิ้น': 'resolved',
        'ปฏิเสธ': 'rejected'
    };
    
    return statusMap[status] || status;
};

// ฟังก์ชันได้รับสีตามสถานะ
export const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
        'pending': '#E91E63',        // ชมพู
        'รอตรวจสอบ': '#E91E63',
        'checking': '#FF9800',       // ส้ม
        'กำลังตรวจสอบ': '#FF9800',
        'waiting': '#FFEB3B',        // เหลือง
        'รอดำเนินการ': '#FFEB3B',
        'in_progress': '#00BCD4',    // ฟ้า
        'กำลังดำเนินการ': '#00BCD4',
        'resolved': '#4CAF50',       // เขียว
        'เสร็จสิ้น': '#4CAF50',
        'rejected': '#F44336',       // แดง
        'ปฏิเสธ': '#F44336'
    };
    
    return colorMap[status] || '#6c757d';
};

// ฟังก์ชันได้รับ CSS class ตามสถานะ
export const getStatusCssClass = (status: string): string => {
    const classMap: { [key: string]: string } = {
        'pending': 'status-pending',
        'รอตรวจสอบ': 'status-pending',
        'checking': 'status-checking',
        'กำลังตรวจสอบ': 'status-checking',
        'waiting': 'status-waiting',
        'รอดำเนินการ': 'status-waiting',
        'in_progress': 'status-progress',
        'กำลังดำเนินการ': 'status-progress',
        'resolved': 'status-resolved',
        'เสร็จสิ้น': 'status-resolved',
        'rejected': 'status-rejected',
        'ปฏิเสธ': 'status-rejected'
    };
    
    return classMap[status] || 'status-default';
};

// ฟังก์ชันได้รับระดับความสำคัญตามสถานะ
export const getStatusPriority = (status: string): number => {
    const priorityMap: { [key: string]: number } = {
        'pending': 1,
        'รอตรวจสอบ': 1,
        'checking': 2,
        'กำลังตรวจสอบ': 2,
        'waiting': 3,
        'รอดำเนินการ': 3,
        'in_progress': 4,
        'กำลังดำเนินการ': 4,
        'resolved': 5,
        'เสร็จสิ้น': 5,
        'rejected': 0
    };
    
    return priorityMap[status] || 0;
};

// ฟังก์ชันคำนวณสถิติจากรายการรายงาน
export const calculateStatusStatistics = (reports: any[]): StatusStatistics => {
    const stats: StatusStatistics = {
        total: reports.length,
        pending: 0,
        checking: 0,
        waiting: 0,
        progress: 0,
        resolved: 0,
        rejected: 0
    };
    
    reports.forEach(report => {
        const status = report.status.toLowerCase();
        switch (status) {
            case 'pending':
            case 'รอตรวจสอบ':
                stats.pending++;
                break;
            case 'checking':
            case 'กำลังตรวจสอบ':
                stats.checking++;
                break;
            case 'waiting':
            case 'รอดำเนินการ':
                stats.waiting++;
                break;
            case 'in_progress':
            case 'กำลังดำเนินการ':
                stats.progress++;
                break;
            case 'resolved':
            case 'เสร็จสิ้น':
                stats.resolved++;
                break;
            case 'rejected':
            case 'ปฏิเสธ':
                stats.rejected++;
                break;
        }
    });
    
    return stats;
};

// ฟังก์ชันเรียงลำดับรายงานตามความสำคัญ
export const sortReportsByPriority = (reports: any[]): any[] => {
    return reports.sort((a, b) => {
        const priorityA = getStatusPriority(a.status);
        const priorityB = getStatusPriority(b.status);
        
        // เรียงตามความสำคัญก่อน แล้วตามวันที่อัปเดตล่าสุด
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
};

// ฟังก์ชันเรียงลำดับรายงานตามวันที่
export const sortReportsByDate = (reports: any[], order: 'asc' | 'desc' = 'desc'): any[] => {
    return reports.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        
        return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
};

// ฟังก์ชันกรองรายงานตามช่วงวันที่
export const filterReportsByDateRange = (
    reports: any[], 
    range: 'today' | 'week' | 'month' | 'year' | 'custom',
    customStart?: Date,
    customEnd?: Date
): any[] => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    switch (range) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'custom':
            if (customStart && customEnd) {
                startDate = customStart;
                endDate = customEnd;
            } else {
                return reports; // ถ้าไม่มีวันที่กำหนด ให้คืนค่าทั้งหมด
            }
            break;
        default:
            return reports;
    }
    
    return reports.filter(report => {
        const reportDate = new Date(report.created_at);
        return reportDate >= startDate && reportDate <= endDate;
    });
};

// ฟังก์ชันสร้าง summary ของรายงาน
export const createReportSummary = (report: any): ReportSummary => {
    return {
        id: report.report_id,
        title: report.title,
        status: report.status,
        createdDate: new Date(report.created_at).toLocaleDateString('th-TH'),
        updatedDate: new Date(report.updated_at).toLocaleDateString('th-TH'),
        location: report.location_detail || `${report.latitude}, ${report.longitude}`,
        priority: determinePriority(report)
    };
};

// ฟังก์ชันกำหนดระดับความสำคัญ
const determinePriority = (report: any): 'low' | 'medium' | 'high' => {
    const status = report.status.toLowerCase();
    const daysSinceCreated = Math.floor(
        (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // ถ้าเป็นสถานะรอและเกิน 7 วัน = สำคัญมาก
    if ((status === 'pending' || status === 'รอตรวจสอบ') && daysSinceCreated > 7) {
        return 'high';
    }
    
    // ถ้าเป็นสถานะกำลังดำเนินการและเกิน 14 วัน = สำคัญปานกลาง
    if ((status === 'in_progress' || status === 'กำลังดำเนินการ') && daysSinceCreated > 14) {
        return 'medium';
    }
    
    // อื่นๆ = ความสำคัญต่ำ
    return 'low';
};

// ฟังก์ชันตรวจสอบว่าสามารถเปลี่ยนสถานะได้หรือไม่
export const canChangeStatus = (currentStatus: string, newStatus: string): boolean => {
    const statusFlow: { [key: string]: string[] } = {
        'pending': ['checking', 'rejected'],
        'รอตรวจสอบ': ['กำลังตรวจสอบ', 'ปฏิเสธ'],
        'checking': ['waiting', 'rejected'],
        'กำลังตรวจสอบ': ['รอดำเนินการ', 'ปฏิเสธ'],
        'waiting': ['in_progress', 'rejected'],
        'รอดำเนินการ': ['กำลังดำเนินการ', 'ปฏิเสธ'],
        'in_progress': ['resolved', 'waiting'],
        'กำลังดำเนินการ': ['เสร็จสิ้น', 'รอดำเนินการ'],
        'resolved': [],
        'เสร็จสิ้น': [],
        'rejected': ['pending'],
        'ปฏิเสธ': ['รอตรวจสอบ']
    };
    
    const allowedStatuses = statusFlow[currentStatus] || [];
    return allowedStatuses.includes(newStatus);
};

// ฟังก์ชันสร้างข้อความแจ้งเตือนสำหรับการเปลี่ยนสถานะ
export const createStatusChangeMessage = (
    reportTitle: string, 
    oldStatus: string, 
    newStatus: string
): string => {
    const oldStatusTh = translateStatus(oldStatus);
    const newStatusTh = translateStatus(newStatus);
    
    return `รายงาน "${reportTitle}" ได้เปลี่ยนสถานะจาก "${oldStatusTh}" เป็น "${newStatusTh}" แล้ว`;
};

// ฟังก์ชันตรวจสอบความถูกต้องของข้อมูลรายงาน
export const validateReportData = (reportData: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!reportData.title || reportData.title.trim().length === 0) {
        errors.push('หัวข้อรายงานไม่สามารถเว้นว่างได้');
    }
    
    if (!reportData.description || reportData.description.trim().length === 0) {
        errors.push('รายละเอียดรายงานไม่สามารถเว้นว่างได้');
    }
    
    if (!reportData.latitude || !reportData.longitude) {
        errors.push('ต้องระบุตำแหน่งที่เกิดปัญหา');
    }
    
    if (reportData.latitude && (reportData.latitude < -90 || reportData.latitude > 90)) {
        errors.push('ค่าละติจูดไม่ถูกต้อง');
    }
    
    if (reportData.longitude && (reportData.longitude < -180 || reportData.longitude > 180)) {
        errors.push('ค่าลองจิจูดไม่ถูกต้อง');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// ฟังก์ชันสำหรับ export ข้อมูลเป็น CSV
export const exportReportsToCSV = (reports: any[]): string => {
    const headers = [
        'ID',
        'หัวข้อ',
        'รายละเอียด',
        'สถานะ',
        'ละติจูด',
        'ลองจิจูด',
        'รายละเอียดตำแหน่ง',
        'วันที่สร้าง',
        'วันที่อัปเดต'
    ];
    
    const csvContent = [
        headers.join(','),
        ...reports.map(report => [
            report.report_id,
            `"${report.title.replace(/"/g, '""')}"`,
            `"${report.description.replace(/"/g, '""')}"`,
            translateStatus(report.status),
            report.latitude,
            report.longitude,
            `"${(report.location_detail || '').replace(/"/g, '""')}"`,
            new Date(report.created_at).toLocaleDateString('th-TH'),
            new Date(report.updated_at).toLocaleDateString('th-TH')
        ].join(','))
    ].join('\n');
    
    return csvContent;
};

// ฟังก์ชันสำหรับ download CSV file
export const downloadCSV = (csvContent: string, filename: string = 'reports.csv'): void => {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
};