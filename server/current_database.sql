--
-- PostgreSQL database dump
--

\restrict 977Y6nyj4A7nt55gHovxfGWPFN31Kbl8j7HTxKT7PGdlGn9bjtV0tBYsqg6qm5D

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-10-25 00:17:08

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 18723)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5968 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 3 (class 3079 OID 19803)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5969 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 355 (class 1255 OID 19957)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 227 (class 1259 OID 19835)
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    admin_id integer NOT NULL,
    user_id integer,
    admin_level character varying(50),
    department character varying(100),
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 19834)
-- Name: admin_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_admin_id_seq OWNER TO postgres;

--
-- TOC entry 5970 (class 0 OID 0)
-- Dependencies: 226
-- Name: admin_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_admin_id_seq OWNED BY public.admin.admin_id;


--
-- TOC entry 243 (class 1259 OID 20091)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    message_id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    user_id integer,
    report_id integer,
    message text NOT NULL,
    sender_type character varying(50) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 20090)
-- Name: chat_messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_message_id_seq OWNER TO postgres;

--
-- TOC entry 5971 (class 0 OID 0)
-- Dependencies: 242
-- Name: chat_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_message_id_seq OWNED BY public.chat_messages.message_id;


--
-- TOC entry 237 (class 1259 OID 19929)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer,
    report_id integer,
    title character varying(255) NOT NULL,
    message text,
    type character varying(50) DEFAULT 'info'::character varying,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 19928)
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO postgres;

--
-- TOC entry 5972 (class 0 OID 0)
-- Dependencies: 236
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- TOC entry 231 (class 1259 OID 19862)
-- Name: problem_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.problem_type (
    problem_type_id integer NOT NULL,
    type_name character varying(100) NOT NULL,
    description character varying(255),
    color_code character varying(7),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.problem_type OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 19861)
-- Name: problem_type_problem_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.problem_type_problem_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.problem_type_problem_type_id_seq OWNER TO postgres;

--
-- TOC entry 5973 (class 0 OID 0)
-- Dependencies: 230
-- Name: problem_type_problem_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.problem_type_problem_type_id_seq OWNED BY public.problem_type.problem_type_id;


--
-- TOC entry 233 (class 1259 OID 19871)
-- Name: report; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report (
    report_id integer NOT NULL,
    user_id integer,
    problem_type_id integer,
    title character varying(255) NOT NULL,
    description text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    location_detail character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp without time zone,
    current_step integer DEFAULT 1,
    step1_completed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    step2_completed_at timestamp without time zone,
    step3_completed_at timestamp without time zone,
    step4_completed_at timestamp without time zone,
    step5_completed_at timestamp without time zone,
    rejected_at timestamp without time zone,
    CONSTRAINT report_current_step_check CHECK (((current_step >= 1) AND (current_step <= 5))),
    CONSTRAINT report_status_check CHECK (((status)::text = ANY ((ARRAY['รอตรวจสอบ'::character varying, 'กำลังตรวจสอบ'::character varying, 'รอดำเนินการ'::character varying, 'กำลังดำเนินการ'::character varying, 'เสร็จสิ้น'::character varying, 'ปฏิเสธ'::character varying, 'step1'::character varying, 'step2'::character varying, 'step3'::character varying, 'step4'::character varying, 'step5'::character varying, 'pending'::character varying, 'in_progress'::character varying, 'resolved'::character varying, 'completed'::character varying, 'rejected'::character varying, 'reviewing'::character varying, 'waiting'::character varying, 'processing'::character varying, 'cancelled'::character varying, 'denied'::character varying])::text[])))
);


ALTER TABLE public.report OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 19821)
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(20),
    birth_date date,
    address text,
    province character varying(100),
    district character varying(100),
    subdistrict character varying(100),
    user_type character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying])::text[])))
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 19961)
-- Name: report_detail_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.report_detail_view AS
 SELECT r.report_id,
    r.title,
    r.description,
    r.latitude,
    r.longitude,
    r.location_detail,
    r.status,
    r.created_at,
    r.updated_at,
    u.first_name,
    u.last_name,
    u.email,
    pt.type_name AS problem_type,
    pt.color_code
   FROM ((public.report r
     JOIN public."user" u ON ((r.user_id = u.user_id)))
     JOIN public.problem_type pt ON ((r.problem_type_id = pt.problem_type_id)));


