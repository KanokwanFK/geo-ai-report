import React, { useState } from 'react';
import styles from './styles/Problem.module.css';
import { useReportStatus } from '../hooks/useReportStatus';
import { exportReportsToCSV, downloadCSV } from '../utils/problemUtils';
import Modal from './Modal';

const Problem: React.FC = () => {
    // ใช้ custom hook สำหรับจัดการข้อมูล
    const {
        // Data
        filteredReports,
        selectedReport,

        // UI State
        loading,
        updateLoading,

        // Actions
        updateStatus,
        selectReport,
        clearSelectedReport,
        setFilters,
        refreshData
    } = useReportStatus();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusComment, setStatusComment] = useState('');
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ reportId: number, status: string } | null>(null);
    
    // Filter state
    const [problemFilter, setProblemFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchText, setSearchText] = useState('');
    const [problemTypes, setProblemTypes] = useState<any[]>([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // ฟังก์ชันเปิด Modal แสดงรายละเอียด
    const handleViewReport = async (reportId: number) => {
        await selectReport(reportId);
        setIsModalOpen(true);
    };

    // ฟังก์ชันเปิด Modal สำหรับใส่หมายเหตุ
    const handleUpdateStatusWithComment = (reportId: number, newStatus: string) => {
        setPendingStatusUpdate({ reportId, status: newStatus });
        setStatusComment('');
        setShowCommentModal(true);
    };

    // ฟังก์ชันยืนยันการอัปเดตสถานะพร้อมหมายเหตุ
    const confirmStatusUpdate = async () => {
        if (!pendingStatusUpdate) {
            console.error('No pending status update found');
            return;
        }

        const { reportId, status } = pendingStatusUpdate;

        console.log('=== Starting status update ===');
        console.log('Updating status:', { reportId, status, comment: statusComment });
        console.log('updateStatus function:', typeof updateStatus);

        try {
            // เรียก API อัปเดตสถานะพร้อมหมายเหตุผ่าน updateStatus จาก hook
            console.log('Calling updateStatus...');
            const success = await updateStatus(reportId, status, statusComment);

            console.log('Update result:', success);
            console.log('Type of success:', typeof success);

            console.log('Checking success result:', success);
            console.log('Success type:', typeof success);
            console.log('Success value:', JSON.stringify(success));
            
            // ตรวจสอบว่าไม่ใช่ false (อาจเป็น true หรือ object response)
            const isSuccess = success !== false && success !== null && success !== undefined;
                              
            console.log('Is success:', isSuccess);
            
            if (isSuccess) {
                console.log('Status update was successful, refreshing data...');
                
                // รีเฟรชข้อมูลเพื่อให้แน่ใจว่าได้ข้อมูลล่าสุด
                try {
                    await refreshData();
                    console.log('Data refresh completed');
                } catch (refreshError) {
                    console.error('Error refreshing data:', refreshError);
                }

                // ปิด modal และล้างข้อมูล
                setShowCommentModal(false);
                setPendingStatusUpdate(null);
                setStatusComment('');

                // ปิด detail modal ถ้าเปิดอยู่
                if (isModalOpen) {
                    setIsModalOpen(false);
                    clearSelectedReport();
                }

                console.log('Status update completed successfully');
                alert('อัปเดตสถานะสำเร็จ!');
            } else {
                console.error('Status update failed - success was:', success);
                console.error('Success is falsy, showing detailed info:');
                console.error('- typeof success:', typeof success);
                console.error('- success === false:', success === false);
                console.error('- success === null:', success === null);
                console.error('- success === undefined:', success === undefined);
                console.error('- JSON.stringify(success):', JSON.stringify(success));
                alert('ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่\n\nDebug: success = ' + JSON.stringify(success));
            }
        } catch (error) {
            console.error('Error in confirmStatusUpdate:', error);
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error && typeof error === 'object') {
                errorMessage = (error as any).message || JSON.stringify(error);
            }
            alert('เกิดข้อผิดพลาด: ' + errorMessage);
        }
    };



    // Auto-load data เมื่อ component mount

    React.useEffect(() => {
        refreshData();
        
        // โหลดข้อมูล problem types
        const fetchProblemTypes = async () => {
            try {
                const response = await fetch('http://localhost:3003/api/problem-types');
                const data = await response.json();
                console.log('Problem types loaded:', data);
                setProblemTypes(data);
            } catch (error) {
                console.error('Error fetching problem types:', error);
            }
        };
        fetchProblemTypes();
    }, [refreshData]);

    // ฟังก์ชันจัดการฟิลเตอร์
    const handleFilterChange = (key: string, value: string) => {
        setFilters({
            status: key === 'status' ? value : '',
            problemType: key === 'problemType' ? value : '',
            dateRange: key === 'dateRange' ? value : '',
            searchText: key === 'searchText' ? value : ''
        });
    };

    // ฟังก์ชัน export ข้อมูลเป็น CSV
    const handleExportCSV = () => {
        const csvContent = exportReportsToCSV(additionalFilteredReports);
        const filename = `reports_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csvContent, filename);
    };

    // ฟังก์ชันกำหนดสีสถานะ
    const getStatusColor = (status: string) => {
        const statusColors: { [key: string]: string } = {
            'รอตรวจสอบ': '#E91E63',      // ชมพู
            'กำลังตรวจสอบ': '#FF9800',    // ส้ม  
            'รอดำเนินการ': '#FFEB3B',     // เหลือง
            'กำลังดำเนินการ': '#00BCD4',   // ฟ้า
            'เสร็จสิ้น': '#4CAF50',       // เขียว
            'ปฏิเสธ': '#F44336'          // แดง
        };
        return statusColors[status] || '#6c757d';
    };

    // ฟิลเตอร์รายงานโดยรวม (สถานะ + ประเภทปัญหา + ข้อความค้นหา)
    const additionalFilteredReports = React.useMemo(() => {
        let filtered = filteredReports; // เริ่มจากข้อมูลที่ถูกฟิลเตอร์จาก hook แล้ว
        
        console.log('Filtering reports:', {
            totalReports: filteredReports.length,
            problemFilter,
            statusFilter,
            searchText,
            sampleReport: filteredReports[0],
            sampleReportKeys: filteredReports[0] ? Object.keys(filteredReports[0]) : []
        });
        
        // ฟิลเตอร์ตามข้อความค้นหา (ถ้ามี)
        if (searchText && searchText.trim() !== '') {
            filtered = filtered.filter((report: any) =>
                report.title?.toLowerCase().includes(searchText.toLowerCase()) ||
                report.description?.toLowerCase().includes(searchText.toLowerCase()) ||
                report.reporter_name?.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        
        // ฟิลเตอร์ตามสถานะ
        if (statusFilter && statusFilter !== '') {
            filtered = filtered.filter((report: any) => report.status === statusFilter);
        }
        
        // ฟิลเตอร์ตามประเภทปัญหา
        if (problemFilter && problemFilter !== '') {
            console.log('PROBLEM TYPE FILTER DEBUG');
            console.log('Selected problem filter:', problemFilter);
            console.log('Total reports before filter:', filtered.length);
            
            // แสดงข้อมูลทั้งหมดของรายงานแรก
            if (filtered.length > 0) {
                console.log('Sample report structure:', filtered[0]);
            }
            
            // แสดง problem_type ของทุกรายงาน (ใช้ problem_type แทน problem_type_name)
            const problemTypes = filtered.map((r: any) => r.problem_type);
            console.log('All problem_type values:', problemTypes);
            console.log('Unique problem types:', [...new Set(problemTypes)]);
            
            // เปลี่ยนจาก problem_type_name เป็น problem_type
            filtered = filtered.filter((report: any) => {
                const matches = report.problem_type === problemFilter;
                if (!matches) {
                    console.log(`Report ${report.report_id}: "${report.problem_type}" !== "${problemFilter}"`);
                }
                return matches;
            });
            
            console.log('Reports after filter:', filtered.length);
        }
        
        return filtered;
    }, [filteredReports, searchText, statusFilter, problemFilter]);

    // ฟังก์ชันเรียงลำดับรายงาน - เรียง ID จากน้อยไปมาก
    const sortedReports = React.useMemo(() => {
        return [...additionalFilteredReports].sort((a, b) => a.report_id - b.report_id);
    }, [additionalFilteredReports]);

    // Pagination calculations
    const totalPages = Math.ceil(sortedReports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentReports = sortedReports.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [problemFilter, statusFilter, searchText]);

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1);
    };

    return (
        <div className={styles.problemContainer}>
            <div className={styles.header}>
                <h1>จัดการปัญหารายงาน</h1>
                <div className={styles.summary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>รายงานทั้งหมด</span>
                        <span className={styles.summaryValue}>{loading ? '...' : filteredReports.length}</span>
                    </div>
                </div>
            </div>

            {/* ฟิลเตอร์ */}
            <div className={styles.filterSection}>
                <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                        <label>ค้นหา:</label>
                        <input
                            type="text"
                            placeholder="ค้นหาจากชื่อหรือรายละเอียด..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label>สถานะ:</label>
                        <select
                            className={styles.filterSelect}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">สถานะทั้งหมด</option>
                            <option value="รอตรวจสอบ">รอตรวจสอบ</option>
                            <option value="กำลังตรวจสอบ">กำลังตรวจสอบ</option>
                            <option value="รอดำเนินการ">รอดำเนินการ</option>
                            <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                            <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                            <option value="ปฏิเสธ">ปฏิเสธ</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>ประเภทปัญหา:</label>
                        <select
                            className={styles.filterSelect}
                            value={problemFilter}
                            onChange={(e) => {
                                console.log('Problem filter changed to:', e.target.value);
                                setProblemFilter(e.target.value);
                            }}
                        >
                            <option key="all" value="">ประเภททั้งหมด</option>
                            {problemTypes.map(type => (
                                <option key={type.problem_type_id} value={type.type_name}>
                                    {type.type_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>ช่วงเวลา:</label>
                        <select
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option key="all" value="">ทุกช่วงเวลา</option>
                            <option key="today" value="today">วันนี้</option>
                            <option key="week" value="week">สัปดาห์นี้</option>
                            <option key="month" value="month">เดือนนี้</option>
                        </select>
                    </div>
                    <button onClick={refreshData} className={styles.refreshButton} disabled={loading}>
                        {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                    </button>
                    <button onClick={handleExportCSV} className={styles.exportButton} disabled={additionalFilteredReports.length === 0}>
                        Export CSV 
                    </button>
                </div>
            </div>

            {/* ตารางรายงาน */}
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loading}>กำลังโหลดข้อมูล...</div>
                ) : sortedReports.length === 0 ? (
                    <div className={styles.noData}>ไม่พบรายงานที่ตรงกับเงื่อนไข</div>
                ) : (
                    <>
                        <table className={styles.reportTable}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'center' }}>ID</th>
                                    <th style={{ textAlign: 'center' }}>ประเภทปัญหา</th>
                                    <th style={{ textAlign: 'center' }}>ผู้รายงาน</th>
                                    <th style={{ textAlign: 'center' }}>สถานะ</th>
                                    <th style={{ textAlign: 'center' }}>วันที่สร้าง</th>
                                    <th style={{ textAlign: 'center' }}>วันที่อัปเดต</th>
                                    <th style={{ textAlign: 'center' }}>การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentReports.map(report => {
                                const statusColor = getStatusColor(report.status);
                                return (
                                    <tr key={report.report_id}>
                                        <td>{report.report_id}</td>
                                        <td className={styles.titleCell}>
                                            <div className={styles.titleText}>{report.title}</div>
                                            <div className={styles.descriptionPreview}>
                                                {report.description.substring(0, 50)}...
                                            </div>
                                        </td>
                                        <td className={styles.reporterCell}>
                                            <div className={styles.reporterName}>
                                                {report.user_name || `${report.first_name || ''} ${report.last_name || ''}`.trim() || 'ไม่ระบุ'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.statusCell}>
                                                <span
                                                    className={styles.statusBadge}
                                                    style={{ 
                                                        background: `linear-gradient(135deg, ${statusColor}90, ${statusColor}60)`,
                                                        backdropFilter: 'blur(10px)',
                                                        WebkitBackdropFilter: 'blur(10px)',
                                                        color: '#ffffff',
                                                        fontWeight: '600',
                                                        border: `1px solid ${statusColor}30`,
                                                        borderRadius: '5px',
                                                        padding: '10px 12px',
                                                        fontSize: '11px',
                                                        display: 'inline-block',
                                                        position: 'relative',
                                                        boxShadow: `0 8px 32px ${statusColor}20, inset 0 1px 2px rgba(255,255,255,0.2)`,
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    {report.status}
                                                </span>
                                                {/* <div className={styles.statusOptions}>
                                                    {getAvailableStatusesForCurrent(report.status).length > 0 && (
                                                        <small className={styles.optionsCount}>
                                                            {getAvailableStatusesForCurrent(report.status).length} ตัวเลือก
                                                        </small>
                                                    )}
                                                </div> */}
                                            </div>
                                        </td>
                                        <td>{new Date(report.created_at).toLocaleDateString('th-TH')}</td>
                                        <td>{new Date(report.updated_at).toLocaleDateString('th-TH')}</td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    onClick={() => handleViewReport(report.report_id)}
                                                    className={styles.viewButton}
                                                    disabled={loading}
                                                >
                                                    ดูรายละเอียด
                                                </button>
                                                <select
                                                    className={styles.statusSelect}
                                                    onChange={(e) => {
                                                        if (e.target.value && e.target.value !== report.status) {
                                                            handleUpdateStatusWithComment(report.report_id, e.target.value);
                                                            e.target.value = ''; // รีเซ็ต select
                                                        }
                                                    }}
                                                    disabled={updateLoading || loading}
                                                >
                                                    <option key="empty" value="">เปลี่ยนสถานะ</option>
                                                    <option key="รอตรวจสอบ" value="รอตรวจสอบ">รอตรวจสอบ</option>
                                                    <option key="กำลังตรวจสอบ" value="กำลังตรวจสอบ">กำลังตรวจสอบ</option>
                                                    <option key="รอดำเนินการ" value="รอดำเนินการ">รอดำเนินการ</option>
                                                    <option key="กำลังดำเนินการ" value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                                                    <option key="เสร็จสิ้น" value="เสร็จสิ้น">เสร็จสิ้น</option>
                                                    <option key="ปฏิเสธ" value="ปฏิเสธ">ปฏิเสธ</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {sortedReports.length > 0 && (
                        <div className={styles.paginationContainer}>
                            <div className={styles.paginationInfo}>
                                แสดง {startIndex + 1} - {Math.min(endIndex, sortedReports.length)} จาก {sortedReports.length} รายการ
                            </div>
                            
                            <div className={styles.paginationControls}>
                                <button
                                    className={styles.paginationButton}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>
                                
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                
                                <button
                                    className={styles.paginationButton}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                            </div>

                            <div className={styles.itemsPerPageSelector}>
                                <select 
                                    value={itemsPerPage} 
                                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    className={styles.itemsPerPageSelect}
                                >
                                    <option value={5}>5 / page</option>
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>

            {/* Modal แสดงรายละเอียด */}
            {isModalOpen && selectedReport && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        clearSelectedReport();
                    }}
                    title={`รายละเอียดรายงาน `}
                >
                    <div className={styles.reportDetails}>
                        <div className={styles.detailSection}>
                            <div className={styles.detailRow}>
                                <strong>หัวข้อ:</strong> {selectedReport.title}
                            </div>
                            <div className={styles.detailRow}>
                                <strong>รายละเอียด:</strong> {selectedReport.description}
                            </div>
                            <div className={styles.detailRow}>
                                <strong>ผู้รายงาน:</strong>
                                <div className={styles.reporterInfo}>
                                    <div>{selectedReport.user_name || `${selectedReport.first_name || ''} ${selectedReport.last_name || ''}`.trim() || 'ไม่ระบุ'}</div>
                                    <div className={styles.reporterEmail}></div>
                                </div>
                            </div>
                            <div className={styles.detailRow}>
                                <strong>สถานะปัจจุบัน:</strong>
                                <span
                                    className={styles.statusBadge}
                                    style={{ 
                                        background: `linear-gradient(135deg, ${getStatusColor(selectedReport.status)}85, ${getStatusColor(selectedReport.status)}65)`,
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        color: '#ffffff',
                                        fontWeight: '600',
                                        border: `1px solid ${getStatusColor(selectedReport.status)}30`,
                                        borderRadius: '5px',
                                        padding: '10px 10px',
                                        fontSize: '12px',
                                        display: 'inline-block',
                                        marginLeft: '8px',
                                        boxShadow: `0 6px 24px ${getStatusColor(selectedReport.status)}25, inset 0 1px 2px rgba(255,255,255,0.2)`,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {selectedReport.status}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <strong>ละติจูด:</strong> {selectedReport.latitude}
                            </div>
                            <div className={styles.detailRow}>
                                <strong>ลองจิจูด:</strong> {selectedReport.longitude}
                            </div>
                            <div className={styles.detailRow}>
                                <strong>รายละเอียดสถานที่:</strong> {selectedReport.location_detail || 'ไม่ระบุ'}
                            </div>
                            <div className={styles.detailRow}>
                                <strong>วันที่สร้าง:</strong> {new Date(selectedReport.created_at).toLocaleString('th-TH')}
                            </div>
                            <div className={styles.detailRow}>
                                <strong>วันที่อัปเดตล่าสุด:</strong> {new Date(selectedReport.updated_at).toLocaleString('th-TH')}
                            </div>
                        </div>

                    </div>
                </Modal>
            )}

            {/* Modal สำหรับใส่หมายเหตุเมื่อเปลี่ยนสถานะ */}
            {showCommentModal && pendingStatusUpdate && (
                <Modal
                    isOpen={showCommentModal}
                    onClose={() => {
                        setShowCommentModal(false);
                        setPendingStatusUpdate(null);
                        setStatusComment('');
                    }}
                    title={`เปลี่ยนสถานะเป็น "${pendingStatusUpdate.status}"`}
                >
                    <div className={styles.commentModal}>
                        <div className={styles.commentSection}>
                            <p><strong>รายงาน ID:</strong> {pendingStatusUpdate.reportId}</p>
                            <p><strong>สถานะใหม่:</strong>
                                <span
                                    className={styles.statusBadge}
                                    style={{ 
                                        background: `linear-gradient(135deg, ${getStatusColor(pendingStatusUpdate.status)}85, ${getStatusColor(pendingStatusUpdate.status)}65)`,
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        color: '#ffffff',
                                        fontWeight: '600',
                                        border: `1px solid ${getStatusColor(pendingStatusUpdate.status)}30`,
                                        borderRadius: '5px',
                                        padding: '10px 10px',
                                        fontSize: '12px',
                                        display: 'inline-block',
                                        marginLeft: '8px',
                                        boxShadow: `0 6px 24px ${getStatusColor(pendingStatusUpdate.status)}25, inset 0 1px 2px rgba(255,255,255,0.2)`,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {pendingStatusUpdate.status}
                                </span>
                            </p>

                            <div className={styles.commentInput}>
                                <label><strong>หมายเหตุ (ไม่บังคับ):</strong></label>
                                <textarea
                                    value={statusComment}
                                    onChange={(e) => setStatusComment(e.target.value)}
                                    placeholder="ระบุเหตุผลหรือรายละเอียดเพิ่มเติมในการเปลี่ยนสถานะ..."
                                    rows={4}
                                    className={styles.commentTextarea}
                                />
                            </div>

                            <div className={styles.commentActions}>
                                <button
                                    onClick={() => {
                                        setShowCommentModal(false);
                                        setPendingStatusUpdate(null);
                                        setStatusComment('');
                                    }}
                                    className={styles.cancelButton}
                                    disabled={updateLoading}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={confirmStatusUpdate}
                                    className={styles.confirmButton}
                                    disabled={updateLoading}
                                >
                                    {updateLoading ? 'กำลังอัปเดต...' : 'ยืนยันการเปลี่ยนสถานะ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Problem;
