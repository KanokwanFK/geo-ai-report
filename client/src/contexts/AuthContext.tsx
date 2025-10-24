// AuthContext สำหรับจัดการสถานะการเข้าสู่ระบบและข้อมูลผู้ใช้
// ระบบนี้จะเก็บข้อมูลผู้ใช้ไว้ใน localStorage เพื่อให้ผู้ใช้ยังคงล็อกอินอยู่หลังรีเฟรชหน้าเว็บ
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// โครงสร้างข้อมูลผู้ใช้
export interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string;
  address: string;
  province: string;
  district: string;
  subdistrict: string;
  user_type: string;
  created_at: string;
}

// ประเภทของ context สำหรับการจัดการข้อมูลผู้ใช้และสถานะการเข้าสู่ระบบ
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, rememberMe?: boolean) => void;
  logout: () => void;
}

// สร้าง context สำหรับการจัดการข้อมูลผู้ใช้
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
// AuthProvider: ตรวจสอบข้อมูลผู้ใช้ใน localStorage เมื่อ component ถูก mount
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // เมื่อ component ถูก mount จะเช็คว่ามีข้อมูลผู้ใช้ใน localStorage หรือไม่
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser)); // ตั้งค่าผู้ใช้จาก localStorage
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // ฟังก์ชัน login: บันทึกข้อมูลผู้ใช้ลง localStorage เพื่อให้รีเฟรชแล้วยังคงล็อกอิน
  const login = (userData: User, rememberMe: boolean = true) => {
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userData)); // เก็บข้อมูลผู้ใช้ใน localStorage
    }
    // ผู้ใช้จะยังคงล็อกอินอยู่หลังรีเฟรชหน้าเว็บจนกว่าจะ logout
  };

  // ฟังก์ชัน logout: ลบข้อมูลผู้ใช้ออกจาก state และ localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // value ที่จะถูกส่งไปยัง context provider
  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  // ส่ง value ไปยัง AuthContext.Provider
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook สำหรับเรียกใช้งาน context การเข้าสู่ระบบ
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};