ALTER VIEW public.report_detail_view OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 20074)
-- Name: status_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.status_mapping (
    mapping_id integer NOT NULL,
    old_status character varying(50) NOT NULL,
    new_status character varying(50) NOT NULL,
    step_number integer,
    status_color character varying(7),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.status_mapping OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 20085)
-- Name: report_detail_with_status; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.report_detail_with_status AS
 SELECT r.report_id,
    r.user_id,
    r.problem_type_id,
    r.title,
    r.description,
    r.latitude,
    r.longitude,
    r.location_detail,
    r.status,
    r.current_step,
    r.step1_completed_at,
    r.step2_completed_at,
    r.step3_completed_at,
    r.step4_completed_at,
    r.step5_completed_at,
    r.rejected_at,
    r.created_at,
    r.updated_at,
    u.first_name,
    u.last_name,
    u.email,
    pt.type_name AS problem_type,
    pt.color_code,
        CASE r.current_step
            WHEN 1 THEN 'รอตรวจสอบ'::text
            WHEN 2 THEN 'กำลังตรวจสอบ'::text
            WHEN 3 THEN 'รอดำเนินการ'::text
            WHEN 4 THEN 'กำลังดำเนินการ'::text
            WHEN 5 THEN 'เสร็จสิ้น'::text
            ELSE 'ไม่ระบุ'::text
        END AS current_step_name,
    COALESCE(sm.status_color, '#999999'::character varying) AS status_color,
    COALESCE(sm.step_number, r.current_step, 1) AS mapped_step,
    COALESCE(sm.description, 'ไม่มีคำอธิบาย'::text) AS status_description,
        CASE
            WHEN ((r.current_step = 5) OR ((r.status)::text = 'เสร็จสิ้น'::text)) THEN 100
            ELSE ((COALESCE(sm.step_number, r.current_step, 1) - 1) * 25)
        END AS progress_percentage
   FROM (((public.report r
     JOIN public."user" u ON ((r.user_id = u.user_id)))
     JOIN public.problem_type pt ON ((r.problem_type_id = pt.problem_type_id)))
     LEFT JOIN public.status_mapping sm ON (((r.status)::text = (sm.new_status)::text)));


ALTER VIEW public.report_detail_with_status OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 19894)
-- Name: report_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_image (
    image_id integer NOT NULL,
    report_id integer,
    image_path character varying(500) NOT NULL,
    original_name character varying(255),
    file_size integer,
    mime_type character varying(100),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_image OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 19893)
-- Name: report_image_image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_image_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_image_image_id_seq OWNER TO postgres;

--
-- TOC entry 5974 (class 0 OID 0)
-- Dependencies: 234
-- Name: report_image_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_image_image_id_seq OWNED BY public.report_image.image_id;


--
-- TOC entry 232 (class 1259 OID 19870)
-- Name: report_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_report_id_seq OWNER TO postgres;

--
-- TOC entry 5975 (class 0 OID 0)
-- Dependencies: 232
-- Name: report_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_report_id_seq OWNED BY public.report.report_id;


--
-- TOC entry 239 (class 1259 OID 20073)
-- Name: status_mapping_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.status_mapping_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.status_mapping_mapping_id_seq OWNER TO postgres;

--
-- TOC entry 5976 (class 0 OID 0)
-- Dependencies: 239
-- Name: status_mapping_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.status_mapping_mapping_id_seq OWNED BY public.status_mapping.mapping_id;


--
-- TOC entry 229 (class 1259 OID 19849)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    setting_id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    description text,
    data_type character varying(20),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT system_settings_data_type_check CHECK (((data_type)::text = ANY ((ARRAY['STRING'::character varying, 'NUMBER'::character varying, 'BOOLEAN'::character varying, 'JSON'::character varying])::text[])))
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 19848)
-- Name: system_settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_setting_id_seq OWNER TO postgres;

--
-- TOC entry 5977 (class 0 OID 0)
-- Dependencies: 228
-- Name: system_settings_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_setting_id_seq OWNED BY public.system_settings.setting_id;


--
-- TOC entry 224 (class 1259 OID 19820)
-- Name: user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_user_id_seq OWNER TO postgres;

--
-- TOC entry 5978 (class 0 OID 0)
-- Dependencies: 224
-- Name: user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_user_id_seq OWNED BY public."user".user_id;


--
-- TOC entry 5717 (class 2604 OID 19838)
-- Name: admin admin_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN admin_id SET DEFAULT nextval('public.admin_admin_id_seq'::regclass);


--
-- TOC entry 5739 (class 2604 OID 20094)
-- Name: chat_messages message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN message_id SET DEFAULT nextval('public.chat_messages_message_id_seq'::regclass);


--
-- TOC entry 5733 (class 2604 OID 19932)
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- TOC entry 5722 (class 2604 OID 19865)
-- Name: problem_type problem_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problem_type ALTER COLUMN problem_type_id SET DEFAULT nextval('public.problem_type_problem_type_id_seq'::regclass);


--
-- TOC entry 5725 (class 2604 OID 19874)
-- Name: report report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report ALTER COLUMN report_id SET DEFAULT nextval('public.report_report_id_seq'::regclass);


--
-- TOC entry 5731 (class 2604 OID 19897)
-- Name: report_image image_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_image ALTER COLUMN image_id SET DEFAULT nextval('public.report_image_image_id_seq'::regclass);


--
-- TOC entry 5737 (class 2604 OID 20077)
-- Name: status_mapping mapping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_mapping ALTER COLUMN mapping_id SET DEFAULT nextval('public.status_mapping_mapping_id_seq'::regclass);


--
-- TOC entry 5720 (class 2604 OID 19852)
-- Name: system_settings setting_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN setting_id SET DEFAULT nextval('public.system_settings_setting_id_seq'::regclass);


--
-- TOC entry 5714 (class 2604 OID 19824)
-- Name: user user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN user_id SET DEFAULT nextval('public.user_user_id_seq'::regclass);


--
-- TOC entry 5948 (class 0 OID 19835)
-- Dependencies: 227
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (admin_id, user_id, admin_level, department, assigned_at, is_active) FROM stdin;
1	1	super_admin	IT Department	2025-09-05 17:24:06.265966	t
\.


--
-- TOC entry 5962 (class 0 OID 20091)
-- Dependencies: 243
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (message_id, session_id, user_id, report_id, message, sender_type, created_at) FROM stdin;
\.


--
-- TOC entry 5958 (class 0 OID 19929)
-- Dependencies: 237
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, user_id, report_id, title, message, type, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 5952 (class 0 OID 19862)
-- Dependencies: 231
-- Data for Name: problem_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.problem_type (problem_type_id, type_name, description, color_code, is_active, created_at) FROM stdin;
1	ถนนชำรุด	ปัญหาเกี่ยวกับถนนที่เสียหาย หลุมบ่อ	#FF6B6B	t	2025-09-05 17:24:06.265966
2	ไฟฟ้า	ปัญหาระบบไฟฟ้าสาธารณะ	#4ECDC4	t	2025-09-05 17:24:06.265966
3	น้ำ	ปัญหาน้ำประปา รั่วซึม น้ำท่วม	#45B7D1	t	2025-09-05 17:24:06.265966
4	อื่นๆ	ปัญหาอื่นๆ ที่ไม่อยู่ในหมวดหมู่ข้างต้น	#FFEAA7	t	2025-09-05 17:24:06.265966
5	ขยะ	ปัญหาเกี่ยวกับการทิ้งขยะ ขยะล้นถัง หรือขยะมูลฝอย	#FF6B6B	t	2025-10-03 16:12:57.38453
6	สิ่งก่อสร้าง	ปัญหาเกี่ยวกับโครงสร้าง อาคาร ถนน สะพาน หรือสิ่งปลูกสร้าง	#4ECDC4	t	2025-10-03 16:12:57.38453
9	ต้นไม้	ปัญหาเกี่ยวกับต้นไม้ กิ่งไม้หักล้ม ต้นไม้ป่วย หรือการตัดแต่งกิ่งไม้	#2ECC71	t	2025-10-03 16:15:43.569501
8	ดินถล่ม	ปัญหาเกี่ยวกับดินถล่ม ดินสไลด์ หรือความไม่มั่นคงของลาดเนินดิน	#8B4513	t	2025-10-03 16:12:57.38453
\.


--
-- TOC entry 5954 (class 0 OID 19871)
-- Dependencies: 233
-- Data for Name: report; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report (report_id, user_id, problem_type_id, title, description, latitude, longitude, location_detail, status, created_at, updated_at, resolved_at, current_step, step1_completed_at, step2_completed_at, step3_completed_at, step4_completed_at, step5_completed_at, rejected_at) FROM stdin;
1	2	1	ถนนเป็นหลุมใหญ่	ถนนหน้าบ้านเป็นหลุมใหญ่ รถผ่านลำบาก	13.75630000	100.50180000	กรุงเทพ หน้าบ้านเลขที่ 123 ถนนสุขุมวิท	เสร็จสิ้น	2025-09-05 17:24:06.265966	2025-10-20 00:50:22.808696	\N	1	2025-10-04 02:43:49.241553	\N	\N	\N	\N	\N
6	11	5	ขยะอุดตัน	ขยะอุดดันทางไหนของน้ำ	16.04995828	103.65371683	เส้นทางไปโรงเรียนสตรีศึกษาและด้านข้างของโรงพยาบาลร้อยเอ็ด	เสร็จสิ้น	2025-09-24 14:43:09.754885	2025-10-20 19:35:23.26203	\N	1	2025-10-04 02:43:49.241553	\N	\N	\N	\N	\N
2	3	3	ท่อประปาแตก	ท่อประปาแตกน้ำท่วมถนน	13.74630000	100.53180000	ซอยลาดพร้าว 15	เสร็จสิ้น	2025-09-05 17:24:06.265966	2025-10-08 18:47:38.433864	\N	1	2025-10-04 02:43:49.241553	\N	\N	\N	\N	\N
11	9	3	ระบายน้ำไม่ทัน	นำท่วมขังบ่อย	16.44044946	102.82889480	อุโมงก่อนถึงเซ้นทรัลขอนแก่น	รอดำเนินการ	2025-10-21 04:31:33.365426	2025-10-21 04:34:18.795308	\N	1	2025-10-21 04:31:33.365426	\N	\N	\N	\N	\N
15	12	2	ไฟดับ	หม้อไฟระเบิด	16.48173408	102.81606333	หน้าคาเฟ่แมว	กำลังตรวจสอบ	2025-10-22 13:57:39.972045	2025-10-22 14:10:27.755957	\N	1	2025-10-22 13:57:39.972045	\N	\N	\N	\N	\N
17	9	4	ฆตต	มีคนฆตต	16.48092663	102.80415682	หอพัฝั่งโคลัมโบ	กำลังตรวจสอบ	2025-10-24 23:50:52.950285	2025-10-24 23:51:35.206133	\N	1	2025-10-24 23:50:52.950285	\N	\N	\N	\N	\N
5	9	3	น้ำท่วมขังบ่อย	เวลาฝนตกตรงนี้ชอบท่วมขังบ่อยมากตกเบาๆก็ขัง	16.48647697	102.81611525	ถนนหน้าหอพักเดอะฟิวเจอร์	กำลังดำเนินการ	2025-09-24 13:55:23.776201	2025-10-15 22:45:44.548108	\N	1	2025-10-04 02:43:49.241553	\N	\N	\N	\N	\N
10	9	6	เสียงก่อสร้างดังยามวิกาล	การก่อสร้างเริ่มงานเร็วและเลิกงานช้า ทำให้ส่งเสียงรบกวน เซ็นทรัลขอนแก่น 2	16.46282831	102.83033524	สถานที่ ที่กำลังสร้างเซ็นทรัลกังสดาล	กำลังตรวจสอบ	2025-10-20 19:51:20.161469	2025-10-20 19:52:52.549493	\N	1	2025-10-20 19:51:20.161469	\N	\N	\N	\N	\N
8	8	8	ดินสไลด์ปิดเส้นทาง “กลอเซโล” แม่ฮ่องสอน	หลังฝนตกหนัก นักท่องเที่ยวยังติดค้างบนดอย	17.87715674	97.71621172	ใกล้บริเวณพื้นที่ตั้งแคมป์	กำลังตรวจสอบ	2025-10-15 23:03:33.142607	2025-10-15 23:09:36.971859	\N	1	2025-10-15 23:03:33.142607	\N	\N	\N	\N	\N
12	10	2	ไฟดับ	ได้ยินเสียงหม้อไฟฟ้าระเบิด	14.52150483	100.90687235	สี่แยกถนนใหญ่	เสร็จสิ้น	2025-10-22 13:38:14.925508	2025-10-22 13:44:39.986828	\N	1	2025-10-22 13:38:14.925508	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5956 (class 0 OID 19894)
-- Dependencies: 235
-- Data for Name: report_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_image (image_id, report_id, image_path, original_name, file_size, mime_type, updated_at) FROM stdin;
1	5	/uploads/images-1760160858524-82718361.png	สกรีนช็อต 2025-09-24 135502.png	1226541	image/png	2025-10-11 12:34:18.706033
2	8	/uploads/images-1760544832586-985462529.jpg	ดินไลด์.jpg	670802	image/jpeg	2025-10-15 23:13:52.803805
3	10	/uploads/image-1760964680201-996816230.jpg	central-campus1.jpg	341658	image/jpeg	2025-10-20 19:51:20.227165
4	11	/uploads/image-1760995893437-348203142.jpg	1-45.jpg	131970	image/jpeg	2025-10-21 04:31:33.46177
\.


