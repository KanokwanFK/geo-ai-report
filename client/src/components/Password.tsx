import styles from './styles/Password.module.css';
import { Button, Form, Input, message } from "antd";
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { useState } from "react";
import axios from "axios";

const Password = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: { email: string; phone: string }) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/forgot-password', {
                email: values.email,
                phone: values.phone
            });
            
            if (response.data.success) {
                message.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
                form.resetFields();
            } else {
                message.error(response.data.message || 'เกิดข้อผิดพลาดในการส่งอีเมล');
            }
        } catch (error: any) {
            console.error('Password reset error:', error);
            message.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งอีเมล');
        } finally {
            setLoading(false);
        }
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
        message.error('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
    };

    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <h2 className={styles.title}>ลืมรหัสผ่าน</h2>
                
                <Form
                    form={form}
                    name="forgot-password"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    className={styles.form}
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'กรุณากรอกอีเมล' },
                            { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
                        ]}
                    >
                        <Input 
                            prefix={<UserOutlined className={styles.inputIcon} />}
                            placeholder="Email" 
                            className={styles.emailInput}
                        />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        rules={[
                            { required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' },
                            { pattern: /^[0-9]{10}$/, message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก' }
                        ]}
                    >
                        <Input 
                            prefix={<PhoneOutlined className={styles.inputIcon} />}
                            placeholder="เบอร์โทรศัพท์" 
                            className={styles.phoneInput}
                            maxLength={10}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            className={styles.resetButton}
                        >
                            รีเซ็ตรหัสผ่าน
                        </Button>
                    </Form.Item>
                </Form>

                <div className={styles.backToLogin}>
                    <a href="/login">กลับไปหน้าเข้าสู่ระบบ</a>
                </div>
            </div>
        </div>
    );
}

export default Password;