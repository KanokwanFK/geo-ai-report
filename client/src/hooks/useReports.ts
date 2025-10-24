import { useState, useCallback } from 'react';
import { 
    createReport, 
    getReports, 
    getProblemTypes,
    uploadReportImages,
} from '../services/reportService';
import type { CreateReportData, ProblemType } from '../services/reportService';

export interface UseReportsReturn {
    // State
    reports: any[];
    problemTypes: ProblemType[];
    loading: boolean;
    error: string | null;
    
    // Functions
    fetchReports: (params?: any) => Promise<void>;
    fetchProblemTypes: () => Promise<void>;
    submitReport: (data: CreateReportData, images?: FileList) => Promise<any>;
    refreshReports: () => Promise<void>;
    clearError: () => void;
}

export const useReports = (): UseReportsReturn => {
    const [reports, setReports] = useState<any[]>([]);
    const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ฟังก์ชันดึงรายงานทั้งหมด
    const fetchReports = useCallback(async (params?: any) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getReports(params);
            setReports(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน');
        } finally {
            setLoading(false);
        }
    }, []);

    // ฟังก์ชันดึงประเภทปัญหา
    const fetchProblemTypes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getProblemTypes();
            setProblemTypes(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทปัญหา');
        } finally {
            setLoading(false);
        }
    }, []);

    // ฟังก์ชันสร้างรายงานใหม่
    const submitReport = useCallback(async (reportData: CreateReportData, images?: FileList) => {
        try {
            setLoading(true);
            setError(null);
            
            // สร้างรายงานก่อน
            const reportResponse = await createReport(reportData);
            
            // ถ้ามีรูปภาพ ให้อัปโหลดด้วย
            if (images && images.length > 0) {
                await uploadReportImages(reportResponse.report.report_id, images);
            }
            
            // รีเฟรชรายการรายงาน
            await fetchReports();
            
            return reportResponse;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างรายงาน';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [fetchReports]);

    // ฟังก์ชันรีเฟรชข้อมูล
    const refreshReports = useCallback(async () => {
        await fetchReports();
    }, [fetchReports]);

    // ฟังก์ชันล้างข้อผิดพลาด
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        reports,
        problemTypes,
        loading,
        error,
        fetchReports,
        fetchProblemTypes,
        submitReport,
        refreshReports,
        clearError,
    };
};