--
-- TOC entry 5713 (class 0 OID 19045)
-- Dependencies: 220
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 5960 (class 0 OID 20074)
-- Dependencies: 240
-- Data for Name: status_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.status_mapping (mapping_id, old_status, new_status, step_number, status_color, description, created_at) FROM stdin;
1	step1	รอตรวจสอบ	1	#E91E63	ผู้ใช้ยื่นรายงานเข้าสู่ระบบ	2025-10-04 02:43:49.241553
2	step2	กำลังตรวจสอบ	2	#FF9800	เจ้าหน้าที่กำลังตรวจสอบข้อมูล	2025-10-04 02:43:49.241553
3	step3	รอดำเนินการ	3	#FFEB3B	รายงานอยู่ในคิวรอดำเนินการ	2025-10-04 02:43:49.241553
4	step4	กำลังดำเนินการ	4	#00BCD4	เจ้าหน้าที่กำลังดำเนินการแก้ไข	2025-10-04 02:43:49.241553
5	step5	เสร็จสิ้น	5	#4CAF50	ดำเนินการแก้ไขเสร็จสิ้นแล้ว	2025-10-04 02:43:49.241553
6	pending	รอตรวจสอบ	1	#E91E63	รอการตรวจสอบจากเจ้าหน้าที่	2025-10-04 02:43:49.241553
7	in_progress	กำลังดำเนินการ	4	#00BCD4	กำลังดำเนินการแก้ไขปัญหา	2025-10-04 02:43:49.241553
8	resolved	เสร็จสิ้น	5	#4CAF50	แก้ไขปัญหาเสร็จสิ้นแล้ว	2025-10-04 02:43:49.241553
9	completed	เสร็จสิ้น	5	#4CAF50	ดำเนินการเสร็จสมบูรณ์	2025-10-04 02:43:49.241553
10	rejected	ปฏิเสธ	0	#F44336	รายงานถูกปฏิเสธ	2025-10-04 02:43:49.241553
11	reviewing	กำลังตรวจสอบ	2	#FF9800	อยู่ระหว่างการทบทวนข้อมูล	2025-10-04 02:43:49.241553
12	waiting	รอดำเนินการ	3	#FFEB3B	รอการดำเนินการจากหน่วยงาน	2025-10-04 02:43:49.241553
13	processing	กำลังดำเนินการ	4	#00BCD4	อยู่ระหว่างการประมวลผล	2025-10-04 02:43:49.241553
14	cancelled	ปฏิเสธ	0	#F44336	ยกเลิกรายงาน	2025-10-04 02:43:49.241553
15	denied	ปฏิเสธ	0	#F44336	ไม่อนุมัติรายงาน	2025-10-04 02:43:49.241553
\.


--
-- TOC entry 5950 (class 0 OID 19849)
-- Dependencies: 229
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (setting_id, setting_key, setting_value, description, data_type, updated_at) FROM stdin;
1	app_name	ระบบรายงานปัญหา	ชื่อแอปพลิเคชัน	STRING	2025-09-05 17:24:06.265966
2	max_file_size	5242880	ขนาดไฟล์สูงสุด (bytes)	NUMBER	2025-09-05 17:24:06.265966
3	allowed_file_types	["jpg","jpeg","png","gif"]	ประเภทไฟล์ที่อนุญาต	JSON	2025-09-05 17:24:06.265966
4	auto_assign_admin	true	กำหนดแอดมินอัตโนมัติ	BOOLEAN	2025-09-05 17:24:06.265966
\.


