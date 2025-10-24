import styles from './styles/Report.module.css';
import { Steps, Card, Row, Col, Spin, Alert, Table, Tag, Empty, Progress } from 'antd';
import { useState, useEffect } from 'react';
import { getDashboardStats, getReportSteps, getUserReports } from '../services/reportService';
// import type { DashboardStats } from '../services/reportService';
import { useAuth } from '../contexts/AuthContext';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface ReportStep {
    step_id: number;
    step_name: string;
    step_number: number;
    step_description: string;
    step_color: string;
    estimated_duration_hours: number;
    is_active: boolean;
}

interface UserReport {
    report_id: number;
    title: string;
    description: string;
    status: string;
    current_step: number;
    calculated_current_step: number;
    created_at: string;
    updated_at: string;
    problem_type: string;
    location_detail: string;
    progress_percentage: number;
    current_step_name: string;
    current_step_color: string;
}

const Report = () => {
    const { user } = useAuth();
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(false);
    // const [reportStats, setReportStats] = useState<DashboardStats | null>(null);
    const [reportSteps, setReportSteps] = useState<ReportStep[]>([]);
    const [userReports, setUserReports] = useState<UserReport[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);

    const onChange = (value: number) => {
        console.log('onChange:', value);
        setCurrent(value);
    };

    // ฟังก์ชันดึงข้อมูลสถิติและขั้นตอน
    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const stats = await getDashboardStats();
            console.log('Dashboard stats:', stats); // ใช้แทน setReportStats
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setError('ไม่สามารถดึงข้อมูลสถิติได้');
        } finally {
            setLoading(false);
        }
    };

    const fetchReportSteps = async () => {
        try {
            const steps = await getReportSteps();
            setReportSteps(steps);
        } catch (error) {
            console.error('Error fetching report steps:', error);
        }
    };

    const fetchUserReports = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const reports = await getUserReports(user.user_id);
            setUserReports(reports);

            // ถ้ามีรายงาน เลือกรายงานแรกเป็นค่าเริ่มต้น
            if (reports.length > 0) {
                setSelectedReport(reports[0]);
                setCurrent((reports[0].calculated_current_step || reports[0].current_step) - 1); // Steps เริ่มที่ 0
            }
        } catch (error) {
            console.error('Error fetching user reports:', error);
            setError('ไม่สามารถดึงข้อมูลรายงานได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
        fetchReportSteps();
        fetchUserReports();
    }, [user]);

    const stepItems = reportSteps.length > 0 ? reportSteps.map((step) => ({
        title: step.step_name,
        description: step.step_description,
        icon: step.step_number === 5 ? <CheckCircleOutlined /> : <ClockCircleOutlined />
    })) : [
        {
            title: 'Step 1',
            description: 'เสียคำร้อง',
        },
        {
            title: 'Step 2',
            description: 'ตรวจสอบข้อมูล',
        },
        {
            title: 'Step 3',
            description: 'รอดำเนินการ',
        },
        {
            title: 'Step 4',
            description: 'กำลังดำเนินการ',
        },
        {
            title: 'Step 5',
            description: 'เสร็จสิ้น',
        },
    ];

    // Columns สำหรับตารางรายงาน
    const columns = [
        {
            title: 'รหัสรายงาน',
            dataIndex: 'report_id',
            key: 'report_id',
            width: 100,
        },
        {
            title: 'หัวข้อ',
            dataIndex: 'title',
            key: 'title',
            width: 200,
        },
        {
            title: 'ประเภทปัญหา',
            dataIndex: 'problem_type',
            key: 'problem_type',
            width: 150,
        },
        {
            title: 'สถานะปัจจุบัน',
            dataIndex: 'current_step_name',
            key: 'current_step_name',
            render: (text: string, record: UserReport) => (
                <Tag color={record.current_step_color || '#108ee9'}>
                    {text}
                </Tag>
            ),
            width: 150,
        },
        {
            title: 'ความคืบหน้า',
            dataIndex: 'progress_percentage',
            key: 'progress_percentage',
            render: (percentage: number) => (
                <Progress percent={percentage} size="small" />
            ),
            width: 120,
        },
        {
            title: 'วันที่สร้าง',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('th-TH'),
            width: 120,
        },
    ];

    if (!user) {
        return (
            <div className={styles.reportContainer}>
                <Alert
                    message="กรุณาเข้าสู่ระบบ"
                    description="คุณต้องเข้าสู่ระบบเพื่อดูรายงานของคุณ"
                    type="warning"
                    showIcon
                />
            </div>
        );
    }

    if (loading && userReports.length === 0) {
        return (
            <div className={styles.reportContainer}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: '20px' }}>กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.reportContainer}>
            <h1 className={styles.title}>ติดตามสถานะการรายงานปัญหา</h1>

            {error && (
                <Alert
                    message="เกิดข้อผิดพลาด"
                    description={error}
                    type="error"
                    closable
                    style={{ marginBottom: '20px' }}
                />
            )}

            {/* Horizontal Stepper */}
            <div className={styles.horizontalStepper}>
                <Steps
                    current={current}
                    onChange={onChange}
                    items={stepItems}
                    className={styles.customSteps}
                />
            </div>

            {/* User Reports Table */}
            <Card title="รายงานของคุณ" style={{ marginBottom: '30px' }}>
                {userReports.length === 0 ? (
                    <Empty
                        description="คุณยังไม่มีรายงานใดๆ"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={userReports}
                        rowKey="report_id"
                        pagination={{
                            pageSize: 5,
                            showSizeChanger: true,
                            showQuickJumper: true,
                        }}
                        scroll={{ x: 800 }}
                    />
                )}
            </Card>

            {/* Selected Report Progress */}
            {selectedReport && (
                <>
                    <Card title={`ติดตามสถานะ: ${selectedReport.title}`} style={{ marginBottom: '20px' }}>
                        <Row>
                            <Col span={16}>
                                <p><strong>รหัสรายงาน:</strong> {selectedReport.report_id}</p>
                                <p><strong>ประเภทปัญหา:</strong> {selectedReport.problem_type}</p>
                                <p><strong>สถานที่:</strong> {selectedReport.location_detail}</p>
                                <p><strong>วันที่สร้าง:</strong> {new Date(selectedReport.created_at).toLocaleString('th-TH')}</p>
                            </Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                                <div className={styles.progressCircle}>
                                    <Progress
                                        type="circle"
                                        percent={selectedReport.progress_percentage}
                                        format={(percent) => `${percent}%`}
                                        size={100}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Card>



                    {/* Current Step Details */}
                    <Card className={styles.stepDetailCard}>
                        <h3>รายละเอียดขั้นตอนปัจจุบัน</h3>
                        <p><strong>ขั้นตอน:</strong> {stepItems[current]?.title}</p>
                        <p><strong>รายละเอียด:</strong> {stepItems[current]?.description}</p>
                        <p><strong>สถานะ:</strong> {current === stepItems.length - 1 ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'}</p>
                        {(selectedReport.calculated_current_step || selectedReport.current_step) < 5 && (
                            <Alert
                                message="หมายเหตุ"
                                description="ระบบจะอัพเดทสถานะให้คุณทราบเมื่อมีความคืบหน้า"
                                type="info"
                                showIcon
                                style={{ marginTop: '15px' }}
                            />
                        )}
                    </Card>
                </>
            )}
        </div>
    );
};

export default Report;
