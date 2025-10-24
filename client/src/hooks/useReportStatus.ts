import { useState, useEffect, useCallback, useMemo } from 'react';
import { updateReportStatus, getReports, getReportById } from '../services/reportService';
import { getStatusMapping, getStatusInfo } from '../services/statusService';
import type { StatusMapping, StatusInfo } from '../services/statusService';

// Interface สำหรับรายงาน
export interface Report {
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
    user_name?: string;
    problem_type_name?: string;
    images?: string[];
    first_name?: string;
    last_name?: string;
    email?: string;
}

// Interface สำหรับการกรองข้อมูล
export interface FilterOptions {
    status: string;
    problemType: string;
    dateRange: string;
    searchText: string;
}

// Interface สำหรับการแสดงสถานะ
export interface StatusDisplay {
    text: string;
    className: string;
    color: string;
    step: number;
    description: string;
}

// Interface สำหรับ return type ของ hook
export interface UseReportStatusReturn {
    // Data
    reports: Report[];
    filteredReports: Report[];
    statusMappings: StatusMapping[];
    statusInfo: StatusInfo[];
    selectedReport: Report | null;
    
    // UI State
    loading: boolean;
    updateLoading: boolean;
    error: string | null;
    
    // Actions
    fetchReports: () => Promise<void>;
    updateStatus: (reportId: number, newStatus: string, comment?: string) => Promise<boolean>;
    selectReport: (reportId: number) => Promise<void>;
    clearSelectedReport: () => void;
    setFilters: (filters: FilterOptions) => void;
    resetFilters: () => void;
    clearError: () => void;
    refreshData: () => Promise<void>;
    
    // Utilities
    getStatusDisplay: (status: string) => StatusDisplay;
    getAvailableStatuses: () => { value: string; label: string; color: string; step: number }[];
    getStatusStats: () => { [key: string]: number };
}

