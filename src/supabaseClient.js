// Conexión a Supabase (la base de datos donde se guardan las tareas).
// Las "llaves" (URL y clave pública) se leen desde variables de entorno
// para no escribirlas directamente en el código.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si todavía no has configurado Supabase, esto será falso y la app
// mostrará un mensaje en lugar de fallar.
export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = supabaseConfigurado
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
