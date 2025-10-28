// Report Service สำหรับจัดการ API เกี่ยวกับรายงาน
import axios from 'axios';
import { API_URL } from '../config/api';

const API_BASE_URL = API_URL;

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout

export interface CreateReportData {
    user_id: number;
    problem_type_id: number;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    location_detail?: string;
}

export interface ReportResponse {
    message: string;
    report: {
        report_id: number;
        user_id: number;
        problem_type_id: number;
        title: string;
        description: string;
        latitude: number;
        longitude: number;
        location_detail: string;
        status: string;
        created_at: string;
        updated_at: string;
    };
}

export interface ProblemType {
    problem_type_id: number;
    type_name: string;
    description: string;
    created_at: string;
}

// สร้างรายงานใหม่
export const createReport = async (reportData: CreateReportData): Promise<ReportResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create report');
        }

        const data: ReportResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating report:', error);
        throw error;
    }
};

// ดึงประเภทปัญหาทั้งหมด
export const getProblemTypes = async (): Promise<ProblemType[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/problem-types`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch problem types');
        }

        const data: ProblemType[] = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching problem types:', error);
        throw error;
    }
};

// ดึงรายงานทั้งหมด
export const getReports = async (params?: {
    status?: string;
    user_id?: number;
    problem_type_id?: number;
    limit?: number;
    offset?: number;
}) => {
    try {
        const searchParams = new URLSearchParams();
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const url = `${API_BASE_URL}/reports${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
    }
};

// ดึงรายละเอียดรายงานเฉพาะ ID
export const getReportById = async (reportId: number) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch report details');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching report details:', error);
        throw error;
    }
};

// อัปเดตสถานะรายงาน (สำหรับแอดมิน)
export const updateReportStatus = async (reportId: number, status: string, comment: string = '', adminId: number = 1) => {
    console.log('=== updateReportStatus called ===');
    console.log('Parameters:', { reportId, status, comment, adminId });
    
    const requestBody = { 
        status, 
        admin_id: adminId, 
        comment 
    };
    
    const url = `${API_BASE_URL}/reports/${reportId}/status`;
    console.log('Request URL:', url);
    console.log('Request body:', requestBody);
    
    try {
        const response = await axios.put(url, requestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000
        });

        console.log('Response status:', response.status, response.statusText);
        console.log('Response data:', response.data);

        return response.data;
    } catch (error) {
        console.error('Error updating report status:', error);
        
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:');
            console.error('- Status:', error.response?.status);
            console.error('- Status text:', error.response?.statusText);
            console.error('- Response data:', error.response?.data);
            console.error('- Request config:', error.config);
            
            // Throw more descriptive error
            const errorMessage = error.response?.data?.error || 
                                error.response?.data?.message || 
                                `HTTP ${error.response?.status}: ${error.response?.statusText}` ||
                                error.message;
            throw new Error(errorMessage);
        }
        
        throw error;
    }
};

// อัปโหลดรูปภาพสำหรับรายงาน
export const uploadReportImages = async (reportId: number, images: FileList) => {
    try {
        const formData = new FormData();
        if (images.length > 1) {
            Array.from(images).forEach((file) => {
                formData.append('images', file);
            });
        } else if (images.length === 1) {
            formData.append('image', images[0]);
        }
        const endpoint = images.length > 1
            ? `${API_BASE_URL}/reports/${reportId}/images/multiple`
            : `${API_BASE_URL}/reports/${reportId}/images`;
        // ใช้ axios ในการอัปโหลด ไม่ต้องตั้ง header Content-Type
        const response = await axios.post(endpoint, formData, {
            // ไม่ต้องตั้ง Content-Type ให้ axios จัดการเอง
            withCredentials: false // ถ้าไม่ต้องการส่ง cookie
        });
        return response.data;
    } catch (error) {
        // เพิ่ม error log แบบละเอียด
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data);
        }
        console.error('Error uploading images:', error);
        throw error;
    }
};

