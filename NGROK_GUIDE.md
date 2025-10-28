# 🚀 คู่มือการใช้ ngrok สำหรับทดสอบ Frontend + Backend

## ขั้นตอนการตั้งค่าและทดสอบ

### 1️⃣ เตรียม Backend

```bash
cd server
node server.js
```

Backend จะรันที่ `http://localhost:3003`

---

### 2️⃣ เปิด ngrok สำหรับ Backend

เปิด Terminal ใหม่:

```bash
# สำหรับ Backend (port 3003)
ngrok http 3003
```

คุณจะได้ URL แบบนี้:
```
Forwarding  https://1234-5678-abcd.ngrok-free.app -> http://localhost:3003
```

**คัดลอก URL นี้** (เช่น `https://1234-5678-abcd.ngrok-free.app`)

---

### 3️⃣ อัพเดท Frontend Configuration

แก้ไขไฟล์ `client/.env`:

```env
# เปลี่ยนจาก localhost เป็น ngrok URL
VITE_API_BASE_URL=https://1234-5678-abcd.ngrok-free.app
```

---

### 4️⃣ (Optional) อัพเดท Backend CORS

แก้ไขไฟล์ `server/.env`:

```env
# ถ้าต้องการจำกัด CORS ให้เฉพาะ frontend ngrok
FRONTEND_URL=https://your-frontend-ngrok.ngrok-free.app

# หรือปล่อยเป็น * เพื่อให้ทุก origin เข้าถึงได้
FRONTEND_URL=*
```

**Restart Backend** หลังแก้ไข .env:
```bash
# กด Ctrl+C แล้วรันใหม่
node server.js
```

---

### 5️⃣ เริ่ม Frontend

```bash
cd client
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

---

### 6️⃣ (Optional) เปิด ngrok สำหรับ Frontend

ถ้าต้องการให้คนอื่นเข้าถึง Frontend ด้วย:

เปิด Terminal อีกหนึ่งตัว:

```bash
# สำหรับ Frontend (port 5173)
ngrok http 5173
```

คุณจะได้ URL สำหรับ Frontend:
```
Forwarding  https://efgh-9012-ijkl.ngrok-free.app -> http://localhost:5173
```

---

## 📋 สรุปการตั้งค่า

### สำหรับ Local Testing (ง่ายสุด)
```
1. Backend: http://localhost:3003
2. Frontend: http://localhost:5173
3. Frontend .env: VITE_API_BASE_URL=http://localhost:3003
```

### สำหรับทดสอบกับ ngrok (Backend only)
```
1. Backend: ngrok http 3003 → https://xxx.ngrok-free.app
2. Frontend: http://localhost:5173
3. Frontend .env: VITE_API_BASE_URL=https://xxx.ngrok-free.app
4. Server .env: FRONTEND_URL=*
```

### สำหรับทดสอบทั้ง Frontend + Backend ผ่าน ngrok
```
1. Backend: ngrok http 3003 → https://backend-xxx.ngrok-free.app
2. Frontend: ngrok http 5173 → https://frontend-xxx.ngrok-free.app
3. Frontend .env: VITE_API_BASE_URL=https://backend-xxx.ngrok-free.app
4. Server .env: FRONTEND_URL=https://frontend-xxx.ngrok-free.app
```

---

## ⚠️ สิ่งที่ต้องระวัง

### 1. ngrok URL เปลี่ยนทุกครั้งที่ restart (Free Plan)
- ต้องอัพเดท `.env` ใหม่ทุกครั้ง
- หรือใช้ ngrok paid plan เพื่อได้ static domain

### 2. CORS Issues
- ถ้าเจอ CORS error ให้ตั้ง `FRONTEND_URL=*` ใน server/.env
- หรือระบุ frontend ngrok URL ที่แน่นอน

### 3. Restart Backend หลังแก้ .env
- Backend ต้อง restart ทุกครั้งที่แก้ไข .env
- Frontend ต้อง rebuild หลังแก้ .env

### 4. WebSocket อาจมีปัญหา
- ngrok free plan อาจมีข้อจำกัดกับ WebSocket
- ถ้าใช้ chat/real-time features อาจต้องใช้ paid plan

---

## 🔧 Troubleshooting

### ❌ CORS Error
```
Access to fetch at 'https://xxx.ngrok-free.app/api/...' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

