import React, { useState, useRef } from 'react';
import styles from './styles/Chat.module.css';
import { SendOutlined } from '@ant-design/icons';
import robot from './imge/robot.png';

// ดึงจำนวนรายงานแต่ละจังหวัดจาก API
async function fetchReportCountByProvince() {
    try {
        const res = await fetch('/api/dashboard/reports-by-province');
        if (!res.ok) return null;
        const provinces = await res.json();
        return provinces;
    } catch {
        return null;
    }
}
// ดึงจำนวนรายงานตามแต่ละประเภทปัญหาจาก API
async function fetchReportCountByType() {
    try {
        const res = await fetch('/api/dashboard/reports-by-type');
        if (!res.ok) return null;
        const types = await res.json();
        return types;
    } catch {
        return null;
    }
}
// ดึงประเภทปัญหาทั้งหมดจาก API
async function fetchProblemTypes() {
    try {
        const res = await fetch('/api/problem-types');
        if (!res.ok) return null;
        const types = await res.json();
        return types;
    } catch {
        return null;
    }
}
// ดึงข้อมูลสถานะและจำนวนรายงานจาก API
async function fetchProjectStats() {
    try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) return null;
        const stats = await res.json();
        return stats;
    } catch {
        return null;
    }
}

type ChatMessage = {
    sender: 'user' | 'ai';
    text: string;
    loading?: boolean;
};

