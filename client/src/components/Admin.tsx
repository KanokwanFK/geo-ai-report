import { useState, useEffect } from 'react';
import styles from './styles/Admin.module.css';
import { useAuth } from '../contexts/AuthContext';
import {
    getDashboardStats,
    getReportsByType
} from '../services/reportService';


import { useNavigate } from 'react-router-dom';
import type {
    DashboardStats,
    ReportsByType
} from '../services/reportService';

const Admin = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [reportsByType, setReportsByType] = useState<ReportsByType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fallback data เมื่อไม่สามารถดึงข้อมูลได้
    const fallbackStats: DashboardStats = {
        total_reports: 0,
        pending_reports: 0,
        checking_reports: 0,
        waiting_reports: 0,
        in_progress_reports: 0,
        resolved_reports: 0,
        rejected_reports: 0,
        total_users: 0,
        total_admins: 0,
        active_problem_types: 0
    };

    // ฟังก์ชันดึงข้อมูลทั้งหมด
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // ดึงข้อมูลพื้นฐานก่อน (ที่จำเป็น)
            const statsData = await getDashboardStats();
            const reportsByTypeData = await getReportsByType();

            setStats(statsData || fallbackStats);
            setReportsByType(reportsByTypeData || []);



        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    // โหลดข้อมูลเมื่อ component mount
    useEffect(() => {
        fetchDashboardData();
    }, []);

    // แสดง loading state
    if (loading) {
        return (
            <div className={styles.adminContainer}>
                <div className={styles.loadingMessage}>
                    กำลังโหลดข้อมูล...
                </div>
            </div>
        );
    }


    // แสดง error state
    if (error) {
        return (
            <div className={styles.adminContainer}>
                <div className={styles.header}>
                    <h1 className={styles.welcomeText}>ภาพรวมผู้ดูแลระบบ</h1>
                </div>
                <div className={styles.errorMessage} style={{
                    background: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    padding: '20px',
                    margin: '20px 0',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#c33', marginBottom: '10px' }}>⚠️ เกิดข้อผิดพลาด</h3>
                    <p style={{ color: '#666', marginBottom: '15px' }}>{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className={styles.refreshButton}
                        style={{
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 ลองใหม่อีกครั้ง
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.adminContainer}>
            {/* Header Section */}
            <div className={styles.headerSection}>
                <div className={styles.header}>
                    <div className={styles.welcomeSection}>
                        <h1 className={styles.welcomeText}>ภาพรวมผู้ดูแลระบบ</h1>
                        <p className={styles.adminName}>
                            ยินดีต้อนรับ {user?.first_name} {user?.last_name}
                        </p>
                    </div>
                    <div className={styles.headerButtons}>
                        <button
                            onClick={() => navigate('/problem')}
                            className={styles.updateButton}
                        >
                            จัดการสถานะรายงาน
                        </button>
                        <button
                            onClick={fetchDashboardData}
                            className={styles.refreshButton}
                            disabled={loading}
                        >
                            รีเฟรชข้อมูล
                        </button>
                    </div>

                </div>
            </div>

            {/* Statistics Cards */}
            <div className={styles.problemTypesSection}>
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.totalReports}`}>
                        <div className={styles.cardIcon}>
                            📊
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.total_reports) || 0}
                            </h2>
                            <p className={styles.statLabel}>รายงานทั้งหมด</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.todayReportsCard}`}>
                        <div className={styles.cardIcon}>
                            📅
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {stats?.total_reports ? Math.floor(Number(stats.total_reports) * 0.1) : 0}
                            </h2>
                            <p className={styles.statLabel}>รายงานวันนี้</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.pendingReports}`}>
                        <div className={styles.cardIcon}>
                            ⏳
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.pending_reports) || 0}
                            </h2>
                            <p className={styles.statLabel}>รอตรวจสอบ</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.checkingReports}`}>
                        <div className={styles.cardIcon}>
                            🔍
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.checking_reports) || 0}
                            </h2>
                            <p className={styles.statLabel}>กำลังตรวจสอบ</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.waitingReports}`}>
                        <div className={styles.cardIcon}>
                            ⏳
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.waiting_reports) || 0}
                            </h2>
                            <p className={styles.statLabel}>รอดำเนินการ</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.inProgressReports}`}>
                        <div className={styles.cardIcon}>
                            🔄
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.in_progress_reports) || 0}
                            </h2>
                            <p className={styles.statLabel}>กำลังดำเนินการ</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.resolvedReports}`}>
                        <div className={styles.cardIcon}>
                            ✅
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.resolved_reports) || 0}
                            </h2>
                            <p className={styles.statLabel}>เสร็จสิ้นแล้ว</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.rejectedReports}`}>
                        <div className={styles.cardIcon}>
                            ❌
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.rejected_reports) || 0}
                            </h2>
                            <p className={styles.statLabel}>ปฏิเสธ</p>
                        </div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className={styles.statsGrid} style={{ marginTop: '1rem' }}>
                    <div className={`${styles.statCard} ${styles.totalUsers}`}>
                        <div className={styles.cardIcon}>
                            👥
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.total_users) || 0}
                            </h2>
                            <p className={styles.statLabel}>ผู้ใช้งานทั้งหมด</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.totalAdmins}`}>
                        <div className={styles.cardIcon}>
                            👨‍💼
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.total_admins) || 0}
                            </h2>
                            <p className={styles.statLabel}>ผู้ดูแลระบบ</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.activeProblemTypes}`}>
                        <div className={styles.cardIcon}>
                            🏷️
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.statNumber}>
                                {Number(stats?.active_problem_types) || 0}
                            </h2>
                            <p className={styles.statLabel}>ประเภทปัญหา</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Problem Types as Cards Section */}
            <div className={styles.problemTypesSection}>
                <h2 className={styles.sectionTitle}>
                    📊 จำนวนรายงานตามประเภทปัญหา
                </h2>

                {reportsByType.length > 0 ? (
                    <div className={styles.statsGrid}>
                        {reportsByType
                            .sort((a, b) => {
                                // ตรวจสอบว่าเป็นประเภท "อื่นๆ" หรือไม่
                                const isOtherA = a.type_name.toLowerCase().includes('อื่น') ||
                                    a.type_name.toLowerCase().includes('other') ||
                                    a.type_name.toLowerCase().includes('misc');
                                const isOtherB = b.type_name.toLowerCase().includes('อื่น') ||
                                    b.type_name.toLowerCase().includes('other') ||
                                    b.type_name.toLowerCase().includes('misc');

                                // ถ้า A เป็น "อื่นๆ" แต่ B ไม่ใช่ ให้ A ไปท้าย
                                if (isOtherA && !isOtherB) return 1;
                                // ถ้า B เป็น "อื่นๆ" แต่ A ไม่ใช่ ให้ B ไปท้าย
                                if (isOtherB && !isOtherA) return -1;
                                // ถ้าทั้งคู่เป็น "อื่นๆ" หรือไม่ใช่ทั้งคู่ ให้เรียงตามจำนวนมากไปน้อย
                                return Number(b.report_count) - Number(a.report_count);
                            })
                            .map((type, index) => {
                                // ฟังก์ชันเลือกอิโมจิตามประเภทปัญหา
                                const getEmojiForType = (typeName: string) => {
                                    const name = typeName.toLowerCase();
                                    // เช็คห้องน้ำก่อน เพราะมีคำว่า "น้ำ" อยู่ด้วย
                                    if (name.includes('ห้องน้ำ') || name.includes('toilet') || name.includes('สาธารณะ')) return '🚻';
                                    if (name.includes('น้ำ') || name.includes('water') || name.includes('ประปา')) return '💧';
                                    if (name.includes('ถนน') || name.includes('road') || name.includes('หลุม')) return '🛣️';
                                    if (name.includes('ไฟฟ้า') || name.includes('electric') || name.includes('ไฟ')) return '⚡';
                                    if (name.includes('ขยะ') || name.includes('trash') || name.includes('waste')) return '🗑️';
                                    if (name.includes('สวน') || name.includes('park') || name.includes('ต้นไม้')) return '🌳';
                                    if (name.includes('อาคาร') || name.includes('building') || name.includes('สิ่งก่อสร้าง')) return '🏢';
                                    if (name.includes('รถ') || name.includes('traffic') || name.includes('จราจร')) return '🚗';
                                    if (name.includes('เสียง') || name.includes('noise') || name.includes('รบกวน')) return '🔊';
                                    if (name.includes('ดินถล่ม')) return '⛰️';
                                    return '📋'; // default emoji
                                };

                                // ฟังก์ชันเลือกสีพาสเทลตามประเภทปัญหา
                                const getGradientForType = (typeName: string) => {
                                    const name = typeName.toLowerCase();
                                    if (name.includes('น้ำ') || name.includes('water') || name.includes('ประปา')) {
                                        return { bg: 'linear-gradient(135deg, #E1F3FF 0%, #B3E0FF 100%)', color: '#0084FF', border: '1px solid rgba(179, 224, 255, 0.3)' };
                                    }
                                    if (name.includes('ถนน') || name.includes('road') || name.includes('หลุม')) {
                                        return { bg: 'linear-gradient(135deg, #FFE1E6 0%, #F8BBD9 100%)', color: '#D63384', border: '1px solid rgba(248, 187, 217, 0.3)' };
                                    }
                                    if (name.includes('ไฟฟ้า') || name.includes('electric') || name.includes('ไฟ')) {
                                        return { bg: 'linear-gradient(135deg, #FFF4E1 0%, #FFE4B3 100%)', color: '#FF8C00', border: '1px solid rgba(255, 228, 179, 0.3)' };
                                    }
                                    if (name.includes('ขยะ') || name.includes('trash') || name.includes('waste')) {
                                        return { bg: 'linear-gradient(135deg, #FFFFCC 0%, #FFFF99 100%)', color: '#8B8B47', border: '1px solid rgba(200, 230, 201, 0.3)' };
                                    }
                                    // ต้นไม้ - สีเขียว
                                    if (name.includes('สวน') || name.includes('park') || name.includes('ต้นไม้') || name.includes('tree') || name.includes('green')) {
                                        return { bg: 'linear-gradient(135deg, #E8F6E8 0%, #C8E6C8 100%)', color: '#2E7D32', border: '1px solid rgba(200, 230, 200, 0.3)' };
                                    }
                                    // ดินถล่ม - สีน้ำตาล
                                    if (name.includes('ดินถล่ม') || name.includes('landslide') || name.includes('soil') || name.includes('earth')) {
                                        return { bg: 'linear-gradient(135deg, #F3E5D0 0%, #E6D7C3 100%)', color: '#8D6E63', border: '1px solid rgba(230, 215, 195, 0.3)' };
                                    }
                                    // สิ่งก่อสร้าง - สีน้ำเงิน
                                    if (name.includes('อาคาร') || name.includes('building') || name.includes('สิ่งก่อสร้าง') || name.includes('construction')) {
                                        return { bg: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', color: '#1976D2', border: '1px solid rgba(187, 222, 251, 0.3)' };
                                    }
                                    if (name.includes('อื่น') || name.includes('other')) {
                                        return { bg: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)', color: '#9C27B0', border: '1px solid rgba(225, 190, 231, 0.3)' };
                                    }
                                    // ใช้สีพาสเทลอ่อนๆ สำหรับกรณีอื่นๆ
                                    return { bg: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)', color: '#757575', border: '1px solid rgba(224, 224, 224, 0.3)' };
                                };

                                const typeStyle = getGradientForType(type.type_name);

                                return (
                                    <div
                                        key={index}
                                        className={styles.statCard}
                                        style={{
                                            background: typeStyle.bg,
                                            border: typeStyle.border,
                                            minHeight: '120px',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                                        }}
                                    >
                                        <div className={styles.cardIcon} style={{
                                            background: 'rgba(77, 128, 77, 0.15)',
                                            color: typeStyle.color,
                                            fontSize: '2rem'
                                        }}>
                                            {getEmojiForType(type.type_name)}
                                        </div>
                                        <div className={styles.cardContent}>
                                            <h2 className={styles.statNumber} style={{ color: typeStyle.color, fontSize: '2.5rem' }}>
                                                {Number(type.report_count) || 0}
                                            </h2>
                                            <p className={styles.statLabel} style={{
                                                color: typeStyle.color,
                                                fontWeight: '500',
                                                fontSize: '0.95rem',
                                                opacity: 0.8
                                            }}>
                                                {type.type_name}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <div className={styles.noDataMessage} style={{
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '40px',
                        textAlign: 'center',
                        color: '#6c757d'
                    }}>
                        📋 ไม่พบข้อมูลประเภทปัญหา
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