**แก้ไข:** ตั้ง `FRONTEND_URL=*` ใน `server/.env` แล้ว restart backend

---

### ❌ 404 Not Found
```
GET https://xxx.ngrok-free.app/api/reports 404
```

**ตรวจสอบ:**
1. Backend รันอยู่หรือไม่
2. ngrok tunnel ยังเปิดอยู่หรือไม่
3. URL ใน `.env` ถูกต้องหรือไม่

---

### ❌ ngrok Warning Page
```
Visit Site → Warning page from ngrok
```

**แก้ไข:** คลิก "Visit Site" แล้วกด "Continue" (ปกติของ free plan)

---

## 🎯 ตัวอย่างการใช้งานจริง

### Scenario 1: ทดสอบเฉพาะ Backend API
```bash
# Terminal 1: Start Backend
cd server
node server.js

# Terminal 2: Start ngrok
ngrok http 3003

# Terminal 3: Test with curl
curl https://YOUR-NGROK-URL.ngrok-free.app/api/test
```

### Scenario 2: ทดสอบ Frontend + Backend
```bash
# Terminal 1: Start Backend
cd server
node server.js

# Terminal 2: ngrok Backend
ngrok http 3003
# Copy URL: https://abc123.ngrok-free.app

# Terminal 3: Update Frontend .env
cd client
echo "VITE_API_BASE_URL=https://abc123.ngrok-free.app" > .env

# Terminal 3: Start Frontend
npm run dev

# เปิดเบราว์เซอร์: http://localhost:5173
```

### Scenario 3: แชร์ให้คนอื่นทดสอบ
```bash
# Terminal 1: Backend
cd server
node server.js

# Terminal 2: ngrok Backend
ngrok http 3003
# Copy: https://backend-xyz.ngrok-free.app

# Terminal 3: Frontend .env
cd client
echo "VITE_API_BASE_URL=https://backend-xyz.ngrok-free.app" > .env
npm run dev

# Terminal 4: ngrok Frontend
ngrok http 5173
# Share: https://frontend-abc.ngrok-free.app

# แชร์ URL ให้เพื่อน: https://frontend-abc.ngrok-free.app
```

---

## 📝 Checklist ก่อนเริ่มทดสอบ

- [ ] ติดตั้ง ngrok แล้ว (`npm install -g ngrok` หรือ download)
- [ ] สร้างไฟล์ `client/.env` แล้ว
- [ ] สร้างไฟล์ `server/.env` แล้ว
- [ ] Backend รันได้ปกติที่ localhost:3003
- [ ] Frontend รันได้ปกติที่ localhost:5173
- [ ] ทดสอบเชื่อมต่อ API ที่ localhost ผ่านก่อน

---

## 💡 Tips & Best Practices

1. **ใช้ ngrok authtoken** (ฟรี):
   ```bash
   ngrok authtoken YOUR_TOKEN
   ```
   จะได้ใช้งานได้นานขึ้นและมี features มากขึ้น

2. **ใช้ ngrok config file**:
   ```yaml
   # ~/.ngrok2/ngrok.yml
   tunnels:
     backend:
       proto: http
       addr: 3003
     frontend:
       proto: http
       addr: 5173
   ```
   
   แล้วรัน:
   ```bash
   ngrok start --all
   ```

3. **Monitor ngrok dashboard**:
   - เปิด http://localhost:4040
   - ดู request/response real-time
   - Debug ได้ง่ายขึ้น

---

## 🔗 Resources

- [ngrok Documentation](https://ngrok.com/docs)
- [ngrok Pricing](https://ngrok.com/pricing)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
