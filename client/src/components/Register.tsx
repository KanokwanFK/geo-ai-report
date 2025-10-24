import styles from "./styles/Register.module.css";
import { Button, Form, Input, DatePicker, Select, message } from "antd";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router";

const { Option } = Select;

interface UserData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    birth_date?: Date;
    province: string;
    district: string;
    subdistrict: string;
    user_type: string;
}

const Register = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Debug log for state changes
    console.log('Current states - loading:', loading, 'success:', success);

    const onFinish = async (values: any) => {
        setLoading(true);
        setSuccess(false); // รีเซ็ต success state
        console.log('Submitting registration...', values);
        
        try {
            const userData: UserData = {
                email: values.email,
                password: values.password,
                first_name: values.first_name,
                last_name: values.last_name,
                phone: values.phone,
                birth_date: values.birth_date ? values.birth_date.toDate() : undefined,
                province: values.province,
                district: values.district,
                subdistrict: values.subdistrict,
                user_type: values.user_type || 'user'
            };

            console.log('Sending data to server:', userData);
            const response = await axios.post('http://localhost:3003/api/auth/register', userData);
            console.log('Server response:', response.data);
            
            if (response.data.success) {
                console.log('Registration successful!');
                setLoading(false);
                setSuccess(true);
                form.resetFields();
                message.success('ลงทะเบียนสำเร็จ กำลังไปยังหน้าล็อคอิน...');
                navigate('/Login');
            } else {
                console.log('Registration failed:', response.data.message);
                message.error(response.data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
                setLoading(false); // หยุด loading เมื่อเกิดข้อผิดพลาด
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            message.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
            setLoading(false); // หยุด loading เมื่อเกิด error
        }
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
        message.error('กรุณากรอกข้อมูลให้ครบถ้วน');
    };

    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <h2 className={styles.title}>ลงทะเบียน</h2>
                <Form
                    form={form}
                    name="register"
                    layout="vertical"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    className={styles.form}
                >
                    <Form.Item
                        label="อีเมล"
                        name="email"
                        rules={[
                            // { required: true, message: 'กรุณากรอกอีเมล' },
                            { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
                        ]}
                    >
                        <Input placeholder="กรอกอีเมล" />
                    </Form.Item>

                    <Form.Item
                        label="รหัสผ่าน(ใช้สำหรับเข้าสู่ระบบ)"
                        name="password"
                        rules={[
                            // { required: true, message: 'กรุณากรอกรหัสผ่าน' },
                            { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
                        ]}
                    >
                        <Input.Password placeholder="กรอกรหัสผ่าน" />
                    </Form.Item>

                    <Form.Item
                        label="ยืนยันรหัสผ่าน"
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'กรุณายืนยันรหัสผ่าน' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="ยืนยันรหัสผ่าน" />
                    </Form.Item>

                    <div className={styles.nameRow}>
                        <Form.Item
                            label="ชื่อ"
                            name="first_name"
                            // rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}
                        >
                            <Input placeholder="กรอกชื่อ" />
                        </Form.Item>

                        <Form.Item
                            label="นามสกุล"
                            name="last_name"
                            // rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}
                        >
                            <Input placeholder="กรอกนามสกุล" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="เบอร์โทรศัพท์"
                        name="phone"
                        rules={[
                            // { required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' },
                            { pattern: /^[0-9]{10}$/, message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' }
                        ]}
                    >
                        <Input placeholder="กรอกเบอร์โทรศัพท์" maxLength={10} />
                    </Form.Item>

                    <Form.Item
                        label="วันเกิด"
                        name="birth_date"
                    >
                        <DatePicker 
                            placeholder="เลือกวันเกิด" 
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                        />
                    </Form.Item>

                    <Form.Item
                        label="จังหวัด"
                        name="province"
                        // rules={[{ required: true, message: 'กรุณากรอกจังหวัด' }]}
                    >
                        <Input placeholder="กรอกจังหวัด" />
                    </Form.Item>

                    <Form.Item
                        label="อำเภอ"
                        name="district"
                        // rules={[{ required: true, message: 'กรุณากรอกอำเภอ' }]}
                    >
                        <Input placeholder="กรอกอำเภอ" />
                    </Form.Item>

                    <Form.Item
                        label="ตำบล"
                        name="subdistrict"
                        // rules={[{ required: true, message: 'กรุณากรอกตำบล' }]}
                    >
                        <Input placeholder="กรอกตำบล" />
                    </Form.Item>

                    <Form.Item
                        label="ประเภทผู้ใช้"
                        name="user_type"
                        initialValue="user"
                    >
                        <Select placeholder="เลือกประเภทผู้ใช้">
                            <Option value="user">ผู้ใช้ทั่วไป</Option>
                            <Option value="admin">ผู้ดูแลระบบ</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            disabled={success}
                            className={styles.submitButton}
                        >
                            {success ? 'ลงทะเบียนสำเร็จ ✓' : 'ลงทะเบียน'}
                        </Button>
                    </Form.Item>

                    <div className={styles.loginLink}>
                        มีบัญชีแล้ว? <a href="/login">เข้าสู่ระบบ</a>
                    </div>
                </Form>
            </div>
        </div>
    );
}

export default Register;
