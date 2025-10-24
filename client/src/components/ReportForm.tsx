import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { useAuth } from '../contexts/AuthContext';
import { getReportById, updateReport } from '../services/reportService';
import styles from './styles/ReportForm.module.css';
import type { CreateReportData, UpdateReportData } from '../services/reportService';

interface ReportFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialLocation?: {
        latitude: number;
        longitude: number;
    };
}

const ReportForm: React.FC<ReportFormProps> = ({ 
    onSuccess, 
    onCancel, 
    initialLocation 
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { reportId } = useParams<{ reportId: string }>();
    const location = useLocation();
    const { 
        problemTypes, 
        loading, 
        error, 
        fetchProblemTypes, 
        submitReport, 
        clearError 
    } = useReports();

    // Edit mode logic
    const isEditMode = !!reportId;
    const editData = location.state?.reportData;

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        problem_type_id: '',
        latitude: initialLocation?.latitude || 0,
        longitude: initialLocation?.longitude || 0,
        location_detail: ''
    });
    const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // โหลดประเภทปัญหาเมื่อคอมโพเนนต์โหลด
    useEffect(() => {
        fetchProblemTypes();
    }, [fetchProblemTypes]);

    // อัปเดตตำแหน่งเมื่อ initialLocation เปลี่ยน
    useEffect(() => {
        if (initialLocation) {
            setFormData(prev => ({
                ...prev,
                latitude: initialLocation.latitude,
                longitude: initialLocation.longitude
            }));
        }
    }, [initialLocation]);

    // โหลดข้อมูลรายงานในโหมดแก้ไข
    useEffect(() => {
        const loadReportData = async () => {
            if (isEditMode && reportId) {
                try {
                    setSubmitting(true);
                    const reportData = await getReportById(parseInt(reportId));
                    setFormData({
                        title: reportData.title || '',
                        description: reportData.description || '',
                        problem_type_id: reportData.problem_type_id?.toString() || '',
                        latitude: reportData.latitude || 0,
                        longitude: reportData.longitude || 0,
                        location_detail: reportData.location_detail || ''
                    });
                } catch (error: any) {
                    console.error('Error loading report data:', error);
                    alert('ไม่สามารถโหลดข้อมูลรายงานได้: ' + error.message);
                    navigate('/Table'); // กลับไปหน้าตาราง
                } finally {
                    setSubmitting(false);
                }
            } else if (editData) {
                // ใช้ข้อมูลที่ส่งมาผ่าน state
                setFormData({
                    title: editData.title || '',
                    description: editData.description || '',
                    problem_type_id: editData.problem_type_id?.toString() || '',
                    latitude: editData.latitude || 0,
                    longitude: editData.longitude || 0,
                    location_detail: editData.location_detail || ''
                });
            }
        };

        loadReportData();
    }, [isEditMode, reportId, editData, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'problem_type_id' ? parseInt(value) : value
        }));
    };

    const handleLocationChange = (field: 'latitude' | 'longitude', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedImages(e.target.files);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            alert('กรุณาเข้าสู่ระบบก่อนส่งรายงาน');
            return;
        }

        if (!formData.title.trim() || !formData.description.trim() || !formData.problem_type_id) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        // Debug: log selectedImages ก่อน submit
        console.log('selectedImages:', selectedImages);
        try {
            setSubmitting(true);
            clearError();

            if (isEditMode && reportId) {
                // โหมดแก้ไข
                const updateData: UpdateReportData = {
                    title: formData.title,
                    description: formData.description,
                    problem_type_id: parseInt(formData.problem_type_id),
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    location_detail: formData.location_detail || undefined
                };

                await updateReport(parseInt(reportId), updateData);
                alert('อัปเดตรายงานสำเร็จ!');
                navigate('/Table'); // กลับไปหน้าตาราง
            } else {
                // โหมดสร้างใหม่
                const reportData: CreateReportData = {
                    user_id: user.user_id,
                    problem_type_id: parseInt(formData.problem_type_id),
                    title: formData.title,
                    description: formData.description,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    location_detail: formData.location_detail || undefined
                };

                await submitReport(reportData, selectedImages || undefined);
                
                // รีเซ็ตฟอร์ม
                setFormData({
                    title: '',
                    description: '',
                    problem_type_id: '',
                    latitude: initialLocation?.latitude || 0,
                    longitude: initialLocation?.longitude || 0,
                    location_detail: ''
                });
                setSelectedImages(null);

                alert('ส่งรายงานสำเร็จ!');
                
                // เรียก onSuccess callback ก่อน (ถ้ามี)
                onSuccess?.();
                
                // นำทางไปหน้า report
                setTimeout(() => {
                    navigate('/report');
                }, 500); // หน่วงเวลาเล็กน้อยให้ alert แสดงก่อน
            }
        } catch (err) {
            console.error('Error submitting report:', err);
            alert('เกิดข้อผิดพลาดในการส่งรายงาน กรุณาลองใหม่อีกครั้ง');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h2 className={styles.title}>
                    {isEditMode ? 'แก้ไขรายงานปัญหาสาธารณะ' : 'รายงานปัญหาสาธารณะ'}
                </h2>
                
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <div className={styles.formGroup}>
                    <label htmlFor="title" className={styles.label}>
                        หัวข้อรายงาน *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="เช่น ถนนเป็นหลุมบ่อ น้ำท่วมขัง ต้นไม้ล้ม"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="problem_type_id" className={styles.label}>
                        ประเภทปัญหา *
                    </label>
                    <select
                        id="problem_type_id"
                        name="problem_type_id"
                        value={formData.problem_type_id}
                        onChange={handleInputChange}
                        className={styles.select}
                        required
                    >
                        <option value="">-- เลือกประเภทปัญหา --</option>
                        {problemTypes.map(type => (
                            <option key={type.problem_type_id} value={type.problem_type_id}>
                                {type.type_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.label}>
                        รายละเอียดปัญหา *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        placeholder="อธิบายปัญหาอย่างละเอียด..."
                        rows={4}
                        required
                    />
                </div>

                <div className={styles.locationGroup}>
                    <div className={styles.formGroup}>
                        <label htmlFor="latitude" className={styles.label}>
                            ละติจูด (Latitude)
                        </label>
                        <input
                            type="number"
                            id="latitude"
                            name="latitude"
                            value={formData.latitude}
                            onChange={(e) => handleLocationChange('latitude', e.target.value)}
                            className={styles.input}
                            step="any"
                            placeholder="13.7563"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="longitude" className={styles.label}>
                            ลองจิจูด (Longitude)
                        </label>
                        <input
                            type="number"
                            id="longitude"
                            name="longitude"
                            value={formData.longitude}
                            onChange={(e) => handleLocationChange('longitude', e.target.value)}
                            className={styles.input}
                            step="any"
                            placeholder="100.5018"
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="location_detail" className={styles.label}>
                        รายละเอียดสถานที่
                    </label>
                    <input
                        type="text"
                        id="location_detail"
                        name="location_detail"
                        value={formData.location_detail}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="เช่น หน้าโรงเรียน, ริมถนนสุขุมวิท"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="images" className={styles.label}>
                        รูปภาพประกอบ
                    </label>
                    <input
                        type="file"
                        id="images"
                        name="images"
                        onChange={handleImageChange}
                        className={styles.fileInput}
                        multiple
                        accept="image/*"
                    />
                    <p className={styles.fileHelp}>
                        สามารถเลือกได้หลายไฟล์ (jpg, png, gif เท่านั้น)
                    </p>
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        type="button"
                        onClick={onCancel}
                        className={styles.cancelButton}
                        disabled={submitting || loading}
                        
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={submitting || loading}
                    >
                        {submitting 
                            ? (isEditMode ? 'กำลังบันทึก...' : 'กำลังส่ง...') 
                            : (isEditMode ? 'บันทึกการแก้ไข' : 'ส่งรายงาน')
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportForm;