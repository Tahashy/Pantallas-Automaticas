-- ====================================================================================
-- SCRIPT DE BASE DE DATOS COMPLETO - SISTEMA DE PANTALLAS (DIGITAL SIGNAGE)
-- ====================================================================================
-- Instrucciones:
-- 1. Ve al panel de Supabase de tu proyecyo.
-- 2. Entra a la sección "SQL Editor".
-- 3. Crea una nueva query, pega todo este archivo y dale clic a "Run".
-- ====================================================================================

-- 1. EXTENSIONES BÁSICAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CREACIÓN DE TABLAS
-- ==========================================

-- TABLA: preferences (Configuración Global y Low-Code)
CREATE TABLE IF NOT EXISTS public.preferences (
    id int2 PRIMARY KEY DEFAULT 1,
    academy_name text DEFAULT 'Academia Adelante',
    logo_url text DEFAULT null,
    updated_at timestamptz DEFAULT now(),
    -- Restricción para garantizar que siempre exista una y sola una fila (id = 1)
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar valor por defecto para preferencias
INSERT INTO public.preferences (id, academy_name) VALUES (1, 'Academia Adelante') ON CONFLICT (id) DO NOTHING;

-- TABLA: content (Biblioteca de Contenidos: Imágenes, Videos, Slides)
CREATE TABLE IF NOT EXISTS public.content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL, -- image, video, slide, announcement
    duration int DEFAULT 8,
    priority text DEFAULT 'normal', -- normal, high, urgent
    file_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- TABLA: screens (Configuración de cada Pantalla o TV)
CREATE TABLE IF NOT EXISTS public.screens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    location text,
    slide_duration int DEFAULT 8,
    transition text DEFAULT 'fade',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Insertar par de pantallas por defecto para testear
INSERT INTO public.screens (id, name, location) VALUES 
(gen_random_uuid(), 'Pantalla Principal', 'Hall de Entrada'),
(gen_random_uuid(), 'Pantalla Menor', 'Pasillo Aulas')
ON CONFLICT DO NOTHING;

-- TABLA: playlists (Listas de reproducción para pantallas)
CREATE TABLE IF NOT EXISTS public.playlists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- TABLA: playlist_items (Asignación de contenidos a las listas)
CREATE TABLE IF NOT EXISTS public.playlist_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id uuid REFERENCES public.playlists(id) ON DELETE CASCADE,
    content_id uuid REFERENCES public.content(id) ON DELETE CASCADE,
    position int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- TABLA: screen_playlists (Asignación de listas a pantallas)
CREATE TABLE IF NOT EXISTS public.screen_playlists (
    screen_id uuid REFERENCES public.screens(id) ON DELETE CASCADE,
    playlist_id uuid REFERENCES public.playlists(id) ON DELETE CASCADE,
    PRIMARY KEY (screen_id, playlist_id)
);

-- TABLA: schedules (Horarios interactivos de clases)
CREATE TABLE IF NOT EXISTS public.schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject text NOT NULL,
    teacher text,
    room text,
    start_time time,
    end_time time,
    color text,
    day_of_week text NOT NULL, -- Mon, Tue, Wed, Thu, Fri, Sat, Sun
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- TABLA: announcements (Avisos de texto estáticos y urgentes)
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    body text,
    type text DEFAULT 'general', -- general, urgent, info, academic
    bg_color text DEFAULT '#E53935',
    expires_at timestamptz,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 3. ALMACENAMIENTO (STORAGE BUCKETS)
-- ==========================================

-- Intentamos crear el bucket 'media'. (NOTA: En algunos proyectos Supabase, 
-- puede ser requerido crear el bucket directamente desde la interfaz gráfica
-- de "Storage". De ser posible por SQL, este comando lo activa).
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage publicas para admitir subidas fácilmente desde la web sin login
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
CREATE POLICY "Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'media');
CREATE POLICY "Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'media');

-- ==========================================
-- 4. REALTIME (SINCRONIZACIÓN EN TIEMPO REAL)
-- ==========================================
-- Esto enciende la publicación de base de datos para que los websockets de 
-- las páginas web reflejen los datos instantaneamente sin recargar.

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.preferences, 
  public.content, 
  public.screens, 
  public.schedules, 
  public.announcements;