// ดึงข้อมูลขั้นตอนรายงาน
export const getReportSteps = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/report-steps`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch report steps');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching report steps:', error);
        throw error;
    }
};

// ดึงสถานะรายงานตาม ID
export const getReportStatus = async (reportId: number) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/${reportId}/status`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch report status');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching report status:', error);
        throw error;
    }
};

// ดึงรายงานตามขั้นตอน
export const getReportsByStep = async (step: number) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/by-step/${step}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch reports by step');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching reports by step:', error);
        throw error;
    }
};

// ดึงสถิติรายงานตามขั้นตอน
export const getReportsByStepStats = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/reports-by-step`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch reports by step stats');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching reports by step stats:', error);
        throw error;
    }
};

// ดึงรายงานของผู้ใช้เฉพาะ
export const getUserReports = async (userId: number) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reports?user_id=${userId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch user reports');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user reports:', error);
        throw error;
    }
};

// ================ Admin Dashboard Services ================

// Interface สำหรับ Dashboard Stats
export interface DashboardStats {
    total_reports: number;
    pending_reports: number;      // รอตรวจสอบ
    checking_reports: number;     // กำลังตรวจสอบ
    waiting_reports: number;      // รอดำเนินการ
    in_progress_reports: number;  // กำลังดำเนินการ
    resolved_reports: number;     // เสร็จสิ้น
    rejected_reports: number;     // ปฏิเสธ
    total_users: number;
    total_admins: number;
    active_problem_types: number;
}

// Interface สำหรับ Reports by Type
export interface ReportsByType {
    type_name: string;
    color_code: string;
    report_count: number;
}

// ดึงสถิติแดชบอร์ดสำหรับ Admin
export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};

// ดึงสถิติรายงานตามประเภทปัญหา
export const getReportsByType = async (): Promise<ReportsByType[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/reports-by-type`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch reports by type');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching reports by type:', error);
        throw error;
    }
};

// ดึงรายงานล่าสุด
export const getRecentReports = async (limit: number = 5) => {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/recent-reports?limit=${limit}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch recent reports');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching recent reports:', error);
        throw error;
    }
};

// ลบรายงาน
export const deleteReport = async (reportId: number): Promise<{ message: string }> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/reports/${reportId}`);
        return response.data;
    } catch (error: any) {
        console.error('Error deleting report:', error);
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('เกิดข้อผิดพลาดในการลบรายงาน');
    }
};

// ลบรายงานแบบกลุ่ม
export const deleteBatchReports = async (reportIds: number[]): Promise<{ message: string; deletedCount: number }> => {
    try {
        const deletePromises = reportIds.map(id => deleteReport(id));
        const results = await Promise.allSettled(deletePromises);
        
        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;
        
        if (failed > 0) {
            throw new Error(`ลบรายงานสำเร็จ ${successful} รายการ แต่ล้มเหลว ${failed} รายการ`);
        }
        
        return {
            message: `ลบรายงานสำเร็จทั้งหมด ${successful} รายการ`,
            deletedCount: successful
        };
    } catch (error: any) {
        console.error('Error batch deleting reports:', error);
        throw error;
    }
};

// อัปเดตรายงาน
export interface UpdateReportData {
    title: string;
    description: string;
    problem_type_id: number;
    latitude: number;
    longitude: number;
    location_detail?: string;
}

export const updateReport = async (reportId: number, reportData: UpdateReportData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/reports/${reportId}`, reportData);
        return response.data;
    } catch (error: any) {
        console.error('Error updating report:', error);
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('เกิดข้อผิดพลาดในการอัปเดตรายงาน');
    }
};

// อัพเดตสถานะรายงานตาม email และ report_id
export const updateReportStatusByEmail = async (email: string, report_id: number, new_status: string) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/reports/update-status-by-email`, {
            email,
            report_id,
            new_status
        });
        return response.data;
    } catch (error: any) {
        console.error('Error updating report status by email:', error);
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('เกิดข้อผิดพลาดในการอัพเดทสถานะรายงาน');
    }
};