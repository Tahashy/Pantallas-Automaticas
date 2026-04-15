import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]

if (!url || !key) {
  process.exit(1)
}

const supabase = createClient(url.trim(), key.trim())

async function cleanRemaining() {
  console.log("Limpiando anuncios y horarios de ejemplo...")
  
  // Borrar anuncios
  const { data: ann } = await supabase.from('announcements').select('id')
  if (ann?.length > 0) {
    await supabase.from('announcements').delete().in('id', ann.map(a => a.id))
    console.log("Anuncios de ejemplo borrados.")
  }

  // Borrar horarios
  const { data: sch } = await supabase.from('schedules').select('id')
  if (sch?.length > 0) {
    await supabase.from('schedules').delete().in('id', sch.map(s => s.id))
    console.log("Horarios de ejemplo borrados.")
  }
}

cleanRemaining()
