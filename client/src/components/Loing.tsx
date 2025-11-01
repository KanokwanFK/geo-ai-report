import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import styles from "./styles/Loing.module.css";
import { loginUser } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // ตั้งค่า rememberMe เป็น true เพื่อให้ล็อกอินคงอยู่หลังรีเฟรช
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [justLoggedIn, setJustLoggedIn] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated } = useAuth();

    // ดึง URL ที่ user พยายามจะเข้าถึงก่อน login
    const from = (location.state as { from?: string })?.from || '/Map';
    const fromProtectedRoute = Boolean((location.state as { from?: string })?.from);

    // ป้องกัน user ที่ login อยู่แล้วเข้าหน้า Login
    // ยกเว้นกรณีที่เพิ่ง login เสร็จ (กำลังจะ navigate ไป from)
    useEffect(() => {
        if (isAuthenticated && !isLoading && !justLoggedIn) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, isLoading, justLoggedIn, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        try {
            const result = await loginUser(email, password);
            
            if (result.success) {
                // ตั้ง flag ว่าเพิ่ง login เสร็จ เพื่อป้องกัน useEffect redirect
                setJustLoggedIn(true);
                
                // Use auth context to store user data
                // บังคับให้จำรหัสผ่านทุกครั้งเพื่อคงสถานะล็อกอินหลังรีเฟรช
                login(result.user, true);
                
                // Navigate ไปที่หน้าที่ user พยายามจะเข้าก่อนหน้า
                // หรือไป /Map ถ้าเข้ามาจากหน้า Login โดยตรง
                navigate(from, { replace: true });
            } else {
                setError(result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <h2 className={styles.title}>เข้าสู่ระบบ</h2>
                
                {fromProtectedRoute && (
                    <div className={styles.infoMessage}>
                        กรุณาเข้าสู่ระบบเพื่อเข้าถึงระบบการแจ้งปัญหาสาธารณะ
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}
                    
                    <div className={styles.inputGroup}>
                        <div className={styles.inputWrapper}>
                            <span className={styles.icon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </span>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <div className={styles.inputWrapper}>
                            <span className={styles.icon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                                </svg>
                            </span>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span className={styles.checkboxText}>จำรหัสผ่าน</span>
                        </label>
                    </div>

                    <button type="submit" className={styles.loginButton} disabled={isLoading}>
                        {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>

                    <div className={styles.linkContainer}>
                        <Link to="/register" className={styles.link}>
                            ลงทะเบียน
                        </Link>
                        <Link to="/Password" className={styles.link}>
                            ลืมรหัสผ่าน
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
