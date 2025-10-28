import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

interface AdminRouteProps {
  children: ReactNode;
}

// หน้าแสดงข้อความเมื่อไม่มีสิทธิ์เข้าถึง
const UnauthorizedPage: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Kanit, Noto Sans Thai, sans-serif'
  }}>
    <div style={{
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
      maxWidth: '500px'
    }}>
      <h2 style={{ color: '#d32f2f', marginBottom: '20px' }}>
        🚫 ไม่มีสิทธิ์เข้าถึง
      </h2>
      <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
        ขออภัย คุณไม่มีสิทธิ์ในการเข้าถึงส่วนจัดการระบบ<br />
        เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเข้าถึงได้
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={() => window.history.back()}
          style={{
            backgroundColor: '#67a6b9',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          ย้อนกลับ
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          หน้าแรก
        </button>
      </div>
    </div>
  </div>
);

// Protected Route สำหรับ Admin เท่านั้น
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // ถ้าไม่ได้ login ให้ไปหน้า login พร้อมเก็บ URL ปัจจุบัน
  if (!isAuthenticated) {
    return <Navigate to="/Login" state={{ from: location.pathname }} replace />;
  }

  // ถ้า login แล้วแต่ไม่ใช่ admin ให้แสดงหน้า Unauthorized
  if (user?.user_type !== 'admin') {
    return <UnauthorizedPage />;
  }

  // ถ้าเป็น admin ให้แสดงหน้าที่ต้องการ
  return <>{children}</>;
};

interface ProtectedRouteProps {
  children: ReactNode;
}

// Protected Route สำหรับผู้ใช้ที่ login แล้ว
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // เก็บ URL ที่ user พยายามจะเข้าถึง
    return <Navigate to="/Login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};