--
-- TOC entry 5946 (class 0 OID 19821)
-- Dependencies: 225
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (user_id, email, password, first_name, last_name, phone, birth_date, address, province, district, subdistrict, user_type, created_at, updated_at) FROM stdin;
1	admin@gmail.com	1234	Admin	System	0812345678	\N	\N	\N	\N	\N	admin	2025-09-05 17:24:06.265966	2025-09-05 17:24:06.265966
2	kln@gmail.com	1234	กัลยาณี	บุญจันทร์	0823456789	\N	\N	\N	\N	\N	user	2025-09-05 17:24:06.265966	2025-09-05 17:24:06.265966
3	klnc@gmail.com	1234	ศิรินภา	ประเสริฐสังข์	0856982402	\N	\N	\N	\N	\N	user	2025-09-05 17:24:06.265966	2025-09-05 17:24:06.265966
4	kch@gmail.com	1234	กชกร	รอก่อน	0834567890	\N	\N	\N	\N	\N	user	2025-09-05 17:24:06.265966	2025-09-05 17:24:06.265966
5	postman.test@example.com	$2a$10$CYgL7STT9fYu.rv.K1Ov6eTVFfyMKLIRvuGjPe8HhfEMxJ2jAygom	Postman	Tester	081-999-8888	\N	\N	กรุงเทพมหานคร	เขตจตุจักร	\N	user	2025-09-07 19:13:56.898873	2025-09-07 19:13:56.898873
6	test@test.com	1234	Test	User	0812345678	\N	\N	\N	\N	\N	user	2025-09-21 14:26:48.821664	2025-09-21 14:26:48.821664
7	postman@test.com	1234	Postman	Test	0999999999	\N	\N	\N	\N	\N	user	2025-09-21 14:37:42.606492	2025-09-21 14:37:42.606492
8	Kanokwan@gmail.com	12345678	kanok	wan	0990293644	\N	\N	\N	\N	\N	admin	2025-09-22 15:28:26.143012	2025-09-22 15:28:26.143012
9	Kanokwan12@gmail.com	123456789	กนกวรรณ	แวดอุดม	0928744568	2003-03-11	\N	ร้อยเอ็ด	จังหาร	ดินดำ	admin	2025-09-22 15:35:01.612257	2025-09-22 15:35:01.612257
10	kavinn@gmail.com	123456789	เควิท	เนฺร์ท	0952486541	2025-09-22	\N	สระบุรี	เมือง	เหนือเมือง	user	2025-09-22 15:41:30.100834	2025-09-22 15:41:30.100834
11	Fangg@gmail.com	123456789	ฟาง	ข้าว	0684649332	2025-09-17	\N	ร้อยเอ็ด	เมือง	เหนือเมือง	user	2025-09-22 15:45:45.542964	2025-09-22 15:45:45.542964
12	cmd@gmail.com	123456789	คอมมาน	ไลน์	0000000000	2025-09-09	\N	ขอนแก่น	เมือง	ศิลา	user	2025-09-22 15:49:19.338634	2025-09-22 15:49:19.338634
13	admin@test.com	admin123	Admin	System	\N	\N	\N	\N	\N	\N	admin	2025-10-08 14:14:26.668832	2025-10-08 14:14:26.668832
14	kanokwan.wae@kkumail.com	123456789	กนกวรรณ	แวดอุดม	0990293644	2003-03-11	\N	ร้อยเอ็ด	จังหาร	ดินดำ	admin	2025-10-22 14:32:24.223007	2025-10-22 14:32:24.223007
15	kiramixzaza@gmail.com	12345678	sorawit	sorawit	0123465789	2025-09-30	\N	khonkaen	khonkaen	khonkaen	user	2025-10-24 23:57:38.240794	2025-10-24 23:57:38.240794
\.


--
-- TOC entry 5979 (class 0 OID 0)
-- Dependencies: 226
-- Name: admin_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_admin_id_seq', 1, true);


--
-- TOC entry 5980 (class 0 OID 0)
-- Dependencies: 242
-- Name: chat_messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_message_id_seq', 1, false);


--
-- TOC entry 5981 (class 0 OID 0)
-- Dependencies: 236
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 1, false);


--
-- TOC entry 5982 (class 0 OID 0)
-- Dependencies: 230
-- Name: problem_type_problem_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.problem_type_problem_type_id_seq', 10, true);


--
-- TOC entry 5983 (class 0 OID 0)
-- Dependencies: 234
-- Name: report_image_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_image_image_id_seq', 6, true);


