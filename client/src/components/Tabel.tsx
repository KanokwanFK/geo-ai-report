import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { getProblemTypes, deleteReport, deleteBatchReports } from '../services/reportService';
import { 
    getStatusMapping, 
    getStatusText, 
    getStatusColor,
    type StatusMapping 
} from '../services/statusService';
import type { ProblemType } from '../services/reportService';
import styles from './styles/Table.module.css';

// Interface สำหรับข้อมูลรายงานจาก API (จาก report_detail_view)
interface Report {
    report_id: number;
    user_id: number;
    problem_type_id: number;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    location_detail: string;
    status: string;
    current_step: number;
    step1_completed_at?: string;
    step2_completed_at?: string;
    step3_completed_at?: string;
    step4_completed_at?: string;
    step5_completed_at?: string;
    rejected_at?: string;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    email: string;
    problem_type: string; // type_name from problem_type table
    color_code: string;
    current_step_name: string;
    current_step_description: string;
    current_step_color: string;
    estimated_duration_hours: number;
    progress_percentage: number;
}

// เอาฟังก์ชันนี้ออกแล้วใช้จาก statusService แทน

// ฟังก์ชันจัดรูปแบบวันที่
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.

    return `${day} ${month} ${year}`;
};

const Table = () => {
    // Hooks สำหรับจัดการ state
    const navigate = useNavigate();
    const { reports, loading, error, fetchReports } = useReports();
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [problemFilter, setProblemFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
    const [statusMappings, setStatusMappings] = useState<StatusMapping[]>([]);

    // ดึงข้อมูลเมื่อ component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchReports();
                const [types, mappings] = await Promise.all([
                    getProblemTypes(),
                    getStatusMapping()
                ]);
                setProblemTypes(types);
                setStatusMappings(mappings);
                console.log('Loaded reports:', reports); // Debug
                console.log('Loaded problem types:', types); // Debug
                console.log('Loaded status mappings:', mappings); // Debug
            } catch (err) {
                console.error('Error loading data:', err);
            }
        };
        loadData();
    }, [fetchReports]);

    // Debug: แสดงข้อมูลเมื่อ reports เปลี่ยนแปลง
    useEffect(() => {
        console.log('Reports updated:', reports);
        if (reports.length > 0) {
            console.log('Sample report structure:', reports[0]);
        }
    }, [reports]);

    // กรองและเรียงข้อมูลตาม filter ที่เลือก
    const filteredReports = reports
        .filter((report: Report) => {
            const matchesProblemType = !problemFilter ||
                problemFilter === 'ทั้งหมด' ||
                report.problem_type === problemFilter;

            // แก้ไขการกรองสถานะ - "ทั้งหมด" จะแสดงทุกสถานะ
            const matchesStatus = !statusFilter ||
                statusFilter === 'ทั้งหมด' ||
                getStatusText(report.status, statusMappings) === statusFilter;

            // กรองตามวันที่ - เปรียบเทียบเฉพาะวันที่ (ไม่รวมเวลา)
            const matchesDate = !dateFilter ||
                new Date(report.created_at).toISOString().split('T')[0] === dateFilter;

            return matchesProblemType && matchesStatus && matchesDate;
        })
        .sort((a: Report, b: Report) => a.report_id - b.report_id); // เรียงตาม ID จากน้อยไปมาก    // ฟังก์ชันสำหรับเลือก/ยกเลิกเลือกแถว
    const handleRowSelect = (id: number) => {
        setSelectedRows(prev =>
            prev.includes(id)
                ? prev.filter(rowId => rowId !== id)
                : [...prev, id]
        );
    };

    // ฟังก์ชันสำหรับเลือกทั้งหมด
    const handleSelectAll = () => {
        if (selectedRows.length === filteredReports.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredReports.map((report: Report) => report.report_id));
        }
    };

    // ฟังก์ชันอัปเดตสถานะแบบกลุ่ม
    const handleBatchStatusUpdate = () => {
        navigate('/problem');
    };

    // ฟังก์ชันสำหรับปุ่มการจัดการ
    const handleManagement = () => {
        navigate('/problem');
    };

    // ฟังก์ชัน Export CSV รายการเดียว
    const handleExportCSV = (report: Report) => {
        const csvContent = [
            ['รหัส', 'วันที่', 'ผู้รายงาน', 'ประเภท', 'สถานะ', 'รายละเอียด'],
            [
                report.report_id,
                formatDate(report.created_at),
                `${report.first_name} ${report.last_name}`,
                report.problem_type,
                getStatusText(report.status, statusMappings),
                report.description
            ]
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `report_${report.report_id}.csv`;
        link.click();
    };

    // ฟังก์ชัน Export CSV ข้อมูลทั้งหมด
    const handleExportAllCSV = () => {
        if (filteredReports.length === 0) {
            alert('ไม่มีข้อมูลสำหรับ Export');
            return;
        }

        const csvContent = [
            ['รหัส', 'วันที่', 'ผู้รายงาน', 'ประเภท', 'สถานะ', 'รายละเอียด'],
            ...filteredReports.map((report: Report) => [
                report.report_id,
                formatDate(report.created_at),
                `${report.first_name} ${report.last_name}`,
                report.problem_type,
                getStatusText(report.status, statusMappings),
                report.description
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `all_reports_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // ฟังก์ชันลบรายงานเดี่ยว
    const handleDeleteReport = async (report: Report) => {
        const confirmMessage = `คุณต้องการลบรายงาน "${report.title}" (รหัส: ${report.report_id}) หรือไม่?`;
        
        if (window.confirm(confirmMessage)) {
            try {
                await deleteReport(report.report_id);
                alert('ลบรายงานสำเร็จ');
                await fetchReports(); // รีเฟรชข้อมูล
                
                // ลบรายการที่ถูกเลือกออกจาก selectedRows หากมี
                if (selectedRows.includes(report.report_id)) {
                    setSelectedRows(prev => prev.filter(id => id !== report.report_id));
                }
            } catch (error: any) {
                alert(`เกิดข้อผิดพลาด: ${error.message}`);
                console.error('Error deleting report:', error);
            }
        }
    };

    // ฟังก์ชันลบรายงานแบบกลุ่ม
    const handleBatchDelete = async () => {
        if (selectedRows.length === 0) {
            alert('กรุณาเลือกรายงานที่ต้องการลบ');
            return;
        }

        const confirmMessage = `คุณต้องการลบรายงานที่เลือก ${selectedRows.length} รายการ หรือไม่?`;
        
        if (window.confirm(confirmMessage)) {
            try {
                const result = await deleteBatchReports(selectedRows);
                alert(result.message);
                await fetchReports(); // รีเฟรชข้อมูล
                setSelectedRows([]); // เคลียร์การเลือก
            } catch (error: any) {
                alert(`เกิดข้อผิดพลาด: ${error.message}`);
                console.error('Error batch deleting reports:', error);
            }
        }
    };

    // ฟังก์ชันแก้ไขรายงาน
    const handleEditReport = (report: Report) => {
        // นำทางไปหน้าแก้ไขพร้อมส่ง report_id
        navigate(`/report-form/${report.report_id}`, {
            state: { 
                editMode: true, 
                reportData: report 
            }
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>กำลังโหลดข้อมูล...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>เกิดข้อผิดพลาด: {error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* หัวข้อหลัก */}
            <h1 className={styles.title}>ข้อมูลรายงานทั้งหมด</h1>

            {/* แถบตัวกรองและปุ่ม */}
            <div className={styles.filterSection}>
                <div className={styles.filters}>
                    <select
                        className={styles.filterSelect}
                        value={problemFilter}
                        onChange={(e) => setProblemFilter(e.target.value)}
                    >
                        <option value="">ประเภทปัญหา</option>
                        {problemTypes.map(type => (
                            <option key={type.problem_type_id} value={type.type_name}>
                                {type.type_name}
                            </option>
                        ))}
                        <option value="ทั้งหมด">ทั้งหมด</option>
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">สถานะ</option>
                        <option value="รอดำเนินการ">รอดำเนินการ</option>
                        <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                        <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                        <option value="ทั้งหมด">ทั้งหมด</option>
                    </select>

                    <input
                        type="date"
                        className={styles.filterSelect}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        placeholder="เลือกวันที่"
                    />
                </div>

                <div className={styles.actionButtons}>
                    <button
                        className={styles.updateStatusBtn}
                        onClick={handleBatchStatusUpdate}
                    >
                        เปลี่ยนสถานะพร้อมกัน
                        {selectedRows.length > 0 && ` (${selectedRows.length})`}
                    </button>
                    
                    <button
                        className={styles.deleteBtn}
                        onClick={handleBatchDelete}
                        disabled={selectedRows.length === 0}
                    >
                        Delete
                        {selectedRows.length > 0 && ` (${selectedRows.length})`}
                    </button>
                    
                    <button
                        className={styles.exportAllBtn}
                        onClick={handleExportAllCSV}
                    >
                        Export All 
                    </button>
                </div>
            </div>

            {/* ตาราง */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectedRows.length === filteredReports.length && filteredReports.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th>รหัส</th>
                            <th>วันที่</th>
                            <th>ผู้รายงาน</th>
                            <th>ประเภท</th>
                            <th>สถานะ</th>
                            <th>การจัดการ</th>
                            <th>Export</th>
                            <th>Edit</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan={10} className={styles.noData}>
                                    ไม่พบข้อมูลรายงาน
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((report: Report) => (
                                <tr key={report.report_id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(report.report_id)}
                                            onChange={() => handleRowSelect(report.report_id)}
                                        />
                                    </td>
                                    <td>{report.report_id}</td>
                                    <td>{formatDate(report.created_at)}</td>
                                    <td>
                                        {(report as any).first_name && (report as any).last_name
                                            ? `${(report as any).first_name} ${(report as any).last_name}`
                                            : (report as any).email || 'ไม่ระบุ'
                                        }
                                    </td>
                                    <td>
                                        {(report as any).problem_type || 'ไม่ระบุ'}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[getStatusColor(report.status, statusMappings)]}`}>
                                            {getStatusText(report.status, statusMappings)}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className={styles.manageBtn}
                                            onClick={handleManagement}
                                        >
                                            การจัดการ
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.csvBtn}
                                            onClick={() => handleExportCSV(report)}
                                        >
                                            CSV
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.editBtn}
                                            onClick={() => handleEditReport(report)}
                                        >
                                            แก้ไข
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.deleteIndividualBtn}
                                            onClick={() => handleDeleteReport(report)}
                                        >
                                            ลบ
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;
