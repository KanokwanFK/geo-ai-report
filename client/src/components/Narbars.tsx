import { Link, useNavigate } from "react-router";
import { Button } from 'antd';
import { useState } from 'react';
import { 
    MenuOutlined, 
    HomeOutlined, 
    FileTextOutlined, 
    BarChartOutlined, 
    SettingOutlined,
    UserOutlined,
    EnvironmentOutlined,
    LogoutOutlined, 
    WechatWorkOutlined
} from '@ant-design/icons';
import styles from "./styles/Narbars.module.css";
import { useAuth } from "../contexts/AuthContext";

const Narbars = ({ onOpenChat }: { onOpenChat?: () => void }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAdminExpanded, setIsAdminExpanded] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleAdmin = () => {
        setIsAdminExpanded(!isAdminExpanded);
    };

    // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
    const isAdmin = isAuthenticated && user?.user_type === 'admin';

    // ฟังก์ชันออกจากระบบ
    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    return(
        <>
            {/* Header */}
            <nav className={styles.navbar}>
                <div className={styles.headerContent}>
                    <div className={styles.leftSection}>
                        <Button 
                            type="text" 
                            icon={<MenuOutlined />} 
                            onClick={toggleMenu}
                            className={styles.menuButton}
                        />
                        <span className={styles.title}>ระบบแจ้งปัญหาสาธารณะ</span>
                    </div>
                    {/* แสดงเฉพาะปุ่มออกจากระบบบนมือถือ */}
                    {isAuthenticated ? (
                        <>
                            <div className={styles.userSection + ' ' + styles.hideOnMobile}>
                                <span className={styles.userName}>
                                    <UserOutlined />  {user?.first_name}
                                </span>
                                <Button 
                                    onClick={handleLogout} 
                                    className={styles.logoutBtn}
                                >
                                    ออกจากระบบ
                                </Button>
                            </div>
                            <div className={styles.showOnlyLogoutMobile}>
                                <Button 
                                    onClick={handleLogout} 
                                    className={styles.logoutBtn}
                                >
                                    ออกจากระบบ
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Button className={styles.btn}>
                            <Link to="/Login">เข้าสู่ระบบ</Link>
                        </Button>
                    )}
                </div>
            </nav>

            {/* Sidebar Overlay */}
            {isMenuOpen && <div className={styles.overlay} onClick={toggleMenu}></div>}

            {/* Sidebar */}
            <div className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarContent}>
                    <div className={styles.menuItem}>
                        <Link to="/" className={styles.menuLink} onClick={toggleMenu}>
                            <HomeOutlined className={styles.icon} />
                            หน้าแรก
                        </Link>
                    </div>
                    
                    {/* เมนูสำหรับการเข้าสู่ระบบ */}
                    {!isAuthenticated ? (
                        <>
                            <div className={styles.menuItem}>
                                <Link to="/Login" className={styles.menuLink} onClick={toggleMenu}>
                                    <UserOutlined className={styles.icon} />
                                    ลงชื่อเข้าใช้
                                </Link>
                            </div>
                            <div className={styles.menuItem}>
                                <Link to="/Register" className={styles.menuLink} onClick={toggleMenu}>
                                    <UserOutlined className={styles.icon} />
                                    สมัครสมาชิก
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className={styles.menuItem}>
                            <button onClick={handleLogout} className={styles.menuLink}>
                                <LogoutOutlined className={styles.icon} />
                                ออกจากระบบ
                            </button>
                        </div>
                    )}

                    {/* เมนูที่ต้องเข้าสู่ระบบ */}
                    {isAuthenticated && (
                        <>
                            <div className={styles.menuItem}>
                                <Link to="/Map" className={styles.menuLink} onClick={toggleMenu}>
                                    <EnvironmentOutlined className={styles.icon} />
                                    แผนที่
                                </Link>
                            </div>

                            <div className={styles.menuItem}>
                                <Link to="/report" className={styles.menuLink} onClick={toggleMenu}>
                                    <FileTextOutlined className={styles.icon} />
                                    ติดตามรายงาน
                                </Link>
                            </div>
                        </>
                    )}

                    <div className={styles.menuItem}>
                        <Link to="/dashboard" className={styles.menuLink} onClick={toggleMenu}>
                            <BarChartOutlined className={styles.icon} />
                            ภาพรวม
                        </Link>
                    </div>

                    {/* แสดงเมนูจัดการระบบเฉพาะ admin */}
                    {isAdmin && (
                        <div className={styles.menuItem}>
                            <div className={styles.adminToggle} onClick={toggleAdmin}>
                                <SettingOutlined className={styles.icon} />
                                <span className={styles.menuLink}>จัดการระบบ</span>
                                <span className={`${styles.dropdownIcon} ${isAdminExpanded ? styles.expanded : ''}`}>▼</span>
                            </div>
                        </div>
                    )}

                    {isAdmin && isAdminExpanded && (
                        <div className={styles.submenu}>
                            <div className={styles.submenuItem}>
                                <Link to="/admin" className={styles.submenuLink} onClick={toggleMenu}>
                                    {/* <UserOutlined className={styles.icon} /> */}
                                    ภาพรวมผู้ดูแลระบบ
                                </Link>
                            </div>
                            <div className={styles.submenuItem}>
                                <Link to="/Problem" className={styles.submenuLink} onClick={toggleMenu}>
                                    {/* <BarChartOutlined  className={styles.icon} /> */}
                                    จัดการรายงาน
                                </Link>
                            </div>
                            <div className={styles.submenuItem}>
                                <Link to="/Table" className={styles.submenuLink} onClick={toggleMenu}>
                                    {/* <FileTextOutlined className={styles.icon} /> */}
                                     ข้อมูลรายงานทั้งหมด
                                </Link>
                            </div>
                            
                        </div>
                    )}

                </div>
            </div>

            <div>
                {/* ปุ่มวงกลมสำหรับเปิดหน้า Chatbot */}
                <div 
                    className={styles.aiChatCircle}
                    title="เปิด/ปิดหน้าแชทบอท AI"
                    onClick={onOpenChat}
                >
                    <WechatWorkOutlined style={{ fontSize: 24, color: '#fff' }} />
                </div>
            </div>
            
            {/* Credits นอกเมนู */}
            <div className={styles.creditsFooter}>
                <div className={styles.creditsContainer}>
                    <div className={styles.developerName}>kanokwan Waetaudom</div>
                </div>
            </div>
        </>
    )
};

export default Narbars;