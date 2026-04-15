import { createClient } from '@supabase/supabase-js'

// Using the credentials from the user's .env.local
const url = 'https://awadndlspxlzdtfdofxt.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWRuZGxzcHhsemR0ZmRvZnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODM3NTMsImV4cCI6MjA5MTY1OTc1M30.tVZZALqLiO1b2xa_Cd8TsH7RNBVRKOx-HmMqLmFcbZE'

const supabase = createClient(url, key)

async function testConnection() {
  console.log('🔍 Probando conexión con Supabase...')
  try {
    const { data, error } = await supabase.from('preferences').select('*').limit(1)
    
    if (error) {
      console.error('❌ Error. La URL/Llave es correcta, pero la tabla "preferences" no existe o dio error:')
      console.error(error.message)
      process.exit(1)
    }
    
    console.log('✅ ¡Conexión exitosa a Supabase!')
    console.log('✅ Tabla "preferences" accesible. Datos encontrados:', data)
  } catch (err) {
    console.error('❌ Error de red o credenciales inválidas:', err.message)
    process.exit(1)
  }
}

testConnection()
