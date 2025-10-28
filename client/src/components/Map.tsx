import styles from "./styles/Map.module.css";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router';
import { getReports, getReportById } from '../services/reportService';
import Modal from './Modal';
import ReportForm from './ReportForm';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

// Interface สำหรับข้อมูล report
interface Report {
    report_id: number;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    location_detail: string;
    status: string;
    problem_type: string;
    created_at: string;
    images?: Array<{
        image_id: number;
        filename: string;
        original_name: string;
        file_size: number;
        mime_type: string;
        uploaded_at: string;
    }>;
}

const Map = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const initialized = useRef<boolean>(false);
    const [mapKey, setMapKey] = useState<number>(0);
    const [reports, setReports] = useState<Report[]>([]);
    const [loadingReports, setLoadingReports] = useState<boolean>(false);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    
    // Modal และ form states
    const [showReportForm, setShowReportForm] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);

    // ฟังก์ชันดึงข้อมูล reports จาก API
    const fetchReports = async () => {
        try {
            setLoadingReports(true);
            const data: Report[] = await getReports();
            
            // ดึงข้อมูลรูปภาพสำหรับแต่ละ report
            const reportsWithImages = await Promise.all(
                data.map(async (report) => {
                    try {
                        const reportDetail = await getReportById(report.report_id);
                        return { ...report, images: reportDetail.images || [] };
                    } catch (error) {
                        console.error(`Error fetching images for report ${report.report_id}:`, error);
                        return { ...report, images: [] };
                    }
                })
            );
            
            setReports(reportsWithImages);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoadingReports(false);
        }
    };

    // ฟังก์ชันลบมาร์กเกอร์เก่าทั้งหมด
    const clearMarkers = () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
    };

    // ฟังก์ชันเพิ่มมาร์กเกอร์จากข้อมูล reports
    const addMarkersToMap = async (reportsData: Report[]) => {
        if (!map.current) return;

        // ลบมาร์กเกอร์เก่า
        clearMarkers();

        for (const report of reportsData) {
            if (!map.current) return;

            // ดึงข้อมูลรูปภาพจาก API
            let imageGallery = '';
            try {
                console.log('Fetching details for report:', report.report_id);
                const response = await fetch(`${API_BASE_URL}/api/reports/${report.report_id}/images`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const images = await response.json();
                console.log('Images for report', report.report_id, ':', images);
                
                if (images && images.length > 0) {
                    
                    imageGallery = `
                        <div style="margin: 12px 0; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                            <p style="margin: 0 0 8px 0; color: #374151; font-size: 13px; font-weight: bold;">รูปภาพประกอบ </p>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 8px;">
                                ${images.slice(0, 6).map((image: any, index: number) => {
                                    // หมายเหตุ: image_path ที่ได้จาก backend มี /uploads/ อยู่แล้ว ไม่ต้องต่อซ้ำ
                                    // ตัวอย่าง: image.image_path = /uploads/image-123456.jpg
                                    // ดังนั้นควรใช้แบบนี้
                                    const imageUrl = `${API_BASE_URL}${image.image_path}`;
                                    console.log('Image URL:', imageUrl, 'for image:', image);
                                    return `
                                        <div style="position: relative; ${index >= 5 && images.length > 6 ? 'cursor: pointer;' : ''}">
                                            <img 
                                                src="${imageUrl}" 
                                                alt="${image.original_name || 'รูปภาพรายงาน'}"
                                                style="
                                                    width: 100%; 
                                                    height: 70px; 
                                                    object-fit: cover; 
                                                    border-radius: 6px; 
                                                    border: 2px solid #e5e7eb;
                                                    cursor: pointer;
                                                    transition: all 0.2s ease;
                                                "
                                                onclick="window.open('${imageUrl}', '_blank')"
                                                onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='scale(1.05)'"
                                                onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='scale(1)'"
                                                onerror="console.error('Failed to load image:', '${imageUrl}'); this.style.display='none'; this.nextSibling.style.display='flex'"
                                                title="คลิกเพื่อดูรูปขนาดเต็ม"
                                            />
                                            <div style="
                                                display: none;
                                                width: 100%; 
                                                height: 70px; 
                                                background: #f3f4f6; 
                                                border-radius: 6px; 
                                                border: 2px solid #e5e7eb;
                                                align-items: center;
                                                justify-content: center;
                                                font-size: 10px;
                                                color: #6b7280;
                                                flex-direction: column;
                                            ">
                                                <div>❌ ไม่สามารถโหลดรูป</div>
                                                <div style="font-size: 8px; margin-top: 2px;">${image.original_name || 'ไม่ทราบชื่อไฟล์'}</div>
                                            </div>
                                            ${index === 5 && images.length > 6 ? `
                                                <div style="
                                                    position: absolute;
                                                    top: 0; left: 0; right: 0; bottom: 0;
                                                    background: rgba(0,0,0,0.7);
                                                    border-radius: 6px;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    color: white;
                                                    font-weight: bold;
                                                    font-size: 12px;
                                                    cursor: pointer;
                                                " onclick="event.stopPropagation(); alert('มีรูปภาพทั้งหมด ${images.length} รูป\\nคลิกรูปภาพเพื่อดูแต่ละรูป')">
                                                    +${images.length - 6}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            <p style="margin: 6px 0 0 0; font-size: 11px; color: #6b7280; font-style: italic;">
                                💡 คลิกรูปภาพเพื่อดูขนาดเต็มจอ(แบบเต็มจอจริงๆ)
                            </p>
                        </div>
                    `;
                } else {
                    console.log('No images found for report', report.report_id);
                }
            } catch (error) {
                console.error('Error fetching report images:', error);
                imageGallery = `
                    <div style="margin: 12px 0; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px; font-style: italic;">
                            ⚠️ ไม่สามารถโหลดรูปภาพได้
                        </p>
                    </div>
                `;
            }

            // สร้าง popup content
            const popupContent = `
                <div style="font-family: Kanit, sans-serif; max-width: 300px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${report.title}</h3>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 12px;">
                        <strong>ประเภท:</strong> ${report.problem_type || 'ไม่ระบุประเภท'}
                    </p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 12px;">
                        <strong>สถานะ:</strong> 
                        <span style="color: ${report.status === 'รอดำเนินการ' ? '#ef4444' : report.status === 'กำลังดำเนินการ' ? '#f59e0b' : '#10b981'};">
                            ${report.status}
                        </span>
                    </p>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 12px;">
                        <strong>วันที่:</strong> ${new Date(report.created_at).toLocaleDateString('th-TH')}
                    </p>
                    <p style="margin: 8px 0 4px 0; color: #374151; font-size: 13px;">${report.description}</p>
                    ${report.location_detail ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px;"><strong>ตำแหน่ง:</strong> ${report.location_detail}</p>` : ''}
                    ${imageGallery}
                </div>
            `;

            // สร้าง popup
            const popup = new maplibregl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false
            }).setHTML(popupContent);

            // สร้างมาร์กเกอร์
            const marker = new maplibregl.Marker({
                color: report.status === 'รอดำเนินการ' ? '#ef4444' : 
                       report.status === 'กำลังดำเนินการ' ? '#f59e0b' : '#10b981'
            })
            .setLngLat([report.longitude, report.latitude])
            .setPopup(popup)
            .addTo(map.current);

            // เก็บ reference ของมาร์กเกอร์
            markersRef.current.push(marker);
        }
    };

    useEffect(() => {
        // ป้องกันการสร้าง map หลายครั้ง
        if (mapContainer.current && !map.current && !initialized.current) {
            initialized.current = true;

            // ตรวจสอบว่า container มีขนาดที่เหมาะสม
            console.log('Map container dimensions:', {
                width: mapContainer.current.offsetWidth,
                height: mapContainer.current.offsetHeight
            });

            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    sources: {
                        'osm': {
                            type: 'raster',
                            tiles: [
                                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                            ],
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
                center: [100.5018, 13.7563], // กรุงเทพมหานคร
                zoom: 5,
                pitch: 0,
                bearing: 0
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

            // สร้าง Search Control
            class SearchControl {
                _map: maplibregl.Map | undefined;
                _container!: HTMLDivElement;

                onAdd(map: maplibregl.Map) {
                    this._map = map;
                    this._container = document.createElement('div');
                    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
                    this._container.style.backgroundColor = 'white';
                    this._container.style.padding = '8px';
                    this._container.style.borderRadius = '4px';
                    this._container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

                    const searchContainer = document.createElement('div');
                    searchContainer.style.display = 'flex';
                    searchContainer.style.gap = '4px';

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.placeholder = 'ค้นหาสถานที่...';
                    input.style.border = '1px solid #ddd';
                    input.style.borderRadius = '3px';
                    input.style.padding = '4px 8px';
                    input.style.fontSize = '12px';
                    input.style.width = '180px';
                    input.style.fontFamily = 'Kanit, Noto Sans Thai, sans-serif';

                    const button = document.createElement('button');
                    button.innerHTML = '🔍';
                    button.style.border = '1px solid #ddd';
                    button.style.borderRadius = '3px';
                    button.style.padding = '4px 8px';
                    button.style.backgroundColor = '#white';
                    button.style.color = 'white';
                    button.style.cursor = 'pointer';
                    button.style.fontSize = '12px';

                    const searchFunction = async () => {
                        const query = input.value.trim();
                        if (!query) return;

                        try {
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
                            );
                            const data = await response.json();

                            if (data && data.length > 0) {
                                const lat = parseFloat(data[0].lat);
                                const lng = parseFloat(data[0].lon);

                                map.flyTo({
                                    center: [lng, lat],
                                    zoom: 14,
                                    duration: 2000
                                });
                            } else {
                                alert('ไม่พบสถานที่ที่ค้นหา');
                            }
                        } catch (error) {
                            console.error('Error searching:', error);
                            alert('เกิดข้อผิดพลาดในการค้นหา');
                        }
                    };

                    button.onclick = searchFunction;
                    input.onkeypress = (e) => {
                        if (e.key === 'Enter') {
                            searchFunction();
                        }
                    };

                    searchContainer.appendChild(input);
                    searchContainer.appendChild(button);
                    this._container.appendChild(searchContainer);

                    return this._container;
                }

                onRemove() {
                    this._container.parentNode?.removeChild(this._container);
                    this._map = undefined;
                }
            }

            // เพิ่ม search control ไปที่แมพ
            map.current.addControl(new SearchControl(), 'top-left');

            // สร้าง Style Switcher Control
            class StyleSwitcherControl {
                _map: maplibregl.Map | undefined;
                _container!: HTMLDivElement;
                _button!: HTMLButtonElement;
                _dropdown!: HTMLDivElement;
                _currentStyle: string = 'osm';

                onAdd(map: maplibregl.Map) {
                    this._map = map;
                    this._container = document.createElement('div');
                    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
                    this._container.style.position = 'relative';

                    // สร้างปุ่มหลัก
                    this._button = document.createElement('button');
                    this._button.className = 'maplibregl-ctrl-icon';
                    this._button.style.width = '30px';
                    this._button.style.height = '30px';
                    this._button.style.border = 'none';
                    this._button.style.cursor = 'pointer';
                    this._button.style.backgroundColor = 'white';
                    this._button.style.borderRadius = '3px';
                    this._button.style.display = 'flex';
                    this._button.style.alignItems = 'center';
                    this._button.style.justifyContent = 'center';
                    this._button.style.fontSize = '12px';
                    this._button.style.fontWeight = 'bold';
                    // preview tile จริงตามสไตล์ที่เลือก
                    const previewUrls: Record<string, string> = {
                        osm: 'https://a.tile.openstreetmap.org/5/17/12.png',
                        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/17/12',
                        streetside: 'https://a.tile.openstreetmap.org/5/17/13.png'
                    };
                    const previewImg = document.createElement('img');
                    previewImg.src = previewUrls[this._currentStyle as keyof typeof previewUrls] || previewUrls.osm;
                    previewImg.alt = 'Map preview';
                    previewImg.style.width = '24px';
                    previewImg.style.height = '24px';
                    previewImg.style.borderRadius = '2px';
                    previewImg.style.border = '1px solid #ddd';
                    this._button.appendChild(previewImg);
                    this._button.title = 'เปลี่ยนสไตล์แมพ';

                    console.log('Creating Style Switcher button...');

                    // สร้าง dropdown
                    this._dropdown = document.createElement('div');
                    this._dropdown.style.position = 'absolute';
                    this._dropdown.style.top = '35px';
                    this._dropdown.style.left = '-120px'; // เปลี่ยนจาก right เป็น left เมื่ออยู่ที่ top-right
                    this._dropdown.style.backgroundColor = 'white';
                    this._dropdown.style.border = '1px solid #ccc';
                    this._dropdown.style.borderRadius = '4px';
                    this._dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    this._dropdown.style.display = 'none';
                    this._dropdown.style.zIndex = '1000';
                    this._dropdown.style.minWidth = '150px';

                    const styles = [
                        {
                            name: 'Road',
                            value: 'osm',
                            preview: 'https://a.tile.openstreetmap.org/5/17/12.png' // ตัวอย่าง tile จริง
                        },
                        {
                            name: 'Satellite',
                            value: 'satellite',
                            preview: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/17/12' // ตัวอย่าง tile จริง
                        },
                        {
                            name: 'Dark',
                            value: 'dark',
                            preview: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark/5/17/13.png' // ตัวอย่าง tile preview ของแผนที่สีดำ
                        }
                    ];

                    styles.forEach(style => {
                        const option = document.createElement('div');
                        option.style.display = 'flex';
                        option.style.alignItems = 'center';
                        option.style.padding = '8px 12px';
                        option.style.cursor = 'pointer';
                        option.style.borderBottom = '1px solid #eee';
                        option.style.fontFamily = 'Kanit, Noto Sans Thai, sans-serif';
                        option.style.fontSize = '12px';

                        const preview = document.createElement('div');
                        preview.style.width = '24px';
                        preview.style.height = '24px';
                        preview.style.backgroundImage = `url(${style.preview})`;
                        preview.style.backgroundSize = 'cover';
                        preview.style.marginRight = '8px';
                        preview.style.border = '1px solid #ddd';
                        preview.style.borderRadius = '2px';

                        const label = document.createElement('span');
                        label.textContent = style.name;

                        option.appendChild(preview);
                        option.appendChild(label);

                        option.addEventListener('mouseover', () => {
                            option.style.backgroundColor = '#f5f5f5';
                        });

                        option.addEventListener('mouseout', () => {
                            option.style.backgroundColor = 'transparent';
                        });

                        option.addEventListener('click', () => {
                            this.changeStyle(style.value, style.preview);
                            this._dropdown.style.display = 'none';
                        });

                        this._dropdown.appendChild(option);
                    });

                    // Event สำหรับแสดง/ซ่อน dropdown
                    this._button.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this._dropdown.style.display = this._dropdown.style.display === 'none' ? 'block' : 'none';
                    });

                    // ซ่อน dropdown เมื่อคลิกข้างนอก
                    document.addEventListener('click', () => {
                        this._dropdown.style.display = 'none';
                    });

                    this._container.appendChild(this._button);
                    this._container.appendChild(this._dropdown);

                    console.log('Style Switcher Control created and added');
                    return this._container;
                }

                changeStyle(selectedStyle: string, _preview: string) {
                    let newStyle;
                    switch (selectedStyle) {
                        case 'satellite':
                            newStyle = {
                                version: 8 as const,
                                sources: {
                                    'satellite': {
                                        type: 'raster' as const,
                                        tiles: [
                                            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                                        ],
                                        tileSize: 256,
                                        attribution: '© Esri'
                                    }
                                },
                                layers: [
                                    {
                                        id: 'satellite',
                                        type: 'raster' as const,
                                        source: 'satellite'
                                    }
                                ]
                            };
                            break;
                        case 'dark':
                            newStyle = {
                                version: 8 as const,
                                sources: {
                                    'dark': {
                                        type: 'raster' as const,
                                        tiles: [
                                            'https://tiles.stadiamaps.com/styles/alidade_smooth_dark/{z}/{x}/{y}.png'
                                        ],
                                        tileSize: 256,
                                        attribution: '© Stadia Maps, © OpenMapTiles, © OpenStreetMap contributors'
                                    }
                                },
                                layers: [
                                    {
                                        id: 'dark',
                                        type: 'raster' as const,
                                        source: 'dark'
                                    }
                                ]
                            };
                            break;
                        default: // osm
                            newStyle = {
                                version: 8 as const,
                                sources: {
                                    'osm': {
                                        type: 'raster' as const,
                                        tiles: [
                                            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                                        ],
                                        tileSize: 256,
                                        attribution: '© OpenStreetMap contributors'
                                    }
                                },
                                layers: [
                                    {
                                        id: 'osm',
                                        type: 'raster' as const,
                                        source: 'osm'
                                    }
                                ]
                            };
                    }

                    if (this._map) {
                        this._map.setStyle(newStyle);
                        // อัปเดต preview เมื่อเปลี่ยนสไตล์
                        const previewUrls = {
                          osm: 'https://a.tile.openstreetmap.org/5/17/12.png',
                          satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/17/12',
                          dark: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark/5/17/13.png'
                        };
                        const previewImg = this._button.querySelector('img');
                        if (previewImg) {
                            previewImg.src = previewUrls[selectedStyle as keyof typeof previewUrls] || previewUrls.osm;
                        }
                        this._currentStyle = selectedStyle;
                    }
                }

                onRemove() {
                    this._container.parentNode?.removeChild(this._container);
                    this._map = undefined;
                }
            }

            // เพิ่ม style switcher control ไปที่แมพ
            map.current.addControl(new StyleSwitcherControl(), 'top-right');
            console.log('Style Switcher Control added to map');

            // เมื่อแมพโหลดเสร็จ
            map.current.on('load', () => {
                console.log('Map loaded successfully');
                if (map.current) {
                    map.current.resize();
                    // โหลดข้อมูล reports เมื่อแมพพร้อม
                    fetchReports();
                }
            });

            // เพิ่ม event listener สำหรับการคลิกเพื่อเลือกตำแหน่ง
            map.current.on('click', (e) => {
                if (user) { // เฉพาะผู้ใช้ที่เข้าสู่ระบบ
                    const { lng, lat } = e.lngLat;
                    setSelectedLocation({ latitude: lat, longitude: lng });
                    setShowReportForm(true);
                }
            });

            // เพิ่ม error handling
            map.current.on('error', (e) => {
                console.error('Map error:', e);
            });

            // ปรับขนาดแมพเมื่อขนาดหน้าต่างเปลี่ยน
            const handleResize = () => {
                if (map.current) {
                    map.current.resize();
                }
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                if (map.current) {
                    console.log('Cleaning up map...');
                    map.current.remove();
                    map.current = null;
                }
                initialized.current = false;
            };
        }

        // ถ้า container หายไปแล้วกลับมาใหม่ ให้ reinitialize
        return () => {
            if (map.current && mapContainer.current && !mapContainer.current.hasChildNodes()) {
                console.log('Container lost, cleaning up...');
                map.current.remove();
                map.current = null;
                initialized.current = false;
            }
        };
    }, []);

    // เพิ่ม useEffect สำหรับตรวจสอบการเปลี่ยนแปลงของ container
    useEffect(() => {
        // ตรวจสอบทุก 1 วินาทีว่า map ยังแสดงอยู่หรือไม่
        const interval = setInterval(() => {
            if (mapContainer.current && (!map.current || !mapContainer.current.hasChildNodes())) {
                console.log('Map lost, forcing re-render...');
                setMapKey(prev => prev + 1);
                initialized.current = false;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Reset เมื่อ component mount ใหม่
    useEffect(() => {
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
            initialized.current = false;
        };
    }, [mapKey]);

    // useEffect สำหรับเพิ่มมาร์กเกอร์เมื่อได้รับข้อมูล reports
    useEffect(() => {
        const loadMarkers = async () => {
            if (reports.length > 0 && map.current) {
                await addMarkersToMap(reports);
            }
        };
        loadMarkers();
    }, [reports]); // dependency คือ reports

    return (
        <div className={styles.mapContainer} key={mapKey}>
            {/* แสดงสถานะการโหลด */}
            {loadingReports && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    zIndex: 1000,
                    fontFamily: 'Kanit, sans-serif',
                    fontSize: '14px',
                    color: '#374151'
                }}>
                    กำลังโหลดข้อมูลรายงาน...
                </div>
            )}

            {/* คำแนะนำสำหรับผู้ใช้ที่เข้าสู่ระบบ */}
            {user && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    background: 'rgba(59, 130, 246, 0.9)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    zIndex: 1000,
                    fontFamily: 'Kanit, sans-serif',
                    fontSize: '12px',
                    maxWidth: '200px'
                }}>
                    💡 คลิกบนแมพเพื่อแจ้งปัญหาใหม่ 
                </div>
            )}
            
            {/* แมพ */}
            <div
                ref={mapContainer}
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '400px' // เพิ่ม minimum height
                }}
            />

            {/* Modal สำหรับฟอร์มรายงาน */}
            <Modal 
                isOpen={showReportForm} 
                onClose={() => {
                    setShowReportForm(false);
                    setSelectedLocation(null);
                }}
                title="แจ้งปัญหาใหม่"
            >
                <ReportForm
                    initialLocation={selectedLocation || undefined}
                    onSuccess={() => {
                        setShowReportForm(false);
                        setSelectedLocation(null);
                        fetchReports(); // รีเฟรชข้อมูลบนแมพ
                        // นำทางไปหน้า report หลังส่งรายงานเสร็จ
                        navigate('/report');
                    }}
                    onCancel={() => {
                        setShowReportForm(false);
                        setSelectedLocation(null);
                    }}
                />
            </Modal>
        </div>
    );
};

export default Map;