--
-- TOC entry 5984 (class 0 OID 0)
-- Dependencies: 232
-- Name: report_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_report_id_seq', 17, true);


--
-- TOC entry 5985 (class 0 OID 0)
-- Dependencies: 239
-- Name: status_mapping_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.status_mapping_mapping_id_seq', 15, true);


--
-- TOC entry 5986 (class 0 OID 0)
-- Dependencies: 228
-- Name: system_settings_setting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_setting_id_seq', 4, true);


--
-- TOC entry 5987 (class 0 OID 0)
-- Dependencies: 224
-- Name: user_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_user_id_seq', 15, true);


--
-- TOC entry 5756 (class 2606 OID 19842)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (admin_id);


--
-- TOC entry 5779 (class 2606 OID 20100)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 5773 (class 2606 OID 19940)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 5762 (class 2606 OID 19869)
-- Name: problem_type problem_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problem_type
    ADD CONSTRAINT problem_type_pkey PRIMARY KEY (problem_type_id);


--
-- TOC entry 5769 (class 2606 OID 19902)
-- Name: report_image report_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_image
    ADD CONSTRAINT report_image_pkey PRIMARY KEY (image_id);


--
-- TOC entry 5767 (class 2606 OID 19882)
-- Name: report report_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_pkey PRIMARY KEY (report_id);


--
-- TOC entry 5775 (class 2606 OID 20084)
-- Name: status_mapping status_mapping_old_status_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_mapping
    ADD CONSTRAINT status_mapping_old_status_key UNIQUE (old_status);


--
-- TOC entry 5777 (class 2606 OID 20082)
-- Name: status_mapping status_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_mapping
    ADD CONSTRAINT status_mapping_pkey PRIMARY KEY (mapping_id);


--
-- TOC entry 5758 (class 2606 OID 19858)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (setting_id);


--
-- TOC entry 5760 (class 2606 OID 19860)
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- TOC entry 5752 (class 2606 OID 19833)
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- TOC entry 5754 (class 2606 OID 19831)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5780 (class 1259 OID 20112)
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at DESC);


--
-- TOC entry 5781 (class 1259 OID 20111)
-- Name: idx_chat_messages_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_session ON public.chat_messages USING btree (session_id);


--
-- TOC entry 5770 (class 1259 OID 19956)
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- TOC entry 5771 (class 1259 OID 19955)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 5763 (class 1259 OID 19954)
-- Name: idx_report_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_created_at ON public.report USING btree (created_at);


--
-- TOC entry 5764 (class 1259 OID 19953)
-- Name: idx_report_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_status ON public.report USING btree (status);


--
-- TOC entry 5765 (class 1259 OID 19952)
-- Name: idx_report_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_user_id ON public.report USING btree (user_id);


--
-- TOC entry 5750 (class 1259 OID 19951)
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_email ON public."user" USING btree (email);


--
-- TOC entry 5792 (class 2620 OID 19959)
-- Name: report update_report_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_report_updated_at BEFORE UPDATE ON public.report FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5791 (class 2620 OID 19960)
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5790 (class 2620 OID 19958)
-- Name: user update_user_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5782 (class 2606 OID 19843)
-- Name: admin admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- TOC entry 5788 (class 2606 OID 20106)
-- Name: chat_messages chat_messages_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report(report_id);


--
-- TOC entry 5789 (class 2606 OID 20101)
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id);


--
-- TOC entry 5786 (class 2606 OID 19946)
-- Name: notifications notifications_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report(report_id) ON DELETE CASCADE;


--
-- TOC entry 5787 (class 2606 OID 19941)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- TOC entry 5785 (class 2606 OID 19903)
-- Name: report_image report_image_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_image
    ADD CONSTRAINT report_image_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report(report_id) ON DELETE CASCADE;


--
-- TOC entry 5783 (class 2606 OID 19888)
-- Name: report report_problem_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_problem_type_id_fkey FOREIGN KEY (problem_type_id) REFERENCES public.problem_type(problem_type_id);


--
-- TOC entry 5784 (class 2606 OID 19883)
-- Name: report report_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id);


-- Completed on 2025-10-25 00:17:08

--
-- PostgreSQL database dump complete
--

\unrestrict 977Y6nyj4A7nt55gHovxfGWPFN31Kbl8j7HTxKT7PGdlGn9bjtV0tBYsqg6qm5D

