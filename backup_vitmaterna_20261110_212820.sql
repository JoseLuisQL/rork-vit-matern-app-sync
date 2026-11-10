--
-- PostgreSQL database dump
--

\restrict WvegZNGGy4R5nLCpA2pjr8V2170kjrXLvYnvMfZILe45bMxEa9HNWdww2Ihe4FK

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

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

ALTER TABLE IF EXISTS ONLY public.visits DROP CONSTRAINT IF EXISTS visits_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplements DROP CONSTRAINT IF EXISTS supplements_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_dni_fkey;
ALTER TABLE IF EXISTS ONLY public.sent_reminders DROP CONSTRAINT IF EXISTS sent_reminders_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.push_tokens DROP CONSTRAINT IF EXISTS push_tokens_dni_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_conv_id_fkey;
ALTER TABLE IF EXISTS ONLY public.intakes DROP CONSTRAINT IF EXISTS intakes_supplement_id_fkey;
ALTER TABLE IF EXISTS ONLY public.intakes DROP CONSTRAINT IF EXISTS intakes_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.avatars DROP CONSTRAINT IF EXISTS avatars_dni_fkey;
ALTER TABLE IF EXISTS ONLY public.article_assignments DROP CONSTRAINT IF EXISTS article_assignments_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.article_assignments DROP CONSTRAINT IF EXISTS article_assignments_assigned_by_dni_fkey;
ALTER TABLE IF EXISTS ONLY public.article_assignments DROP CONSTRAINT IF EXISTS article_assignments_article_id_fkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.alerts DROP CONSTRAINT IF EXISTS alerts_patient_id_fkey;
DROP INDEX IF EXISTS public.idx_whatsapp_logs_created;
DROP INDEX IF EXISTS public.idx_visits_patient;
DROP INDEX IF EXISTS public.idx_visits_date;
DROP INDEX IF EXISTS public.idx_supplements_patient;
DROP INDEX IF EXISTS public.idx_sessions_dni;
DROP INDEX IF EXISTS public.idx_sent_reminders_patient;
DROP INDEX IF EXISTS public.idx_push_tokens_dni;
DROP INDEX IF EXISTS public.idx_messages_conv;
DROP INDEX IF EXISTS public.idx_articles_category;
DROP INDEX IF EXISTS public.idx_articles_active;
DROP INDEX IF EXISTS public.idx_article_assignments_patient;
DROP INDEX IF EXISTS public.idx_article_assignments_article;
DROP INDEX IF EXISTS public.idx_appointments_patient;
DROP INDEX IF EXISTS public.idx_appointments_date;
DROP INDEX IF EXISTS public.idx_alerts_status;
DROP INDEX IF EXISTS public.idx_alerts_patient;
ALTER TABLE IF EXISTS ONLY public.whatsapp_logs DROP CONSTRAINT IF EXISTS whatsapp_logs_seq_key;
ALTER TABLE IF EXISTS ONLY public.whatsapp_logs DROP CONSTRAINT IF EXISTS whatsapp_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_pkey;
ALTER TABLE IF EXISTS ONLY public.visits DROP CONSTRAINT IF EXISTS visits_seq_key;
ALTER TABLE IF EXISTS ONLY public.visits DROP CONSTRAINT IF EXISTS visits_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_seq_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.supplements DROP CONSTRAINT IF EXISTS supplements_seq_key;
ALTER TABLE IF EXISTS ONLY public.supplements DROP CONSTRAINT IF EXISTS supplements_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.sent_reminders DROP CONSTRAINT IF EXISTS sent_reminders_pkey;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.push_tokens DROP CONSTRAINT IF EXISTS push_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_seq_key;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_pkey;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_dni_key;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_seq_key;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.intakes DROP CONSTRAINT IF EXISTS intakes_pkey;
ALTER TABLE IF EXISTS ONLY public.avatars DROP CONSTRAINT IF EXISTS avatars_pkey;
ALTER TABLE IF EXISTS ONLY public.articles DROP CONSTRAINT IF EXISTS articles_seq_key;
ALTER TABLE IF EXISTS ONLY public.articles DROP CONSTRAINT IF EXISTS articles_pkey;
ALTER TABLE IF EXISTS ONLY public.article_assignments DROP CONSTRAINT IF EXISTS article_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_seq_key;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_pkey;
ALTER TABLE IF EXISTS ONLY public.applied_actions DROP CONSTRAINT IF EXISTS applied_actions_pkey;
ALTER TABLE IF EXISTS ONLY public.app_config DROP CONSTRAINT IF EXISTS app_config_pkey;
ALTER TABLE IF EXISTS ONLY public.alerts DROP CONSTRAINT IF EXISTS alerts_seq_key;
ALTER TABLE IF EXISTS ONLY public.alerts DROP CONSTRAINT IF EXISTS alerts_pkey;
DROP TABLE IF EXISTS public.whatsapp_logs;
DROP TABLE IF EXISTS public.whatsapp_config;
DROP TABLE IF EXISTS public.visits;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.supplements;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.sent_reminders;
DROP TABLE IF EXISTS public.schema_migrations;
DROP TABLE IF EXISTS public.push_tokens;
DROP TABLE IF EXISTS public.patients;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.intakes;
DROP TABLE IF EXISTS public.avatars;
DROP TABLE IF EXISTS public.articles;
DROP TABLE IF EXISTS public.article_assignments;
DROP TABLE IF EXISTS public.appointments;
DROP TABLE IF EXISTS public.applied_actions;
DROP TABLE IF EXISTS public.app_config;
DROP TABLE IF EXISTS public.alerts;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    seq bigint NOT NULL,
    id text NOT NULL,
    type text NOT NULL,
    patient_id text NOT NULL,
    at_iso timestamp with time zone NOT NULL,
    title text NOT NULL,
    detail text NOT NULL,
    status text NOT NULL,
    note text,
    attended_at_iso timestamp with time zone,
    lat double precision,
    lng double precision,
    CONSTRAINT alerts_status_check CHECK ((status = ANY (ARRAY['abierta'::text, 'atendida'::text]))),
    CONSTRAINT alerts_type_check CHECK ((type = ANY (ARRAY['emergencia'::text, 'alarma'::text, 'inasistencia'::text, 'adherencia'::text, 'anemia'::text, 'sin_control'::text])))
);


--
-- Name: alerts_seq_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.alerts ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.alerts_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: app_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_config (
    id smallint DEFAULT 1 NOT NULL,
    seed_version integer NOT NULL,
    maintenance boolean DEFAULT false NOT NULL,
    maintenance_message text NOT NULL,
    environment text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT app_config_environment_check CHECK ((environment = ANY (ARRAY['demo'::text, 'produccion'::text]))),
    CONSTRAINT app_config_id_check CHECK ((id = 1))
);


--
-- Name: applied_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.applied_actions (
    id text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    seq bigint NOT NULL,
    id text NOT NULL,
    patient_id text NOT NULL,
    control integer,
    week integer,
    date_key date NOT NULL,
    "time" text NOT NULL,
    motivo text NOT NULL,
    estado text NOT NULL,
    lugar text NOT NULL,
    notas text,
    CONSTRAINT appointments_estado_check CHECK ((estado = ANY (ARRAY['programada'::text, 'confirmada'::text, 'asistida'::text, 'no_asistida'::text, 'solicitud_reprogramacion'::text]))),
    CONSTRAINT appointments_time_check CHECK (("time" ~ '^[0-9]{2}:[0-9]{2}$'::text))
);


--
-- Name: appointments_seq_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.appointments ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.appointments_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: article_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_assignments (
    patient_id text NOT NULL,
    article_id text NOT NULL,
    assigned_by_dni text,
    assigned_at_iso timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    seq bigint NOT NULL,
    id text NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    body text[] NOT NULL,
    minutes integer DEFAULT 3 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    image_url text,
    links jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at_iso timestamp with time zone DEFAULT now() NOT NULL,
    updated_at_iso timestamp with time zone DEFAULT now() NOT NULL,
    media_type text DEFAULT 'lectura'::text,
    media_url text,
    indicaciones text
);


--
-- Name: articles_seq_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.articles ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.articles_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: avatars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avatars (
    dni text NOT NULL,
    mime text NOT NULL,
    bytes bytea NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: intakes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intakes (
    patient_id text NOT NULL,
    day_key date NOT NULL,
    supplement_id text NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    CONSTRAINT intakes_count_check CHECK (((count >= 1) AND (count <= 12)))
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    seq bigint NOT NULL,
    id text NOT NULL,
    conv_id text NOT NULL,
    sender text NOT NULL,
    kind text NOT NULL,
    text text NOT NULL,
    at_iso timestamp with time zone NOT NULL,
    read_by_gestante boolean DEFAULT false NOT NULL,
    read_by_obstetra boolean DEFAULT false NOT NULL,
    lat double precision,
    lng double precision,
    CONSTRAINT messages_kind_check CHECK ((kind = ANY (ARRAY['text'::text, 'emergencia'::text, 'alarma'::text]))),
    CONSTRAINT messages_sender_check CHECK ((sender = ANY (ARRAY['gestante'::text, 'obstetra'::text])))
);


--
-- Name: messages_seq_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.messages ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.messages_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    seq bigint NOT NULL,
    id text NOT NULL,
    dni text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    age integer NOT NULL,
    community text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    fum_key date NOT NULL,
    gestas integer DEFAULT 1 NOT NULL,
    cesareas integer DEFAULT 0 NOT NULL,
    abortos integer DEFAULT 0 NOT NULL,
    obito_fetal boolean DEFAULT false NOT NULL,
    rh_sensibilizado boolean DEFAULT false NOT NULL,
    antecedentes text[] DEFAULT '{}'::text[] NOT NULL,
    hb_observed numeric(4,1) NOT NULL,
    bp_sys integer NOT NULL,
    bp_dia integer NOT NULL,
    imc numeric(4,1) NOT NULL,
    adherence_base integer DEFAULT 0 NOT NULL,
    obstetra_dni text,
    weight numeric(5,1),
    height numeric(4,2),
    CONSTRAINT patients_abortos_check CHECK ((abortos >= 0)),
    CONSTRAINT patients_cesareas_check CHECK ((cesareas >= 0)),
    CONSTRAINT patients_gestas_check CHECK ((gestas >= 0))
);


--
-- Name: patients_seq_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.patients ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.patients_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: push_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_tokens (
    dni text NOT NULL,
    token text NOT NULL,
    platform text DEFAULT 'android'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    name text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sent_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sent_reminders (
    id text NOT NULL,
    patient_id text NOT NULL,
    kind text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    token text NOT NULL,
    dni text NOT NULL,
    at_iso timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: supplements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplements (
    seq bigint NOT NULL,
    id text NOT NULL,
    patient_id text NOT NULL,
    name text NOT NULL,
    dose text DEFAULT '1 tableta'::text NOT NULL,
    schedule text DEFAULT ''::text NOT NULL,
    times_per_day integer DEFAULT 1 NOT NULL,
    start_key date,
    CONSTRAINT supplements_times_per_day_check CHECK (((times_per_day >= 1) AND (times_per_day <= 6)))
);


--
-- Name: supplements_seq_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.supplements ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.supplements_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    seq bigint NOT NULL,
    dni text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    patient_id text,
    phone text,
    avatar_version integer,
    auto_controls boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_dni_check CHECK ((dni ~ '^[0-9]{8}$'::text)),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['gestante'::text, 'obstetra'::text, 'admin'::text])))
);


--
-- Name: users_seq_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visits (
    seq bigint NOT NULL,
    id text NOT NULL,
    patient_id text NOT NULL,
    date_key date NOT NULL,
    "time" text NOT NULL,
    motivo text NOT NULL,
    estado text NOT NULL,
    resultado text,
    created_at_iso timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT visits_estado_check CHECK ((estado = ANY (ARRAY['programada'::text, 'realizada'::text]))),
    CONSTRAINT visits_time_check CHECK (("time" ~ '^[0-9]{2}:[0-9]{2}$'::text))
);


--
-- Name: visits_seq_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.visits ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.visits_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: whatsapp_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_config (
    id smallint DEFAULT 1 NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    server_url text DEFAULT 'https://openwa.qware.me'::text NOT NULL,
    api_key text DEFAULT ''::text NOT NULL,
    session_id text DEFAULT 'vitmaterna'::text NOT NULL,
    notify_appointments boolean DEFAULT true NOT NULL,
    notify_supplements boolean DEFAULT true NOT NULL,
    remind_appointments boolean DEFAULT true NOT NULL,
    remind_supplements boolean DEFAULT true NOT NULL,
    chat_offline_fallback boolean DEFAULT true NOT NULL,
    sos_offline_alerts boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT whatsapp_config_id_check CHECK ((id = 1))
);