const Chat = ({ onClose }: { onClose: () => void }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'ai', text: 'สวัสดีค่ะ ยินดีให้บริการ สามารถพูดคุยหรือสอบถามเพิ่มเติมหรือมีอะไรให้ช่วยไหมคะ ' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg, { sender: 'ai', text: '', loading: true }]);
        setInput('');
        setLoading(true);
        try {
            // ngrok (ใช้งานอยู่)
            const res = await fetch('/webhook/400731d1-9bf5-4c51-aff2-ec047b2c7e43/chat', {
                // localhost 
                // const res = await fetch('/webhook/400731d1-9bf5-4c51-aff2-ec047b2c7e43/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // สำคัญสำหรับ ngrok
                },
                body: JSON.stringify({
                    sessionId: '4aa27fce56064887a773b5e62d1e93b0',
                    action: 'sendMessage',
                    chatInput: input
                    // chatInput: input,
                    // sender_type: 'user',
                    // sessionId: '400731d1-9bf5-4c51-aff2-ec047b2c7e43'
                })
            });
            const data = await res.json();
            const lastUserMsg = input.trim();
            let aiReply = data.output || data.output?.output || data.chat?.message || data.reply || '';
            let stats;
            if ((/จำนวนรายงาน.*ประเภท|จำนวนรายงานแต่ละประเภท|รายงานแต่ละประเภท|จำนวนรายงานของแต่ละประเภท|จำนวนของแต่ละประเภท|report.*type|count.*problem/i.test(lastUserMsg)) ||
                (/จำนวนรายงาน/i.test(lastUserMsg) && /ประเภท/i.test(lastUserMsg))) {
                const types = await fetchReportCountByType();
                if (types && Array.isArray(types) && types.length > 0) {
                    aiReply = 'จำนวนรายงานแต่ละประเภทในระบบ:\n' + types.map(t => `- ${t.type_name}: ${t.report_count} รายงาน`).join('\n') + '\n\nข้อมูลนี้อัปเดตล่าสุดจากระบบค่ะ';
                } else {
                    aiReply = 'ขออภัย ไม่สามารถดึงข้อมูลจำนวนรายงานแต่ละประเภทได้ในขณะนี้';
                }
            } else if (/สถานะรายงาน|รายงานทั้งหมด|คืบหน้า|สถิติ/.test(lastUserMsg)) {
                stats = await fetchProjectStats();
                if (stats) {
                    const total = Number(stats.total_reports) || 0;
                    const pending = Number(stats.pending_reports) || 0;
                    const checking = Number(stats.checking_reports) || 0;
                    const waiting = Number(stats.waiting_reports) || 0;
                    const inProgress = Number(stats.in_progress_reports) || 0;
                    const resolved = Number(stats.resolved_reports) || 0;
                    const rejected = Number(stats.rejected_reports) || 0;
                    aiReply = `ขณะนี้มีรายงานทั้งหมด ${total} รายการ\nรอตรวจสอบ: ${pending}\nกำลังตรวจสอบ: ${checking}\nรอดำเนินการ: ${waiting}\nกำลังดำเนินการ: ${inProgress}\nเสร็จสิ้น: ${resolved}\nปฏิเสธ: ${rejected} ค่ะ`;
                } else {
                    aiReply = 'ขออภัย ไม่สามารถดึงข้อมูลสถานะรายงานได้ในขณะนี้';
                }
            } else if (/ประเภทปัญหา|ปัญหาอะไรบ้าง|type|problem/i.test(lastUserMsg)) {
                const types = await fetchProblemTypes();
                if (types && Array.isArray(types) && types.length > 0) {
                    aiReply = 'ประเภทปัญหาทั้งหมดในระบบ ได้แก่\n' + types.map(t => `- ${t.type_name}`).join('\n');
                } else {
                    aiReply = 'ขออภัย ไม่สามารถดึงข้อมูลประเภทปัญหาได้ในขณะนี้';
                }
            } else if (
                // เดิม: มีคำว่า "น้อยที่สุด" หรือ "มากที่สุด" + "จำนวน" + "จังหวัด"
                ((/น้อยสุด|น้อยที่สุด|least|min/i.test(lastUserMsg) || /เยอะที่สุด|มากที่สุด|top|most/i.test(lastUserMsg)) && (/จำนวน|report|count/i.test(lastUserMsg) && /จังหวัด|province/i.test(lastUserMsg)))
                // ใหม่: มี "จังหวัด" + ("มากที่สุด" หรือ "น้อยที่สุด") หรือ "รายงาน" + "จังหวัด" + ("มากที่สุด"/"น้อยที่สุด")
                || (/จังหวัด.*(มากที่สุด|เยอะที่สุด|น้อยที่สุด|min|least|top|most)/i.test(lastUserMsg))
                || (/(มากที่สุด|เยอะที่สุด|น้อยที่สุด|min|least|top|most).*จังหวัด/i.test(lastUserMsg))
                || (/รายงาน.*จังหวัด.*(มากที่สุด|เยอะที่สุด|น้อยที่สุด|min|least|top|most)/i.test(lastUserMsg))
            ) {
                const provinces = await fetchReportCountByProvince();
                if (provinces && Array.isArray(provinces) && provinces.length > 0) {
                    const most = provinces[0];
                    const least = provinces[provinces.length - 1];
                    aiReply = `จังหวัดที่มีคนรายงานมากที่สุด: "${most.province}" (${most.report_count} รายงาน)\nจังหวัดที่มีคนรายงานน้อยที่สุด: "${least.province}" (${least.report_count} รายงานค่ะ)`;
                } else {
                    aiReply = 'ขออภัย ไม่สามารถดึงข้อมูลจังหวัดที่มีคนรายงานมาก/น้อยที่สุดได้ในขณะนี้';
                }
            } else if ((/น้อยสุด|น้อยที่สุด|least|min/i.test(lastUserMsg) || /เยอะที่สุด|มากที่สุด|top|most/i.test(lastUserMsg)) && (/จำนวน|report|count/i.test(lastUserMsg) && /ประเภท|type|problem/i.test(lastUserMsg))) {
                const types = await fetchReportCountByType();
                if (types && Array.isArray(types) && types.length > 0) {
                    const mostType = types[0];
                    const leastType = types[types.length - 1];
                    aiReply = `ประเภทที่มีคนรายงานมากที่สุด: "${mostType.type_name}" (${mostType.report_count} รายงาน)\nประเภทที่มีคนรายงานน้อยที่สุด: "${leastType.type_name}" (${leastType.report_count} รายงานค่ะ)`;
                } else {
                    aiReply = 'ขออภัย ไม่สามารถดึงข้อมูลจำนวนรายงานมากที่สุด/น้อยที่สุดของแต่ละประเภทได้ในขณะนี้';
                }
            } else if (!aiReply || aiReply === '' || aiReply.includes('แชทบอท')) {
                if (/งานนี้.*(เสร็จ|คืบหน้า|ทำอะไรไปบ้าง)/.test(lastUserMsg)) {
                    aiReply = 'งานที่เสร็จแล้วในระบบนี้ ได้แก่ การสมัครสมาชิก, การเข้าสู่ระบบ, การรายงานปัญหา, การดูสถานะรายงาน, และการอัปโหลดรูปภาพค่ะ หากต้องการดูรายละเอียดเพิ่มเติมสามารถสอบถามได้เลยค่ะ';
                } else if (/รายงานปัญหา|แจ้งปัญหา/.test(lastUserMsg)) {
                    aiReply = 'ระบบรายงานปัญหาสามารถแจ้งปัญหาใหม่ ดูสถานะรายงาน และติดตามผลการดำเนินการได้ค่ะ หากต้องการแจ้งปัญหาใหม่หรือดูสถานะรายงาน แจ้งรายละเอียดได้เลยค่ะ';
                } else {
                    aiReply = 'ขอบคุณที่สอบถามค่ะ หากมีคำถามเกี่ยวกับงานหรือรายงานปัญหา สามารถถามได้เลยค่ะ';
                }
            }
            setMessages(prev => {
                const filtered = prev.filter(msg => !(msg.sender === 'ai' && msg.loading));
                return [
                    ...filtered,
                    { sender: 'ai', text: aiReply }
                ];
            });
        } catch (e) {
            setMessages(prev => {
                const filtered = prev.filter(msg => !(msg.sender === 'ai' && msg.loading));
                return [...filtered, { sender: 'ai', text: 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' }];
            });
        }
        setLoading(false);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSend();
    };

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <>
            <div className={styles.chatBackdrop} onClick={onClose}></div>
            <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                    <span className={styles.chatTitle}>
                        <img src={robot} alt="AI Logo" style={{ height: 40, verticalAlign: 'middle', marginRight: 10 }} />
                        AI Chatbot
                    </span>
                    <button className={styles.closeButton} onClick={onClose} title="ปิดแชทบอท">&times;</button>
                </div>
                <div className={styles.messages}>
                    {messages.map((msg, idx) => (
                        <div key={idx}>
                            {msg.sender === 'user' ? (
                                <span className={styles.usernameLabel}>ฉัน</span>
                            ) : (
                                <span className={styles.botLabel}>AI Chatbot</span>
                            )}
                            <div
                                className={
                                    msg.sender === 'user'
                                        ? `${styles.message} ${styles.userMessage}`
                                        : `${styles.message} ${styles.botMessage}`
                                }
                            >
                                {msg.loading ? (
                                    <span className={styles.loadingDots}>
                                        <span>.</span><span>.</span><span>.</span>
                                    </span>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className={styles.inputContainer}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="พิมพ์คำถามที่นี่..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        disabled={loading}
                    />
                    <button className={styles.sendButton} onClick={handleSend} disabled={loading || !input.trim()}>
                        <SendOutlined style={{ fontSize: 20 }} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default Chat;