# 📝 Mis Recordatorios

Aplicación web de **tareas y recordatorios personales**. Trabajo universitario
construido con **Claude en la terminal de Cursor**.

## Tecnologías
- **React + Vite** — interfaz de la aplicación
- **Supabase** — base de datos donde se guardan las tareas
- **GitHub** — repositorio del código
- **Netlify** — publicación en internet

## Cómo correr la app en tu computador

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear el archivo `.env.local` con tus llaves de Supabase
   (copia `.env.example` y reemplaza los valores).
3. Iniciar la app en modo desarrollo:
   ```bash
   npm run dev
   ```
4. Abrir la dirección que aparece (por defecto http://localhost:5173).

## Configurar la base de datos (Supabase)
1. Crea un proyecto en https://supabase.com
2. Ve a **SQL Editor**, pega el contenido de `supabase-setup.sql` y dale **Run**.
3. En **Project Settings → API** copia el `URL` y la clave `anon public`
   a tu archivo `.env.local`.

## Publicar (Netlify)
Netlify se conecta a este repositorio de GitHub y publica automáticamente.
Recuerda agregar en Netlify las mismas variables `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY` (en *Site settings → Environment variables*).
