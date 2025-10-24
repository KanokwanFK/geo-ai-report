import { useState, useEffect } from 'react';
import style from './styles/Dashboard.module.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRef } from 'react';
import { getReports } from '../services/reportService';

// Interface สำหรับข้อมูล report
interface Report {
    report_id: number;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    location_detail: string;
    status: string;
    current_step: number;
    current_step_name: string;
    current_step_color: string;
    progress_percentage: number;
    problem_type_name: string;
    user_name: string;
    created_at: string;
    updated_at: string;
    is_overdue?: boolean;
    hours_in_current_step?: number;
    images?: Array<{
        image_id: number;
        filename: string;
        original_name: string;
        file_size: number;
        mime_type: string;
        uploaded_at: string;
    }>;
}

// Interface สำหรับสถิติ
interface DashboardStats {
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    rejectedReports: number;
    todayReports: number;
    weekReports: number;
    monthReports: number;
    avgResolutionHours: number;
}

const Dashboard = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const initialized = useRef<boolean>(false);
    const markersRef = useRef<maplibregl.Marker[]>([]);

    const [reports, setReports] = useState<Report[]>([]);
    const [loadingReports, setLoadingReports] = useState<boolean>(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        rejectedReports: 0,
        todayReports: 0,
        weekReports: 0,
        monthReports: 0,
        avgResolutionHours: 0
    });
    // const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // ฟังก์ชันดึงข้อมูล reports - ทำงานได้โดยไม่ต้องเข้าสู่ระบบ
    const fetchReports = async () => {
        try {
            setLoadingReports(true);
            const data = await getReports();
            
            if (data && Array.isArray(data)) {
                setReports(data);
                calculateStats(data);
            } else {
                setReports([]);
                calculateStats([]);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            // แม้จะมี error ก็ยังคงแสดง Dashboard โดยไม่มีข้อมูล
            // งานหลักไม่หลุด - Dashboard ยังคงทำงานปกติ
            setReports([]);
            setStats({
                totalReports: 0,
                pendingReports: 0,
                resolvedReports: 0,
                rejectedReports: 0,
                todayReports: 0,
                weekReports: 0,
                monthReports: 0,
                avgResolutionHours: 0
            });

        } finally {
            setLoadingReports(false);
        }
    };

    // คำนวณสถิติ
    const calculateStats = (reportsData: Report[]) => {
        const today = new Date().toDateString();
        const todayReports = reportsData.filter(report =>
            new Date(report.created_at).toDateString() === today
        ).length;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekReports = reportsData.filter(report =>
            new Date(report.created_at) >= weekAgo
        ).length;

        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthReports = reportsData.filter(report =>
            new Date(report.created_at) >= monthAgo
        ).length;

        // นับรายงานที่รอดำเนินการ - รองรับทั้งสถานะภาษาไทยและอังกฤษ
        const pendingReports = reportsData.filter(report =>
            report.status && (
                ['รอตรวจสอบ', 'กำลังตรวจสอบ', 'รอดำเนินการ', 'กำลังดำเนินการ'].includes(report.status) ||
                ['step1', 'step2', 'step3', 'step4'].includes(report.status) ||
                ['pending', 'in_progress'].includes(report.status)
            )
        ).length;

        // นับรายงานที่เสร็จสิ้น - รองรับทั้งสถานะภาษาไทยและอังกฤษ
        const resolvedReports = reportsData.filter(report =>
            report.status === 'เสร็จสิ้น' || report.status === 'step5' || report.status === 'resolved'
        ).length;

        // นับรายงานที่ปฏิเสธ
        const rejectedReports = reportsData.filter(report =>
            report.status === 'ปฏิเสธ' || report.status === 'rejected'
        ).length;

        // คำนวณเวลาเฉลี่ยในการแก้ไข (ถ้ามีข้อมูล)
        const resolvedWithTime = reportsData.filter(report => 
            (report.status === 'เสร็จสิ้น' || report.status === 'step5') && report.created_at && report.updated_at
        );
        const avgResolutionHours = resolvedWithTime.length > 0 
            ? resolvedWithTime.reduce((sum, report) => {
                const created = new Date(report.created_at).getTime();
                const updated = new Date(report.updated_at).getTime();
                return sum + (updated - created) / (1000 * 60 * 60); // แปลงเป็นชั่วโมง
            }, 0) / resolvedWithTime.length
            : 0;

        setStats({
            totalReports: reportsData.length,
            pendingReports,
            resolvedReports,
            rejectedReports,
            todayReports,
            weekReports,
            monthReports,
            avgResolutionHours: Math.round(avgResolutionHours * 10) / 10 // ปัดเป็น 1 ตำแหน่ง
        });
    };



    // เริ่มต้นแผนที่
    useEffect(() => {
        if (!mapContainer.current || initialized.current) return;

        const initializeMap = async () => {
            try {
                map.current = new maplibregl.Map({
                    container: mapContainer.current!,
                    style: {
                        version: 8,
                        sources: {
                            'osm': {
                                type: 'raster',
                                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                                tileSize: 256,
                                attribution: '© OpenStreetMap contributors'
                            }
                        },
                        layers: [
                            {
                                id: 'osm',
                                type: 'raster',
                                source: 'osm'
                            }
                        ]
                    },
                    center: [101.0, 13.0], // จุดกึ่งกลางประเทศไทย
                    zoom: 5 // ซูมให้เห็นทั่วประเทศไทย
                });

                // เพิ่ม navigation controls
                map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

                // เพิ่ม fullscreen control
                map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

                // เพิ่ม scale control
                map.current.addControl(new maplibregl.ScaleControl({
                    maxWidth: 100,
                    unit: 'metric'
                }), 'bottom-left');
                
                // รอให้แผนที่โหลดเสร็จก่อน
                map.current.on('load', async () => {
                    initialized.current = true;
                    // ดึงข้อมูลรายงานทันทีโดยไม่ต้องเข้าสู่ระบบ
                    // งานหลักของแผนที่ไม่หลุด แม้จะไม่มีข้อมูล
                    await fetchReports();
                });
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };

        initializeMap();

        return () => {
            if (map.current) {
                try {
                    map.current.remove();
                } catch (error) {
                    console.log('Map cleanup error:', error);
                }
                map.current = null;
                initialized.current = false;
            }
        };
    }, []);

    // โหลดข้อมูลรายงานทันทีเมื่อ component mount โดยไม่ต้องรอแผนที่
    useEffect(() => {
        fetchReports();
    }, []);

    // สร้าง Heat Map เมื่อข้อมูลรายงานเปลี่ยน
    useEffect(() => {
        if (!map.current) return;
        
        // ลบ markers เดิม
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // สร้าง Heat Map เฉพาะเมื่อมีข้อมูล - งานหลักไม่หลุด
        if (reports.length > 0) {
            createHeatMap();
        }
    }, [reports]);

    // ฟังก์ชันสร้าง Heat Map โดยใช้ Kernel Density Estimation
    const createHeatMap = () => {
        if (!map.current || !reports.length || !initialized.current) return;

        try {
            // ลบ layer และ source เดิม (ถ้ามี)
            if (map.current.getLayer('reports-point')) {
                map.current.removeLayer('reports-point');
            }
            if (map.current.getLayer('heatmap-layer')) {
                map.current.removeLayer('heatmap-layer');
            }
            if (map.current.getSource('reports-heatmap')) {
                map.current.removeSource('reports-heatmap');
            }
        } catch (error) {
            console.log('Layer/Source removal error (expected):', error);
        }

        // สร้าง GeoJSON data สำหรับ heat map
        const geojsonData = {
            type: 'FeatureCollection' as const,
            features: reports.map(report => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'Point' as const,
                    coordinates: [report.longitude, report.latitude]
                },
                properties: {
                    weight: calculateWeight(report),
                    status: report.status,
                    title: report.title,
                    problem_type: report.problem_type_name,
                    created_at: report.created_at
                }
            }))
        };

        try {
            // เพิ่ม source และ layer สำหรับ heat map
            map.current.addSource('reports-heatmap', {
                type: 'geojson',
                data: geojsonData
            });

            // เพิ่ม heatmap layer
            map.current.addLayer({
                id: 'heatmap-layer',
                type: 'heatmap',
                source: 'reports-heatmap',
                maxzoom: 15,
                paint: {
                    // ใช้ weight property สำหรับความเข้มของ heat map
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'weight'],
                        0, 0,
                        10, 1
                    ],
                    // ความเข้มของสีตาม zoom level
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 1,
                        15, 3
                    ],
                    // สีของ heat map - ไล่สีตามภาพ: น้ำเงินเข้ม → เขียว → เหลือง → ส้ม → แดง
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(31, 81, 140, 0)',      // โปร่งใส (ไม่มีข้อมูล)
                        0.2, 'rgb(31, 81, 140)',         // น้ำเงินเข้ม
                        0.4, 'rgb(49, 163, 84)',         // เขียว
                        0.6, 'rgb(255, 187, 34)',        // เหลือง
                        0.8, 'rgb(255, 141, 60)',        // ส้ม
                        1, 'rgb(227, 74, 51)'            // แดง
                    ],
                    // รัศมีของแต่ละจุด
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 2,
                        15, 20
                    ],
                    // ความโปร่งใสตาม zoom level
                    'heatmap-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        7, 1,
                        15, 0.9
                    ]
                }
            });

            // เพิ่ม point layer สำหรับ high zoom levels
            map.current.addLayer({
                id: 'reports-point',
                type: 'circle',
                source: 'reports-heatmap',
                minzoom: 14,
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        14, 6,
                        22, 20
                    ],
                    'circle-color': [
                        'case',
                        // สถานะภาษาไทย
                        ['==', ['get', 'status'], 'รอตรวจสอบ'], '#E91E63', // รอตรวจสอบ - สีชมพู
                        ['==', ['get', 'status'], 'กำลังตรวจสอบ'], '#FF9800', // กำลังตรวจสอบ - สีส้ม
                        ['==', ['get', 'status'], 'รอดำเนินการ'], '#FFEB3B', // รอดำเนินการ - สีเหลือง
                        ['==', ['get', 'status'], 'กำลังดำเนินการ'], '#00BCD4', // กำลังดำเนินการ - สีฟ้า
                        ['==', ['get', 'status'], 'เสร็จสิ้น'], '#4CAF50', // เสร็จสิ้น - สีเขียว
                        ['==', ['get', 'status'], 'ปฏิเสธ'], '#F44336', // ปฏิเสธ - สีแดง
                        // สถานะเก่า (สำหรับ backward compatibility)
                        ['==', ['get', 'status'], 'step1'], '#E91E63',
                        ['==', ['get', 'status'], 'step2'], '#FF9800', 
                        ['==', ['get', 'status'], 'step3'], '#FFEB3B',
                        ['==', ['get', 'status'], 'step4'], '#00BCD4',
                        ['==', ['get', 'status'], 'step5'], '#4CAF50',
                        ['==', ['get', 'status'], 'rejected'], '#F44336',
                        '#999999' // สีเทาสำหรับสถานะที่ไม่รู้จัก
                    ],
                    'circle-stroke-color': 'white',
                    'circle-stroke-width': 2,
                    'circle-opacity': 0.8
                }
            });
        } catch (error) {
            console.error('Error adding heatmap layers:', error);
            return;
        }

        try {
            // เพิ่ม click event สำหรับแสดงข้อมูล
            map.current.on('click', 'reports-point', (e) => {
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    const properties = feature.properties;

                    // แปลงข้อมูลสำหรับ Popup
                    const coordinates = (feature.geometry as any)?.coordinates;
                    const report = reports.find(r => 
                        coordinates && 
                        Math.abs(r.latitude - coordinates[1]) < 0.0001 && 
                        Math.abs(r.longitude - coordinates[0]) < 0.0001
                    );

                    new maplibregl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`
                            <div class="${style.popupContent}">
                                <h4>${properties?.title || 'ไม่มีชื่อ'}</h4>
                                <p><strong>ประเภท:</strong> ${properties?.problem_type || 'ไม่ระบุ'}</p>
                                <p><strong>สถานะ:</strong> ${getStatusText(properties?.status || '')}</p>
                                <p><strong>ขั้นตอน:</strong> ${report?.current_step || 1}/5</p>
                                <p><strong>ความคืบหน้า:</strong> ${report?.progress_percentage || 0}%</p>
                                <p><strong>วันที่สร้าง:</strong> ${new Date(properties?.created_at || '').toLocaleDateString('th-TH')}</p>
                                ${report?.is_overdue ? '<p style="color: #f44336;"><strong>⚠️ ค้างนานเกินกำหนด</strong></p>' : ''}
                                <div style="width: 100%; background: #eee; border-radius: 10px; margin-top: 10px;">
                                    <div style="width: ${report?.progress_percentage || 0}%; background: ${report?.current_step_color || '#999'}; height: 8px; border-radius: 10px;"></div>
                                </div>
                            </div>
                        `)
                        .addTo(map.current!);
                }
            });

            // เปลี่ยน cursor เมื่อ hover
            map.current.on('mouseenter', 'reports-point', () => {
                if (map.current) {
                    map.current.getCanvas().style.cursor = 'pointer';
                }
            });

            map.current.on('mouseleave', 'reports-point', () => {
                if (map.current) {
                    map.current.getCanvas().style.cursor = '';
                }
            });
        } catch (error) {
            console.error('Error adding map events:', error);
        }
    };

    // ฟังก์ชันคำนวณน้ำหนักสำหรับ Heat Map ตามสูตร Kernel Density Estimation
    const calculateWeight = (report: Report) => {
        /*
         * สูตร Kernel Density Estimation: f(x) = (1/nh) * Σ K((x-xi)/h)
         * 
         * คำอธิบายตัวแปรในสูตร:
         * ────────────────────────────────────────────────────────────
         * f(x)  = ค่าความหนาแน่นที่ตำแหน่ง x (ค่าที่เราต้องการหา)
         * n     = จำนวนข้อมูลจุดทั้งหมด (Total data points)
         * h     = ค่า bandwidth หรือรัศมีการกระจาย (Smoothing parameter)
         * K     = ฟังก์ชันเคอร์เนล (Kernel function - ในที่นี้ใช้ Gaussian)
         * xi    = ตำแหน่งของข้อมูลจุดที่ i (Position of i-th data point)
         * x     = ตำแหน่งที่ต้องการคำนวณความหนาแน่น (Target position)
         * 
         * หลักการทำงาน:
         * ────────────────────────────────────────────────────────────
         * 1. วัดระยะห่างจากจุดเป้าหมาย (x) ไปยังจุดข้อมูลแต่ละจุด (xi)
         * 2. ใช้ฟังก์ชันเคอร์เนลคำนวณอิทธิพลของแต่ละจุด
         * 3. รวมอิทธิพลทั้งหมดและปรับด้วยค่าคงที่ (1/nh)
         * 
         * การปรับปรุงสำหรับระบบรายงาน:
         * ────────────────────────────────────────────────────────────
         * - อายุของรายงาน: รายงานใหม่ → น้ำหนักมากกว่า
         * - สถานะการดำเนินงาน: step1-4 > step5 > rejected
         * - ความเร่งด่วน: รายงานค้างนาน → น้ำหนักเพิ่มขึ้น
         */

        // พารามิเตอร์พื้นฐานของ Kernel Density Estimation
        const n = reports.length;  // จำนวนข้อมูลจุดทั้งหมด (n)
        const h = 0.01;           // bandwidth (h) - ควบคุมความนุ่มนวลของ heat map
                                  // h เล็ก = เฉียบคม, h ใหญ่ = เบลอ

        // คำนวณอายุของรายงาน (วัน)
        const reportAge = Math.max(1, Math.floor((Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24)));

        // คำนวณน้ำหนักตามสถานะใหม่
        let statusWeight = 1;
        switch (report.status) {
            case 'step1': statusWeight = 4; break;  // เพิ่งยื่น - น้ำหนักสูงสุด
            case 'step2': statusWeight = 3.5; break; // กำลังตรวจสอบ
            case 'step3': statusWeight = 3; break;  // รอดำเนินการ
            case 'step4': statusWeight = 2.5; break; // กำลังดำเนินการ
            case 'step5': statusWeight = 1; break;  // เสร็จแล้ว - น้ำหนักต่ำ
            case 'rejected': statusWeight = 0.5; break; // ปฏิเสธ - น้ำหนักต่ำสุด
            default: statusWeight = 2;
        }

        // เพิ่มน้ำหนักสำหรับรายงานค้างนาน
        const urgencyMultiplier = report.is_overdue ? 1.5 : 1;

        /*
         * การคำนวณน้ำหนักขั้นสุดท้าย
         * ────────────────────────────────────────────────────────────
         * 
         * สูตรพื้นฐาน: f(x) = (1/nh) * Σ K((x-xi)/h)
         * 
         * ในที่นี้เราปรับปรุงเป็น:
         * f(x) = [(1/nh) * K(0,h)] * [statusWeight * urgencyMultiplier / √reportAge]
         * 
         * โดยแยกเป็นส่วน:
         * 1. densityValue     = (1/nh) * K(0,h)     ← ค่าพื้นฐานจาก KDE
         * 2. statusWeight     = น้ำหนักตามสถานะ      ← ความสำคัญตามขั้นตอน
         * 3. urgencyMultiplier = ตัวคูณความเร่งด่วน  ← รายงานค้างนาน
         * 4. reportAge        = อายุรายงาน (วัน)      ← รายงานใหม่สำคัญกว่า
         * 
         * เหตุผลของการปรับปรุง:
         * ────────────────────────────────────────────────────────────
         * - KDE แบบดั้งเดิมคำนวณความหนาแน่นของจุดเท่านั้น
         * - ระบบรายงานต้องการน้ำหนักตามความสำคัญและความเร่งด่วน
         * - รายงานใหม่และค้างนานควรได้รับความสนใจมากกว่า
         */
        
        // 1. คำนวณค่าพื้นฐานจาก Kernel Density Estimation
        const densityValue = (1 / (n * h)) * gaussianKernel(0, h);
        
        // 2. รวมปัจจัยเพิ่มเติมเข้าไปในการคำนวณ
        const adjustedWeight = (statusWeight * urgencyMultiplier / Math.sqrt(reportAge)) * densityValue;
        
        // 3. ปรับค่าให้อยู่ในช่วง 1-10 เพื่อความเหมาะสมในการแสดงผล Heat Map
        const finalWeight = adjustedWeight * 100;  // ขยายค่าให้เห็นชัดขึ้น
        
        return Math.max(1, Math.min(10, finalWeight));
    };

    // Gaussian Kernel function - ฟังก์ชันเคอร์เนลแบบเกาส์เซียน
    const gaussianKernel = (x: number, h: number) => {
        /*
         * Gaussian Kernel Function: K(u) = (1/√(2π)) * e^(-u²/2)
         * 
         * คำอธิบายตัวแปร:
         * ────────────────────────────────────────────────────────────
         * K(u)   = ค่าที่ได้จากฟังก์ชันเคอร์เนล (Kernel value)
         * u      = (x-xi)/h ระยะห่างมาตรฐาน (Standardized distance)
         * x      = ตำแหน่งที่ต้องการคำนวณ (Target position)  
         * xi     = ตำแหน่งจุดข้อมูล (Data point position)
         * h      = bandwidth (ค่าการกระจาย)
         * π      = pi (3.14159...)
         * e      = ค่าคงที่ออยเลอร์ (2.71828...)
         * 
         * หลักการทำงาน:
         * ────────────────────────────────────────────────────────────
         * 1. คำนวณระยะห่างมาตรฐาน u = (x-xi)/h
         * 2. ใช้ฟังก์ชันเกาส์เซียน (Bell curve) คำนวณอิทธิพล
         * 3. จุดใกล้ → ค่าสูง, จุดไกล → ค่าต่ำ (ลดลงแบบ exponential)
         * 
         * ผลลัพธ์:
         * ────────────────────────────────────────────────────────────
         * - ระยะห่าง = 0 → ค่าสูงสุด ≈ 0.399
         * - ระยะห่างเพิ่มขึ้น → ค่าลดลงแบบโค้งเกาส์เซียน
         * - ระยะห่างมาก → ค่าเข้าใกล้ 0
         */
        const u = x / h;  // คำนวณระยะห่างมาตรฐาน
        const coefficient = 1 / Math.sqrt(2 * Math.PI);  // ค่าคงที่ 1/√(2π)
        const exponential = Math.exp(-0.5 * Math.pow(u, 2));  // e^(-u²/2)
        
        return coefficient * exponential;
    };



    // ฟังก์ชันแปลงสถานะเป็นภาษาไทย
    const getStatusText = (status: string) => {
        switch (status) {
            case 'step1': return 'เริ่มยื่นคำร้อง';
            case 'step2': return 'ตรวจสอบข้อมูล';
            case 'step3': return 'รอดำเนินการ';
            case 'step4': return 'กำลังดำเนินการ';
            case 'step5': return 'เสร็จสิ้น';
            case 'rejected': return 'ปฏิเสธ';
            default: return 'ไม่ทราบสถานะ';
        }
    };



    return (
        <div className={style.dashboardContainer}>
            {/* Header Stats - งานหลักแสดงอยู่เสมอ ไม่หลุด */}
            <div className={style.statsSection}>
                <div className={style.statCard}>
                    <div className={style.statIcon}>📊</div>
                    <div className={style.statContent}>
                        <h3>{stats.totalReports}</h3>
                        <p>รายงานทั้งหมด</p>
                    </div>
                </div>
                <div className={style.statCard}>
                    <div className={style.statIcon}>⏳</div>
                    <div className={style.statContent}>
                        <h3>{stats.pendingReports}</h3>
                        <p>กำลังดำเนินการ</p>
                    </div>
                </div>
                <div className={style.statCard}>
                    <div className={style.statIcon}>✅</div>
                    <div className={style.statContent}>
                        <h3>{stats.resolvedReports}</h3>
                        <p>เสร็จสิ้นแล้ว</p>
                    </div>
                </div>
                <div className={style.statCard}>
                    <div className={style.statIcon}>📅</div>
                    <div className={style.statContent}>
                        <h3>{stats.todayReports}</h3>
                        <p>รายงานวันนี้</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={style.mainContent}>
                {/* Map Section - ซ้าย */}
                <div className={style.mapSection}>
                    <div className={style.sectionHeader}>
                        <h2>Heat Map รายงานปัญหา</h2>
                        {loadingReports ? (
                            <div className={style.loading}>กำลังโหลด...</div>
                        ) : reports.length === 0 ? (
                            <div className={style.noDataMessage}>
                                <p>🗺️ ไม่สามารถแสดงข้อมูลรายงานได้ในขณะนี้</p>
                                <small>กรุณาเข้าสู่ระบบ Heat Map จะแสดงเมื่อมีรายงานปัญหาจากผู้ใช้งาน</small>
                            </div>
                        ) : null}
                    </div>
                    <div className={style.mapContainer} ref={mapContainer}></div>
                </div>

                {/* Right Sidebar - ขวา */}
                <div className={style.rightSidebar}>
                    {/* Legend Section - ขวาล่าง */}
                    <div className={style.legendSection}>
                        <div className={style.sectionHeader}>
                            <h2>Legend ความหนาแน่นรายงาน</h2>
                        </div>
                        <div className={style.legendContainer}>
                            <div className={style.legendScale}>
                                <div className={style.scaleBar}>
                                    <div className={style.scaleGradient}></div>
                                </div>
                                <div className={style.scaleLabels}>
                                    <span>น้อย</span>
                                    <span>มาก</span>
                                </div>
                            </div>
                            <div className={style.legendItems}>
                                <div className={style.legendItem}>
                                    <div className={style.legendColor} style={{ backgroundColor: 'rgb(31, 81, 140)' }}></div>
                                    <span>ความหนาแน่นต่ำ</span>
                                </div>
                                <div className={style.legendItem}>
                                    <div className={style.legendColor} style={{ backgroundColor: 'rgb(49, 163, 84)' }}></div>
                                    <span>ความหนาแน่นปานกลาง</span>
                                </div>
                                <div className={style.legendItem}>
                                    <div className={style.legendColor} style={{ backgroundColor: 'rgb(255, 187, 34)' }}></div>
                                    <span>ความหนาแน่นสูง</span>
                                </div>
                                <div className={style.legendItem}>
                                    <div className={style.legendColor} style={{ backgroundColor: 'rgb(255, 141, 60)' }}></div>
                                    <span>ความหนาแน่นสูงมาก</span>
                                </div>
                                <div className={style.legendItem}>
                                    <div className={style.legendColor} style={{ backgroundColor: 'rgb(227, 74, 51)' }}></div>
                                    <span>ความหนาแน่นสูงสุด</span>
                                </div>
                            </div>
                            <div className={style.legendNote}>
                                <small>🔍 ซูมเข้าเพื่อดูรายละเอียดแต่ละจุดในแผนที่</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