export const useReportStatus = (initialFilters: FilterOptions = {
    status: '',
    problemType: '',
    dateRange: '',
    searchText: ''
}): UseReportStatusReturn => {
    // Core Data State
    const [reports, setReports] = useState<Report[]>([]);
    const [statusMappings, setStatusMappings] = useState<StatusMapping[]>([]);
    const [statusInfo, setStatusInfo] = useState<StatusInfo[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Filter State
    const [filters, setFiltersState] = useState<FilterOptions>(initialFilters);

    // ดึงข้อมูล Status Mapping และ Status Info
    const fetchStatusData = useCallback(async () => {
        try {
            const [mappings, info] = await Promise.all([
                getStatusMapping(),
                getStatusInfo()
            ]);
            setStatusMappings(mappings);
            setStatusInfo(info);
        } catch (err) {
            console.error('Error fetching status data:', err);
            throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ');
        }
    }, []);

    // ดึงข้อมูลรายงาน
    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params: any = {};
            if (filters.status) params.status = filters.status;
            if (filters.problemType) params.problem_type_id = filters.problemType;
            
            const data = await getReports(params);
            const reportsList = Array.isArray(data) ? data : data.reports || [];
            
            // เรียงลำดับตาม updated_at ล่าสุดก่อน
            const sortedReports = reportsList.sort((a: Report, b: Report) => 
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
            
            setReports(sortedReports);
        } catch (err) {
            console.error('Error fetching reports:', err);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน';
            setError(errorMessage);
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.problemType]);

    // เลือกรายงานและดึงรายละเอียด
    const selectReport = useCallback(async (reportId: number) => {
        try {
            setLoading(true);
            const reportData = await getReportById(reportId);
            setSelectedReport(reportData);
        } catch (err) {
            console.error('Error fetching report details:', err);
            setError('เกิดข้อผิดพลาดในการดึงรายละเอียดรายงาน');
        } finally {
            setLoading(false);
        }
    }, []);

    // อัปเดตสถานะรายงาน
    const updateStatus = useCallback(async (reportId: number, newStatus: string, comment: string = ''): Promise<boolean> => {
        console.log('=== useReportStatus.updateStatus called ===');
        console.log('Parameters:', { reportId, newStatus, comment });
        
        try {
            setUpdateLoading(true);
            setError(null);
            
            console.log('Calling updateReportStatus service...');
            // เรียก API อัปเดตสถานะ
            const result = await updateReportStatus(reportId, newStatus, comment, 1);
            console.log('updateReportStatus result:', result);
            console.log('typeof result:', typeof result);
            console.log('result.message:', result?.message);
            console.log('result.report:', result?.report);
            
            console.log('Updating local state...');
            // อัปเดต state ใน reports ทันที
            setReports(prev => {
                const updated = prev.map(report => 
                    report.report_id === reportId 
                        ? { ...report, status: newStatus, updated_at: new Date().toISOString() }
                        : report
                );
                console.log('Updated reports state');
                return updated;
            });
            
            // อัปเดต selectedReport ถ้ามี
            if (selectedReport?.report_id === reportId) {
                setSelectedReport(prev => prev ? { 
                    ...prev, 
                    status: newStatus, 
                    updated_at: new Date().toISOString() 
                } : null);
                console.log('Updated selectedReport state');
            }
            
            // รีเฟรช status info เพื่ออัปเดตจำนวนในแต่ละสถานะ
            try {
                console.log('Refreshing status info...');
                const info = await getStatusInfo();
                setStatusInfo(info);
                console.log('Status info refreshed');
            } catch (infoError) {
                console.error('Error refreshing status info:', infoError);
            }
            
            console.log('updateStatus returning true');
            return true;
        } catch (err) {
            console.error('Error updating status in hook:', err);
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตสถานะ';
            setError(errorMessage);
            console.log('updateStatus returning false due to error');
            return false;
        } finally {
            setUpdateLoading(false);
            console.log('updateStatus finished, updateLoading set to false');
        }
    }, [selectedReport]);

    // ฟังก์ชันแปลงสถานะเป็นการแสดงผล
    const getStatusDisplay = useCallback((status: string): StatusDisplay => {
        // หา mapping จาก old_status ก่อน แล้วใช้ new_status
        const mapping = statusMappings.find(m => m.old_status === status);
        const displayStatus = mapping?.new_status || status;
        
        // หาสีจาก status_color
        const colorMapping = statusMappings.find(m => m.new_status === displayStatus || m.old_status === status);
        const hexColor = colorMapping?.status_color || '#6c757d';
        
        // แปลง hex เป็นคลาส CSS
        const getCssClass = (hex: string) => {
            switch (hex.toUpperCase()) {
                case '#E91E63': return 'status-pending'; // ชมพู - รอตรวจสอบ
                case '#FF9800': return 'status-checking'; // ส้ม - กำลังตรวจสอบ
                case '#FFEB3B': return 'status-waiting'; // เหลือง - รอดำเนินการ
                case '#00BCD4': return 'status-progress'; // ฟ้า - กำลังดำเนินการ
                case '#4CAF50': return 'status-resolved'; // เขียว - เสร็จสิ้น
                case '#F44336': return 'status-rejected'; // แดง - ปฏิเสธ
                default: return 'status-default';
            }
        };
        
        return {
            text: displayStatus,
            className: getCssClass(hexColor),
            color: hexColor,
            step: colorMapping?.step_number || 1,
            description: colorMapping?.description || ''
        };
    }, [statusMappings]);

    // ได้รับสถานะที่สามารถเปลี่ยนได้
    const getAvailableStatuses = useCallback(() => {
        return statusMappings
            .filter((mapping, index, self) => 
                // กรองเอาเฉพาะ new_status ที่ไม่ซ้ำ
                index === self.findIndex(m => m.new_status === mapping.new_status)
            )
            .map(mapping => ({
                value: mapping.new_status,
                label: mapping.new_status,
                color: mapping.status_color,
                step: mapping.step_number
            }))
            .sort((a, b) => a.step - b.step); // เรียงตาม step
    }, [statusMappings]);

    // คำนวณสถิติสถานะ
    const getStatusStats = useCallback(() => {
        const stats: { [key: string]: number } = {};
        
        reports.forEach(report => {
            const statusDisplay = getStatusDisplay(report.status);
            const statusKey = statusDisplay.text;
            stats[statusKey] = (stats[statusKey] || 0) + 1;
        });
        
        return stats;
    }, [reports, getStatusDisplay]);

    // กรองรายงานตาม filters
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            // กรองตามข้อความค้นหา
            if (filters.searchText) {
                const searchLower = filters.searchText.toLowerCase();
                if (!report.title.toLowerCase().includes(searchLower) &&
                    !report.description.toLowerCase().includes(searchLower) &&
                    !(report.location_detail || '').toLowerCase().includes(searchLower)) {
                    return false;
                }
            }
            
            // กรองตามสถานะ
            if (filters.status) {
                const statusDisplay = getStatusDisplay(report.status);
                if (statusDisplay.text !== filters.status && report.status !== filters.status) {
                    return false;
                }
            }
            
            // กรองตามประเภทปัญหา
            if (filters.problemType && report.problem_type_id.toString() !== filters.problemType) {
                return false;
            }
            
            // กรองตามช่วงวันที่
            if (filters.dateRange) {
                const reportDate = new Date(report.created_at);
                const now = new Date();
                
                switch (filters.dateRange) {
                    case 'today':
                        if (reportDate.toDateString() !== now.toDateString()) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        if (reportDate < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        if (reportDate < monthAgo) return false;
                        break;
                }
            }
            
            return true;
        });
    }, [reports, filters, getStatusDisplay]);

    // ฟังก์ชัน Utilities
    const clearSelectedReport = useCallback(() => {
        setSelectedReport(null);
    }, []);

    const setFilters = useCallback((newFilters: FilterOptions) => {
        setFiltersState(newFilters);
    }, []);

    const resetFilters = useCallback(() => {
        setFiltersState(initialFilters);
    }, [initialFilters]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const refreshData = useCallback(async () => {
        try {
            await Promise.all([
                fetchStatusData(),
                fetchReports()
            ]);
        } catch (err) {
            console.error('Error refreshing data:', err);
            setError('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล');
        }
    }, [fetchStatusData, fetchReports]);

    // โหลดข้อมูลเมื่อเริ่มต้น
    useEffect(() => {
        fetchStatusData();
    }, [fetchStatusData]);

    useEffect(() => {
        if (statusMappings.length > 0) {
            fetchReports();
        }
    }, [fetchReports, statusMappings.length]);

    return {
        // Data
        reports,
        filteredReports,
        statusMappings,
        statusInfo,
        selectedReport,
        
        // UI State
        loading,
        updateLoading,
        error,
        
        // Actions
        fetchReports,
        updateStatus,
        selectReport,
        clearSelectedReport,
        setFilters,
        resetFilters,
        clearError,
        refreshData,
        
        // Utilities
        getStatusDisplay,
        getAvailableStatuses,
        getStatusStats
    };
};