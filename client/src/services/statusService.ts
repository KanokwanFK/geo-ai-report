// Status Service สำหรับจัดการข้อมูลสถานะจากฐานข้อมูล

// import axios from 'axios';
import { API_URL } from '../config/api';

const API_BASE_URL = API_URL;

export interface StatusMapping {
    mapping_id: number;
    old_status: string;
    new_status: string;
    step_number: number;
    status_color: string;
    description: string;
    created_at: string;
}

export interface StatusInfo {
    status_name: string;
    step_number: number;
    status_color: string;
    description: string;
    report_count: number;
}

// ดึงข้อมูล status mapping ทั้งหมด
export const getStatusMapping = async (): Promise<StatusMapping[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/status-mapping`);
        if (!response.ok) {
            throw new Error('Failed to fetch status mapping');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching status mapping:', error);
        throw error;
    }
};

// ดึงข้อมูลสถานะพร้อมสีและจำนวน
export const getStatusInfo = async (): Promise<StatusInfo[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/status-info`);
        if (!response.ok) {
            throw new Error('Failed to fetch status info');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching status info:', error);
        throw error;
    }
};

// อัพเดทสถานะจากระบบเก่าเป็นใหม่
export const updateOldStatus = async (): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE_URL}/update-status`);
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
};

// Utility functions สำหรับจัดการสถานะใน Frontend

// แปลงสถานะเป็นคลาส CSS สีตาม mapping จากฐานข้อมูล
export const getStatusColor = (status: string, statusMappings: StatusMapping[]): string => {
    // หาจาก new_status ก่อน
    const mapping = statusMappings.find(m => m.new_status === status);
    let hexColor = mapping?.status_color;
    
    // หาจาก old_status ถ้าไม่เจอ
    if (!hexColor) {
        const oldMapping = statusMappings.find(m => m.old_status === status);
        hexColor = oldMapping?.status_color;
    }
    
    // แปลง hex color เป็นชื่อคลาส CSS
    if (hexColor) {
        switch (hexColor.toUpperCase()) {
            case '#E91E63': // ชมพู - รอตรวจสอบ
                return 'pink';
            case '#FF9800': // ส้ม - กำลังตรวจสอบ
                return 'orange';
            case '#FFEB3B': // เหลือง - รอดำเนินการ
                return 'yellow';
            case '#00BCD4': // ฟ้า - กำลังดำเนินการ
                return 'blue';
            case '#4CAF50': // เขียว - เสร็จสิ้น
                return 'green';
            case '#F44336': // แดง - ปฏิเสธ
                return 'red';
            default:
                return 'gray';
        }
    }
    
    // default color
    return 'gray';
};

// แปลงสถานะเป็นข้อความที่แสดงผล
export const getStatusText = (status: string, statusMappings: StatusMapping[]): string => {
    // หาจาก old_status แล้วใช้ new_status
    const mapping = statusMappings.find(m => m.old_status === status);
    if (mapping) return mapping.new_status;
    
    // ถ้าเป็น new_status อยู่แล้ว ก็ return เลย
    const newMapping = statusMappings.find(m => m.new_status === status);
    if (newMapping) return status;
    
    // default
    return status;
};

// แปลงสถานะเป็น step number
export const getStatusStep = (status: string, statusMappings: StatusMapping[]): number => {
    const mapping = statusMappings.find(m => m.new_status === status || m.old_status === status);
    return mapping?.step_number || 1;
};

// ดึง description ของสถานะ
export const getStatusDescription = (status: string, statusMappings: StatusMapping[]): string => {
    const mapping = statusMappings.find(m => m.new_status === status || m.old_status === status);
    return mapping?.description || '';
};

// ฟังก์ชันสำหรับแปลงสถานะเก่าเป็นใหม่ (client-side)
export const normalizeStatus = (status: string, statusMappings: StatusMapping[]): string => {
    const mapping = statusMappings.find(m => m.old_status === status);
    return mapping?.new_status || status;
};