--
-- Name: whatsapp_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_logs (
    seq bigint NOT NULL,
    id text NOT NULL,
    phone text NOT NULL,
    kind text NOT NULL,
    status text NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: whatsapp_logs_seq_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.whatsapp_logs ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.whatsapp_logs_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alerts (seq, id, type, patient_id, at_iso, title, detail, status, note, attended_at_iso, lat, lng) FROM stdin;
34	al-adh-p-f8776b1e	adherencia	p-f8776b1e	2026-09-10 05:19:06.119+00	Adherencia baja sostenida	Adherencia al tratamiento de 0% en los últimos 30 días.	abierta	\N	\N	\N	\N
35	al-adh-p-41f21ef8	adherencia	p-41f21ef8	2026-09-16 03:38:47.323+00	Adherencia baja sostenida	Adherencia al tratamiento de 0% en los últimos 30 días.	abierta	\N	\N	\N	\N
37	al-adh-p-3396ccaa	adherencia	p-3396ccaa	2026-09-16 03:59:39.595+00	Adherencia baja sostenida	Adherencia al tratamiento de 0% en los últimos 30 días.	abierta	\N	\N	\N	\N
38	al-ctrl-p-f8776b1e	sin_control	p-f8776b1e	2026-10-03 04:00:33.3+00	Sin control en la semana esperada	El control 1 de 8 estaba previsto para el 2026-09-30 y sigue pendiente.	abierta	\N	\N	\N	\N
42	al-adh-p-2236b07d	adherencia	p-2236b07d	2026-10-28 01:56:05.428+00	Adherencia baja sostenida	Adherencia al tratamiento de 0% en los últimos 30 días.	abierta	\N	\N	\N	\N
43	al-adh-p-b50cf8bf	adherencia	p-b50cf8bf	2026-10-28 02:06:43.034+00	Adherencia baja sostenida	Adherencia al tratamiento de 0% en los últimos 30 días.	abierta	\N	\N	\N	\N
44	al-adh-p-5eab51df	adherencia	p-5eab51df	2026-10-28 17:28:39.148+00	Adherencia baja sostenida	Adherencia al tratamiento de 0% en los últimos 30 días.	abierta	\N	\N	\N	\N
\.


--
-- Data for Name: app_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_config (id, seed_version, maintenance, maintenance_message, environment, updated_at) FROM stdin;
1	4	f	Estamos mejorando VitMaterna para cuidarte mejor. Vuelve a intentarlo en un ratito; tus datos están seguros.	produccion	2026-09-10 05:10:25.723+00
\.


--
-- Data for Name: applied_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.applied_actions (id, applied_at) FROM stdin;
a-1789531337959-jbxe2m	2026-09-16 04:02:14.302938+00
a-1792797724764-zydm2m	2026-10-23 23:22:05.78638+00
a-1792797732441-fahjrm	2026-10-23 23:22:12.204371+00
a-1792797802148-tb016h	2026-10-23 23:23:23.211922+00
a-1792797804789-jwalsb	2026-10-23 23:23:24.449258+00
a-1792881194300-oxb1py	2026-10-24 22:33:14.394241+00
a-1792881199734-qr70ai	2026-10-24 22:33:19.34362+00
a-1792881212222-901ssw	2026-10-24 22:33:32.336157+00
a-1792881213710-1z8q90	2026-10-24 22:33:33.343125+00
a-1792881293359-cb1pvh	2026-10-24 22:34:53.837155+00
a-1792881295383-wqy5z3	2026-10-24 22:34:54.997598+00
a-1792881314490-antrt2	2026-10-24 22:35:14.625478+00
a-1792881316236-prv71e	2026-10-24 22:35:16.343784+00
a-1792881325746-p0ut02	2026-10-24 22:35:25.868117+00
a-1792881336853-agh63g	2026-10-24 22:35:36.980321+00
a-1792881379832-32rknv	2026-10-24 22:36:19.956431+00
a-1792881380647-9irvsh	2026-10-24 22:36:21.691191+00
a-1792881380830-aax2wh	2026-10-24 22:36:21.714411+00
a-1792881484961-0doibx	2026-10-24 22:38:05.071932+00
a-1792881499905-zddzpx	2026-10-24 22:38:19.52316+00
a-1792881502775-780lw2	2026-10-24 22:38:22.383046+00
a-1792881513416-gu0kq8	2026-10-24 22:38:33.033659+00
a-1792881534318-y40ohd	2026-10-24 22:38:53.942905+00
a-1792881535370-ypfadt	2026-10-24 22:38:55.01276+00
a-1792882098933-90qmlq	2026-10-24 22:48:19.027362+00
a-1792882108327-c83c5p	2026-10-24 22:48:28.422599+00
a-1792882121811-t69ljz	2026-10-24 22:48:41.971903+00
a-1792883290615-c5rjd3	2026-10-24 23:08:10.228536+00
a-1793134817518-0okz3r	2026-10-27 21:00:17.77452+00
a-1793134817519-j4ouw0	2026-10-27 21:00:17.808072+00
a-1793138662940-kuxk0g	2026-10-27 22:04:23.032922+00
a-1793138662945-e9j0i4	2026-10-27 22:04:23.058218+00
a-1793138663636-2w06kx	2026-10-27 22:04:23.72543+00
a-1793138663638-9ds0ty	2026-10-27 22:04:23.72543+00
a-1793151811816-pi5ud4	2026-10-28 01:43:30.885315+00
a-1793151816667-7msbjs	2026-10-28 01:43:35.730466+00
a-1793208793038-hodo8v	2026-10-28 17:33:12.708286+00
a-1793208822378-eulgca	2026-10-28 17:33:42.065541+00
a-1793209066879-yl0k7x	2026-10-28 17:37:46.558562+00
a-1793209069294-rubss5	2026-10-28 17:37:48.981282+00
a-1793209270859-q9gn9a	2026-10-28 17:41:09.828164+00
a-1793209398605-ik04o5	2026-10-28 17:43:18.289935+00
a-1793209402449-butpzv	2026-10-28 17:43:22.130462+00
a-1793209631012-npyn2k	2026-10-28 17:47:10.695756+00
a-1793212479522-hs1adz	2026-10-28 18:34:39.20326+00
a-1793212480806-b3mrq1	2026-10-28 18:34:40.4752+00
a-1793212483731-7n47ag	2026-10-28 18:34:43.411096+00
a-1793277967439-q5vg1l	2026-10-29 12:46:06.942795+00
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (seq, id, patient_id, control, week, date_key, "time", motivo, estado, lugar, notas) FROM stdin;
271	p-f8776b1e-c1	p-f8776b1e	1	12	2026-09-30	09:00	Control prenatal 1 de 8	programada	C.S. Talavera	\N
272	p-f8776b1e-c2	p-f8776b1e	2	18	2026-11-11	10:30	Control prenatal 2 de 8	programada	C.S. Talavera	\N
273	p-f8776b1e-c3	p-f8776b1e	3	23	2026-12-16	11:30	Control prenatal 3 de 8	programada	C.S. Talavera	\N
274	p-f8776b1e-c4	p-f8776b1e	4	27	2027-01-13	15:00	Control prenatal 4 de 8	programada	C.S. Talavera	\N
275	p-f8776b1e-c5	p-f8776b1e	5	31	2027-02-10	09:00	Control prenatal 5 de 8	programada	C.S. Talavera	\N
276	p-f8776b1e-c6	p-f8776b1e	6	34	2027-03-03	10:30	Control prenatal 6 de 8	programada	C.S. Talavera	\N
277	p-f8776b1e-c7	p-f8776b1e	7	37	2027-03-24	11:30	Control prenatal 7 de 8	programada	C.S. Talavera	\N
278	p-f8776b1e-c8	p-f8776b1e	8	39	2027-04-07	15:00	Control prenatal 8 de 8	programada	C.S. Talavera	\N
288	p-2236b07d-c4	p-2236b07d	4	27	2026-11-08	15:00	Control prenatal 4 de 8	programada	C.S. Talavera	\N
289	p-2236b07d-c5	p-2236b07d	5	31	2026-12-06	09:00	Control prenatal 5 de 8	programada	C.S. Talavera	\N
290	p-2236b07d-c6	p-2236b07d	6	34	2026-12-27	10:30	Control prenatal 6 de 8	programada	C.S. Talavera	\N
291	p-2236b07d-c7	p-2236b07d	7	37	2027-01-17	11:30	Control prenatal 7 de 8	programada	C.S. Talavera	\N
292	p-2236b07d-c8	p-2236b07d	8	39	2027-01-31	15:00	Control prenatal 8 de 8	programada	C.S. Talavera	\N
\.


--
-- Data for Name: article_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.article_assignments (patient_id, article_id, assigned_by_dni, assigned_at_iso) FROM stdin;
p-3396ccaa	art-317e3836	41234812	2026-10-27 22:04:23.72543+00
p-b50cf8bf	art-317e3836	41234812	2026-10-28 17:47:10.695756+00
\.


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articles (seq, id, category, title, summary, body, minutes, active, image_url, links, created_at_iso, updated_at_iso, media_type, media_url, indicaciones) FROM stdin;
25	art-317e3836	Nutrición	PRUEBA TITULO	Prueba resumen	{"Prueba resumen 1","Prueba resumen 2"}	3	t	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAFAAUADASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAAUDBAYCAQf/xABGEAACAQIEAwYCBgcHBAICAwABAgMEEQAFEiEGEzEUIkFRYXEykRUjM4GSoRZCUmJysdEHJFNUgsHwNEOT8SXhorIXJjX/xAAaAQEBAQEBAQEAAAAAAAAAAAAAAQIDBAUG/8QANREAAgEBBQUGBQQCAwAAAAAAAAECEQMSEyFRBDFBUpEFFBUyofAWIkJTYQaxweFxgXKi0f/aAAwDAQACEQMRAD8A+x4MGDAoYdp8C+2EmHafAvtgQ9wYMQvVU8bMrzxKygswZwCALXJ+Y+eAJsGKz5jRRoHkrIERlDBmkABB6H2OOhW0rKGWphKnTYhxbvbL8/DzwBPjJcay8o0R8+YP/wBcaYVlKzogqYi0hYIocXYr1A87eOMxxhkMvFmX07ZbnUVGKd2LTKokUi2462FrY4bVYu2spWa4nbZ7SNnaqctyMpmde9PGJIwGISJmB/Zsuo/K5xIk3MpaiUbmEI3tdwp/Jji+3BMtJnNBU1/EUIpFgWGSmkRV55CaSQSfEkHHOTcHPldPmsNVxPBUJVRmlhJVVML3uPHdhtt6Y+auyvnvtrj6qh7nt1ndupPh+4vjl7VKlPe/OdY/mQP98OOGptecaPKJ/wCWKGS8B1uUZ5DWV/FcNTDRsJZoDGqWHgSb7C+/3Yb8OcGV2UcQT5lPna1VNMjiKARBdOo3BB8bDFsOzJWTi21k6+gttsspqSinmqC/KK4RrXOT8NI4+8kD/fCYV9P9IMokHaTECV8dFzY/O+GNLwNWUtPmqvxZTuJ17OjGNQIH1q1jv12tb1xzL/ZvUR5bDSvxJBHmzTFhVNCod4rDuAX3AO/34xLsqbio3llX1dTS26xUm7r4fsSQ5hDUZizzMOU5fXvbqDcYTZPluWZJS1IoY2R5HQtdy2wDeeLdV/Z5VNFDU5XxZTI8gWKYyKrRySgWuvWxPliz+gsdPkM9L+lkC5rJUI09U5Wy6QwEYW+3U/njouz7VRlC9k6/7qZe17PVSuuqp6HMlUNMILfEl/8A8m/pgarUyygMDa5FvHfE9f8A2fy1OWUQpOJI481okaGacqCkouXsy+BFzjnKv7PZly+tlquJI6nMaiARwTRqOXCrMLMF8blbX8bYx4XK9vVP6oXvtjd3Ov8AFShFmLNUTxvtoKlPVSP6hsa7PpeXwzlbX6qn/wCmEVV/Z1WyZNRxpxMkVVTGQz1PKFpEJ8RfbTY7++Hmf5Ic/wCHsuyvL8+gp6iMromXS/MCLZrC/wD6xuy7NdnCcE18ySMWm2Wc5wlR5N9ClPm9OeFKanSUGZZfrF8QLsR/thJlGY06VxaKUMFqCJLH4W2uMRN/ZxmsYmjfjaBXjs0l4VBQeovt1HXDCT+zeoqhRy5XxDBFHHGoqTHCrCeS92ckHqRbGZdnWs2pNqqouhtbXs8U0k86+pQlnneaF4qhEiRiZUYXMgtYAeW5B+7Ei1MEUEcMEaRBQbqgsCSxJNvvxCP7N80ljeePjeAwAm7rCpCgbne/hi7XcB0a5PRw0vFUcOaUwZmqppFIlD2PeUnp0tjmuyZXWqrd/Nczb2+wqmk9/wDFMjrtamtmAYEfWEEHrsxxReSeSbmGRDR8so8RG5Y9DfysCMXso4EejE8+acTwT11RTvDRlNKohYW1AfrHcfPHMf8AZ7mLZHPCvFkTSpPrapEK2RVUgqd7DrfGpdlSlm2q59WZW3WKe50y9CpmNbRRUaIzLDSwxxIL9F0hQPzGLf0gDRcu/STV8x/9Y5y/gBkzCF8x4opK6klUhaZo1AlNrAjfezWPuMQv/Ztm0KyQycYwpKRzBqgUFUF7m1+nr6Yj7KtHVuSq6+pVt1gqK66KnvefQOGK6nqcqihikDSxD6xf2bk2w7xieCcgl4cM8lZxDBmIrCqwkBVF1vcCx3P9Ma9qylSISvURLGQDqLgDfpv64+vYxlCzUZb0fMtXFzbhu/JPgxA1ZSpzdVREvJAMt3A0A9NXl9+O0qIZLaJUa50izA72vb5b46nMkwY5V1csFYNpNjY9D5Y6wBzJ9k3thLh1J9k3thLgUMGDBgAwYMGADDtPgX2wkw7T4F9sCHuPmvF3AecZ5n1VmFDVQwhopVjDORq1rAhVhbppST2Ok4+lYy2ZUGZvW5jVpLOacSRKsMTyCRo/qy+izhemsbLqv0OAM5J/Z7mEkGZxStSSrIlTTUSMTpipyjchTt1Vnb2sD1xWzj+z7P6qrzSpop8vhWudAsKhl5AhdOSb7g2CMbBRYudzi7V0PEbzVVRRNXpQ6NMEcksvOCky2IGu19RS+oFgpHQrjuSHi0VDNCtVIkAhk0yTlOYINasgsDqaQ2be1wQCRbAFHLP7PM3oOUjJl87M0DNUu7a6do6h5mKDTvrD2NivrcYd8PcKZjl3CdZk8wpoe0TrZFYSBYdKKyswVC1wrAX71iLsTi5wlSZxTVc75nJO8c1PG0YdnOltT6g2p2s1ivQKCPbavnWW57UVtc9BPOnOqFiiXtEkaiPlJqOoEhBcPuEJ1W33OAG0WTyvleWU1UkMklFJp1t3iUUMqtuOpGkkefibYQLwtmKVNJMcsy2ZKenWleB5e5PZXHMbuH9obWJ6745q6LiKpjq55jURtPRSBYqWaVTHUCFCADrsF1h7EAG4AJ7xu4yenqqfiauSWSqamG0KyidhbSm/MZyh31bab+vXAC2XhXMOzLTiCmd4HeTtfN0yz6nDAbqQCLDrqBKJta9nlPR5hQ5ZlcUcEM0tOuiReYIwBptcaVAJHoqjyA6YUcRQ5q+eVnYlzHU1LT9maGRxCpDymW4B03KaRuL3026bW+H5qmmmWOpFbKJV0h2p51UMDvfmM5G1t72OAE9RwfmUtHTxrT0qyU0C04kWUapmCsplYMjKb6iCrA7O+9wL6Cv4dfMsyoqmepKJTRJdIkS0jqwYX1KSBcD4SDiLiCOvbiDLGp5J0pwj8zRHM6FtSW1ct1A21bsCOu2ElJUZtTV5fsudGnipkSZJNbmSoKSamS5NxfQLjug2Ow3wBJFwfmFHK/cpsxRoHhvVFUI1rGLkIgXu8si4FyGG+xvO3CdfT05MNQ80r1c0zC8K6VZ2IsWia+zC97m/QgdYDlHEc8dZMlZVRSxcwxqZnvJ3pQFW7aBsUsSDaw6eGk4fWYJWkrVLSNMDTLVFjIE0Le+vvAatXX+VsAZWq4TzE1jTFqSnpxUpIEeUESd5zo1aAdLlwpDFra2ttseX4Oztc5r84pTSxSVDUrR0ZmPLVY5WkZLhbbnQ17dWceNzezXLayDMEaGSv7OZnLXapqBa0ZWypICu+vfp6dMRpBnIjppKaPNO3wFXqxNKeTUOEk1IoY2sxIsR3RdPFSAB0OGc2ocnrsppVgqIJ6WWCKVpShTWo3IIa5LliTfx+7E9JkGaRZjl9RpReUQJXeSNyyhmNiFjUdG2KaTf4tQ2wuyyDP1pGWrXMzXNGRRtzW0I2uS5k3t0KfF1Fgu4ONPw+sgkqmSOujoyIxGlazNJrsdfxEm3wjyJDEbG5AQ55wtmWY1lU8ENNGDWrVJOJAJJFCopjIKEAXUtvcXVdvJ1kFHmOXmohqaePlSsJBLzlLX0Itiqoo/VJuAPbCOsyzif6yXL5maeWpqCsc9TKiKqys0bMbsLbINKqAysQTiu9HxVKKhIDMhr2cws1RLHyBzWY6ydYU6QirpUX1EEbXwB3l3B+ZQZFTU01JRJLBSU1OVimP1jxXvJq07Eki1wegvcbYlk4MrqrLuVK1NHUt2QGeJEDqI6kyMfg0ltBA+HSWB2A2xoq6prJ+G6arWlqYKkvTSy06XaRBzEMi7dbLqBt13xVymTN5eJayrnjkXKqpLU6yMweIpYbxlRp1Eub3JI09LWwBWoOF5oKWihmWAyU9S8hlFiTeORdYFrAlmVtI2HQdBjxOH605TnMIpaOleqy5aOKCFyULKsg1k6RYHWB0vZfuCri2LiH6aqTl9PmUrvGBTSU87JDHHy2DXAbTr13O4ue5Y3GFdDRcQyVeULKM5aMyaKgE1ES6SRrYs07MpC+dwf1dBucAaGLIq6kzs5pJHT0tM8qSPDFNHoiAsDctGb3tq7pXcnc9cdZ/wvX5mc2igEH9+Jkjqmezw/UiPlgaT3SQSTfo7bX6oJcpzmn7ItRFntVl2iJqqOGskeUv8A3ncEvq2bkEgH9k9AcMeE6Xi6m4hpvpl6mWkkp2eVnkuEnEcSlbdNJIJHrr88ATDg7MKc5hEjxVHbBy0qpWCvB0ImCqgUP0Fl0g8pD1JtzlPCWZ5RR00LwUdfHDSwxrBNKdKvokEm5U7anuPR2G1gCv8A7QKLjCo4hkbIZa5aJ6COIiCVlCyCSSQstj8Vo0QnykAxSan43aggNMuZrVUUEEUizTECokjjqObY3N9WqMBvFtJ/VwBp6Xh7MKWNEfL8tnNPNJNr1lTU65C4U3B0hbg7k7ovQYu5Fw0+W5gKqURgGN2EUbXSORnY7C29kKxhv2VtYDbGIpKTitcqrkrYs/fMGhqRQyRVLBYzqntr71iSDFpuCfh02scdyZVx3S0wqaOarnmknkqDTSVUgCrFJIUUsxYd/VGNChQVQg9b4A33D+WZhl01W9XLAyVRE7JEpGiYli+5+IW0AHb4emHuEHC1ZVz0tTBW0tdFNFUzsHqkIDo0zlNJvuAmkemww/wBzJ9k3thLh1J9k3thLgUMGDBgAwYMGADDtPgX2wkw7T4F9sCHuPnHF3FeaZZxFU0dBmkEcMUKNUK8Kk0+orpZb7t+tqJ2GtPHH0fGczXPauietmiipDS0jcphK5V3fliS6+BFmAt16nw3AzFNxJnWYZi0MGbWbt0UBgjpYyUbTJJLGQdwoWMqGNiXDeFsV8843ziDMq0UFTy0iQFqWogQSwScl3WOwJ1amVFJ85Aq94HGkzLi2qocwzOnjoo5VpIBJG+u2prgEH7iTt+ycScPcTVebViRVFGI4ZIDMsphkiBI03UBwNVtQ7wupvt44AzsPF+bjPoKft8c9McweInkBQ6fUal81KCSUnx7u/Q4Z8TcQZpl+evFRVI5S06uIbIxN0mJYLbUbFE3BsPLHs3HenLGqzSRGPRPr79wrBUaIE9O8sig+TEDfD/Ns0npK+loaOOn5skEtSXqGKoEjKAi46E8wb9AATgBBm3E1ZDWTTZfVJUwgWpYIQrGdrW6Wu6hrglGutrkEY7HEFVFUUqUdec2gWYPVSrEq8uMhFsSLCwLs9wL9zSfE4nrOKq2gqKYy0UElPVGR05ch1xxRkBywI3NjqsPIrubHDdM3MmTZfXpHGe1tCLA3ADkC4P34AzNFxBmlRHS9szEUsXdgqZ+Sq6XVWYvdgVAe8Y3FhcgbkYt5NnlfVVrrUViyk0hkWNEVbEIhDMhAdbkkj4lsbXBFjZreIcwp1aWKlpnhkqHpoRqJkDI5UsV/WHdYhRvso3LbWqrPJoeFY81jiVpmMSlBDI1izqh7lg9xc9217i1sAZ1c14lhipJZ56kRSwGe7LDdReEEyaV+AF3Pds1vHbFiPOM1q5qCGmzGSWWpINVHFHGrUj6JGMd2UgbrazAt3Ou+OaTjbMagM70CIgKIgEMrBy9gjF7aUB1KxVu8AbEXxdpeLKl8yzLL5qaDm0EtJE8kZOiQzSabrfwClT73GAKc+d1sdHUyjNwHjq3jZTLBqRRzLKo0WBOldnO9jYg4rVPE+bChzGoWq5VXBNIlLSGNQZ4+Y6mSxGo6VBNh/h79cMoOLK2orYqQQU0U1SfqFcORYbFtQ7ri9rgG63AI3xDS8X5k+SQ5pLSUZj5VO8sauVJM9tIUnYAaluT173S24EFLxVnJzSWmnppW7JVLHVCONbKhjiGu5OyFneQHc2W3nj0cT1FTmQWHN4VjTLIJwqNGwedubrBXSXb4U7qEHf1GHlHn803DuZ10sUfaaESa4grpZlQPZlYXHUeYIsQbHFdc+zRcxpKGaCmMkkhEjwxSyrptER0HcP1h+LbYHxwBS+napstoi+bGBHzE081beFho5DP3X06CNQUX0g+Fr74nynOa2qiq5Zq7VUJRCRaf6tdLcpG1cvTrG5PUkb2wyz3OqjKaujWOCNqaQ/XSsGOjvKALKCVB1E6iNI02JF74VycYVIoqOpWmhVJKGCsmYh3CK4JIsoJCiw79iBe5wBTfP69URIM6jnhKamqnEaaTeG6awhS4DtYkW7wB3F8Va/iDPIKGrrKavnNsuhqIklp4wFd45idgCdjEu2o9TudsaPiriGfIY6dqeFJDIkjnVG7Du6bAlQdAOrd27o8cUW4pzIU1VOKNNMVS8QHZpjZFMgJ2H1nwAdwG17kWGAODnObPFV1Us80MtLM0JpIo0KSSLEh0gsmohnYgG4uCOmJMszyvmzegp6yZ4m0GKWmYRiR3UyDmMtr6WCow0E2vuLb4ozccZl21YaegV4ZK2SlWcUs7AaOaRYAfWEiK90uBvfww0hz7NaugnrKeKgRUMyokpYPeGQxtdfIkE+mwN77AKn4hrxRVE30wqSLVyxtGZILoimUKFBSwJ0rs7C9jYjEs+bZ0nKnlrZaajmrpIdcpgj0hebpCEqQB3Fvrub9MXsx4tnyulqGnpEeWFGkupIRwnN12J6WEXj01rjuXiHMqSvipaqnptKzLHPPGHZAG0aegJT4m3bu90XI1bAVoOIZ40mqJMxNRJG0xejWFbqiPZGBA2LKAd/i1XWwGI8p4mr3FbR5lPFHmVNTJ9UVCM0mqQkgeP1YiYgXAvhnn+f1eV5xQ0NLR9o7QjOwEMjnZkXqoITZibtYbYTJxtmRoMuqGo0L1iFwnZJ0ufq9K6iLC5ktrPdwBBFxVmywQimmkzORqeCqlWOJCyGztLGCAF/VjWx7y67m9xjqr4jrkrKOODOA1PUVDrUShoF7NYSlU1FSBq0j4gT3evexfoeL62eXL+dSxBK1iB9VJGVGuJdtXxC0vxDY2x7LxTmY7U0dJGyR1UkC/wB3mJARnGoWH1p7nRLkXv4HABR57XmXNFSqFbJDTTSwoiKVuhsgIAVgxv5EP8SkDbFd+JpkWtio83Su008op5mRAXqAI9MYsAGNySLDcHxtfGokzMDh8ZpEscmqASoFe6NcAjvW+HfrbpvbCl8+r4auogeKhkehjSWrMTsSyuzABB1DAKTY+YHjcAS8I5jPmVC01TXdomKqXj1xHlE32sigr7Nc7e+NHjM8L8UScQVEsMlMsEkNHTzyKCTZ5TJt7aUVh6NjTYA5k+yb2wlw6k+yb2wlwKGDBgwAYMGDABh2nwL7YSYdp8C+2BD3Gdr5MrbM6mWpycTrBG0VRWMiFUHLLFWub20N1tbv28TbRYy2cJw5NXVK5hWOCHUVFKHbQzGMkFlA3vGrDyIFuoGAF75zw7SyQUsuSxoRBzuWeUXRiJlZNOq7MLSglb/EfAk4tVmZZPV5dzJckaqpKGlMkndQin+r18u1+tgAbbC49bSNQ8L0stdRcgojaHqIo4HMUaqzSWNl0qpJYkHY3OKUtPwnT088V62mpZY5mmgjp5ljtZixZQndIDki9tivkuALE+f5Q1BJU1+TvHDJEoHMRGEsOrvHYnZQuog9AB1xfFdl2eZiuXV2W6iDM9O0yq6yCJxG5FibbsNja4PvhXHScJg6Kh56lYm0GKsikdYABtqVlsgtLe7Adb3NhazHBkeRV/er6tZ4NYDzh2VAfrnRWtpuwUMRckgemAJ85qck4anhq5aKjjmqpTaV5IobvYn4nIFzc7Dc3OKGZcR5LS5caCpylTR00vZ3hdoo44mRWcL3mAHdRWHo6fcyr8wyvMeQwq8wjZGsklLTy3bVsNwhuptsehtscUY6rhalnWu59TriTtB1xSkuGEh5unTc3DSd4C1h5AWAWvxJwoYqmdstoBabskuuogVhbVbWC3c+x2DWJsvltbHG2SxL2BKDQsEBqEppHjjchC5ASNmDFgYidhttfF6lhyKoqTSmoqp1mldhBUxsI1d0dmTdQASrsdJN7WNsUezcOUlRJAa7MxLUXpZItErNUn60nbQS/wD3DqXbbr0wBLTVGQVeZTrQZAKh7qaiRIUFkmUNqYEgm+tri19m26XnyBOHK2q5VDlKQtTpHUIWiAUNIochfUXUm3iwPUnEVVTcL5RmiM9RPR1FdKKiSOLmKJNTKBzLDuqXt8VhdmHiRitlmbcFZZyqujqHWaOMoG7NLzZY37wJGjU6WjNmsQAp3wA4VcnpeIloo8qjSve0iusai8djeQHyBAU23uy36g4MwiyqirKKmjyVKmoSBuUkUafVwppU2vbprAAHmbeOI34q4ZasWsGYrJNEssC8tXe/ei1KAAdRu8VrbnULXxWzLPOFcykiknzOSJo4GJkjDoDGyh2jZtNrlVB0bNt0wB4ueZPliUuXHJ3p6PM5uVDZEKTK3dLEA3A3Ub+DDyICuPiPhdEgdMlhiRJX5RYxRlWHViC11FkHeO2wv0xbDcJ1kqKa+rMrExwROZVeEyExlUUgFTd+nVe6dlAw01cOZRlEtQ86Q0T1pVpHJsJubpK9NhrW3lt5YAoScSZNmscVfLlJqY6WzNORG4h1SFFKsCQwLJe63FgpOKkmd8MRxxRnI1IkRKhlEaWjdo5H0sb2BCxEHwAI8L2tZsOEsszGWlr6+SmlMaVM1OGbS6NMQhIA3Alc2A6X32xTlXgWjjllWqlTkV0kTtTiV2SpRHL/AAgkFQ7G/QW9MAOE4jy7M4oZpKAy0rlaZ57xyIhlYKE2J1K103FxZl9bT5llmT0UaxpkcVVLUyluVGiAsQGYsSxA8T76reJxQqk4YyR6RqvMJEWRXrVRnZlnMZ5rSsANyurV4dBt3RazmOe8N5i700mbmGaljlqi8LsjLHGTHIwNrEXJX3BtuNgKmY51knYFeuyV2y9KoiJ3jW3O1lJCFvqBBaQnbcB/S7fJocorqaaupMvhi5kktM50C7CORoz08CUv8sKKVuFGVpYqqZIIJIm7PIJESCR5tKnQwBUtIhBv69AxvYyHOuFsuydqbLKrl0dPHNU6WjcaY7iR2AIvp+tUjzDC18Ad5DnmUcSGGanpYGLxTaWWSOXSDyy6sVJ0k61uD5b4mzGhyrKkpWhyKOoZHZ0WFEDJYaiw1Efsr4+A8hipkcWS1FbFT5dm9dLLl6lVVmIUx6gpAJUB01RgXUncdcPsyyuLNI40llnjCEm8MmgkEWIJ8iDgDLrx/ks/PrI4Y5DBI1MZO0Q3UamF3u31asU2LWuSo6kY9kzXhzK6eppxlMNPCgSF1m5cMbJIlz3mIW3c0kea2w3XhOiiQxw1NbFGJXmjjjmssTMWLaRbodbCxuN/bHtDwfkmXNA1NRqphDqCTcuHvcOT8VrkC/QYAQLxNw5mjJQPlCy8pESGBuUXXVyyq6NV0BZoxc2W4G/TFmmbh2Z6ymbIUhmgkgSojaNO68spRdwd9xqv5N53GGycJZWkKxqJwyElZOadY2UfF12KIR6qDiM8H0JleVaquSSXQZWWbeVkcurNt1DMbeGwFrC2AJIquigqRlC5c4oppXp1eymJn0F2TTe4Fgw6WuCPLFbNhk2RGmeTJo5IaaOWqMqIn93RCpZ9yCd2DbXO1+tsMoMhpYa6OrMtTLJGdarJKSvM06C9v2itx5bna5Jx3meS0ubPEappdCI8bRo9lkRtOpWHiDpG2AFvCubZTnPaJ8tpqeFo0jhflyxs4VdWlWCElbb2DWtc40eF+V5TFlMRhgnqJIrAIkr6hGB4Lt/y2GGAOZPsm9sJcOpPsm9sJcChgwYMAGDBgwAYdp8C+2EmHafAvtgQ9xk884cy/NawzyZn2eYSu5CsP1oeVYgnexAYHw3HQnGsPTHzfiOimrM1m5dZLTqrOpCX3vbfYjcWNuvXztj5vae3vY4RlRZumf8Aj8Hp2awxpNaDr6GiaumrJc1y+SonXTK7U4JX4rGO72XZrbhr2x4mQUX0bUUb5rAFmhmiCRALHEsiKlkQsdIGm9r9WPTGXpMunp6xqiWvnmB1WjYkKL6T0v4WNv4vTElZRT1MuuOtkhAUABb7EG9+o67A38PK5v8AE+JJX7tFTXM9nhypWrNC/DWWg5hHT5lBFTZirRVMdgS0R6qG1Cx3ezG9gwH6otZzTKabNJahXzeBKaZjJy1A1B+Vyh3tXSxva17jrbbGJgyarhkQnOKqVFZTZz1t4bH18fzw5xLX9Szg/lipdf5Eezk97aNDluXUlA0hOZUzB5EcLGqxrdSxLEA21tq7xAF7DbFBeFsqjR0hzKJFkpOzv0JLctoy977bNfT0uCepN1t8R1MbTUssSStEzoVEi9VJFrj2xyX6ota0dmurNeGx5jTx5fSpmKz/AEnCacTiq5W1+aI+X8V/hsL2te/jbbFDMeHqfMq+lq581oXajneSnSSHUgVw4ZWGvvHvg3uPhG25xkocmroVQDOJ5CrXvJckjSBY97zF/vNrY5p8iqoU0y51WzWUAEuQbhr3O++23lj1fEP/AB/7f+HPw/8Az6G0zXJYMyqkmXOoYFkp46asjRVImjR9QC3Pc6sPHZvMA4U0XBFFlMsVRlOfRU1VHGqCV40k30FHNieh7rAXsGBO+ojC3LaGeiMvNrpagPbSHJ7m56XJPiB92L5xwtP1NaRlSME1/s2uzU1myOm/s4yXL6ynrMvzoQT0yFYi2l1B5qOpIvuQE0npcEdLDDObhvtKVUU3FGqOr0SzgRxhnqFRFV7+Cjlo2kDqvW1wV+DGPii1+2upfDY8w0ThrL5KqKsrc3jmrRPNPLPERExaSEQ9wg3SyqvQ3ut74qVXB1JmNEcsruIBJlQnmnSFLLJqk5lw0hYlvtG8N9sV8G+HxRa/bXUeGx5ifPeCsuz/ADClzCqztBVw00dOzqFs4XWSSL+LOrW8CgxUf+zjJpIjHJnjSLJeWbWynXOUkUyjfa5kuV3HdA6E4lx5ifFFr9tdWPDY8xdfhDLXzamzI57KZ6cx6FebWlgzGQaWY2VldlsNlHTC/wD/AI7yjs0SDPGSWKmSkV4yqryliKW03tfWzPfzOO8GL8UWv211HhseYv1XDgzGTVmHEkc6zcsVarEiCRY5WkjCb9wAsRvqJHjiGfg6hzGhSmzbPIK7k0ktLTF4kXkB1jUOAD8Q5d7+JY9BtivjzD4otftrqPDY8w5yjJosproZhnsUsFOjw08TIo0RO2plLX7xuE322XpuTjSfSFH/AJqH/wAgxgsFsPii1+2uo8NjzG97fR/5qH/yDB9IUf8Amof/ACDGDwYnxRa/bXUeGx5jefSFH/mof/IMH0hR/wCah/8AIMYLxwYvxRa/bXUeGx5je/SFH/mof/IMH0hR/wCah/8AIMYLHuHxRa/bXVjw2PMb2GdZp3MdRFJHpFlTcqd7km/jt4eB632sYzfC3x1Psv8AvjSY/S9nbW9r2eNtJUbr+5863slZWjguBzJ9k3thLh1J9k3thLj3HIMGDBgAwYMGADDtPgX2wkw7T4F9sCHuMrnNBmE9QkmW9jUXk5onXdjfu76T63/5bVYXfrP/ABt/M48m1xjJK8qnWybVaEHYaS3/AE0X4BjPZwssMtMKSpy6mVhHqSdRqYl7bd03JAIHrfr4anFNsvpKpYpJ6eOR1CEMw3BXcH3BJt7nHgVlZKWcV0R2cpU3mSRq6K5lzbJ3vbSvLCkiyk/qmxsbjr8Q2OLsnPeM8urysXcMh0hu4BY37u+7RnYC9+u4w8GRZUsrSjLqbmN8TcsXb3Pj1OJfoyi5Qj7NHoDagoFgDYC/yAGOuHYci6IzWepSpHy3s1Ok8tE9QyKCVAAkbYXXbcEkW9xiavooxST9mjpop+RJy3kQaEa2xO3QHEjZNlryRSNQwGSEgxMUF0t00nw+7HWYxyS0dRHDHFJI8EiokoujEjYN6eeOcrGyqqRXRGlKXFmTlps5WpjjjzfJd11APCLyBvgYWXYHSdrne++4A6YV4Vn+l8jMQNg+lRcrbUehuNxsN9x3tt2VRQzyPCfoPLniSl0EPpLId+4D00/1OJIqCQXhfJ6GGBbBSLHSpK6hbysp8ui7eXbBseVdEc70tRNTx5oIZkGbZC7spEWqzlW1Le5CjV3dQ6Cxt1xZMOZMY2WsygIH0y2s1jc2tZOm42JvYfFvfF2OhlpDGafI6BWIu2h1XRf4h63Pp88S00FYr8t8po46VVugRwCGA2AHTrt6W9dmBZcq6IX5amdjiztDRhs4yF4yxSS2nVIwABVToIFiGN7frbjbGioZqGKiR8yqMsLySHS8bLo33C3sOnT1sPE4qvl1SadDHw7lyyog0qxUhSb3A9LAeXht4ixPQy6bvktDJo76XYGzHrcnpsBv+WI7Cxf0roiqctS4KjIy2nn0GonTbWl7+VvPAKnIimvn0GnffWltv/Y+eKNXQ1cc96TKsvmj2vGwCEC3ibkddXh/XHjUFR2TR9AZe7sxZ1LAI1gLHoetz8sZWzWPKvQuJPUcx01DLEskUMDowurKoII9DjrsVJ/l4vwDCylnzdISgoKQKLNGscw+Ek+Hnb13OJ1qc3Yk9hp7BLnTPe7X3A28N/Lp4eEezWfKvQuJLUuCipf8tF+AY87FS3/6aL8AwtqK/OoI4yuWxSMZFRrTAWv4+3vbr0x0KzO7T3y6BmFuWon63sLE/iN/IDY4d1s+VegxHqxj2Gl/y0X4Bg7DS/5aL8AxTNXmjJE0NFBIrs2o8+2ldrHa9yd/b1xEKrPjGT9H0uoKOlRe7arHw8t/yxO7WfKvQYj1GPYqX/LRfgGDsNL/AJeL8AxQFVnl/wD/AD6e3LZt5rXezWXxsL6e9v1O2PXqM7WOJloKdnIbWgm6dLb/AIvDyw7tZ8q9BiS1L3YqX/LRfgGDsVL/AJaL8AxVeozXXMEoYdKgmMtL8Z1WA9O7Y3+71xxDV5u0rRzUEKWjLArOGN7mwtt4W+829cO7WfKvQYj1Zd7FS/5aL8Ax72Kl/wAtF+AYX9rzq0K9hpObvzU7R0F7Ajb7/wD1uNU55zj/AHCn5YZh9tuwuNJHkeu3tv4B3az5V6DEerL/AGGk/wAvF+AYOxUn+Xi/AMVDU5o9URFRxdmKGzvKNStp6EC9+9sd9reOLNDLVywlqymWCTVYKr6haw3v88R7PZr6V6FxJalyigihlflRqlwL6Ra+L2KlN9q38OLePo7LFRs6I89o6yzOZPsm9sJcOpPsm9sJcegyGDBgwAYMGDABh2nwL7YSYdp8C+2BD3C79Z/42/nhjhd+s/8AE388eXatyOlme4ji+xj/AIRiTEcX2KfwjHi+o7HePcHXHnpjQPcUsyGqiqAIWnvTyDlKxUvt8II6E9L4uWxTzKNJqKoilkkijenkVpIzZlBG5HqMRgSdkphQmc5JV6mcs0YY6wdug8th08tugxWNDRho6V8jzFoBLqLmRzY79477jcjxvta46RvTZRFp5lXmJUrHUxteyKGNwvoPqtwdhq8ziomW5YgWNMyz25dgji+oFQQV3HTfpbwHkcek5DwUOXNO4bJ6pLu8ZbSSDYizWB/Wv18gb4qQUlDDXaY+HswEilmUuSUYnY9Tbe3U/wC4Jhys5blVU1YM0zORIo7MkwBRgeWlztfUSFJ6b6vXD0cSUBVWAqLMCwvCw2HU74y6rcXIUwRwwmemTIcyEMiDWWcsXtuQSTv899/DfHDZbR10kdskqVk52gNNNJGtrMb3tc7KOo/WG98PH4go444HZJtM19Nk3AHiRe4G4+YvbEcvElHEoYRTsGVWFlA+K1upH7Qv5YlZaDIioeHsqNPFOlI8TNZypdtm6+Pr44tvkdBKIQ8bNyUEaXc/CL2B8+vj4X8zfh+IKNJ3iKTgIAWfl90EgED3sf8AbqRdlDKk8SSxm6OLg4y3JbzSSFUPDOV08gkiikVwAAxlZiLEEWufMDHk3C+Wz1q1TJJrDu7LrJDMxvc39elreXTDnxwDGb0tS0QofhnKni5Zp2KC1hzG2sbi2/5eW2JTkeXsZSYmvKpVzrNyDa+9/QYZ48HXC9LUUQlXhPJldGWla6Cw+tbpYjfffriSDhrLKUNyIWjvq6SMfiDA9T+8dvXDfBhelqKITrwzlkciSRxyKyAgESt6nz63J364lhyDLqcxmOAho2DKxYk3BB69fD78M8GLflqLqEy8M5YOXpjlHLTQp5zGw1FvE9bk79d8dR8M5XEECQuNAIU81id733v13O/XDfBhflqKIVScOZZKrK8DHVIZCeY17k3O9+np6nzOOZeG8tnqFmkikZlUqBzGsAWZjtfzY/lhvgIviXpaiiKlLl9NRTTywIVadtT3YkX36A9Op6YtjpgtgxG6glpvtW9sW8VKb7VvbFvHu2byHG08xzJ9k3thLh1J9k3thLjuZDBgwYAMGDBgAw7T4F9sJMO0+BfbAh7hd+s/8bfzOGOM9mv0vHJC2V0aVKMZTNqcAgg90C7Drv8A86+e3g50SNwklvGOOIfsU/hGLfZI7dX/ABYQZlUZhSSUsdDBBJG6xlzJOFZQWAY2LDwO3mfkfP3ed46YioN8GM3HmGeKheohy9VDkXSoHeXSput33NyRY26ruMWGrc07FLKkNJzFkGj+8ArosQdXe2Nx6/EB5213e0JiIeYpZkbUdQTUdmAp5Dz/APD2+L7uuGFLTGSkhecMkrIC6htla246nFbNKNno6iOCJZpmp5AkUrdx2tsreh6HGZWE0MRCA1bzrzYc9jXTToWLw2SwL3bfYatvweuOUrWnC1MfFVMItRQ/VoASb6QLn0PncDFOagzqOqEEORZKw0lZFLgFhe62F91Pe3IvfVt4mfsWcRKyLkWUaEK7oQACBuSCRYWJsdzYjbc264MzN5Ez1pRGSXieiVggBLxILsSrBhc2+E2HvffHQqaizM3EtJyxIUuETrtsTfr/AF+VWKhz14qh6jIMrMgAMJkZVLWKgBrEgdzVaxO4HQYm7HmcHZ0TIqCOF5FEoOgaDc7jv7gnTY9didO4GGDMXkedpkhp+V+k9MzcuQFpVUEtawN77WJ3+7HHbXRVjHF1GZJAX1PEhBW4O2/rYeh6bYpR0GfK1LzuG8oKk/WvdC9za4A1AFrhvGx26Y0eWZFQNTq2YZTQ09SXbQiKpsp3A9wNjbxBI2thgzF5FSRpxWoBxFCAsgQRtEu7WF1NiN+8th13xF2tTFJq4ngZJAUDIEBXY73HQjrf0+Wi+g8qOlhSwkh+araRs23e99hv6Yjj4eyVY40SkpygGlO6Dtbp8hhhTF5CLtzSaJRxRRKkpIiXQguR1Aud9iPa+JUrizzFeIqWRQGXTy0OggWJ2Pg1vu2Pnh79AZWURexw6UvoGgWW/W2217D5Y5HDeUKmhaGBVsRYRgdevhhgz0F5GfXtt1k/SaB01koBAtio2I2Pex29bJDqjHEVG872aNJQgstz4Dc+H3j7saA5DlpSNOyx6Y21ooUWVvMDzxx+jmVa9Zo4i2kJuoNgPD2wwp6C8hJHWfXxxDiGnvCC0sbIup1G56m4FvH/AN4ryV1U1RAkHEdG4ZgXGhRdNJNwbG+4v7ePTGlPD2Vksexw3ZSrHQLkEWt8iRjleHMoT4KCnXYjaNR16+HrhhS0F5CWSeZFpNWeA6yw1R04bmENp2tcCxZQb+XhvjukSurUM1NnWqIsDbswBHQ27242Iw9gyehptPIgWLTe2gabXtfp52HyxKmXwR6tAYam1NZup88TBnwSLfQlFLmzVMbvmUaxoVuqwD6wWGq/kSQbW6A4I6LNQiiTNg51gsRTqLixuB5XNj57Yedjj83/ABYOyR+b/ixMG0/AvxEEmX5qSwizcot7oDArEd6+5PXa48Ovhbft8vzF6dR9KsJxcFxEADufAfd8vXDzskfm/wCLB2SPzf8AFhg2n4F+Jn5MvzflyCLNwGbpqgG23/OmLKUtcteZjX3pyb8kxD9lRa/uCf8AVhv2SPzf8WDskfm/4sMG0/AvxOKb7VvbFvEEcSxTHSSbr4m+J8d7GLjGjMSdXU5k+yb2wlw6k+yb2wlx2IGDBgwAYMGDABh2nwL7YSYdp8C+2BD3EUHwH+Jv5nEuI4PgP8TfzOMvzIcCTGWzWJZKynY5PLVskMciyrIwGpS1hYC1xfqf2t9gSNTjI559HPUwxVklbG/ZhdobaNJDC5J6Ebn5dcPqXvQcBfLl8E1O6S8LVEiO/Q1L2bYbjxXy3AFgB4WE0VPyQwXhypiARNANS7EhbADug2sAPl44gNXkyUoUzZroSMshfSO6VIGknqbqxHjdjbyF3Kc5ynLIXmH0ggmCbVKBb3JsF6Do1yB4G+NkNdTxrFTRRpHy1RAoS99IA6Yp5sGaiqQkDVDGmlAhVypkNvhBG4v0vgy7OIMzCGCKYK0Ql1MoAAJIAvfrdT8sdZlIkVPM8kskSLBIWkiF3UWG6ix3HhscYnu6FRmqmjpmlpT+j9a4WiCq6zOCgW/cNj1F9j132x1BllDIvZBkE8USd1DJI1rMUDet7Le+/wAJ333X0lblizMj8QZ1PISWCqXHdsLAi3UbdLdRtiwtRlnIdTnGd3UqTM0hNgRsb20gHz/MAY2QkioKGheIR8OVrB9x9Yz6dVi2q52Nxb+gxZpI40PZlyGpSn0czWzkksAet9yTsN9+t/C4aulr9NZHVZo6NGzScl9CoFUXJF7/AHC+5wxgyApqkTOMxbmLsTMCL6dOobdfHyvgDPNQURpI5U4Zr9cQ1JG0rggtfV47nb169b7GzV0FGsKRScO1MkUTcyNI5GIJPoNr7eO2/W53vxcLVCbvxBmjkNteYgadtiPO19xbr0xZHDzBVAzjNNjck1Fyfy/5fACisy2lopkmi4cepViDqikJddr3sfEEnxv+QxGuW0DwRxvw5Vh52JdBK3csFudV9gb/AH6fTDyPIHgjnWHNa68qSKOZJq0avEeoO4Pv548Th54yjJnGZFlYMdc+rVbwI6f83vgCvTZtVUdOtPFkVUIk0iIKbjRY+e46dD5jpiWLPq6WWNTkdXGrayzP+qFUkdPFiAAPXE8eRcuqSoXMa5pEct35dQIPVbeXp/QYjk4dD69OZ5imogjTNbTby2+7+VsCkI4irQGMuQ1iWaw3B1b2Frf8/ImSLP6t4nkfJKyMBQVDC5JJAtYeIv8Al72KDh6ajSYSZxXTvMGDsz9L7Ar4ggAePyxIvDyKrD6QzAsz6yxqDc9NvLw98Aex5zVPRiY5PVo7PoELW1DpufADc7+nteOTPa2OoEX0HWEEgcxSCtj47YkfINbyuMzzFWk07rNbTY32FrefzwUmQdjqTOmZV0hL6tEsupdzuLW9T198ARQ55XS1CxNklUgJ+I9ALH87i3l67i/r55WLTxTfQtUdeq8Y3ZbWtcetz8sez8Pyyxxqmc5lGUAFxKO93iSTtubG33DyxwvDCpIZBm2Z8wgAsZ7k2v6fvdOmwwBLPnVXFUCKPJqqYEm7qQAOnifO/h99umOos6maogjlyyriSVQeZoLBCSRZrDbf5A72xHLw2stXJU/SeZJI9x3J7AAm9ht0FzbHT5AzjT9K5iqBCo0zm9yxN7nqdwB6AYAgTiKsarFMcirFckXYkaBfxv5f/f3zQ51VyOofJ6qMc1YyWsdifi28B1xJLkSSuzGurVBYMoWWwQjV099Rv7DyxH+jxBX/AOXzTbTe9RfVbz28fG1sAQvn+YfVGPIKtldypuwBUC+9vcD7j57YkGeVpWFjktUolNiDuU3tdgOnn/y2JKPITRLIqZnXyCQMpMst7Aj9XbYjax9MWabLDTVfP7bVyDQFMckmpdgBe3nt8zgC0p1SA77rfcWxLjj/AL3+nHeMR4lZzJ9k3thLh1J9k3thLjQDBgwYAMGDBgAw7T4F9sJMO0+BfbAh7iOH4D/E38ziTEcPwH+Jv5nGX5kXgSYy2dVk1NLSLHnMNEDHGzRulyVDqGN7G17gXPTc+ZGpOKqUlPPDG0sEUjaALsgJ6Ef7n5nD6l70JwMfDnSsOWOKYzMGDsTBYKllHUr53J6fF4Wxo8ozWnmjSlevWqqlJDPyimrdvD/Qfl6jFpcoy1JeamX0qyXvqEKg397YkGX0QdHFJAHjYsjCMXUnqR5HGwWcUM05vZZxDULTS9nk0TsLiNrCzEHrbri/ihmqPJSVCRtCsjU8gUzC6A221enn6YxPd0KjLE5nHIpl4thUFY5FXkrZ1Y3HetvcI9rb7+m8JkzXnD/+6UoVRY/UoQdIIa+3jcHrtYdb4ZNA1SyCGHI505EatCAGAsX1EbfCCVsP4sTLTV8zrKtPkhj1P0UmxPQ3tudjfpjZkiyyuaKsaas4hpqmmSAK0ehQdRKjXqFrg3G1v1hhz9P5TpBFfTkHpZxvhP8ARtSY5VFBkVyFuACAG1K1jYXtbf309MdyUWYSQBFoslQhGQEqTYkWAG3Q/wDB5gN3zvLo445HqkWOQkK5+EkevTwxy2f5YoLdqDCym6qW+K2noPG4woioq/sUcNVBlE8io1mRRv06Ai3h+QwSUldrEYpMidm6B7ghQV3AA8LD5DfADhs/ypZ2gNdEJUXUy36Drv8Acb+3ti+jrIiuhurC4I8RjOT5fWme8VLkrSOLsroRrYW3OxJsP9sWY3zGGHlczLYEtZOUSLH0B2/9/MUeYMJpJc7JGg5cO+dizbrv+fT/AJ14hqM9GoVJyoNpOjlu+7eF7+HX/m2IB5gxn1qc81AtNlRWORUktIw6gbHbruCOl7jHctVnkUUpcZdfUNLiRgFTe7Nfy7vzOAHuDCSCpzt2gLnK+WAOcUdyb3Pw7eWnr54h+kc6NRHEv0W920tolJKkLc3Bt4228iOmANDgwhnzGvpniNVV5VTJyyzmSQ+Goki9rjSt+u1j1tgjk4jeRTH9FyQb6n1uWvfwsANun3YAfYMKlbO2qmJSlSFLAC5Ou4BJv1FjcdN/5dJ9NFYeYKIEkc3QW2H7t+v34AZ4MI7cSqJFU5a1j9Wza7tuOtum1+l/DriSROIGjiZJaJZNNpEGrTe/UEi/S3zPpgBxgwkb9Iljl0ihckkpu1xt0xbhGbDMmMppTRbWtfX0+XXAF3/vfdjvEf8A3v8ATiTGY8Ss5k+yb2wlw6k+yb2wlxoBgwYMAGDBgwAYdp8C+2EmHafAvtgQ9xnczzupyueKKKgnqllMpLRIWEek+NvO+3tjRYXfrN/G38zjzbRJxo0bgqknPl81+WFVTnVVRNTwx0Us4cRjWiEgajbqAeg3N7eGGWMznxMfIkNdWU6iNZLQC6kI2prjUNiDv7DfwPmjKTnm2dGkkWk4pzBvjyWqUatPwE26bmw+Hc7i/Q7YnfiKsTmWyypbRIqC0TWcEE3XbzFt7dRjOjTVU0Lrneb6XGm6WQk6Rfqdth433ufHBTZpTPStKmeVXIZlS80barqrG47w2PQ26npa4t1z1fqZyNtBVzywRyMAjMoJUj4fTFTN5WbLaoSQNUqaaUNDGDqkFt1FvE9Me5fKr03KV5ZOQeS0kvVyosT674MwmWnpJ52dkWOCRy6i5UAXuB544ylKtKs2kqGRmqEpv7v+i1fIjxmKQRl2XSpNh+ZsRtYjfwHqPSQwmlHCVYscbJIEKOVJsR3Tcgkam9Ou/TF6eqpVnglfPqtD2RGLqvcYDXZyLfEe9f8Ah38Mew8uVDTR5/WzSgnV3BdwxRQdgOlx0t1Jx2vPX9zFBXz6Ssinlq+D61nhVdIWKQ8zSVRQt7HYG+4Gyk4tRT0qSxU0fDNUY3fmhmjkIDat7kj4u6vpv1sCcWYqmnp9AqOIJ2LsdJkQrqvYjp5C/wDviSOvo5Fel+mpTKtpTIykbLu1/Abb+GxHrdeer9RRCUVUHaIqabhCu+tLNI+mVo01aTcnx3vfa/d6bjDzK8lymupOd9EvTgFowk3MVtIOxsTfcWPp08MVJKykFPFL+kdUyIeZ3EN21E2O46eXh+Vp6ian5aCTP6qEQNrdgpW4JsAb+Hh67b4Nye5v1CSG5yShLs/IGtpWmLamvrYAE9fID02xBFwxlMUAiWjSwABN2BNuh2OFlXUw5fUL2rO66GHULM6gqTYG2wvaxA3GPDU0i0PMbiKqRC50uVJK2AuDsb9Qf5Yz8/M/UuWg8+hcvMBh7JEEJvYXBBsBsb3HQYrS8LZRNAsLUaCNdNgrMPhII8fTBRZ9lopFU1rSGMiNpHQgufPp42JtideIMrcgLVKe5zPhPw3sD08bj54zW01ZaROF4dyxEKLSJoYuzKSxuWABJuevdHtjluGsqcy66RHEgUEMW2AUKAN+llGOn4kymNFZ6sKHta6N4/d7/I+WBeJMpZZ27WAsPxsVNrbb9OneGFbTVikTxeHMrSGSJKRFSSwezNcgMGte/mBjheFsnRtS0ShtYe4ke9wLA/F5YsSZ9lkXL11QUyMyoCjXJW1x08LjEa8SZU8XMSq1LbUdKMbb23NrddsK2mrFIlqLLqWHSFp4iFhWABlLAIuqw3P7zfPFmDVTR8uMqFLM/TxYkn8ycLBxJlBYr2xdSo0jDSe6oDEsdthZTjp+IMsjVGep0o+oBijdRa46eowraasfKNufL5r8sHPm81+WFj55lqNKrVIvECZLIx0gEqSbDzBGOIuIcqnZ1irFdkBLKFNxYkWtbrsdsK2mrFIjbny/tL+HBz5f2l+WFB4iypY1kaqCo6F1JRtwCQfDzGORxNlBKAVYIdSykI24Av5eW+FbTVikRzz5f2l+WDny/tL+HCleIMtdQ61AZCGLOOi6bXv7XxepqmOrgWaI3Rul8Rua4sqUS5A7vK2og7eAxZxUpvtW/hxbx69nbcMzlPecyfZN7YS4dSfZN7YS47mQwYMGADBgwYAMO0+BfbCTDtPgX2wIe4XfrN/G388McLv1n/ib+ePLtXA6WZ7hPXU+cTKhy2rp4E5SgCRNXevuenlb5YcYjh+xT+EY8adJHZqqEbUnE3OktXUTQmRio5elgu9t7EbbeH3+GPDScTc6NhXUfLMZEiFOjm9iDp3A2NvG2NDgx0vszdEPZuIyllraZXbYlu9o2XcWQatw3W3UeWLDtmFNllS9XU0yTpFK6TfqILAgtt0U3HqBfxthtitWR86GSLlRy64nXlyfC9wNj6HGJSrSooZZeIK9pmUZrkgUqqxbN3nJG1r3HUbe2O4c/kNXTCbOclKHvMNwfMEetg222LMuXzRMrR5TldnSMsLC/NudVj42IS3TofIDHMmS1EkmpsjyYozHUCl+nwHpv1Pla+PRkYIYMyz6rRo6StyaonsHVAzFtFx3ugvsR4DwxeSn4oWomdqnLniKgRx6GFjbc3t5+G+IUpsxo43rKbJctNXygiGEgMRqUaQxtddNz1HQdMWVq8/EoSWny1CxGlec1/l9xxl/guRPOmdcpTCaPmEIGBU2G/eI/wBhiMxcREAc/Lrlhe8bbLff77Y9WXPjDAzRUQks/PXUSFOxUA+2rr6dOuI5KzO5JoTTrQckqDKeZc7k207+Wk7+e2M5lyCph4kanC09Rl6yaSCXRiL3NiP9NvDqMScvPiNZOXCRQbWDWI22va/UY8lnzwNFyo6IWVeYsjkEkgeXTvXH/rfqpq8zhjLnsUYalJTmSWAnAJ633Xp+eGYyPeVnhggtNRLKoIlGklWJsQR4i24t43v4YjSPiIqxeTLlawCgBiOvj+Yx6KrO+aFMFCI2bSrtKbnr4eJ23H8+oI5+IQiGenoFNiG0yHr4fP8A56M/wMjw0ubytH2hctmEcgkBZCSDq2ttsQt9/PyxPUQ5rIyiJqNE52okqSQg6W2te/8Azy5E+eCbvUdJyiFsRKb3sNV/vuNr7b+mIVm4iNVEXioUi0EvHqJYm43HoB+Z+83MZEoXPgr6my9jpOiwZe9Y2/O33Y85WfGKMmagEgkUsoVtJWxv136lSPbrjoz5ywVooKZgUU7vtc9bHBFNnUiM7QUag/AFctceZ/58+mJn+BkccnPxrC1FDYMdBaNr2Pna3tjkRcQsoDyZepDX7oYi2/mP6f19jm4gK35FAy6V0sJG75tufQYlE+allVFpGdrFlLkabAah73P3fzuf4GQxiD8peaE12GrT0v6Y70geAwmafiFD/wBNQlAxuXkKnTfbzF7YkafOrxlIaILYczU562FwPvvjN16lqhlLDFPE0UsSSRt1V1BB+7HekeQwnWfPdBHZ6JpVbdRId1I2PpvtiR6nNlq2HZ6RYBqCl5bFjvp+e39MLrFUNLDyGAKqkkKAWNzYdT0wp7Rna0ys9PRLIS2xkIFtrb+dtV/YY6oKrNKiVTPT06Q6mV2R7nYkAixPkLjwxLrFUOqb7Zv4cW8VKb7VvbFvHs2fyHKfmOZPsm9sJcOpPsm9sJcdzIYMGDABgwYMAGHafAvthJh2nwL7YEPcLj8TfxN/PDHC79Z/4m/njy7VwOlme+GI4fsU/hGJMcRfYp/CMeL6jsdHzwDHuDGgGKeZMVo6gimNSRTyHkDrLt8P39MXMVMxcR0k7kzALBIbwC8g2/VH7Xl64j4EFMOTxFhBVZVCsUpuXjqZHN+98VwPAL49WI8N7v6PZaqOscJi1gBijsCQCpsd/wB0fn5nGUXLsnpJRV9tzqYIAhBkRo9gLFtrE2Asd+gPliesyjKXKs1bnMbMWlAikALBgyEWtve1+lxsbjHdr8mFQ0T8M5PJEsTUYKBi4GttmNrkb+gxM+R5dIJA1MCJJDI/eYamN7nr6nCGAZZRV61jVGZTzIglu4B2KsdwALbSHytt02uzg4py6qmjjj51nBIkKWUAX3J8Bt/zfGWpcCpriWI8hyyGRXjpQrIbqdTHwt5+WPXyPLXYs1KLldGzsNvIWO2OUz6kcNZJ7qbBTGbk6C4t9wJ+7EEvE9FGZAYKpjEVVlEe9yQPPe1xfE+cvylmnyPL6Z5jDAV55VnGtuoOoEb7b2+WD6By0x6Oz2QksVDta+2/X0xAvEdG1RHByqgOxUG6Du3ta+/73h0+V3OI3JbwqMoSZNQTaubCX1Wvd28yfPzJ+eA5LlxMhNMt5QA51HcC1vH0HyxfwYl5lohYeH8sZI17IAIwQul2W1xbwPWx6+GPJOHcqmneaSkBkd9bMHYXP3HDTBi3paiiFJ4aykqF7JsCD9q/9fyxJBkOW0xJhptFyCbSNvY3Hj4EYZYMS9LUUQofhvLHmhkMLWikMoTWSpYhRc3PgFFrYki4fyyCSKSOlAaFtUZLsbHz3Prhngxb0tRRCocOZUqBBS2UHVYSN18+uJFyPL0qYpxAeZELJ9Y1h919+vjhjgwvPUUQqfh6geleC0oD37wkN1v1A8APTAOG8pWLlrSAJYCwkbw+/DXBheeoohX+j+Wki9ObBOWF5jABb3t188SU+S0FK8TQQFDFcpaRtr3v479T88MMGF56iiJab7VvbFvFSm+1b2xbx7Nn8hxn5jmT7JvbCXDqT7JvbCXHcyGDBgwAYMGDABh2nwL7YSYdp8C+2BD3CHM8vzOqeGTLamCAKZOaskYPMJPd3INrb4fYig+A/wATfzOMSSclUqdDzssFvsY/wjGXzmc0dRTlcwgpo2ijXktBclmbrqCtYkAgDxsfLGuxnc3izJ0ppcuyyhqnREOup6q2oEEew1H3It0OJcjeWQq6CNsxaNEEvENHHJo5jk0llABIJF17wuPMW0n7rJGZySLBBm1EZpHAT+77EFWZbHTY3BF/Kw897Roc0OpnyTKy66TtGp1i5JAufDum58SffHUcGfRRq8OV5VHIqgAabWYKANNj06gbg2tt4Y3choiVY6oaJ0pyKxIXlLsboAQFJNh0HQWGI8yph2aYU7Q08xgk5croCsbW2YjyB3xQWo4pKoxpKIbRl1udXwnmAd61wQLb733ta+GFWtVLlzKYYHq2pXHKcXjZ9I2P7t/yxznZxpu0KmzJVEeaLWRxLxPl8epNahqVCJFYnQ17Wt3SLX8L33FvQ1YULpxVlkkXRX5MdzpALEWHf6i4HQt12sW0sVbMKfRkuWyIaXo2klSL3Ueam4t4bm+JoKaqeV4JcpoIoRYJpCnSpIuLeyn5Lt5dLkNCVYiposz7POo4pyuRn1ckiFJOWQykg2tqsNSnpbUDi00eY6YJEzrLuUJAkuiJWBNzuCF2vcXHhpG/U4uRU9fCA0GR5YCT+ppXT01Anz1X+XicdUwzUGRHyfL0hVTywrLdmAOkWGw3AHXC5HQVZn4481g7Hq4pysxaijRmNS0hFgRrKk22O9ttXjtjS0FbQ0lEhzPMKCZ5JW0yoAqbm+i/TbdRfc2F9zijJT5i3LaDIMp0gE6zoOkb/DbqOm+353E0MGZvEhnyLKyw7yhCGCnYePp4+g2ww4aCrGgzPITIEFXQcy9tOtb38refpgGaZHoD9qowvS5ZRb38sUKuLMg8y0mUUDDSQjsF2awIBF+lyfzO/jxTUde87JPk+V9mkYMxVQdrC5PmetsTDhoLzH8MdJPCksKQvG4DKygEEeYOO+ywf4Mf4RhVzs3gpEdKWlSwX6gEDe7XAN7D9X7yeuPYqzO2QB6OnElwGtJcLtc338Pz8vHDDjoWrGnZYP8ABj/CMHZYP8GP8IwiWs4oGstl9GxJug5trC3Qm/8Ay/pfEsdfnpkCvR0g+rLELNchrGy2v426+n34YcNELzHHZYP8GP8ACMe9lg/wY/wjCCfMuI4BrbLKUxhu+wmACrfruRta/l7eGCHMOJzTzySZVSF9S8lEnFiCyg3N/AFj91vdhx0F5j7ssH+DH+EYOywf4Mf4RhWtXnhUK1FTLIzED629lAXvHz3JG3p54jNZxCL6qCkCqqnVzr38/K2Jhw0QvMc9lg/wY/wjB2aD/Bj/AAjChavP+eVNDTcsXIbmddjYdfO2/r08vGq+IRArjL6Yya2BQS/q2Gk3v1vfbFw46CrHHZYP8GP8Ix52WD/Bj/CMKZ63PBJOsFFStosUEkttQufIkjYdbfPHiVufaW5lBTA8okWlFtd9h13/AC98MOOgqxx2WD/Bj/CMHZYP8GP8IwlFfnulEWkpGnCXkQS2s2q3n0t/wWse2qeIgCVoKUkA93mW1b7EG+23h7b9QJhx0F5jZI0jmOhFW672FsTYhjZmZWZCjFASp6g+W2JsIJKqQZzJ9k3thLh1J9k3thLjYDBgwYAMGDBgAw7T4F9sJMO0+BfbAh7iOH4D/E38ziTEcHwH+Jv5nGX5kOBJiKn/AOnj/hH8sS4ip/8Ap4/4R/LB+ZF4EuDBgxogYXZubUNSRTvUkU0v1CMVaXb4QRuCel/XDHFDNJeTSVEv13cp5G+pAMmw/Vv4+XrjM93QqMcsf90SnXhSsWmSQWtUuCA2kXAtqsLbjw0+xx5PUTGqctwfXO0os5Woa3e1E22tswG9x126YvVM1Ahjl7XmyS9lgHOUi7LeSwY+fXUTYX04GmoROq9pz0teSx1nc+K+nhYbfkbbMhlFBDW1ckM+RVlJDNTnVM1TJpubEoAdJB3O9gNvXDteGMpQ3FMbnYkyMbjy64zzzUr08xhzLO0YxqdTAsbcxBewsb9Ad9gW6YkepoUpgVr8+NkYgrLckgDfyvvsD8txcByeEsmK2NO5FtNuc/Trbr02xKvDmWx1kdVGksc0bFlZZmtc9dr239sIo6ihq6OnOvN4ZIVZrsQJN7XufvvttiGofKpXUSyZo79wJdRITYKQCd7g2B67ne/Q4A0bcNZUzajC5a1gea23548ThjKow+mGQaypb6999PTx8PLCOeehgmaeWbOtZjC3U30rZRYW3BOxt12vhtS8QQCLkJDXSyRoCTJFZmFwN/C++/t6i4Ej8KZPIwZqZiwNwea4/wB8dfoxlXeCwOgbqEmdfC3gfI44fiejQK3JqSjMVBEfW3iBe5Hr/UXKfiiiqVcpDVroXUQ8JU9QOh9xhmUsPkGXyTmeWJ3lJBLNI250hb2vboB/PFb9EMl5jSdmcu1rkzvuB0HXp6Y9/SamshNLWKGPjD8jjr9JKTlO/JqQVYJoMR1Fu9sB/pOGYO24dy54+XJHI6dzutKx+FdIB3328/E46Xh/L4545443jkj06SsjWsPCxNvf59d8RR8S0cslKiw1d6gXS8BFtyN/Lp/LEX6WUGpFMVSNfTUgA+HV1J8gcAWRw5lgmp5hC+unsIzzW23Lee+58ceJw1lccJiEMhUsrHVM5N16b3/LHK8RU7vEkdNVu8q6lUR2NtRG9zt8J64hPFlGKgQtTVoY+PJOkC9rk+GGYJ5eGssmmeV4pSzks1p3AJJJ6Xt1J/LyGPZeGssmWVXiktK/McCZxdrk+B26nHi8Q0rVSQLDUksVVm5eylgCoPuDfa9rG/THsWf00yQMkFUBMwVNURHgTc+XQ4AjThXKlVbxzMyqq6jUOL2Nx0Nse/otlPLZORIA17kTvc3IPW9/AYibiujQPelrCU+ICK9t7bb97r4X8bXtiRuJIFpo6jslZy5B3SYvUjfyvbDMF2HK6WCdZo0s6kkHx3v1PU9T8zi7hEeKaQKxNPVAi+3L67X2339xf5YtQ51DPmZoVgqNYAJcp3LFQ3W/rb3xAX/+9/pxJiP/AL3+nEmMx4lZzJ9k3thLh1J9k3thLjQDBgwYAMGDBgAw6T4F9sJcO0+BfbAh6emI4PgP8TfzOJMU1rYYbq7EHU36p88c5SUWm2VJvcXMRU//AE8f8I/liPtsX7/4D/TEMeYU0UMavJpbSNip9B/PGcWzvby3XTcX8GKa5nSMQFluT0sDv0/qPng+k6X/ABfG3wnrv/Q/LGsWGpLrLmKOZ6+zT8uoWnfs8mmZukZsO8fbriRa+BwSrMwBtsh64q5hUCWnlSIIXaCQKJ4yYySBbUPFfP0xmVtZ036FUXoZSkz+l5sdNDxQ01TLTAxE0kjm572oL0bYi/7OnyuB0M+pcupuy1PF7CVJCTLLRG5ADMw3BvfYg+lhieSKpkjn5NPkiTsQI5TAWYm17sdNr30np4+2O1WvFOiSUmSmYsrM4iazPvc209bePXc43i2eqJdeg07DmtUgmpeICkTabf3RDewAbr5kE+l8WEy7NuVpfOQXMmostKo7u3dAufC+/XfCiKpziPLY0pJssRgW70cbabbWNgLE/EdrbkeF7yR5hnQEhlnpNR0iNUBI1amve6jawA89mwxYaoXXoXxlecdTnliNQFqVehIt1JvYDrjgZTnmpXbPwWCFdqRQpJI3tfrt+ZwtGc59pEqSZZOkh7hUsFC2Jve2/wCr08MW5a7iBpQYDl5iVt9SSXbY3/O3/OrFhqhdehfkoM1MjSLmiX1uVTs4A0EDSp38CL6vU7YrR5TnrU6ioz68vdLaKZQAR1AtbrhlTVn91i5+vnaBrsh+K2/hiXtsX7/4D/TExrPmQuvQp9gzIQaRmx5t9nNOtvvHz8fHFWbKc7Ma8rPbSDTdmplt17xt7E7e3vht22L9/wDAf6YO2xfv/gP9MMaz5kLr0FP0ZnqRlUzlGeScyPIYANKabBVW5GxAPz88eDJs5FQ8n6QMQbWXsq2Fh72/LDftsX7/AOA/0wdti/f/AAH+mGNZ8yF16CepybOqmqMi58YYtbkRJTjZTcAXuL2B+eJlyzNxDobONZ7oDCnVSLBr3ve9yV8unrhl22L9/wDAf6YO2xfv/gP9MMaz5kLr0F8uW5s0SJFnZjIUBm7MrEm5339CB93riOPKs6SZnOf6kbcoaReu3Tfbp+eGnbYv3/wH+mDtsX7/AOA/0wxrPmQuvQWQ5RmsdHLC+eO8jrpWQwKCvTfr5Ajr43646+jc4JgBzvuov1hFMl5Dc/h2IH3YY9ti/f8AwH+mPO2xfv8A4D/TDGs+ZC69BectzdolU513r95hSqNS+I67H1w3RSEAYgm25AtfEPbYv3/wH+mDtsX7/wCA/wBMMaz5kLr0LFsGK/bYv3/wH+mDtsX7/wCA/wBMMaz5kLr0JP8Avf6cSYgimWaY6dWy+KkYnxYNSTaDVDmT7JvbCXDqT7JvbCXGwGDBgwAYMGDABh2nwL7YSYdp8C+2BD3GdzPI6DNpkkq4mZ4TIsbK5XSGO/Q+mNFhd+s/8TfzOPLtLapQ6WYWxm83pUkrKaT6IesZ0iiMiyFQqFyT4WsNifO/ocaXGZzaGjkq4mqe3Ly4Y5C0NtB0sWCnxJJFtPj3fTHlh5zpLcLXpALQLwvPIgSwvUsLsCwUEkfnfbV8panLafXyY8hrJUbS2ozuvUXt5C2p/vv5nDMcWUuoq1DmCkRCSxguSCbWABuSDe49DjuPiimlgMqUdba1wpiALHTew33O1vfHWstDORVp81zCjpokh4dq2RtbuOYLoxY9bgX8Dt5+NsOswihqqGaKWKSWGWnkV41BDMpG4HjcjbFWLP4pELdkqgOSJwCguVIv0ve9vzsPHFrMY46igninMkcUlPIrlPiUEb26745z4VRpGVq8iyqSqhLcN1ckRhEnMWRg0ZYsWQrfqNjsf1j6XPojLTCzrwzXqZAV0GQiyrp0ggMbAnpa/wAOJmrctmlVRWZ0JYYOWJVU3K2vqvp+Lf79IuMT09VQgyTrUZpLHdS4mBI6gg6djfugext447VZjIpUuRZRLHPEnDuYRrUaubzJXUmzq1738SoIt5eGLoyjL3SnqTlNaGiZVSN5XuF36gEg21H5nfriKGsy+eOncZhnNOSQCHNrkEL3iRbx3N/W+LAWjpK9yK7N3nZXS+7KLXBPw2uNyOvnbcXlWBV9B5Us1JOvDWY85HOkrI45YFrN1tcgDw8Nz0u7pqlsqo4YaPJq10eRiylizAncsS3mTfc+JxSbsMlNJA+Z5y4RBqN7nYgXuF3J1D5YkeahmR2jrs3QFVJZSbgHyuDY9duu2w3FzzyYGgzep5mlsnrVW473dI99jjkZ1VCNmbJa26NYhQD9488KcxlyqcJUNU5nSSEga4FKOx2UX238MS1HY6RKeH6SzUxqpZRE9y19NhsOgt5eJ9cZurQtWaSCVpoI5GiaJmW5R+q+hxIMYuOty8hQtTna89lZieqkqTuLewJHQgb4s/3CiVKiTM85kRANKyMXsZBYH4b3APsPniOBbxq7YMYd6qiVf7tm2fEs6hjuwUHyuLeHXfr64slKaFJGjzHPJDOFV2D3KjVbUBYWJ0Wv5HDDF41+PbYyb1GXpTQg5pnIVJrBtbapCwJAO17WQnwt9+ACiZUCVudsHjZo0EjANpLEixFh8BG+1iPPC4W8ay2PMZBKrL2ZyK/OtMMLA7GwuG7wOndu9sfQYlWShqNESV+boYh9tqNyG0ndiNhsvl4+RsuEvGrwYzdRJSrUsrVubEzMyAI/djOq9xYetvGw2IxFT1FJTS1EgzLOZFiBR1kBcC7W27u5uw38APIHC4LxqLY9tjJStl8MEdO2YZujd5g6t3wG0EqWtt4fniefsUlRPK2Y5sp5YusZZQAxBBAt1Gse2FwXjS49xlcuzTLYGNRHX5pUIA6lJELKCNzcaRvsdz6jDMcR0bKxEdSLKGsYSPC/z9P/AKxHBlUkPKb7VvbFvC/LKlKuNZ49QR1uNQsevlhhj17P5DlPecyfZN7YS4dSfZN7YS47mQwYMGADBgwYAMO0+BfbCTDtPgX2wIe4XdGf+Jv54Y4XH4m/jb+Zx5dq4HSzPcLpKStllSWCuMMQiUCMICNV7k3+Q+7DEY4h+wj/AIRjxp0lU7NVQpXLs4MKI+ahTqBZxGCSLAWH33OORl2darNmysvLCgiICzAEFrDre4PoR5Yd4MbvMzdRWpIamLndoqOcGe8fdtpXy9cQ5tK0GXVUqzinZKaVhOy6hHYX1EeNutsX8VMwcJSzu3JKrBITzzaO1v1v3fP0xiTqy0EtJxTlFO/JkzZ52cjSHhfWCWGxsot8agAjpY+uJ/004e1opzEAuoYExOBYgkXNrC4B64gljrIzy6eHJg5p4neEjYNdrt0G1wum/k2OJaWs7VtT5ACS+rVGSwt0Pr436eOO7jFmKsb0Oe5bmNT2elqdc3L5nLaNkbT3d7MB+0vvfDHwxl0TNKSnkeko8k7WsfdEPdsdYB8tgt/HrbFgVXECFnkkyblix+Jxbpcfn19RtjLhoaUjQYMI4avMZcrinFZlzVBBclGJiYEi1j1t6+3XAKnNpKYfX0HO0N3o37mrfzufLEuC8PLYMIpqvNecghqcsCiMEK7ks79CDboBcdPH3wxpaphShq2SnWVfi5T3XwsRf3HzxHFoVRcwYjNRArBTNGCSRYsOox7zov8AFTpf4vDEoWp3bBiHtVPdfr4+9sO8N8dc+HSz85NKi5OoWA/4DiUYqiTBjjmx3A5i3PTfrjk1EA6zRj3YeV/5YUYqS4MRtUQr8U0Y92HtjwVMDdJozvb4h1vb+eLRipLgxHz4eYsfNTW4uq6hcj0+Yx7zorX5idbdcKMVO8GIBWUpRX7TDoYgK2sWJJsPz2wNWUytpaoiBtqtqHTzwoxUnsBgxD2ym0lufHYXudQ8OuPVqYHmaFZozKuxQMLja/T2IOFGKlqm+1b2xbxUpvtW9sW8e3Z/IcZ+Y5k+yb2wlw6k+yb2wlx3MhgwYMAGDBgwAYdp8C+2EmHafAvtgQ9wsMiB3BdQdbePrhnhLmOTPmjQyJmNVSGEyjTC1lfUerDxtbb3xxtbO+0qmoyuk/NT/EX544hkTkp31+EeOGttsZHPpUgqqRy+ZGRoo1EdNYoe9fpcEkna4vba/UY4d1d5Z+n9m8TLcPObH+2vzx7zY/21+eMe2YUcSwxy1GeABdTyKBe19O+k3X2tc7ddsSCnWprKKBM2zxOaVK/Cq7qW799wdze/U7AWXbfdXr6f2TF/Bq+bH+2vzxTzKRDRVNolqf7vJ9RqtzNvh+/phnl1E9FA8clQ87PK8hduo1G9vYXsPS2I81RJKSoR55KdGp5Q00Zs0Yt8Q9R1xiWzNZ104f2XE/BklBkh1TZCOYkC6EE29wWsoa+1gx/EceQQq1OksnDEKTiT4BOvd1A3N/uUff5DHFZS0j10N89zyOJ4ecjxMQhRix3tvqW3iNgVHgcHLo2geaPPs+EcgsgYPchApJW4BUm4F267464D199TN87lhVVMMfDMMqaUVb1I027rkdP1WH/4j7pFp4ZIAW4dQEMYwjVAuEbYn23O3lfzxBR0dC1NPFT8S504qA6jQSpjs6k6bju9LDzDG2LhpIysFameZrJGrLGyi4DAk2Yg2N+8d/bbphgS199RfKwvGOXDw2uldSgCpAGxABHgL2Hrt7XgdTLLGzcJqb3aQvUqWDC1vfp+XzjNFRwz0U0fEechVYqtOinlm2kFmUfqnSNr+LW6nGkos3o8qpYopausrBNM1pXjJIY7kWAvpudrCwBHhi4EtffUXxfNHDPKElyEPBzeUWMq7JZSHtfpe+3Xb1xBBUSCFZYuHFRiN0M4BA62sQN7/wAz9+kXiXLmNv7wG2BBp5B4262t9/THA4oy3lGRjMqq2l7wsdJtfewxFYS199RfM8VY08LNw4l2dmePtYuptsx8ydTfn54jpo1hglK8LR0+tW1IKgHVuLDbzsD6Wxu6eeOqp454rlHUMtwQbex3GJLDDAevvqL5hWROzoRw4he5CRCVe6Ba1z033+WIjoM8sMfDS7cuRrzaUdyCbdLEDWw/26Y39hj3bDAevvqL5ho4IYNUi8PQhqUAU5Eoue9sBtsBdj6bbdbRmnQVIZchBVCpV1qAp6abHf8AVBPTy2HS+92wYYL199RfMZHThhSSQZTTRTIjd2eUgR2JIAIB8Wv958rYmpcpyyoQT1WX0yVCsy9b2AY2Iv4G18a3bHm2JgS5vfUt9aGeXK8rWUS8iIuGVgSb2KgAW9gBgjyrKYhEsdNAoiYMlv1SL2P5n540WDE7vLm99RfWhm3ybJ5HldqaAtLtISd33vv57gfLHZyzKzAkJgh5afCL9NyevXqT88aHBh3eXN76jEWhm5MnymQMHgiIbdu8dz5nfc4nSjoErDVqkQqDsZL79AP5AfLD3Bh3eXN76i+tCnSMrStpYHbwOLmIx9t/pxJjrYxuxoZk6upzJ9k3thLh1J9k3thLjqQMGDBgAwYMGADDtPgX2wkw7T4F9sCHuI4PgP8AE38ziQ4ih+A/xN/M4y/Mi8CXCuopq6eGBqOq5No7MptuTaxvY7gX+eGmIqf/AKeP+Efyw+pDgIPoziTnxyHOIdCqA8QiFnNzve1xsQPuv47Wcqy/O6aWNswzWOqVQwdRCF1XtY7dLW++59MO8GNEDFHMtfZpuXULTydnk0zPa0ZsLMb+A64vYoZok0tJPHTxwyTtTyCNJhdGa2wb0v1xme7oVCQ19XUQwTwZ9QKklPbVYadY6m589SXB6W2G+J4quojqpUqs6odAYXUEKVswuL/cRbrv123V9gzQt2Y5fkYiR1kWn0KX0EgFrdAdjv0Nh93k1HxD2puXQZCzMdy6fEp1a7+PUqem+9+uNmRgKusks8OfZfpTvTarbBe61vS/U/K2IoczqOfIX4iysoqMNFxcNYgE+l/Ha+33+5XlUrVkiV+WZMKR4NMwjjXWZSQSCOmnr69MPFynKVvpoaMX62iX+mAEBzCtek1/pHliEoG190DxuQD0G48/9jbSoranakzyikeQ3jWy3HmLDci3h19cMPozIzoiNFQ73Kpy0307Gw9McyUmQ08yu8NBFLFZlayqy77b+G5Hz9cAK5p8wetc0+f5esEmkrG2ksAF7xB8dwT/AE8PYKmrNQJTxFQNTKEEikKCLm49iVw5FDlIk5IpqQOU+AIt9N/LyucerkuVKjKuXUgVyCwEK2JHQnbACWfMJVp4lPEWXx1Std7Muki58N7Dp/XxxHT1uYywDRxDlkpM4vILEBDq2XzNyoHsfbD45JlTMGOXUhYeJhW/8sAyTKlFhl1IB5CFfby9TgUUc3M6esdJs/y/4h9U6gFNhcW2O/X7+pxytdWrKqvn+X7BwQQPiI7lztsOp6XN/YPly2hWTmCkh5lra9A1Wtbr7YjGTZYOmX0o72r7JevW/TrgQQT1ea0VEXnz6gL8xbEgC4Zr6bAG509Nt7D1v3BUZtIKhI8+y2ac6eWq27m63uPYN95+T36Hy0hQaGnIRgyAxghSFCgjy2AG3gMdDK6BZRKtHAJAQdQjAN7W/ltgUUx1tT9Ukmd0JaUkgrbdf3fW4P8Awb15a6uUSseIcs0RjfSouG3NjufI7de6cPlyugUxlaKnBjFkIjHd9vLqfnjhcmyxY+WuX0oS4OkRLa4v6ep+ZwAqSor1qnWTO6DSBfQSLg7jf0vbbr6+fFRV1q04Mef5ckqOFlMmnSLgWHvsSL+eHJyjLTK0poKYyMbs3KFyfU2x59DZZ9Z/8fS/WNrf6pe82+523O539TgBNLX1klRKYc+y9Y1AIFg/Um3zHhe+3hjmHMaoq1+IcskJjNtLLsdwDt4XK74cpkWUoQVy2kBHRuSpPh429B8se/QeVFNH0bSaALaeStrdbdPQfLDIgngfN5jHSxZzTPVRBuaeTsxDW8rbWPTyPuLho8/vcZlBcBgBytm32vtsbf8Arzax0sETBo41UgsdvNjcn7zibEKQx69S8zSH0DUFO1/TE2I/+9/pxJjMeJWcyfZN7YS4dSfZN7YS40AwYMGAP//Z	[]	2026-10-27 20:58:15.281+00	2026-10-27 20:58:15.281+00	lectura	\N	\N
26	art-e9a740db	Urgencias	Alimento	Comer bien	{"Comer bien"}	3	t	data:image/jpeg;base64,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	[]	2026-10-28 17:46:41.612+00	2026-10-28 17:46:41.612+00	video	youtube.com	\N
\.


--
-- Data for Name: avatars; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.avatars (dni, mime, bytes, updated_at) FROM stdin;
\.


--
-- Data for Name: intakes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intakes (patient_id, day_key, supplement_id, count) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (seq, id, conv_id, sender, kind, text, at_iso, read_by_gestante, read_by_obstetra, lat, lng) FROM stdin;
52	m-a-1792882098933-90qmlq	p-3396ccaa	obstetra	text	Hola buenas tardes soy la obst Liliana	2026-10-24 22:48:18.933+00	f	t	\N	\N
53	m-a-1792882108327-c83c5p	p-3396ccaa	obstetra	text	Se encuentra bien	2026-10-24 22:48:28.327+00	f	t	\N	\N
54	m-a-1792882121811-t69ljz	p-3396ccaa	obstetra	text	O presenta alguna molestia	2026-10-24 22:48:41.811+00	f	t	\N	\N
55	m-a-1793208793038-hodo8v	p-b50cf8bf	obstetra	text	Hhjkk	2026-10-28 17:33:13.038+00	t	t	\N	\N
56	m-a-1793208822378-eulgca	p-b50cf8bf	obstetra	text	Hola	2026-10-28 17:33:42.378+00	t	t	\N	\N
57	m-a-1793212479522-hs1adz	p-b50cf8bf	obstetra	text	H	2026-10-28 18:34:39.522+00	f	t	\N	\N
58	m-a-1793212480806-b3mrq1	p-b50cf8bf	obstetra	text	J	2026-10-28 18:34:40.806+00	f	t	\N	\N
59	m-a-1793212483731-7n47ag	p-b50cf8bf	obstetra	text	J	2026-10-28 18:34:43.731+00	f	t	\N	\N
60	m-a-1793277967439-q5vg1l	p-5eab51df	obstetra	text	Y	2026-10-29 12:46:07.439+00	f	t	\N	\N
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patients (seq, id, dni, first_name, last_name, age, community, phone, fum_key, gestas, cesareas, abortos, obito_fetal, rh_sensibilizado, antecedentes, hb_observed, bp_sys, bp_dia, imc, adherence_base, obstetra_dni, weight, height) FROM stdin;
33	p-f8776b1e	46963105	ILDAURA	ROLDAN QUISPE	34	Aranjuez	976569616	2026-07-08	1	0	0	f	f	{}	13.7	99	67	28.6	0	\N	\N	\N
34	p-41f21ef8	76686412	GLORIA SOLEDAD	RODAS PILLPE	25	PALOMAR/ARANJUEZ REF.COSTADO DE LA CASA GRANDE	986412578	2026-04-01	2	0	0	f	f	{}	15.1	123	69	28.9	0	\N	\N	\N
36	p-3396ccaa	48154160	ELIZABETH	CENTENO LAURA	33	NINAMARCA REF.FRENTE ALA CHICHERIA	957562515	2026-04-09	4	0	0	f	f	{}	14.2	106	65	30.5	0	\N	\N	\N
38	p-2236b07d	73513013	SOLEDAD	CCOYSO  MEZA	27	PALOMAR/CERCA AL RESERVORIO	969539309	2026-05-03	2	0	0	f	f	{}	12.9	118	69	23.2	0	41234812	51.4	1.49
39	p-b50cf8bf	88888888	ELENA SALAZAR SERNA	SALAZAR SERNA	25	Talavera		2026-10-01	1	0	0	f	f	{}	13.0	110	70	24.1	0	41234812	58.0	1.55
40	p-5eab51df	12345678	DIANA	QUISPE QUISPE	25	Talavera	987654321	2026-10-01	1	0	0	f	f	{}	13.0	110	70	24.1	0	87654321	58.0	1.55
\.


--
-- Data for Name: push_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_tokens (dni, token, platform, updated_at) FROM stdin;
41234812	ExponentPushToken[EndXgOCf5uVfnLPqN2H1tD]	android	2026-10-24 22:21:31.589705+00
87654321	ExponentPushToken[dL_p03NL4QJj1t9ImAVGiM]	android	2026-10-26 02:26:58.464381+00
22222222	ExponentPushToken[kJFCJMLcSHrjHLJ_Z4vjWB]	android	2026-10-27 13:31:15.845886+00
87654321	ExponentPushToken[YrqD0iDMn547uWx7Bm7OC-]	android	2026-10-27 13:49:18.378467+00
41234812	ExponentPushToken[6x6LgHBtQai6PRGFeqXmdf]	android	2026-09-10 13:07:39.845575+00
87654321	ExponentPushToken[KdrivGFCBKrkjcuJgpUBOk]	android	2026-10-29 12:49:00.080512+00
87654321	ExponentPushToken[3uPbeGCItQj9PghgLQUsGg]	android	2026-10-29 14:54:29.381767+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schema_migrations (id, name, applied_at) FROM stdin;
1	esquema-inicial	2026-08-18 13:49:03.32033+00
2	add-user-auto-controls	2026-08-18 13:49:03.32033+00
3	add-whatsapp-integration	2026-08-18 13:49:03.32033+00
4	add-push-tokens	2026-08-19 05:16:03.582843+00
5	add-education-articles-and-assignments	2026-08-23 04:40:32.242465+00
6	add-patient-obstetra-anthropometrics-and-article-media	2026-10-27 21:25:19.694832+00
7	disable-auto-controls-and-add-appointment-notes	2026-10-28 03:36:11.597355+00
8	add-article-indicaciones	2026-10-29 04:23:48.736748+00
\.


--
-- Data for Name: sent_reminders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sent_reminders (id, patient_id, kind, sent_at) FROM stdin;
appt-p-2236b07d-c4-24h	p-2236b07d	recordatorio_cita_24h	2026-11-07 05:08:55.930609+00
appt-p-2236b07d-c4-2h	p-2236b07d	recordatorio_cita_2h	2026-11-08 17:38:55.805855+00
appt-p-f8776b1e-c2-24h	p-f8776b1e	recordatorio_cita_24h	2026-11-10 05:08:50.632281+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (token, dni, at_iso) FROM stdin;
fcd6420a-29ec-4920-8823-b0f7e01cf383	10000000	2026-09-10 02:31:56.762+00
c97b68d1-4e54-44e0-9dcc-0fe65413804f	10000000	2026-08-28 00:38:54.669+00
015141b8-eb94-4fcf-99a1-8c6e3467c22d	10000000	2026-08-28 00:39:20.914+00
9f0e3882-c30d-47e8-b9af-396323deeed2	10000000	2026-08-29 00:44:30.47+00
afe082ca-1f0c-4d24-8ede-7aed4613bb01	10000000	2026-09-08 03:50:49.907+00
a5eb59f3-bcc3-45b1-9fd3-9f61b0f04612	41234812	2026-09-10 05:15:05.538053+00
6c80e7ac-0334-4dcb-ac94-010e6f4fc637	41234812	2026-09-10 05:26:20.662255+00
31780963-5c81-49de-8e3c-53e568b5857b	10000000	2026-09-10 05:28:44.848892+00
08525ecb-af65-4fce-a28a-3b8d70067e5e	41234812	2026-09-10 05:31:00.194448+00
3f22dde5-fa9f-4108-a9a6-7f1580ec75fa	41234812	2026-09-10 05:31:39.480564+00
769d2442-e2c7-45ad-b6bb-a06a6d3d4918	10000000	2026-09-10 05:32:08.732071+00
b0381386-f28a-4e0e-8fdd-483dd6c6d246	46963105	2026-09-10 05:32:22.27546+00
0a24f63f-5ce5-41a8-a1e8-10b6341327fd	41234812	2026-09-10 05:35:55.320827+00
e827ae2b-e5bf-495d-bede-f16df2ef75af	10000000	2026-09-10 05:54:28.121287+00
aec8c4dd-ebb0-4673-b385-fc3de02d54fb	10000000	2026-09-10 12:34:40.516655+00
1ed5bc46-8013-4ed2-b7c4-b29c09920dc8	46963105	2026-09-10 13:06:46.483433+00
cc7bcd37-0fc4-49fc-a5ff-006aa0bb4abc	41234812	2026-09-10 13:07:39.066688+00
58642cc7-e715-4c92-b7de-331c520b5d12	10000000	2026-09-10 14:32:00.636927+00
7dfcf9bb-5328-4e33-8533-b2bbb6841ab4	41234812	2026-09-10 14:34:03.753123+00
9fb693ea-621f-4415-8e85-4edeb0b622f7	46963105	2026-09-12 21:30:54.655839+00
f633dbfd-b1be-4bf4-a3e0-ab62e1e90c82	10000000	2026-09-12 21:32:16.442049+00
417711c5-32ce-49fc-b050-b421358f0f30	41234812	2026-09-16 03:22:36.669682+00
d716b9f6-955a-49df-a428-3ebb438e59a0	10000000	2026-09-16 03:42:01.202132+00
e04a04ac-a026-4427-ba0f-61c9cf4edd63	10000000	2026-10-16 03:11:46.358934+00
62449019-59c5-484a-bcdf-ab9003a0f182	41234812	2026-10-16 05:11:12.122445+00
d146ea89-3c0e-43ce-8401-01ee840059ba	41234812	2026-10-22 11:56:54.396042+00
7adacd02-d100-4376-8c38-d06b73b39cd4	76686412	2026-10-22 12:00:16.198485+00
fd7997f6-7067-4106-83c7-9a1514706e55	41234812	2026-10-23 23:20:42.451031+00
02dfcf8f-9497-4a15-96ba-725ef91cb535	41234812	2026-10-24 22:21:26.0625+00
9ede911e-1048-4511-913a-1f71972b7cc5	41234812	2026-10-24 23:07:51.682116+00
7d89b5f9-5877-4fe8-8538-c25ad57372e6	10000000	2026-10-26 02:17:14.108686+00
a9e60c2c-015d-43ba-bd4f-06a4c257fbcb	41234812	2026-10-26 02:25:36.160459+00
ca76eae5-8b51-4bc9-b9f0-1c0586af60a5	87654321	2026-10-26 02:26:57.382006+00
5699f18a-67e3-4985-9a76-62cc03b813ad	22222222	2026-10-27 13:31:07.80207+00
232d9cb6-9963-413b-a5a9-9f7a5ab4c440	87654321	2026-10-27 13:46:52.035291+00
cef5e861-6160-417e-9af0-46093bffdfbe	87654321	2026-10-27 13:49:17.367857+00
d5b5cddc-b9ba-43b2-9493-bd065ae792c8	87654321	2026-10-27 15:23:56.912618+00
f3cfc24d-9fbf-4124-86f2-0d5a0d910d23	22222222	2026-10-27 20:35:15.430785+00
4a61552c-9ce5-4662-b7ab-ca89ff76dd93	41234812	2026-10-27 20:47:03.547541+00
283c400a-47f6-4fdd-8a60-d062f63cce6e	22222222	2026-10-27 20:49:28.263025+00
7933e946-e668-4ae8-beed-3eca38bedd67	41234812	2026-10-27 20:53:40.085049+00
d4ae2640-96df-4093-8818-222a48f0a3c9	41234812	2026-10-27 20:58:49.834934+00
79a36dc4-aa37-4632-8b9d-c9e1bf969dcf	41234812	2026-10-27 21:28:19.697049+00
1e0775f9-7983-45fa-93ab-fa7d2f804cee	87654321	2026-10-28 01:45:49.308549+00
f1d75262-63a4-4058-a652-e62c0636b111	41234812	2026-10-28 01:58:01.558665+00
1e29f26c-53f4-4bcc-975f-8647ddb2cae2	87654321	2026-10-28 17:24:36.096424+00
28c5bf90-162e-4fbb-81f8-020bf84e7475	87654321	2026-10-28 17:27:46.194237+00
67b0d033-d7da-48ab-9215-44f740bfd443	41234812	2026-10-28 17:29:44.553985+00
9db23b1a-80ce-4d45-86d8-72f573c47b17	87654321	2026-10-28 17:40:38.199884+00
4af27bc0-e4ff-4d5b-b502-a0d34fd3f433	88888888	2026-10-28 17:41:03.70714+00
e52544c9-6c76-4504-a73c-468b3cde8a6d	87654321	2026-10-28 18:44:57.534001+00
9e6d883c-536c-4eb6-8b4a-1e7e95fe7276	87654321	2026-10-29 03:01:52.757213+00
be9264ea-83f6-447f-9d82-0953378d61d9	41234812	2026-10-29 04:17:22.203935+00
a5cfe475-f763-4a85-87e9-91620d90bb04	87654321	2026-10-29 12:48:56.931766+00
e317469e-4fb3-4443-b9d3-637fe9c45d2d	87654321	2026-10-29 14:54:27.593882+00
\.


--
-- Data for Name: supplements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplements (seq, id, patient_id, name, dose, schedule, times_per_day, start_key) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (seq, dni, password_hash, role, first_name, last_name, active, patient_id, phone, avatar_version, auto_controls, created_at) FROM stdin;
46	12345678	$2b$10$9gQWJ3b3fzMzoh3IVbdb6ea9DDdWP9OQ2tdOxk3u8Oqd/4sMzXnIC	gestante	DIANA	QUISPE QUISPE	t	p-5eab51df	987654321	\N	f	2026-10-28 17:28:39.047584+00
38	46963105	$2b$10$1gk4O5av.erZEqMyI9JC7u.DO5H2lnPE9FZRu2/3iXiJdrln6lPge	gestante	ILDAURA	ROLDAN QUISPE	t	p-f8776b1e	976569616	\N	f	2026-09-10 05:19:06.00023+00
36	10000000	$2b$10$Pthi9MOAWCeXgC4RY2MiBuusfRQRsQVu8oSn6PhY6KY7.tsXgwH3u	admin	Administrador	Principal	t	\N	\N	\N	f	2026-08-28 00:38:17.702+00
37	41234812	$2b$10$uLXViDgN5DdzQXHt5wQqduzZKxMOo3eVTJ521SK73s3b9lgDqyZbC	obstetra	LILIANA VILMA	TORRE TINTAYA	t	\N	961640114	\N	f	2026-09-10 05:14:47.620203+00
39	76686412	$2b$10$Ri6YbZ9FFtEjxUoXFrTVOOaqHT0vi0vLtYE46ZeJcwtEwrR8kkYOm	gestante	GLORIA SOLEDAD	RODAS PILLPE	t	p-41f21ef8	986412578	\N	f	2026-09-16 03:38:46.979761+00
41	48154160	$2b$10$d69WHrRJJjzo3VRB4vJlVu45hhgz2oQO9SUdpQPH3UVsyaE9uw0B2	gestante	ELIZABETH	CENTENO LAURA	t	p-3396ccaa	957562515	\N	f	2026-09-16 03:59:39.485885+00
35	22222222	$2b$10$UWQV6sBsvufIHBUuRNKlTudVy/YMVw1TUZiqF1QVCt36iK/RKexGq	admin	Patricia	Salas Vega	t	\N	983 111 222	\N	f	2026-08-11 05:02:15.731+00
42	87654321	$2b$10$QvAgQrqIPmvs/T.zfHavwO7PyfL85syCNBfmm.yCRFU5NVzCZZGNi	obstetra	Deysy	Berrocal Salazar	t	\N	930356897	\N	f	2026-10-26 02:20:36.773501+00
44	73513013	$2b$10$w1TjCOLbFqwCHZ9O42mo1eFNQA3/R1mQdomxfE95QpCKL/rlJxkOm	gestante	SOLEDAD	CCOYSO  MEZA	t	p-2236b07d	969539309	\N	f	2026-10-28 01:56:05.275855+00
45	88888888	$2b$10$q/E9Et9i9E6U3077Z/jCg.dZ0Tl3PL5fQiTn/P.gmOyUlO/bHGlBm	gestante	ELENA SALAZAR SERNA	SALAZAR SERNA	t	p-b50cf8bf	\N	\N	f	2026-10-28 02:06:42.941332+00
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.visits (seq, id, patient_id, date_key, "time", motivo, estado, resultado, created_at_iso) FROM stdin;
\.


--
-- Data for Name: whatsapp_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_config (id, enabled, server_url, api_key, session_id, notify_appointments, notify_supplements, remind_appointments, remind_supplements, chat_offline_fallback, sos_offline_alerts, updated_at) FROM stdin;
1	t	https://openwa.qware.me	owa_k1_d78a7be3c71a72e8460b61a26cb2ee9b0dce6474fb004a2cc1cdbc285093ed97	19024686-72a5-42f7-adec-969d324e064f	t	t	t	t	t	t	2026-09-10 05:10:30.667+00
\.


--
-- Data for Name: whatsapp_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_logs (seq, id, phone, kind, status, error, created_at) FROM stdin;
1	wl-ec6ca6aa	950328511	mensaje_prueba_admin	sent	\N	2026-08-18 14:08:09.187869+00
2	wl-074ce7b0	951 234 567	recordatorio_medicamento_diario	sent	\N	2026-08-18 14:19:10.175162+00
3	wl-bbaa5330	952 345 678	recordatorio_medicamento_diario	sent	\N	2026-08-18 14:19:15.872511+00
4	wl-ce7a1455	950328511	nueva_cita	sent	\N	2026-08-18 15:00:22.98127+00
5	wl-7e450233	950328511	nueva_cita	sent	\N	2026-08-18 15:02:09.02885+00
6	wl-6cfa107e	950328511	chat_fallback_offline	sent	\N	2026-08-18 15:02:44.665391+00
7	wl-eabc3bb5	950328511	chat_fallback_offline	sent	\N	2026-08-18 15:03:25.675167+00
8	wl-1a15b22a	950328511	recordatorio_cita_2h	sent	\N	2026-08-18 15:04:09.156424+00
9	wl-01fb377d	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 18:04:09.033081+00
10	wl-e6125d60	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 18:19:09.921218+00
11	wl-74108130	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 18:34:09.67607+00
12	wl-6a24a535	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 18:34:14.97451+00
13	wl-4a69af72	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 18:49:09.434611+00
14	wl-e6d9cd10	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 18:49:15.166873+00
15	wl-3aaf1dec	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:04:09.740082+00
16	wl-46832ed0	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:04:15.324636+00
17	wl-8915b3a4	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:19:10.078788+00
18	wl-eeb56e6d	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:19:16.25223+00
19	wl-ae99e0c6	955 678 901	nuevo_medicamento	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:29:11.187267+00
20	wl-33d6ee77	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:34:09.638059+00
21	wl-3a3c27c3	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:34:14.673806+00
22	wl-cab1d77a	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:34:20.260083+00
23	wl-75c60b23	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:49:09.075154+00
24	wl-5fee5f93	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:49:14.402346+00
25	wl-4608b3d8	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 19:49:19.28108+00
26	wl-7ecb1655	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:04:09.00637+00
27	wl-6b17b751	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:04:14.65513+00
28	wl-43dd2e91	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:04:20.31617+00
29	wl-61d959bc	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:19:10.025233+00
30	wl-008927d0	956 789 012	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:19:16.128769+00
31	wl-41b72332	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:19:21.24852+00
32	wl-7594cfbd	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:34:09.494041+00
33	wl-9c77fdc3	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:34:15.513169+00
34	wl-d7e9bf4e	954 567 890	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:49:09.044614+00
35	wl-0d85dc1e	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 20:49:14.296278+00
36	wl-f101aecf	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 21:04:08.842864+00
37	wl-8fc5caa9	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 21:19:09.629484+00
38	wl-7f245e72	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 21:34:10.064367+00
39	wl-7e22a385	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 21:49:09.136663+00
40	wl-dc1c50ca	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 22:04:08.929642+00
41	wl-6f1acc0f	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 22:19:10.191903+00
42	wl-9ed4a3c6	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 22:34:09.900045+00
43	wl-f266d293	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 22:49:09.226247+00
44	wl-d63d13c9	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 23:04:09.575294+00
45	wl-a4c890c2	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 23:19:09.022061+00
46	wl-cb442f4a	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 23:34:09.110388+00
47	wl-036c5ae0	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-18 23:49:09.370521+00
48	wl-9e76b88b	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-19 00:04:10.229156+00
49	wl-c839f598	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-19 00:19:09.40221+00
50	wl-805bf5e0	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-19 00:34:09.591096+00
51	wl-61ef1299	955 678 901	recordatorio_medicamento_diario	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-19 00:49:09.873237+00
52	wl-0d1874ab	952 345 678	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-19 05:04:04.216107+00
53	wl-af685132	952 345 678	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-19 05:16:13.721758+00
54	wl-899baa60	952 345 678	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-08-19 05:31:03.712118+00
55	wl-e76673e7	987654321	nueva_cita	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 04:12:39.622725+00
56	wl-27255f5a	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 05:08:18.902351+00
57	wl-5c9642ef	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 05:23:18.906168+00
58	wl-8b6276df	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 05:38:18.901859+00
59	wl-5aebda90	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 05:53:18.903746+00
60	wl-2a972de4	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 06:08:18.908709+00
61	wl-a6231515	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 06:23:18.902942+00
62	wl-d464286b	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 06:38:18.907328+00
63	wl-895eb224	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 06:53:18.906656+00
64	wl-1c41b063	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 07:08:18.907102+00
65	wl-74e42661	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 07:23:18.911094+00
66	wl-b4cb13f1	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 07:38:18.907348+00
67	wl-02302b6b	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 07:53:18.907305+00
68	wl-8ee5fc79	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 08:08:18.908099+00
69	wl-ef9c2d79	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 08:23:18.912901+00
70	wl-dd9a1c6b	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 08:38:18.912398+00
71	wl-71092ab0	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 08:53:18.917159+00
72	wl-e04200a6	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 09:08:18.933064+00
73	wl-00cd8414	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 09:23:18.918873+00
74	wl-8be3c993	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 09:38:18.918464+00
75	wl-c85e695e	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 09:53:18.91363+00
76	wl-35086fd1	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 10:08:18.916119+00
77	wl-7621f268	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 10:23:18.914852+00
78	wl-3a492632	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 10:38:18.923819+00
79	wl-279a1d18	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 10:53:18.915644+00
80	wl-5a827691	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 11:08:18.940204+00
81	wl-a19e7182	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 11:23:18.929825+00
82	wl-4b71040d	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 11:38:18.939266+00
83	wl-4a9cbf6b	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 11:53:18.930374+00
84	wl-c03e4a96	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 12:08:18.931623+00
85	wl-e5f9bfcd	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 12:23:18.924168+00
86	wl-51d70d2c	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 12:38:18.927862+00
87	wl-7de0631c	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 12:53:18.950152+00
88	wl-3152b078	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:08:18.936163+00
89	wl-83f2d471	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:08:19.027185+00
90	wl-ec1e32f2	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:08:19.031037+00
91	wl-856bd799	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:23:18.9386+00
92	wl-fe812415	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:23:18.95106+00
93	wl-e53359f2	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:23:18.955138+00
94	wl-2afacfdb	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:38:18.938543+00
95	wl-80d93778	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:38:18.977327+00
96	wl-8d1be113	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:38:18.981791+00
97	wl-b0db5759	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:53:18.936906+00
98	wl-9bdf7aac	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:53:18.956387+00
99	wl-eaa18cf2	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 13:53:18.958866+00
100	wl-30e734ec	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:08:18.929731+00
101	wl-6a570ce8	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:08:18.951145+00
102	wl-5629e033	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:08:18.955142+00
103	wl-cafaa000	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:23:18.927817+00
104	wl-3137fd94	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:23:18.949197+00
105	wl-eb912d89	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:23:18.954207+00
106	wl-d14cd1fb	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:38:18.959816+00
107	wl-63c92045	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:38:18.982553+00
108	wl-a582ad9a	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:38:18.987651+00
109	wl-4e59db19	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:53:18.932461+00
110	wl-16e01894	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:53:18.949194+00
111	wl-e4d75a34	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 14:53:18.951495+00
112	wl-a667d77c	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:08:18.963777+00
113	wl-aea7f8c9	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:08:18.980759+00
114	wl-b87e6b36	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:08:18.982632+00
115	wl-c5d4f7d1	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:23:18.932095+00
116	wl-631c14a2	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:23:18.951557+00
117	wl-23da0de2	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:23:18.9556+00
118	wl-5448b982	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:38:18.947961+00
119	wl-beb67b26	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:38:18.961117+00
120	wl-8f83a5ed	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:38:18.963238+00
121	wl-7981b76f	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:53:18.933799+00
122	wl-36b534d7	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:53:18.948011+00
123	wl-d730a7a8	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 15:53:18.950542+00
124	wl-84a6ce0e	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:08:18.950949+00
125	wl-49d72fce	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:08:18.976203+00
126	wl-e38fbc52	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:08:18.978991+00
127	wl-e3412c4f	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:23:18.93357+00
128	wl-e8990f36	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:23:18.954248+00
129	wl-2b0ac6d3	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:23:18.958966+00
130	wl-fac306a4	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:38:18.946926+00
131	wl-1a195fb2	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:38:18.967233+00
132	wl-5cc4efd7	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:38:18.970883+00
133	wl-ab0ca2d3	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:53:18.938389+00
134	wl-2c02fafe	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:53:18.952928+00
135	wl-57030b6f	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 16:53:18.955577+00
136	wl-5d408062	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:08:18.963729+00
137	wl-9a3974c1	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:08:18.985882+00
138	wl-df4fad17	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:08:18.988636+00
139	wl-098d0d78	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:23:18.949189+00
140	wl-fad26657	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:23:18.966868+00
141	wl-0d9213aa	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:23:18.970293+00
142	wl-94467311	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:38:18.941082+00
143	wl-954e1bdf	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:38:18.963152+00
144	wl-5d1223c5	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:38:18.965262+00
145	wl-02fad697	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:53:18.938403+00
146	wl-20cb2dd5	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:53:18.951426+00
147	wl-0d964234	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 17:53:18.953581+00
148	wl-68f7c763	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:08:18.951902+00
149	wl-d0c08c7e	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:08:18.983752+00
150	wl-3954f49b	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:08:18.985816+00
151	wl-7a617307	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:23:18.954328+00
152	wl-cf4c3fc2	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:23:18.983791+00
153	wl-f6ce47ab	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:23:18.990038+00
154	wl-9e4e3eff	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:38:18.940503+00
155	wl-0626b32a	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:38:18.956255+00
156	wl-aac03f73	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:38:18.958187+00
157	wl-64381905	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:53:18.944995+00
158	wl-63511e37	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:53:18.958944+00
159	wl-c3c8d922	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 18:53:18.961402+00
160	wl-226b276e	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:08:18.949238+00
161	wl-7c314480	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:08:18.973947+00
162	wl-c45d80d8	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:08:18.978862+00
163	wl-48d87b82	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:23:18.943693+00
164	wl-f223282f	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:23:18.960654+00
165	wl-e53e845d	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:23:18.962987+00
166	wl-cee32c33	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:38:18.94524+00
167	wl-1a736c43	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:38:18.962076+00
168	wl-8c1baa6b	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:38:18.964395+00
169	wl-905c358c	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:53:18.94396+00
170	wl-34de11ae	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:53:18.961391+00
171	wl-22de2a47	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 19:53:18.963656+00
172	wl-92c82ed4	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:08:18.94845+00
173	wl-2f668d59	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:08:18.964713+00
174	wl-d2f55508	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:08:18.967322+00
175	wl-6cc92a6a	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:23:18.943942+00
176	wl-36edbf33	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:23:18.960668+00
177	wl-a4c12309	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:23:18.963611+00
178	wl-1489f634	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:38:18.95792+00
179	wl-1e56d12e	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:38:18.975011+00
180	wl-db14e5fa	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:38:18.980206+00
181	wl-14914f56	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:53:18.971835+00
182	wl-f452cb55	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:53:19.017363+00
183	wl-656a938e	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 20:53:19.019736+00
184	wl-c2c77d6d	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:08:18.951963+00
185	wl-f8d05cad	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:08:18.969012+00
186	wl-fa3be34c	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:08:19.002301+00
187	wl-4ccbe264	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:23:19.024873+00
188	wl-e9f09e4d	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:23:19.083158+00
189	wl-9257f37c	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:23:19.093702+00
190	wl-bf4bad05	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:38:18.957604+00
191	wl-05d2d2f1	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:38:18.970278+00
192	wl-9f175ed8	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:38:18.972105+00
193	wl-2113f0cd	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:53:18.96252+00
194	wl-2b1a6a47	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:53:18.975118+00
195	wl-c936a494	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 21:53:18.976979+00
196	wl-f311aa9c	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:08:18.954718+00
197	wl-240d9ef0	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:08:18.96698+00
198	wl-bda962f3	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:08:18.969114+00
199	wl-46535728	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:23:18.980465+00
200	wl-4981ac3a	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:23:19.009454+00
201	wl-ec7371d7	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:23:19.016702+00
202	wl-73697c9f	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:38:18.9639+00
203	wl-f26af9dd	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:38:18.980943+00
204	wl-962c2889	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:38:18.98329+00
205	wl-7341b95a	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:53:18.969413+00
206	wl-bee0f912	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:53:18.986214+00
207	wl-356299a3	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 22:53:18.995989+00
208	wl-5a061bef	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:08:18.973537+00
209	wl-51b94a0c	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:08:18.99743+00
210	wl-81fffee0	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:08:19.002091+00
211	wl-638bbc95	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:23:18.98453+00
212	wl-71f457e9	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:23:19.00727+00
213	wl-7cfa98f4	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:23:19.010414+00
214	wl-7db2e1ac	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:38:18.991053+00
215	wl-8d6cf5d0	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:38:19.030572+00
216	wl-2673b330	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:38:19.04075+00
217	wl-f243aaf8	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:53:18.974672+00
218	wl-25aee846	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:53:18.991289+00
219	wl-c5313f32	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-08 23:53:18.993326+00
220	wl-b4fcbae4	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:08:18.970405+00
221	wl-00dc6efd	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:08:18.989799+00
222	wl-b1070093	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:08:18.991942+00
223	wl-e676f479	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:23:18.964722+00
224	wl-387949da	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:23:18.979913+00
225	wl-5c5428b2	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:23:18.982877+00
226	wl-3c711d7d	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:38:18.989488+00
227	wl-e46438bc	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:38:19.008637+00
228	wl-2190efa8	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:38:19.011282+00
229	wl-ba2bfae5	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:53:18.970936+00
230	wl-b8c66f62	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:53:18.983368+00
231	wl-03b457c5	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 00:53:18.985473+00
232	wl-ece6c24e	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 01:08:18.97036+00
233	wl-c28bf7ca	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 01:23:18.974112+00
234	wl-2f928619	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 01:38:18.969351+00
235	wl-2c8b181b	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 01:53:18.972097+00
236	wl-750cf975	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 02:08:18.976179+00
237	wl-90ad56d5	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 02:23:18.978806+00
238	wl-c314bab0	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 02:38:18.988057+00
239	wl-02b08526	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 02:53:18.977654+00
240	wl-483e67a6	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 03:08:18.979091+00
241	wl-b104a432	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 03:23:18.978748+00
242	wl-4cd06aa1	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 03:38:18.989712+00
243	wl-d7126b5b	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 03:53:18.977543+00
244	wl-07dffd27	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 04:08:18.984986+00
245	wl-4e654eda	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 04:23:18.997532+00
246	wl-650e4c1f	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 04:38:18.980208+00
247	wl-d24a8e78	952 345 678	recordatorio_cita_24h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 04:53:19.001908+00
248	wl-32cc46a0	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:08:19.037874+00
249	wl-07a3ec08	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:08:19.095323+00
250	wl-0eb96e1d	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:08:19.098165+00
251	wl-d17c7cb5	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:23:19.025524+00
252	wl-ca5ceea3	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:23:19.042093+00
253	wl-61d2f8af	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:23:19.044548+00
254	wl-cfaf6ef5	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:38:19.038735+00
255	wl-8996b2d3	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:38:19.054117+00
256	wl-377398bf	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:38:19.057074+00
257	wl-02ef29a8	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:53:19.024571+00
258	wl-29beef8e	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:53:19.038488+00
259	wl-5311b9af	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 13:53:19.043479+00
260	wl-1079e50f	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:08:19.035808+00
261	wl-47934cf3	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:08:19.048108+00
262	wl-cc93d2b1	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:08:19.050194+00
263	wl-ea391ac7	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:23:19.031116+00
264	wl-2ebea1eb	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:23:19.05312+00
265	wl-6ff2309f	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:23:19.057586+00
266	wl-bc9565a7	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:38:19.029702+00
267	wl-04776bbf	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:38:19.043139+00
268	wl-58526064	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:38:19.045319+00
269	wl-985365ad	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:53:19.043064+00
270	wl-5cd6a332	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:53:19.071634+00
271	wl-a63f5627	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 14:53:19.079757+00
272	wl-2e241504	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:08:19.039162+00
273	wl-dbfe8042	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:08:19.057064+00
274	wl-f888b3ae	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:08:19.061183+00
275	wl-6372fc0c	952 345 678	recordatorio_cita_2h	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:23:19.042093+00
276	wl-e82d1bbd	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:23:19.056196+00
277	wl-603f668a	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:23:19.05827+00
278	wl-3b0fd24e	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:38:19.062571+00
279	wl-19ea416f	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:38:19.069712+00
280	wl-7d373da9	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:53:19.046683+00
281	wl-c50dea28	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 15:53:19.05487+00
282	wl-b55e4583	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 16:08:19.060233+00
283	wl-97d51890	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 16:08:19.065109+00
284	wl-3c37a4ee	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 16:23:19.063981+00
285	wl-17308d45	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 16:23:19.072455+00
286	wl-b65817e5	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 16:38:19.062829+00
287	wl-1e0eac94	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 16:38:19.066394+00
288	wl-d75bbbe6	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 16:53:19.087316+00
289	wl-73941b58	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 16:53:19.100493+00
290	wl-0f930aa6	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 17:08:19.097548+00
291	wl-52277521	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 17:08:19.106344+00
292	wl-d5d5d206	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 17:23:19.074301+00
293	wl-fafae0a2	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 17:23:19.09644+00
294	wl-10617889	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 17:38:19.054938+00
295	wl-9c623113	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 17:38:19.060131+00
296	wl-909c3e52	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 17:53:19.060301+00
297	wl-d93190aa	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 17:53:19.06462+00
298	wl-7a01559c	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 18:08:19.087989+00
299	wl-7a8ca863	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 18:08:19.103541+00
300	wl-0a013a0c	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 18:23:19.07317+00
301	wl-73a1e052	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 18:23:19.082097+00
302	wl-f82eec63	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 18:38:19.074476+00
303	wl-2ea136a7	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 18:38:19.081441+00
304	wl-18a9d3b5	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 18:53:19.069261+00
305	wl-8992c8e9	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 18:53:19.077615+00
306	wl-3f97e051	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 19:08:19.064296+00
307	wl-48794b46	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 19:08:19.07121+00
308	wl-71e03f8d	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 19:23:19.071252+00
309	wl-39f3bc84	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 19:23:19.075708+00
310	wl-85fb2674	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 19:38:19.084921+00
311	wl-8ebcf1d9	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 19:38:19.089065+00
312	wl-f37b993d	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 19:53:19.072735+00
313	wl-530e13e9	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 19:53:19.077242+00
314	wl-d630d09b	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 20:08:19.083759+00
315	wl-9e344ddb	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 20:08:19.088963+00
316	wl-94da9ab3	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 20:23:19.082183+00
317	wl-62993589	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 20:23:19.086987+00
318	wl-0580a61a	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 20:38:19.0842+00
319	wl-a8fca20b	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 20:38:19.093128+00
320	wl-d0361b93	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 20:53:19.088907+00
321	wl-e9e5b17e	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 20:53:19.098199+00
322	wl-f53846d6	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 21:08:19.094908+00
323	wl-7c5eb78f	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 21:08:19.099393+00
324	wl-b70963d0	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 21:23:19.087715+00
325	wl-d56bc585	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 21:23:19.092171+00
326	wl-60fa68d8	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 21:38:19.100493+00
327	wl-cbfa5d0c	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 21:38:19.115903+00
328	wl-005ab43e	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 21:53:19.085727+00
329	wl-0cf82d48	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 21:53:19.092478+00
330	wl-ce1af774	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 22:08:19.079769+00
331	wl-f6c2de5c	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 22:08:19.085258+00
332	wl-35315ec0	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 22:23:19.111435+00
333	wl-986cfba7	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 22:23:19.122504+00
334	wl-d088eec4	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 22:38:19.120333+00
335	wl-4d574f96	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 22:38:19.131378+00
336	wl-1a40695d	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 22:53:19.0862+00
337	wl-8a1f621d	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 22:53:19.093077+00
338	wl-4f06abe2	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 23:08:19.108147+00
339	wl-445bb3a5	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 23:08:19.112823+00
340	wl-120fdc5f	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 23:23:19.110144+00
341	wl-ef79a6e5	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 23:23:19.119294+00
342	wl-0547aeb1	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 23:38:19.102428+00
343	wl-ffc6abf6	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 23:38:19.107419+00
344	wl-c33e16da	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 23:53:19.087692+00
345	wl-fadcc8f9	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-09 23:53:19.092916+00
346	wl-2222a737	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-10 00:08:19.102875+00
347	wl-874b2be3	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-10 00:08:19.113453+00
348	wl-eb209daa	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-10 00:23:19.1039+00
349	wl-6a79af1c	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-10 00:23:19.108434+00
350	wl-ea760f64	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-10 00:38:19.085372+00
351	wl-1e2b2883	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-10 00:38:19.089223+00
352	wl-ca038562	951 234 567	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-10 00:53:19.097653+00
353	wl-272ba8cf	952 345 678	recordatorio_medicamento_diario	skipped	Servidor Open-WA o API Key no configurados	2026-09-10 00:53:19.101738+00
354	wl-77492272	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-10 04:54:41.299074+00
355	wl-62b9a4dc	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-10 04:55:13.702772+00
356	wl-786d15b6	917405094	mensaje_prueba_admin	sent	\N	2026-09-10 05:11:14.860241+00
357	wl-a0090aec	976569616	nueva_cita	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-10 05:19:06.128687+00
358	wl-db81ce37	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 05:12:01.361729+00
359	wl-af5329eb	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 05:27:01.02173+00
360	wl-b5b513dd	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 05:42:01.019491+00
361	wl-c29b3517	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 05:57:01.021373+00
362	wl-631f8205	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 06:12:01.052192+00
363	wl-bf1f0690	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 06:27:01.036573+00
364	wl-4fd2088e	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 06:42:01.025793+00
365	wl-aab783e3	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 06:57:01.030922+00
366	wl-d5dd8ebc	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 07:12:01.053124+00
367	wl-457946c1	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 07:27:01.040927+00
368	wl-af4c8a2a	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 07:42:01.028754+00
369	wl-ce0dfa65	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 07:57:01.043534+00
370	wl-c1e00f0d	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 08:12:01.026612+00
371	wl-61cc848c	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 08:27:01.037213+00
372	wl-be51812c	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 08:42:01.022802+00
373	wl-a61e7437	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 08:57:01.018633+00
374	wl-dccb8f16	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 09:12:01.02207+00
375	wl-7779f5b5	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 09:27:01.322861+00
376	wl-0618c267	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 09:42:01.036684+00
377	wl-fefa91cd	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 09:57:01.030923+00
378	wl-d60d5a52	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 10:12:01.03008+00
379	wl-99cf0824	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 10:27:01.021594+00
380	wl-577053d7	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 10:42:01.068438+00
381	wl-18c9f6a5	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 10:57:01.048821+00
382	wl-0af47c8e	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 11:12:01.059193+00
383	wl-0f447a2a	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 11:27:01.045729+00
384	wl-c383a371	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 11:42:01.072105+00
385	wl-efccb878	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 11:57:01.031344+00
386	wl-a92faaf6	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 12:12:01.065095+00
387	wl-8f528293	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 12:27:01.037839+00
388	wl-b52512bd	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 12:42:01.03638+00
389	wl-6818f3fd	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 12:57:01.077147+00
390	wl-3de9937c	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 13:12:01.050911+00
391	wl-b1e96fbd	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 13:27:01.076433+00
392	wl-68c039f0	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 13:42:01.193196+00
393	wl-d05c7a88	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 13:57:01.06663+00
394	wl-755c5c10	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 14:12:01.078113+00
395	wl-78445134	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 14:27:01.050419+00
396	wl-0223e393	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 14:42:01.082715+00
397	wl-81cbff70	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 14:57:01.057474+00
398	wl-d76daf51	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 15:12:01.071323+00
399	wl-cc07c313	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 15:27:01.072079+00
400	wl-ae3d3e5c	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 15:42:01.069607+00
401	wl-a297c47e	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 15:57:01.053546+00
402	wl-7ce4a4bd	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 16:12:01.099353+00
403	wl-5c145b8e	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 16:27:01.054195+00
404	wl-c2c6ae2e	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 16:42:01.072725+00
405	wl-9f3793bc	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 16:57:01.071679+00
406	wl-a12dd682	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 17:12:01.113881+00
407	wl-e0312147	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 17:27:01.211035+00
408	wl-42b6fdce	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 17:42:01.20785+00
409	wl-1d33e55a	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 17:57:01.072663+00
410	wl-81e4cacc	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 18:12:01.104917+00
411	wl-367695eb	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 18:27:01.092983+00
412	wl-c426d8e1	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 18:42:01.077089+00
413	wl-b24a02c0	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 18:57:01.089218+00
414	wl-6411e85f	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 19:12:01.133291+00
415	wl-ac86a91d	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 19:27:01.101474+00
416	wl-45c0a41a	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 19:42:01.148767+00
417	wl-25f9e8b0	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 19:57:01.10592+00
418	wl-49c66b07	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 20:12:01.101159+00
419	wl-98b7f12d	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 20:27:01.15483+00
420	wl-f3e4dbe5	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 20:42:01.111427+00
421	wl-9b0b1568	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 20:57:01.102956+00
422	wl-63644748	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 21:12:01.136248+00
423	wl-bebe0b3d	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 21:27:01.088202+00
424	wl-bdba89b0	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 21:42:01.219294+00
425	wl-511c8988	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 21:57:01.119037+00
426	wl-08e26ee1	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 22:12:01.108285+00
427	wl-8dbdd958	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 22:27:01.101837+00
428	wl-b5150edf	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 22:42:01.412935+00
429	wl-acdae9aa	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 22:57:01.10144+00
430	wl-c1a7f053	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 23:12:01.132088+00
431	wl-829a5955	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 23:27:01.114966+00
432	wl-5744bedb	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 23:42:01.121085+00
433	wl-44711530	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-29 23:57:01.131579+00
434	wl-8f68cc9a	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 00:12:01.135061+00
435	wl-de197c54	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 00:27:01.110192+00
436	wl-dea41283	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 00:42:01.139416+00
437	wl-6e57bb88	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 00:57:01.125718+00
438	wl-682ac18d	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 01:12:01.125578+00
439	wl-cae45791	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 01:27:01.139523+00
440	wl-c1656f64	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 01:42:01.405154+00
441	wl-b7bddb8e	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 01:57:01.130399+00
442	wl-64413f53	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 02:12:01.161591+00
443	wl-df3f7ed1	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 02:27:01.122722+00
444	wl-b7bf5340	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 02:42:01.204068+00
445	wl-956a1b19	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 02:57:01.127404+00
446	wl-0dc90eb5	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 03:12:01.13894+00
447	wl-d3775963	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 03:27:01.1943+00
448	wl-71de26ad	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 03:42:01.13149+00
449	wl-adc35e72	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 03:57:01.117694+00
450	wl-80d473b4	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 04:12:01.157214+00
451	wl-6fe5f732	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 04:27:01.120115+00
452	wl-7938e627	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 04:42:01.123906+00
453	wl-50e377af	976569616	recordatorio_cita_24h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 04:57:01.144415+00
454	wl-0c4719ba	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 11:42:01.430249+00
455	wl-dd654448	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 11:57:01.172183+00
456	wl-9691c5bb	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 12:12:01.183333+00
457	wl-1576caac	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 12:27:01.162086+00
458	wl-dc354a51	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 12:42:01.183412+00
459	wl-b919397d	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 12:57:01.241338+00
460	wl-51c0cb3e	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 13:12:01.17483+00
461	wl-263c3eca	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 13:27:01.176159+00
462	wl-a14feec8	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 13:42:01.283236+00
463	wl-34b6035c	976569616	recordatorio_cita_2h	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-09-30 13:57:01.181266+00
464	wl-bd368576	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-16 03:12:46.731575+00
465	wl-d61b9704	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-16 03:13:03.841981+00
466	wl-2ae85094	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-16 03:14:00.705638+00
467	wl-84876f55	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-16 03:29:45.628158+00
468	wl-d7217e7f	917405094	mensaje_prueba_admin	sent	\N	2026-10-16 05:09:35.783173+00
469	wl-19f6b890	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-23 03:20:54.367774+00
470	wl-e5183ce8	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-23 03:21:02.702656+00
471	wl-0e41fdec	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-23 03:21:23.303924+00
472	wl-46434da2	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-23 03:21:27.744285+00
473	wl-5084a999	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-23 03:22:58.788311+00
474	wl-4eb5c4c9	917405094	mensaje_prueba_admin	sent	\N	2026-10-23 03:25:03.212439+00
475	wl-787f6ca4	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-23 03:25:49.710012+00
476	wl-04a6f017	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-23 03:26:06.100781+00
477	wl-36d113d0	917405094	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-23 03:26:24.364608+00
478	wl-efa11427	978691505	mensaje_prueba_admin	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-23 03:27:06.901942+00
479	wl-cbbaf14a	969539309	nuevo_medicamento	sent	\N	2026-10-24 22:38:11.351841+00
480	wl-a3ff5905	969539309	nueva_cita	sent	\N	2026-10-24 22:41:55.62618+00
481	wl-ea55893b	957562515	chat_fallback_offline	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-24 22:48:23.841206+00
482	wl-adaab601	957562515	chat_fallback_offline	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-24 22:48:33.142077+00
483	wl-b4485477	957562515	chat_fallback_offline	failed	HTTP 404: {"message":"Cannot POST /api/sendText","error":"Not Found","statusCode":404}	2026-10-24 22:48:47.805851+00
484	wl-7ba87e41	969539309	recordatorio_medicamento_diario	sent	\N	2026-10-25 13:03:50.023675+00
485	wl-2b2ada7c	935712667	nueva_cita	sent	\N	2026-10-26 02:23:45.401714+00
486	wl-dc0cac48	969539309	recordatorio_medicamento_diario	sent	\N	2026-10-26 13:03:49.029372+00
487	wl-d56200ac	969539309	recordatorio_cita_24h	sent	\N	2026-10-27 05:03:49.423076+00
488	wl-a7eab84a	969539309	recordatorio_medicamento_diario	sent	\N	2026-10-27 13:05:25.684323+00
489	wl-c8911ad1	969539309	nueva_cita	sent	\N	2026-10-28 01:56:10.143745+00
490	wl-9b847982	987654321	chat_fallback_offline	sent	\N	2026-10-29 12:46:16.799412+00
491	wl-26d0b646	969539309	recordatorio_cita_24h	sent	\N	2026-11-07 05:08:55.897312+00
492	wl-afd792c8	969539309	recordatorio_cita_2h	sent	\N	2026-11-08 17:38:55.784322+00
493	wl-0ba74f77	976569616	recordatorio_cita_24h	sent	\N	2026-11-10 05:08:50.614851+00
\.


--
-- Name: alerts_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alerts_seq_seq', 44, true);


--
-- Name: appointments_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.appointments_seq_seq', 292, true);


--
-- Name: articles_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.articles_seq_seq', 26, true);


--
-- Name: messages_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_seq_seq', 60, true);


--
-- Name: patients_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patients_seq_seq', 40, true);


--
-- Name: supplements_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplements_seq_seq', 39, true);


--
-- Name: users_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_seq_seq', 46, true);


--
-- Name: visits_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.visits_seq_seq', 10, true);


--
-- Name: whatsapp_logs_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.whatsapp_logs_seq_seq', 493, true);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_seq_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_seq_key UNIQUE (seq);


--
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_config
    ADD CONSTRAINT app_config_pkey PRIMARY KEY (id);


--
-- Name: applied_actions applied_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applied_actions
    ADD CONSTRAINT applied_actions_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_seq_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_seq_key UNIQUE (seq);


--
-- Name: article_assignments article_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_assignments
    ADD CONSTRAINT article_assignments_pkey PRIMARY KEY (patient_id, article_id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: articles articles_seq_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_seq_key UNIQUE (seq);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (dni);


--
-- Name: intakes intakes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intakes
    ADD CONSTRAINT intakes_pkey PRIMARY KEY (patient_id, day_key, supplement_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: messages messages_seq_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_seq_key UNIQUE (seq);


--
-- Name: patients patients_dni_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_dni_key UNIQUE (dni);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: patients patients_seq_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_seq_key UNIQUE (seq);


--
-- Name: push_tokens push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_pkey PRIMARY KEY (dni, token);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: sent_reminders sent_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_reminders
    ADD CONSTRAINT sent_reminders_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (token);


--
-- Name: supplements supplements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplements
    ADD CONSTRAINT supplements_pkey PRIMARY KEY (id);


--
-- Name: supplements supplements_seq_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplements
    ADD CONSTRAINT supplements_seq_key UNIQUE (seq);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (dni);


--
-- Name: users users_seq_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_seq_key UNIQUE (seq);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: visits visits_seq_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_seq_key UNIQUE (seq);


--
-- Name: whatsapp_config whatsapp_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_config
    ADD CONSTRAINT whatsapp_config_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_logs whatsapp_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_logs
    ADD CONSTRAINT whatsapp_logs_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_logs whatsapp_logs_seq_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_logs
    ADD CONSTRAINT whatsapp_logs_seq_key UNIQUE (seq);


--
-- Name: idx_alerts_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_patient ON public.alerts USING btree (patient_id);


--
-- Name: idx_alerts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_status ON public.alerts USING btree (status);


--
-- Name: idx_appointments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_date ON public.appointments USING btree (date_key);


--
-- Name: idx_appointments_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_id);


--
-- Name: idx_article_assignments_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_assignments_article ON public.article_assignments USING btree (article_id);


--
-- Name: idx_article_assignments_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_assignments_patient ON public.article_assignments USING btree (patient_id);


--
-- Name: idx_articles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_active ON public.articles USING btree (active);


--
-- Name: idx_articles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_category ON public.articles USING btree (category);


--
-- Name: idx_messages_conv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conv ON public.messages USING btree (conv_id, seq);


--
-- Name: idx_push_tokens_dni; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_tokens_dni ON public.push_tokens USING btree (dni);


--
-- Name: idx_sent_reminders_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sent_reminders_patient ON public.sent_reminders USING btree (patient_id);


--
-- Name: idx_sessions_dni; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_dni ON public.sessions USING btree (dni);


--
-- Name: idx_supplements_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplements_patient ON public.supplements USING btree (patient_id);


--
-- Name: idx_visits_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_date ON public.visits USING btree (date_key);


--
-- Name: idx_visits_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_patient ON public.visits USING btree (patient_id);


--
-- Name: idx_whatsapp_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_logs_created ON public.whatsapp_logs USING btree (created_at DESC);


--
-- Name: alerts alerts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: article_assignments article_assignments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_assignments
    ADD CONSTRAINT article_assignments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: article_assignments article_assignments_assigned_by_dni_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_assignments
    ADD CONSTRAINT article_assignments_assigned_by_dni_fkey FOREIGN KEY (assigned_by_dni) REFERENCES public.users(dni) ON DELETE SET NULL;


--
-- Name: article_assignments article_assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_assignments
    ADD CONSTRAINT article_assignments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: avatars avatars_dni_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatars
    ADD CONSTRAINT avatars_dni_fkey FOREIGN KEY (dni) REFERENCES public.users(dni) ON DELETE CASCADE;


--
-- Name: intakes intakes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intakes
    ADD CONSTRAINT intakes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: intakes intakes_supplement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intakes
    ADD CONSTRAINT intakes_supplement_id_fkey FOREIGN KEY (supplement_id) REFERENCES public.supplements(id) ON DELETE CASCADE;


--
-- Name: messages messages_conv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conv_id_fkey FOREIGN KEY (conv_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: push_tokens push_tokens_dni_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_dni_fkey FOREIGN KEY (dni) REFERENCES public.users(dni) ON DELETE CASCADE;


--
-- Name: sent_reminders sent_reminders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sent_reminders
    ADD CONSTRAINT sent_reminders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_dni_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_dni_fkey FOREIGN KEY (dni) REFERENCES public.users(dni) ON DELETE CASCADE;


--
-- Name: supplements supplements_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplements
    ADD CONSTRAINT supplements_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: users users_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: visits visits_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict WvegZNGGy4R5nLCpA2pjr8V2170kjrXLvYnvMfZILe45bMxEa9HNWdww2Ihe4FK

